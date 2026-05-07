import { Request, Response } from 'express';
import { QuestManifest, manifestService } from '../services/manifestService';
import { giteaService } from '../services/giteaService';
import { dbService } from '../services/dbService';
import { config } from '../config/env';
import { canonicalQuestId, templateRepoNameForQuest } from '../services/identity';

export const listQuests = async (_req: Request, res: Response) => {
  try {
    const quests = await dbService.listQuestSummaries();
    res.status(200).json(quests.map((quest) => ({
      id: quest.id,
      name: quest.name || quest.title,
      exerciseCount: quest.exerciseCount,
    })));
  } catch (error: any) {
    console.error('[AdminController] Error listing quests:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getQuestDetail = async (req: Request, res: Response) => {
  try {
    const manifest = await dbService.getQuestManifest(req.params.id);
    if (!manifest) return res.status(404).json({ error: 'Quest not found' });
    res.status(200).json(manifest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const saveQuest = async (req: Request, res: Response) => {
  try {
    const incoming: QuestManifest = req.body;
    if (!incoming.id || !incoming.name) return res.status(400).json({ error: 'Missing quest id or name' });

    const manifest = await dbService.upsertQuestManifest({
      ...incoming,
      id: canonicalQuestId(incoming.id),
    });

    try {
      manifestService.saveManifest(manifest);
    } catch (diskError: any) {
      console.warn(`[Admin] Manifest disk cache skipped: ${diskError.message}`);
    }

    try {
      const repoName = templateRepoNameForQuest(manifest.id);
      await giteaService.createFile(
        config.gitea.templateOwner,
        repoName,
        'manifest.json',
        JSON.stringify(manifest, null, 2),
        'Admin Update: Sync manifest.json',
      );
      await dbService.recordGiteaRepository({
        repoFullName: `${config.gitea.templateOwner}/${repoName}`,
        owner: config.gitea.templateOwner,
        name: repoName,
        repoUrl: `${config.gitea.webUrl}/${config.gitea.templateOwner}/${repoName}`,
        questId: manifest.id,
        isTemplate: true,
      });
    } catch (giteaErr: any) {
      console.warn(`[Admin] Gitea sync skipped/failed: ${giteaErr.message}`);
    }

    res.status(200).json({ message: 'Quest saved successfully', id: manifest.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteQuest = async (req: Request, res: Response) => {
  try {
    await dbService.deleteQuestManifest(req.params.id);
    try {
      manifestService.deleteManifest(req.params.id);
    } catch {
      // The DB is the source of truth; deleting the cache is best effort.
    }
    res.status(200).json({ message: 'Quest deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
