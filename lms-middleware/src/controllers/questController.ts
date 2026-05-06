import { Request, Response } from 'express';
import { giteaService } from '../services/giteaService';
import { dbService } from '../services/dbService';
import { config } from '../config/env';
import { manifestService } from '../services/manifestService';

const toGiteaUsername = (username: string) => {
  const normalized = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || username;
};

const questNumber = (questId: string) => Number.parseInt(questId.replace(/^quest-/, ''), 10);

const getPreviousQuestId = (questId: string) => {
  const current = questNumber(questId);
  if (Number.isNaN(current) || current <= 0) return null;
  return String(current - 1).padStart(2, '0');
};

const ensureQuestUnlocked = async (studentUsername: string, questId: string) => {
  const previousQuestId = getPreviousQuestId(questId);
  if (!previousQuestId) return null;

  const progress = await dbService.getStudentProgress(studentUsername);
  const previousQuest = progress.find((item: any) => item.quest_id === previousQuestId || item.quest_id === `quest-${previousQuestId}`);

  if (previousQuest?.status === 'COMPLETED') return null;
  return `Quest ${questId} stays locked until Quest ${previousQuestId} is completed.`;
};

export const startQuest = async (req: Request, res: Response) => {
  const { studentUsername, email, questId } = req.body;

  if (!studentUsername || !email || !questId) {
    return res.status(400).json({ error: 'Missing required fields: studentUsername, email, questId' });
  }

  const templateOwner = 'curriculum-team';
  const normalizedQuestId = questId.replace(/^quest-/, '');
  const templateRepo = `quest-${normalizedQuestId}-template`;
  const newRepoName = `quest-${normalizedQuestId}`;
  const giteaUsername = toGiteaUsername(studentUsername);

  try {
    const unlockError = await ensureQuestUnlocked(studentUsername, questId);
    if (unlockError) {
      return res.status(403).json({ error: unlockError });
    }

    console.log(`Starting quest ${questId} for ${studentUsername}...`);

    // 1. Ensure user exists in Gitea
    await giteaService.createUser(giteaUsername, email);

    // 2. Provision the repository from template
    await giteaService.generateRepo(giteaUsername, templateOwner, templateRepo, newRepoName);
    await giteaService.enableActions(giteaUsername, newRepoName);

    // 4. Add manifest file to the repository
    const manifest = manifestService.getManifest(questId);
    if (manifest) {
      await giteaService.createFile(
        giteaUsername,
        newRepoName,
        'manifest.json',
        JSON.stringify(manifest, null, 2),
        'Add quest manifest'
      );
    }

    // 5. Add the grading bot as collaborator
    await giteaService.addBotCollaborator(giteaUsername, newRepoName);

    // 4. Inject Middleware API Key as a repository secret
    // This allows the Gitea Actions workflow to post results back to our /webhooks/gitea endpoint
    if (config.server.apiKey) {
      await giteaService.setRepoSecret(giteaUsername, newRepoName, 'MIDDLEWARE_API_KEY', config.server.apiKey);
      console.log(`[Quest] Secret injected for ${giteaUsername}/${newRepoName}`);
    }

    // 5. Update local DB to show quest has started
    await dbService.updateStudentProgress(studentUsername, questId, 'IN_PROGRESS', manifestService.getFirstExerciseId(questId));

    res.status(200).json({ 
      message: 'Quest environment provisioned successfully!',
      repoFullName: `${giteaUsername}/${newRepoName}`,
      repoUrl: `${config.gitea.webUrl}/${giteaUsername}/${newRepoName}`
    });
  } catch (error: any) {
    console.error('Error starting quest:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getQuestAccess = async (req: Request, res: Response) => {
  const { questId, studentUsername } = req.params;

  if (!questId || !studentUsername) {
    return res.status(400).json({ error: 'Missing required fields: questId, studentUsername' });
  }

  const normalizedQuestId = questId.replace(/^quest-/, '');
  const templateOwner = 'Dotunbey';
  const templateRepo = `quest-${normalizedQuestId}-template`;
  const repoName = `quest-${normalizedQuestId}`;
  const giteaUsername = toGiteaUsername(studentUsername);
  let giteaWarning: string | undefined;

  try {
    const unlockError = await ensureQuestUnlocked(studentUsername, questId);
    if (unlockError) {
      return res.status(403).json({ error: unlockError });
    }

    const existingRepo = await giteaService.getRepo(giteaUsername, repoName);
    if (!existingRepo) {
      await giteaService.createUser(giteaUsername, `${giteaUsername}@local.dev`);
      await giteaService.generateRepo(giteaUsername, templateOwner, templateRepo, repoName);
      await giteaService.enableActions(giteaUsername, repoName);
      
      // Add manifest file to the repository
      const manifest = manifestService.getManifest(questId);
      if (manifest) {
        await giteaService.createFile(
          giteaUsername,
          repoName,
          'manifest.json',
          JSON.stringify(manifest, null, 2),
          'Add quest manifest'
        );
      }
      
      await giteaService.addBotCollaborator(giteaUsername, repoName);
      if (config.server.apiKey) {
        await giteaService.setRepoSecret(giteaUsername, repoName, 'MIDDLEWARE_API_KEY', config.server.apiKey);
      }
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

export const listQuests = async (req: Request, res: Response) => {
  try {
    const quests = manifestService.listQuests();
    const details = quests.map((id) => {
      const manifest = manifestService.getManifest(id);
      return {
        id: manifest?.id || id,
        title: manifest?.name || id,
        description: (manifest as any)?.description || '',
        exerciseCount: manifest?.exercises.length || 0,
        xp: (manifest as any)?.xp || `${(manifest?.exercises.length || 0) * 250} XP`,
        level: (manifest as any)?.level || (Number.parseInt(id.replace('quest-', '')) + 1)
      };
    });
    res.status(200).json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
