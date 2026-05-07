import { Request, Response } from 'express';
import { giteaService } from '../services/giteaService';
import { dbService } from '../services/dbService';
import { config } from '../config/env';
import { manifestService } from '../services/manifestService';
import { canonicalQuestId, repoNameForQuest, shortQuestId, templateRepoNameForQuest, toGiteaUsername } from '../services/identity';
import { getLmsUser, isLmsAdmin } from '../services/sessionService';

const questNumber = (questId: string) => Number.parseInt(shortQuestId(questId), 10);

const getPreviousQuestId = (questId: string) => {
  const current = questNumber(questId);
  if (Number.isNaN(current) || current <= 0) return null;
  return `quest-${String(current - 1).padStart(2, '0')}`;
};

const requestedUser = async (req: Request) => {
  const sessionUser = getLmsUser(req);
  const paramUsername = req.params.studentUsername;
  if (sessionUser && (!paramUsername || paramUsername === 'me' || paramUsername === sessionUser.username || !isLmsAdmin(sessionUser))) {
    return sessionUser;
  }

  if (paramUsername && isLmsAdmin(sessionUser)) {
    const platformUser = await dbService.getPlatformUserByUsername(paramUsername);
    if (platformUser) return platformUser;
  }

  return sessionUser || null;
};

const ensureQuestUnlocked = async (studentUsername: string, questId: string) => {
  const previousQuestId = getPreviousQuestId(questId);
  if (!previousQuestId) return null;

  const progress = await dbService.getStudentProgress(studentUsername);
  const previousQuest = progress.find((item: any) => canonicalQuestId(item.quest_id) === previousQuestId);

  if (previousQuest?.status === 'COMPLETED') return null;
  return `Quest ${canonicalQuestId(questId)} stays locked until ${previousQuestId} is completed.`;
};

const firstExerciseId = async (questId: string) => {
  const manifest = await dbService.getQuestManifest(questId);
  return manifest?.exercises[0]?.id || manifestService.getFirstExerciseId(questId);
};

const provisionQuestRepository = async (input: {
  userId?: string;
  studentUsername: string;
  email: string;
  questId: string;
}) => {
  const canonical = canonicalQuestId(input.questId);
  const repoName = repoNameForQuest(canonical);
  const templateRepo = templateRepoNameForQuest(canonical);
  const giteaUsername = toGiteaUsername(input.studentUsername);

  await giteaService.createUser(giteaUsername, input.email);
  const repo = await giteaService.generateRepo(giteaUsername, config.gitea.templateOwner, templateRepo, repoName);
  await giteaService.enableActions(giteaUsername, repoName);

  const manifest = await dbService.getQuestManifest(canonical);
  if (manifest) {
    await giteaService.createFile(
      giteaUsername,
      repoName,
      'manifest.json',
      JSON.stringify(manifest, null, 2),
      'Add quest manifest',
    );
  }

  await giteaService.addBotCollaborator(giteaUsername, repoName);
  if (config.server.apiKey) {
    await giteaService.setRepoSecret(giteaUsername, repoName, 'MIDDLEWARE_API_KEY', config.server.apiKey);
  }

  const repoFullName = `${giteaUsername}/${repoName}`;
  const repoUrl = `${config.gitea.webUrl}/${repoFullName}`;
  await dbService.recordGiteaRepository({
    userId: input.userId,
    questId: canonical,
    repoFullName,
    owner: giteaUsername,
    name: repoName,
    repoUrl,
    giteaRepoId: repo?.id,
  });

  return { repoFullName, repoUrl };
};

export const startQuest = async (req: Request, res: Response) => {
  const sessionUser = getLmsUser(req);
  const questId = canonicalQuestId(req.params.questId || req.body.questId);
  const studentUsername = sessionUser?.username || req.body.studentUsername;
  const email = sessionUser?.email || req.body.email;
  const userId = sessionUser?.id;

  if (!studentUsername || !email || !questId) {
    return res.status(400).json({ error: 'Missing required fields: questId' });
  }

  try {
    const unlockError = await ensureQuestUnlocked(studentUsername, questId);
    if (unlockError) return res.status(403).json({ error: unlockError });

    const repository = await provisionQuestRepository({ userId, studentUsername, email, questId });
    await dbService.updateStudentProgress(studentUsername, questId, 'IN_PROGRESS', await firstExerciseId(questId));

    res.status(200).json({
      message: 'Quest environment provisioned successfully.',
      ...repository,
    });
  } catch (error: any) {
    console.error('Error starting quest:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getQuestAccess = async (req: Request, res: Response) => {
  const questId = canonicalQuestId(req.params.questId);
  const user = await requestedUser(req);

  if (!questId || !user) {
    return res.status(400).json({ error: 'Missing quest or user session' });
  }

  const repoName = repoNameForQuest(questId);
  const giteaUsername = toGiteaUsername(user.username);
  let giteaWarning: string | undefined;

  try {
    const unlockError = await ensureQuestUnlocked(user.username, questId);
    if (unlockError) return res.status(403).json({ error: unlockError });

    const existingRepo = await giteaService.getRepo(giteaUsername, repoName);
    if (!existingRepo) {
      await provisionQuestRepository({
        userId: user.id,
        studentUsername: user.username,
        email: user.email,
        questId,
      });
    } else {
      await dbService.recordGiteaRepository({
        userId: user.id,
        questId,
        repoFullName: `${giteaUsername}/${repoName}`,
        owner: giteaUsername,
        name: repoName,
        repoUrl: `${config.gitea.webUrl}/${giteaUsername}/${repoName}`,
        giteaRepoId: existingRepo.id,
      });
    }
  } catch (error: any) {
    giteaWarning = error.message || 'Gitea repository could not be verified.';
  }

  res.status(200).json({
    repoFullName: `${giteaUsername}/${repoName}`,
    repoUrl: `${config.gitea.webUrl}/${giteaUsername}/${repoName}`,
    giteaWarning,
  });
};

export const listQuests = async (_req: Request, res: Response) => {
  try {
    const quests = await dbService.listQuestSummaries();
    res.status(200).json(quests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuestManifest = async (req: Request, res: Response) => {
  const { questId } = req.params;
  const manifest = await dbService.getQuestManifest(questId);
  if (!manifest) return res.status(404).json({ error: 'Manifest not found' });
  const publicManifest = {
    ...manifest,
    exercises: manifest.exercises.map(({ hiddenTests, ...exercise }: any) => exercise),
  };
  res.json(publicManifest);
};
