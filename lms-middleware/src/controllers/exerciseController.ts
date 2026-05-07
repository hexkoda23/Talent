import { Request, Response } from 'express';
import { exerciseRunnerService } from '../services/exerciseRunnerService';
import { dbService } from '../services/dbService';
import { giteaSubmissionService } from '../services/giteaSubmissionService';
import { auditMatchingService } from '../services/auditMatchingService';
import { getLmsUser, isLmsAdmin } from '../services/sessionService';
import { canonicalQuestId } from '../services/identity';

const getRequesterUsername = (req: Request) => {
  const sessionUser = getLmsUser(req);
  const paramUsername = req.params.studentUsername;
  if (paramUsername && paramUsername !== 'me' && isLmsAdmin(sessionUser)) return paramUsername;
  return sessionUser?.username || paramUsername || req.body.studentUsername;
};

const getNextExerciseId = (manifest: any, currentExerciseId: string): string | 'DONE' => {
  const index = manifest?.exercises?.findIndex((exercise: any) => exercise.id === currentExerciseId) ?? -1;
  if (index === -1 || index === manifest.exercises.length - 1) return 'DONE';
  return manifest.exercises[index + 1].id;
};

export const runExerciseTests = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const questId = canonicalQuestId(req.params.questId);
    const { code, language } = req.body;

    if (!questId || !exerciseId || typeof code !== 'string' || typeof language !== 'string') {
      return res.status(400).json({ error: 'Missing required fields: questId, exerciseId, code, language' });
    }

    const manifest = await dbService.getQuestManifest(questId);
    const exercise = manifest?.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

    const result = await exerciseRunnerService.run({
      code,
      language,
      tests: exercise.sampleTests || [],
      restrictions: exercise.restrictions || [],
      applyRestrictions: false,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Exercise run failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const submitExerciseTests = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const questId = canonicalQuestId(req.params.questId);
    const { code, language } = req.body;
    const studentUsername = getRequesterUsername(req);

    if (!questId || !exerciseId || typeof code !== 'string' || typeof language !== 'string' || !studentUsername) {
      return res.status(400).json({ error: 'Missing required fields: questId, exerciseId, code, language' });
    }

    const manifest = await dbService.getQuestManifest(questId);
    const exercise = manifest?.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

    const normalizedLanguage = language.toLowerCase().replace(/\s+/g, '');
    if (normalizedLanguage !== 'python' && normalizedLanguage !== 'python3') {
      return res.status(200).json({
        passed: false,
        results: [],
        output: 'This quest is currently graded in Python.',
        questStatus: 'IN_PROGRESS',
        nextExerciseId: exerciseId,
      });
    }

    const submission = await giteaSubmissionService.submitCode({
      studentUsername,
      questId,
      exerciseId,
      code,
    });

    const result = await exerciseRunnerService.run({
      code,
      language,
      tests: exercise.hiddenTests || [],
      restrictions: exercise.restrictions || [],
      applyRestrictions: true,
    });

    if (!result.passed) {
      const storedResult = { ...result, commit_id: submission.commitId };
      await dbService.recordExerciseResult(studentUsername, questId, exerciseId, 'FAILED', storedResult);
      await dbService.recordSubmission({
        username: studentUsername,
        questId,
        exerciseId,
        commitHash: submission.commitId,
        status: 'failed_tests',
        result: storedResult,
        repoFullName: submission.repoFullName,
      });
      await dbService.updateStudentProgress(studentUsername, questId, 'IN_PROGRESS', exerciseId);

      return res.status(200).json({
        ...result,
        questStatus: 'IN_PROGRESS',
        nextExerciseId: exerciseId,
        commitId: submission.commitId,
        repoUrl: submission.repoUrl,
        repoFullName: submission.repoFullName,
      });
    }

    const storedResult = { ...result, commit_id: submission.commitId };
    await dbService.recordExerciseResult(studentUsername, questId, exerciseId, 'WAITING_FOR_AUDIT', storedResult);
    await dbService.recordSubmission({
      username: studentUsername,
      questId,
      exerciseId,
      commitHash: submission.commitId,
      status: 'passed_hidden_tests',
      result: storedResult,
      repoFullName: submission.repoFullName,
    });
    await dbService.joinAuditQueue(studentUsername, questId, exerciseId);
    const auditSession = await auditMatchingService.tryMatchExercise(studentUsername, questId, exerciseId);

    const nextExerciseId = getNextExerciseId(manifest, exerciseId);
    const questStatus = nextExerciseId === 'DONE' ? 'WAITING_FOR_AUDIT' : 'IN_PROGRESS';
    await dbService.updateStudentProgress(studentUsername, questId, questStatus, nextExerciseId === 'DONE' ? exerciseId : nextExerciseId);

    res.status(200).json({
      ...result,
      output: auditSession ? 'Test passed, paired for an audit.' : 'Test passed, pairing for an audit.',
      questStatus,
      nextExerciseId: nextExerciseId === 'DONE' ? null : nextExerciseId,
      commitId: submission.commitId,
      repoUrl: submission.repoUrl,
      repoFullName: submission.repoFullName,
      auditSession,
    });
  } catch (error: any) {
    console.error('Exercise submit failed:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getQuestProgress = async (req: Request, res: Response) => {
  try {
    const questId = canonicalQuestId(req.params.questId);
    const studentUsername = getRequesterUsername(req);
    if (!questId || !studentUsername) return res.status(400).json({ error: 'Missing quest or user session' });

    const manifest = await dbService.getQuestManifest(questId);
    const firstExerciseId = manifest?.exercises[0]?.id || 'ex01';
    const progress = await dbService.getStudentProgress(studentUsername);
    const questProgress = progress.find((item: any) => canonicalQuestId(item.quest_id) === questId);
    const passedExercises = await dbService.getPassedExercises(studentUsername, questId);
    const latestResult = await dbService.getLatestExerciseResult(studentUsername, questId);
    const auditStates = await dbService.getExerciseAuditStates(studentUsername, questId);
    const activeAuditData = await dbService.getActiveAuditsForUser(studentUsername, questId);

    res.status(200).json({
      status: questProgress?.status || 'IN_PROGRESS',
      currentExerciseId: questProgress?.current_exercise_id || firstExerciseId,
      passedExercises,
      latestResult,
      auditStates,
      activeAudits: activeAuditData,
    });
  } catch (error: any) {
    console.error('Quest progress lookup failed:', error.message);
    res.status(200).json({
      status: 'IN_PROGRESS',
      currentExerciseId: 'ex01',
      passedExercises: [],
    });
  }
};
