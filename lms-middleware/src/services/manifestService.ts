import fs from 'fs';
import path from 'path';

interface Exercise {
  id: string;
  name: string;
  path: string;
  level?: number;
  xp?: string;
  filesToSubmit?: string[];
  allowedFunctions?: string[];
  instructions?: string;
  defaultCode?: string;
  defaultCodeByLanguage?: Record<string, string>;
  sampleTests?: ExerciseTest[];
  hiddenTests?: ExerciseTest[];
  restrictions?: ExerciseRestriction[];
  bonus?: boolean;
  auditChecklist?: Array<{ id: string; text: string }>;
}

export interface ExerciseTest {
  name: string;
  functionName: string;
  args: any[];
  expected: any;
}

export interface ExerciseRestriction {
  type: 'forbiddenSource';
  value: string;
  message: string;
}

export interface QuestManifest {
  id: string;
  name: string;
  language?: string;
  exercises: Exercise[];
}

export type PublicQuestManifest = Omit<QuestManifest, 'exercises'> & {
  exercises: Array<Omit<Exercise, 'hiddenTests'>>;
};

const toPublicManifest = (manifest: QuestManifest): PublicQuestManifest => ({
  ...manifest,
  exercises: manifest.exercises.map(({ hiddenTests, ...exercise }) => exercise),
});

export const manifestService = {
  /**
   * Get the manifest for a specific quest.
   * In a real app, this might be fetched from the template repo or a DB.
   */
  getManifest: (questId: string): QuestManifest | null => {
    try {
      const normalizedQuestId = questId.startsWith('quest-') ? questId : `quest-${questId}`;
      const manifestPath = path.join(process.cwd(), 'templates', `${normalizedQuestId}-manifest.json`);
      if (fs.existsSync(manifestPath)) {
        const content = fs.readFileSync(manifestPath, 'utf8');
        return JSON.parse(content);
      }
      // Fallback for demo purposes
      return {
        id: normalizedQuestId,
        name: normalizedQuestId.replace('-', ' '),
        exercises: [
          { id: 'ex00', name: 'Exercise 00', path: 'ex00/README.md' },
          { id: 'ex01', name: 'Exercise 01', path: 'ex01/README.md' }
        ]
      };
    } catch (error) {
      console.error(`Error reading manifest for ${questId}:`, error);
      return null;
    }
  },

  getPublicManifest: (questId: string): PublicQuestManifest | null => {
    const manifest = manifestService.getManifest(questId);
    return manifest ? toPublicManifest(manifest) : null;
  },

  getFirstExerciseId: (questId: string): string => {
    const manifest = manifestService.getManifest(questId);
    return manifest?.exercises[0]?.id || 'ex01';
  },

  /**
   * Get the next exercise ID in the sequence.
   */
  getNextExerciseId: (questId: string, currentExerciseId: string): string | 'DONE' => {
    const manifest = manifestService.getManifest(questId);
    if (!manifest) return 'DONE';

    const index = manifest.exercises.findIndex(e => e.id === currentExerciseId);
    if (index === -1 || index === manifest.exercises.length - 1) {
      return 'DONE';
    }

    return manifest.exercises[index + 1].id;
  },

  /**
   * List all available quest IDs by scanning the templates directory.
   */
  listQuests: (): string[] => {
    try {
      const templatesPath = path.join(process.cwd(), 'templates');
      if (!fs.existsSync(templatesPath)) return [];
      
      const files = fs.readdirSync(templatesPath);
      return files
        .filter(f => f.endsWith('-manifest.json'))
        .map(f => f.replace('-manifest.json', ''));
    } catch (error) {
      console.error('Error listing quests:', error);
      return [];
    }
  },

  /**
   * Save a manifest to the templates directory.
   */
  saveManifest: (manifest: QuestManifest): void => {
    try {
      const normalizedQuestId = manifest.id.startsWith('quest-') ? manifest.id : `quest-${manifest.id}`;
      const manifestPath = path.join(process.cwd(), 'templates', `${normalizedQuestId}-manifest.json`);
      
      // Ensure directory exists
      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      console.log(`[Manifest] Saved ${normalizedQuestId} to disk.`);
    } catch (error) {
      console.error(`Error saving manifest for ${manifest.id}:`, error);
      throw new Error(`Failed to save manifest: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Delete a manifest.
   */
  deleteManifest: (questId: string): void => {
    try {
      const normalizedQuestId = questId.startsWith('quest-') ? questId : `quest-${questId}`;
      const manifestPath = path.join(process.cwd(), 'templates', `${normalizedQuestId}-manifest.json`);
      if (fs.existsSync(manifestPath)) {
        fs.unlinkSync(manifestPath);
      }
    } catch (error) {
      console.error(`Error deleting manifest ${questId}:`, error);
      throw error;
    }
  }
};
