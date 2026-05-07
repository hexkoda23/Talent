import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { giteaService } from '../services/giteaService';
import { config } from '../config/env';
import { canonicalQuestId, repoNameForQuest, toGiteaUsername } from '../services/identity';
import { getLmsUser, isLmsAdmin } from '../services/sessionService';

const EXERCISE_CHECKLIST: Record<string, Array<{ id: string; text: string }>> = {
  ex01: [
    { id: 'ex01-defense', text: 'Can the student explain why ex01 must return a string instead of printing?' },
    { id: 'ex01-exact-output', text: 'Does the student know the exact newline and punctuation required by Hello World?' },
  ],
};

const getChecklist = async (questId: string, exerciseId: string) => {
  const manifest = await dbService.getQuestManifest(questId);
  const exercise = manifest?.exercises.find((item) => item.id === exerciseId);
  const baseItems = (exercise as any)?.auditChecklist?.length
    ? (exercise as any).auditChecklist
    : (EXERCISE_CHECKLIST[exerciseId] || [{ id: `${exerciseId}-defense`, text: `Can the student explain the solution for ${exerciseId}?` }]);

  return [
    ...baseItems,
    { id: 'repo-defense', text: 'Does the code in Gitea match what the student defends during the live session?' },
  ];
};

const normalizeExerciseId = (exerciseId: string) => exerciseId || 'ex01';

const decodeContent = (content: any) => {
  if (!content?.content) return '';
  return Buffer.from(String(content.content).replace(/\s/g, ''), 'base64').toString('utf8');
};

const currentUsername = (req: Request, fallback?: string) => getLmsUser(req)?.username || fallback || '';

export const getAuditAvailable = async (req: Request, res: Response) => {
  try {
    const questId = canonicalQuestId(String(req.query.questId || 'quest-00'));
    const exerciseId = req.query.exerciseId ? normalizeExerciseId(String(req.query.exerciseId)) : undefined;
    const auditor = currentUsername(req, String(req.query.auditor || ''));

    if (!auditor) return res.status(400).json({ error: 'Missing auditor session' });

    const eligible = exerciseId
      ? await dbService.hasPassedExercise(auditor, questId, exerciseId)
      : await dbService.hasCompletedQuest(auditor, questId);
    const points = await dbService.getAuditPoints(auditor);
    const queue = eligible ? await dbService.getAvailableAudits(questId, auditor, exerciseId) : [];

    res.status(200).json({
      questId,
      auditor,
      eligible,
      auditPoints: points?.points ?? 1,
      auditsCompleted: points?.audits_completed ?? 0,
      queue,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const assignAudit = async (req: Request, res: Response) => {
  try {
    const auditor = currentUsername(req, req.body.auditor);
    const requestedAuditee = req.body.auditee as string | undefined;
    const questId = canonicalQuestId(String(req.body.questId || 'quest-00'));
    const exerciseId = normalizeExerciseId(String(req.body.exerciseId || ''));

    if (!auditor || !questId || !exerciseId) return res.status(400).json({ error: 'Missing auditor, questId, or exerciseId' });

    const eligible = await dbService.hasPassedExercise(auditor, questId, exerciseId);
    if (!eligible) return res.status(403).json({ error: 'Auditor must pass this exercise before auditing it.' });

    const queue = await dbService.getAvailableAudits(questId, auditor, exerciseId);
    const candidates = requestedAuditee ? queue.filter((item: any) => item.username === requestedAuditee) : queue;
    if (!candidates.length) return res.status(404).json({ error: 'No eligible audit candidates are waiting.' });

    const match = candidates[Math.floor(Math.random() * candidates.length)];
    const auditee = match.username;
    const owner = toGiteaUsername(auditee);
    const repoName = repoNameForQuest(questId);
    const repoUrl = `${config.gitea.webUrl}/${owner}/${repoName}`;

    await giteaService.addCollaborator(owner, repoName, toGiteaUsername(auditor), 'read');

    const session = await dbService.createAuditSession(
      auditee,
      auditor,
      questId,
      exerciseId,
      repoUrl,
      new Date(Date.now() + 30 * 60 * 1000),
    );
    if (!session) throw new Error('Audit session could not be created');

    await dbService.updateStudentProgress(auditee, questId, 'AUDITING');

    res.status(200).json({ session, checklist: await getChecklist(questId, session.exercise_id || exerciseId) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuditSession = async (req: Request, res: Response) => {
  try {
    const session = await dbService.getAuditSession(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Audit session not found' });

    res.status(200).json({ session, checklist: await getChecklist(session.quest_id, session.exercise_id) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyAudit = async (req: Request, res: Response) => {
  try {
    const username = currentUsername(req, req.params.username);
    const questId = req.query.questId ? canonicalQuestId(String(req.query.questId)) : undefined;
    const sessions = await dbService.getActiveAuditsForUser(username, questId);
    const queue = await dbService.getQueueStatusForUser(username, questId);

    res.status(200).json({ session: sessions[0] || null, sessions, queue });
  } catch (error: any) {
    console.error('[AuditController] getMyAudit error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAuditCode = async (req: Request, res: Response) => {
  try {
    const session = await dbService.getAuditSession(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Audit session not found' });

    const owner = toGiteaUsername(session.auditee);
    const repo = repoNameForQuest(session.quest_id);
    const requestedPath = String(req.query.path || '');
    const exerciseRoot = `exercises/${session.exercise_id}`;
    const filePath = requestedPath && requestedPath !== '/' ? requestedPath : exerciseRoot;

    if (filePath !== exerciseRoot && !filePath.startsWith(`${exerciseRoot}/`)) {
      return res.status(403).json({ error: 'This audit can only inspect the assigned exercise.' });
    }

    const contents = await giteaService.getContents(owner, repo, filePath);
    if (Array.isArray(contents)) return res.status(200).json({ type: 'tree', path: filePath, entries: contents });

    res.status(200).json({
      type: 'file',
      path: contents.path,
      name: contents.name,
      content: decodeContent(contents),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitAudit = async (req: Request, res: Response) => {
  try {
    const { sessionId, checklist, feedback } = req.body;
    if (!sessionId || !checklist || typeof checklist !== 'object') {
      return res.status(400).json({ error: 'Missing sessionId or checklist' });
    }

    const session = await dbService.getAuditSession(String(sessionId));
    if (!session) return res.status(404).json({ error: 'Audit session not found' });

    const user = getLmsUser(req);
    if (user && user.username !== session.auditor && !isLmsAdmin(user)) {
      return res.status(403).json({ error: 'Only the assigned auditor can submit this audit.' });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      return res.status(409).json({ error: 'Audit session expired.' });
    }

    const requiredChecklist = await getChecklist(session.quest_id, session.exercise_id);
    const missing = requiredChecklist.filter((item) => typeof checklist[item.id] !== 'boolean');
    if (missing.length) return res.status(400).json({ error: 'Every checklist item must be toggled before submitting.' });

    const passed = requiredChecklist.every((item) => checklist[item.id] === true);
    const auditStatus = passed ? 'PASSED' : 'FAILED';
    const exerciseStatus = passed ? 'PASSED' : 'FAILED';

    const updated = await dbService.finalizeAuditSession(String(sessionId), auditStatus, checklist, feedback || '');
    await dbService.recordExerciseResult(session.auditee, session.quest_id, session.exercise_id, exerciseStatus, {
      audit_session_id: sessionId,
      checklist,
      feedback: feedback || '',
    });

    let progressStatus = passed ? 'IN_PROGRESS' : 'FAILED';
    if (passed) {
      const manifest = await dbService.getQuestManifest(session.quest_id);
      const states = await dbService.getExerciseAuditStates(session.auditee, session.quest_id);
      const audited = new Set(states.filter((item: any) => item.exercise_status === 'PASSED').map((item: any) => item.exercise_id));
      if (manifest?.exercises.every((exercise: any) => audited.has(exercise.id))) {
        progressStatus = 'COMPLETED';
        await dbService.awardQuestCompletionXp(session.auditee, session.quest_id);
      }
    }

    await dbService.updateStudentProgress(
      session.auditee,
      session.quest_id,
      progressStatus,
      passed ? undefined : session.exercise_id,
    );
    await dbService.removeFromQueue(session.auditee, session.quest_id, session.exercise_id);
    await dbService.adjustAuditPointsAfterSession(session.auditee, session.auditor);

    res.status(200).json({ session: updated, finalStatus: exerciseStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuditQueue = async (req: Request, res: Response) => getAuditAvailable(req, res);
export const bookAudit = async (req: Request, res: Response) => assignAudit(req, res);
