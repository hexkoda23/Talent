import { Request, Response } from 'express';
import { manifestService, QuestManifest } from '../services/manifestService';
import { giteaService } from '../services/giteaService';

export const listQuests = async (req: Request, res: Response) => {
  try {
    console.log('[AdminController] Listing quests...');
    const quests = manifestService.listQuests();
    const details = quests.map(id => {
      const manifest = manifestService.getManifest(id);
      return {
        id: manifest?.id || id,
        name: manifest?.name || id,
        exerciseCount: manifest?.exercises.length || 0
      };
    });
    console.log(`[AdminController] Found ${details.length} quests.`);
    res.status(200).json(details);
  } catch (error: any) {
    console.error('[AdminController] Error listing quests:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getQuestDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const manifest = manifestService.getManifest(id);
    if (!manifest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    res.status(200).json(manifest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const saveQuest = async (req: Request, res: Response) => {
  try {
    const manifest: QuestManifest = req.body;
    if (!manifest.id || !manifest.name) {
      return res.status(400).json({ error: 'Missing quest id or name' });
    }
    
    manifestService.saveManifest(manifest);

    // Sync to Gitea template repo if possible
    try {
      const templateOwner = 'Dotunbey';
      const repoName = manifest.id.startsWith('quest-') ? manifest.id : `quest-${manifest.id}`;
      await giteaService.createFile(templateOwner, repoName, 'manifest.json', JSON.stringify(manifest, null, 2), 'Admin Update: Sync manifest.json');
      console.log(`[Admin] Synced manifest for ${repoName} to Gitea.`);
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
    const { id } = req.params;
    manifestService.deleteManifest(id);
    res.status(200).json({ message: 'Quest deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
