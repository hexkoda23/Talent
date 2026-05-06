import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { giteaService } from '../services/giteaService';
import { config } from '../config/env';
import { manifestService } from '../services/manifestService';

const EXERCISE_CHECKLIST: Record<string, Array<{ id: string; text: string }>> = {
  ex01: [
    { id: 'ex01-defense', text: 'Can the student explain why ex01 must return a string instead of printing?' },
    { id: 'ex01-exact-output', text: 'Does the student know the exact newline and punctuation required by Hello World?' },
  ],
  ex02: [
    { id: 'ex02-branches', text: 'Can the student explain the positive, zero, and negative branches in ex02?' },
    { id: 'ex02-zero', text: 'Can the student explain why zero returns P?' },
  ],
  ex03: [
    { id: 'ex03-loop', text: 'Can the student explain how the loop/building logic in ex03 works?' },
    { id: 'ex03-restriction', text: 'Does the solution avoid hardcoding the full digit string?' },
  ],
  ex04: [
    { id: 'ex04-no-len', text: 'Does ex04 avoid len() and can the student explain the counting method?' },
    { id: 'ex04-empty', text: 'Can the student explain how the empty string case returns 0?' },
  ],
  ex05: [
    { id: 'ex05-no-slice', text: 'Does ex05 avoid [::-1] and can the student explain the reverse algorithm?' },
    { id: 'ex05-edge-cases', text: 'Can the student defend single-character and empty-string behavior?' },
  ],
};

const getChecklist = (questId: string, exerciseId: string) => {
  const manifest = manifestService.getManifest(questId);
  const exercise = manifest?.exercises.find(ex => ex.id === exerciseId);
  
  const baseItems = exercise?.auditChecklist?.length 
    ? exercise.auditChecklist 
    : (EXERCISE_CHECKLIST[exerciseId] || [{ id: `${exerciseId}-defense`, text: `Can the student explain the solution for ${exerciseId}?` }]);

  return [
    ...baseItems,
    { id: 'repo-defense', text: 'Does the code in Gitea match what the student defends during the live session?' },
  ];
};

const toGiteaUsername = (username: string) => {
  const normalized = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || username;
};

const normalizeQuestId = (questId: string) => questId.replace(/^quest-/, '');
const normalizeExerciseId = (exerciseId: string) => exerciseId || 'ex01';

const decodeContent = (content: any) => {
  if (!content?.content) return '';
  return Buffer.from(String(content.content).replace(/\s/g, ''), 'base64').toString('utf8');
};

export const getAuditAvailable = async (req: Request, res: Response) => {
  try {
    const questId = normalizeQuestId(String(req.query.questId || '00'));
    const exerciseId = req.query.exerciseId ? normalizeExerciseId(String(req.query.exerciseId)) : undefined;
    const auditor = String(req.query.auditor || '');

    if (!auditor) return res.status(400).json({ error: 'Missing auditor' });

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
    const { auditor, questId: rawQuestId } = req.body;
    const requestedAuditee = req.body.auditee as string | undefined;
    const questId = normalizeQuestId(String(rawQuestId || '00'));
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
    const repoName = `quest-${questId}`;
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

    await dbService.updateStudentProgress(auditee, questId, 'AUDITING');

    res.status(200).json({ session, checklist: getChecklist(questId, session.exercise_id || exerciseId) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuditSession = async (req: Request, res: Response) => {
  try {
    const session = await dbService.getAuditSession(Number(req.params.sessionId));
    if (!session) return res.status(404).json({ error: 'Audit session not found' });

    res.status(200).json({ session, checklist: getChecklist(session.quest_id, session.exercise_id) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyAudit = async (req: Request, res: Response) => {
  try {
    const username = String(req.params.username || '');
    const questId = req.query.questId ? normalizeQuestId(String(req.query.questId)) : undefined;
    
    console.log(`[AuditController] getMyAudit for ${username}, questId: ${questId}`);
    
    const sessions = await dbService.getActiveAuditsForUser(username, questId);
    const queue = await dbService.getQueueStatusForUser(username, questId);
    
    console.log(`[AuditController] Found ${sessions.length} sessions and ${queue.length} queue items for ${username}`);
    
    res.status(200).json({ session: sessions[0] || null, sessions, queue });
  } catch (error: any) {
    console.error('[AuditController] getMyAudit error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAuditCode = async (req: Request, res: Response) => {
  try {
    const session = await dbService.getAuditSession(Number(req.params.sessionId));
    if (!session) return res.status(404).json({ error: 'Audit session not found' });

    const owner = toGiteaUsername(session.auditee);
    const repo = `quest-${session.quest_id}`;
    const requestedPath = String(req.query.path || '');
    const exerciseRoot = `exercises/${session.exercise_id}`;
    const filePath = requestedPath && requestedPath !== '/'
      ? requestedPath
      : exerciseRoot;

    if (filePath !== exerciseRoot && !filePath.startsWith(`${exerciseRoot}/`)) {
      return res.status(403).json({ error: 'This audit can only inspect the assigned exercise.' });
    }

    const contents = await giteaService.getContents(owner, repo, filePath);

    if (Array.isArray(contents)) {
      return res.status(200).json({ type: 'tree', path: filePath, entries: contents });
    }

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

    const session = await dbService.getAuditSession(Number(sessionId));
    if (!session) return res.status(404).json({ error: 'Audit session not found' });
    if (new Date(session.expires_at).getTime() < Date.now()) {
      return res.status(409).json({ error: 'Audit session expired.' });
    }

    const requiredChecklist = getChecklist(session.quest_id, session.exercise_id);
    const missing = requiredChecklist.filter((item) => typeof checklist[item.id] !== 'boolean');
    if (missing.length) {
      return res.status(400).json({ error: 'Every checklist item must be toggled before submitting.' });
    }

    const passed = requiredChecklist.every((item) => checklist[item.id] === true);
    const auditStatus = passed ? 'PASSED' : 'FAILED';
    const exerciseStatus = passed ? 'PASSED' : 'FAILED';

    const updated = await dbService.finalizeAuditSession(Number(sessionId), auditStatus, checklist, feedback || '');
    await dbService.recordExerciseResult(session.auditee, session.quest_id, session.exercise_id, exerciseStatus, {
      audit_session_id: sessionId,
      checklist,
      feedback: feedback || '',
    });
    let progressStatus = passed ? 'IN_PROGRESS' : 'FAILED';
    if (passed) {
      const manifest = manifestService.getManifest(session.quest_id);
      const states = await dbService.getExerciseAuditStates(session.auditee, session.quest_id);
      const audited = new Set(states.filter((item: any) => item.exercise_status === 'PASSED').map((item: any) => item.exercise_id));
      if (manifest?.exercises.every((exercise: any) => audited.has(exercise.id))) {
        progressStatus = 'COMPLETED';
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

// Backward-compatible wrappers.
export const getAuditQueue = async (req: Request, res: Response) => getAuditAvailable(req, res);
export const bookAudit = async (req: Request, res: Response) => assignAudit(req, res);
