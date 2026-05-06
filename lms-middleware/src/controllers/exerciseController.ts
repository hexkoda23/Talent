import { Request, Response } from 'express';
import { exerciseRunnerService } from '../services/exerciseRunnerService';
import { manifestService } from '../services/manifestService';
import { dbService } from '../services/dbService';
import { giteaSubmissionService } from '../services/giteaSubmissionService';
import { auditMatchingService } from '../services/auditMatchingService';

export const runExerciseTests = async (req: Request, res: Response) => {
  try {
    const { questId, exerciseId } = req.params;
    const { code, language } = req.body;

    if (!questId || !exerciseId || typeof code !== 'string' || typeof language !== 'string') {
      return res.status(400).json({ error: 'Missing required fields: questId, exerciseId, code, language' });
    }

    const manifest = manifestService.getManifest(questId);
    const exercise = manifest?.exercises.find((item) => item.id === exerciseId);

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

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
    const { questId, exerciseId } = req.params;
    const { code, language, studentUsername } = req.body;

    if (!questId || !exerciseId || typeof code !== 'string' || typeof language !== 'string' || typeof studentUsername !== 'string') {
      return res.status(400).json({ error: 'Missing required fields: questId, exerciseId, code, language, studentUsername' });
    }

    const manifest = manifestService.getManifest(questId);
    const exercise = manifest?.exercises.find((item) => item.id === exerciseId);

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

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
      await dbService.recordExerciseResult(studentUsername, questId, exerciseId, 'FAILED', {
        ...result,
        commit_id: submission.commitId,
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

    await dbService.recordExerciseResult(studentUsername, questId, exerciseId, 'WAITING_FOR_AUDIT', {
      ...result,
      commit_id: submission.commitId,
    });
    await dbService.joinAuditQueue(studentUsername, questId, exerciseId);
    const auditSession = await auditMatchingService.tryMatchExercise(studentUsername, questId, exerciseId);

    const nextExerciseId = manifestService.getNextExerciseId(questId, exerciseId);
    const questStatus = nextExerciseId === 'DONE' ? 'WAITING_FOR_AUDIT' : 'IN_PROGRESS';
    await dbService.updateStudentProgress(studentUsername, questId, questStatus, nextExerciseId === 'DONE' ? exerciseId : nextExerciseId);

    res.status(200).json({
      ...result,
      output: auditSession
        ? `Test passed, paired for an audit.`
        : `Test passed, pairing for an audit.`,
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
    const { questId, studentUsername } = req.params;

    if (!questId || !studentUsername) {
      return res.status(400).json({ error: 'Missing required fields: questId, studentUsername' });
    }

    const progress = await dbService.getStudentProgress(studentUsername);
    const questProgress = progress.find((item: any) => item.quest_id === questId || item.quest_id === `quest-${questId}`);
    const passedExercises = await dbService.getPassedExercises(studentUsername, questId);
    const latestResult = await dbService.getLatestExerciseResult(studentUsername, questId);
    const auditStates = await dbService.getExerciseAuditStates(studentUsername, questId);
    const activeAuditData = await dbService.getActiveAuditsForUser(studentUsername, questId);

    res.status(200).json({
      status: questProgress?.status || 'IN_PROGRESS',
      currentExerciseId: questProgress?.current_exercise_id || manifestService.getFirstExerciseId(questId),
      passedExercises,
      latestResult,
      auditStates,
      activeAudits: activeAuditData,
    });
  } catch (error: any) {
    console.error('Quest progress lookup failed:', error.message);
    res.status(200).json({
      status: 'IN_PROGRESS',
      currentExerciseId: manifestService.getFirstExerciseId(req.params.questId),
      passedExercises: [],
    });
  }
};
