import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { canonicalQuestId } from '../src/services/identity';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const force = process.argv.includes('--force');
const templatesDir = path.resolve(process.cwd(), 'templates');

const parseXp = (value: unknown) => {
  if (typeof value === 'number') return Math.round(value);
  const match = String(value || '').match(/[\d.]+/);
  return match ? Math.round(Number(match[0]) * 100) : 0;
};

const json = (value: unknown) => JSON.stringify(value ?? null);

async function importManifest(filePath: string) {
  const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questId = canonicalQuestId(manifest.id || path.basename(filePath).replace('-manifest.json', ''));
  const existing = await pool.query('SELECT id FROM "Quest" WHERE id = $1', [questId]);

  if (existing.rowCount && !force) {
    console.log(`[skip] ${questId} already exists. Use --force to overwrite DB manifest data.`);
    return;
  }

  const exercises = manifest.exercises || [];
  const totalXp = exercises.reduce((sum: number, exercise: any) => sum + parseXp(exercise.xp), 0);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO "Quest" (id, name, slug, description, language, "xpReward", level, manifest, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
       ON CONFLICT (id)
       DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         description = EXCLUDED.description,
         language = EXCLUDED.language,
         "xpReward" = EXCLUDED."xpReward",
         level = EXCLUDED.level,
         manifest = EXCLUDED.manifest,
         "isActive" = true,
         "updatedAt" = NOW()`,
      [
        questId,
        manifest.name || questId,
        questId,
        manifest.description || null,
        manifest.language || 'python',
        totalXp,
        manifest.level || null,
        json({ ...manifest, id: questId }),
      ],
    );

    for (const [index, exercise] of exercises.entries()) {
      await client.query(
        `INSERT INTO "QuestExercise"
          ("id", "questId", "exerciseId", name, path, "order", level, "xpReward", instructions,
           "filesToSubmit", "allowedFunctions", "defaultCode", "defaultCodeByLanguage", "sampleTests",
           "hiddenTests", restrictions, "auditChecklist", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
         ON CONFLICT ("questId", "exerciseId")
         DO UPDATE SET
           name = EXCLUDED.name,
           path = EXCLUDED.path,
           "order" = EXCLUDED."order",
           level = EXCLUDED.level,
           "xpReward" = EXCLUDED."xpReward",
           instructions = EXCLUDED.instructions,
           "filesToSubmit" = EXCLUDED."filesToSubmit",
           "allowedFunctions" = EXCLUDED."allowedFunctions",
           "defaultCode" = EXCLUDED."defaultCode",
           "defaultCodeByLanguage" = EXCLUDED."defaultCodeByLanguage",
           "sampleTests" = EXCLUDED."sampleTests",
           "hiddenTests" = EXCLUDED."hiddenTests",
           restrictions = EXCLUDED.restrictions,
           "auditChecklist" = EXCLUDED."auditChecklist",
           "updatedAt" = NOW()`,
        [
          randomUUID(),
          questId,
          exercise.id,
          exercise.name || exercise.id,
          exercise.path || `exercises/${exercise.id}/README.md`,
          index,
          exercise.level || null,
          parseXp(exercise.xp),
          exercise.instructions || null,
          json(exercise.filesToSubmit || []),
          json(exercise.allowedFunctions || []),
          exercise.defaultCode || null,
          json(exercise.defaultCodeByLanguage || {}),
          json(exercise.sampleTests || []),
          json(exercise.hiddenTests || []),
          json(exercise.restrictions || []),
          json(exercise.auditChecklist || []),
        ],
      );
    }

    await client.query('COMMIT');
    console.log(`[ok] imported ${questId} (${exercises.length} exercises)`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!fs.existsSync(templatesDir)) throw new Error(`Template directory not found: ${templatesDir}`);

  const files = fs.readdirSync(templatesDir)
    .filter((file) => file.endsWith('-manifest.json'))
    .map((file) => path.join(templatesDir, file));

  for (const file of files) {
    await importManifest(file);
  }
}

main()
  .finally(() => pool.end())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
