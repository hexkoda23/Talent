import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { config } from '../config/env';
import { canonicalQuestId, shortQuestId, toGiteaUsername } from './identity';
import { manifestService, QuestManifest } from './manifestService';

export const pool = new Pool({
  connectionString: config.db.url,
});

export interface PlatformUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationId: string;
  isActive: boolean;
  username: string;
  roles: string[];
}

type AuditStatus = 'PASSED' | 'FAILED' | 'WAITING_FOR_AUDIT' | 'AUDITING';

const json = (value: unknown) => JSON.stringify(value ?? null);

const parseXp = (value: unknown) => {
  if (typeof value === 'number') return Math.round(value);
  const match = String(value || '').match(/[\d.]+/);
  if (!match) return 0;
  return Math.round(Number(match[0]) * 100);
};

const questSlug = (questId: string) => canonicalQuestId(questId).replace(/^quest-/, 'quest-');

const mapUser = (row: any): PlatformUser => ({
  id: row.id,
  email: row.email,
  firstName: row.firstName,
  lastName: row.lastName,
  organizationId: row.organizationId,
  isActive: row.isActive,
  username: row.username || toGiteaUsername(row.email),
  roles: row.roles || [],
});

const userSelect = `
  SELECT
    u.id,
    u.email,
    u."firstName",
    u."lastName",
    u."organizationId",
    u."isActive",
    COALESCE(ga."giteaUsername", regexp_replace(lower(split_part(u.email, '@', 1)), '[^a-z0-9._-]+', '-', 'g')) AS username,
    COALESCE(array_remove(array_agg(r.name), NULL), ARRAY[]::text[]) AS roles
  FROM "User" u
  LEFT JOIN "GiteaAccount" ga ON ga."userId" = u.id
  LEFT JOIN "UserRole" ur ON ur."userId" = u.id
  LEFT JOIN "Role" r ON r.id = ur."roleId"
`;

const userGroup = 'GROUP BY u.id, ga."giteaUsername"';

const userByUsername = async (username: string) => {
  const result = await pool.query(
    `${userSelect}
     WHERE ga."giteaUsername" = $1 OR lower(split_part(u.email, '@', 1)) = lower($1) OR lower(u.email) = lower($1)
     ${userGroup}
     LIMIT 1`,
    [username],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
};

const userIdByUsername = async (username: string) => {
  const user = await userByUsername(username);
  return user?.id || null;
};

const userNameById = async (userId: string) => {
  const user = await dbService.getPlatformUserById(userId);
  return user?.username || userId;
};

const normalizeSessionRow = async (row: any) => {
  if (!row) return null;
  return {
    id: row.id,
    auditee: row.auditee,
    auditor: row.auditor,
    quest_id: row.quest_id,
    exercise_id: row.exercise_id,
    repo_url: row.repo_url,
    status: row.status,
    checklist_results: row.checklist_results,
    feedback: row.feedback,
    expires_at: row.expires_at,
    created_at: row.created_at,
    finished_at: row.finished_at,
  };
};

const auditSessionSelect = `
  SELECT
    a.id,
    COALESCE(auditee_ga."giteaUsername", lower(split_part(auditee.email, '@', 1))) AS auditee,
    COALESCE(auditor_ga."giteaUsername", lower(split_part(auditor.email, '@', 1))) AS auditor,
    a."questId" AS quest_id,
    a."exerciseId" AS exercise_id,
    a."repoUrl" AS repo_url,
    a.status,
    a."checklistResults" AS checklist_results,
    a.feedback,
    a."expiresAt" AS expires_at,
    a."createdAt" AS created_at,
    a."finishedAt" AS finished_at
  FROM "Audit" a
  JOIN "User" auditee ON auditee.id = a."auditeeId"
  JOIN "User" auditor ON auditor.id = a."auditorId"
  LEFT JOIN "GiteaAccount" auditee_ga ON auditee_ga."userId" = auditee.id
  LEFT JOIN "GiteaAccount" auditor_ga ON auditor_ga."userId" = auditor.id
`;

const fallbackManifest = async (questId: string) => manifestService.getManifest(questId);

/**
 * Main database adapter for the LMS middleware.
 *
 * These methods intentionally keep the old snake_case response shape used by the
 * React workspace while persisting to the main platform tables.
 */
export const dbService = {
  ensureAuditSchema: async () => {
    // Schema is owned by the main backend Prisma migrations.
    return true;
  },

  getPlatformUserById: async (userId: string) => {
    const result = await pool.query(
      `${userSelect}
       WHERE u.id = $1
       ${userGroup}
       LIMIT 1`,
      [userId],
    );

    const user = result.rows[0] ? mapUser(result.rows[0]) : null;
    if (!user) return null;
    const account = await dbService.ensureGiteaAccount(user.id, user.username, user.email);
    return { ...user, username: account.giteaUsername };
  },

  getPlatformUserByUsername: userByUsername,

  ensureGiteaAccount: async (userId: string, preferredUsername: string, email?: string) => {
    const existing = await pool.query(
      'SELECT "giteaUsername", email, "giteaUserId" FROM "GiteaAccount" WHERE "userId" = $1',
      [userId],
    );
    if (existing.rows[0]) return existing.rows[0] as { giteaUsername: string; email?: string; giteaUserId?: number };

    const base = toGiteaUsername(preferredUsername || email || userId);
    const candidates = [base, `${base}-${userId.slice(0, 8)}`];

    for (const candidate of candidates) {
      try {
        const result = await pool.query(
          `INSERT INTO "GiteaAccount" ("id", "userId", "giteaUsername", email, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING "giteaUsername", email, "giteaUserId"`,
          [randomUUID(), userId, candidate, email || null],
        );
        return result.rows[0] as { giteaUsername: string; email?: string; giteaUserId?: number };
      } catch (error: any) {
        if (error.code !== '23505') throw error;
      }
    }

    const result = await pool.query(
      `INSERT INTO "GiteaAccount" ("id", "userId", "giteaUsername", email, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT ("userId") DO UPDATE SET email = EXCLUDED.email, "updatedAt" = NOW()
       RETURNING "giteaUsername", email, "giteaUserId"`,
      [randomUUID(), userId, `${base}-${randomUUID().slice(0, 8)}`, email || null],
    );
    return result.rows[0] as { giteaUsername: string; email?: string; giteaUserId?: number };
  },

  recordGiteaRepository: async (input: {
    userId?: string | null;
    questId?: string | null;
    repoFullName: string;
    owner: string;
    name: string;
    repoUrl: string;
    giteaRepoId?: number | null;
    isTemplate?: boolean;
  }) => {
    const questId = input.questId ? canonicalQuestId(input.questId) : null;
    const result = await pool.query(
      `INSERT INTO "GiteaRepository"
        ("id", "userId", "questId", "repoFullName", owner, name, "repoUrl", "giteaRepoId", "isTemplate", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT ("repoFullName")
       DO UPDATE SET
         "userId" = COALESCE(EXCLUDED."userId", "GiteaRepository"."userId"),
         "questId" = COALESCE(EXCLUDED."questId", "GiteaRepository"."questId"),
         owner = EXCLUDED.owner,
         name = EXCLUDED.name,
         "repoUrl" = EXCLUDED."repoUrl",
         "giteaRepoId" = COALESCE(EXCLUDED."giteaRepoId", "GiteaRepository"."giteaRepoId"),
         "isTemplate" = EXCLUDED."isTemplate",
         "updatedAt" = NOW()
       RETURNING *`,
      [
        randomUUID(),
        input.userId || null,
        questId,
        input.repoFullName,
        input.owner,
        input.name,
        input.repoUrl,
        input.giteaRepoId || null,
        input.isTemplate || false,
      ],
    );
    return result.rows[0];
  },

  listQuestSummaries: async () => {
    const result = await pool.query(
      `SELECT q.id, q.name, q.description, q."xpReward", q.level, q.manifest, COUNT(e.id)::int AS "exerciseCount"
       FROM "Quest" q
       LEFT JOIN "QuestExercise" e ON e."questId" = q.id
       WHERE q."isActive" = true
       GROUP BY q.id
       ORDER BY q.id ASC`,
    );

    if (result.rows.length) {
      return result.rows.map((row) => ({
        id: row.id,
        title: row.name,
        name: row.name,
        description: row.description || row.manifest?.description || '',
        exerciseCount: row.exerciseCount,
        xp: row.xpReward ? `${row.xpReward} XP` : row.manifest?.xp || `${row.exerciseCount * 250} XP`,
        level: row.level || row.manifest?.level || (Number.parseInt(shortQuestId(row.id), 10) + 1),
      }));
    }

    const manifest = await fallbackManifest('quest-00');
    return manifest ? [{
      id: manifest.id,
      title: manifest.name,
      name: manifest.name,
      description: (manifest as any).description || '',
      exerciseCount: manifest.exercises.length,
      xp: (manifest as any).xp || `${manifest.exercises.length * 250} XP`,
      level: (manifest as any).level || 1,
    }] : [];
  },

  getQuestManifest: async (questId: string): Promise<QuestManifest | null> => {
    const canonical = canonicalQuestId(questId);
    const questResult = await pool.query(
      'SELECT id, name, language, manifest FROM "Quest" WHERE id = $1 AND "isActive" = true',
      [canonical],
    );
    const quest = questResult.rows[0];

    if (!quest) return fallbackManifest(canonical);
    if (quest.manifest) return quest.manifest as QuestManifest;

    const exerciseResult = await pool.query(
      `SELECT
        "exerciseId" AS id,
        name,
        path,
        level,
        "xpReward",
        instructions,
        "filesToSubmit",
        "allowedFunctions",
        "defaultCode",
        "defaultCodeByLanguage",
        "sampleTests",
        "hiddenTests",
        restrictions,
        "auditChecklist"
       FROM "QuestExercise"
       WHERE "questId" = $1
       ORDER BY "order" ASC`,
      [canonical],
    );

    return {
      id: quest.id,
      name: quest.name,
      language: quest.language,
      exercises: exerciseResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        path: row.path,
        level: row.level,
        xp: row.xpReward ? `${row.xpReward} XP` : undefined,
        instructions: row.instructions,
        filesToSubmit: row.filesToSubmit || [],
        allowedFunctions: row.allowedFunctions || [],
        defaultCode: row.defaultCode,
        defaultCodeByLanguage: row.defaultCodeByLanguage || {},
        sampleTests: row.sampleTests || [],
        hiddenTests: row.hiddenTests || [],
        restrictions: row.restrictions || [],
        auditChecklist: row.auditChecklist || [],
      })),
    };
  },

  upsertQuestManifest: async (manifest: QuestManifest) => {
    const canonical = canonicalQuestId(manifest.id);
    const exercises = manifest.exercises || [];
    const totalXp = exercises.reduce((sum, exercise) => sum + parseXp((exercise as any).xp), 0);
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
          canonical,
          manifest.name,
          questSlug(canonical),
          (manifest as any).description || null,
          manifest.language || 'python',
          totalXp,
          (manifest as any).level || null,
          json({ ...manifest, id: canonical }),
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
            canonical,
            exercise.id,
            exercise.name,
            exercise.path,
            index,
            exercise.level || null,
            parseXp((exercise as any).xp),
            exercise.instructions || null,
            json(exercise.filesToSubmit || []),
            json(exercise.allowedFunctions || []),
            exercise.defaultCode || null,
            json(exercise.defaultCodeByLanguage || {}),
            json(exercise.sampleTests || []),
            json(exercise.hiddenTests || []),
            json(exercise.restrictions || []),
            json((exercise as any).auditChecklist || []),
          ],
        );
      }

      await client.query(
        `DELETE FROM "QuestExercise"
         WHERE "questId" = $1 AND NOT ("exerciseId" = ANY($2::text[]))`,
        [canonical, exercises.map((exercise) => exercise.id)],
      );

      await client.query('COMMIT');
      return { ...manifest, id: canonical };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  deleteQuestManifest: async (questId: string) => {
    await pool.query('UPDATE "Quest" SET "isActive" = false, "updatedAt" = NOW() WHERE id = $1', [canonicalQuestId(questId)]);
  },

  getAuditQueue: async (questId: string, exerciseId?: string) => {
    const result = await pool.query(
      `SELECT
        COALESCE(ga."giteaUsername", lower(split_part(u.email, '@', 1))) AS username,
        q."questId" AS quest_id,
        q."exerciseId" AS exercise_id,
        q."joinedAt" AS joined_at,
        q."joinedAt" AS waiting_since
       FROM "AuditQueue" q
       JOIN "User" u ON u.id = q."userId"
       LEFT JOIN "GiteaAccount" ga ON ga."userId" = u.id
       WHERE q.status = 'WAITING'
         AND q."questId" = $1
         AND ($2::text IS NULL OR q."exerciseId" = $2)
       ORDER BY q."joinedAt" ASC`,
      [canonicalQuestId(questId), exerciseId || null],
    );
    return result.rows;
  },

  getQueueStatusForUser: async (username: string, questId?: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) return [];
    const result = await pool.query(
      `SELECT
        $1::text AS username,
        "questId" AS quest_id,
        "exerciseId" AS exercise_id,
        "joinedAt" AS joined_at,
        "joinedAt" AS waiting_since,
        status
       FROM "AuditQueue"
       WHERE "userId" = $2
         AND ($3::text IS NULL OR "questId" = $3)
       ORDER BY "joinedAt" DESC`,
      [username, userId, questId ? canonicalQuestId(questId) : null],
    );
    return result.rows;
  },

  getAvailableAudits: async (questId: string, auditor: string, exerciseId?: string) => {
    const auditorId = await userIdByUsername(auditor);
    if (!auditorId) return [];
    const result = await pool.query(
      `SELECT
        COALESCE(auditee_ga."giteaUsername", lower(split_part(auditee.email, '@', 1))) AS username,
        q."questId" AS quest_id,
        q."exerciseId" AS exercise_id,
        q."joinedAt" AS joined_at,
        q."joinedAt" AS waiting_since,
        COALESCE(p.points, 1) AS audit_points
       FROM "AuditQueue" q
       JOIN "User" auditee ON auditee.id = q."userId"
       LEFT JOIN "GiteaAccount" auditee_ga ON auditee_ga."userId" = auditee.id
       LEFT JOIN "AuditPoint" p ON p."userId" = q."userId"
       WHERE q.status = 'WAITING'
         AND q."questId" = $1
         AND q."userId" <> $2
         AND ($3::text IS NULL OR q."exerciseId" = $3)
         AND COALESCE(p.points, 1) >= 1
         AND EXISTS (
           SELECT 1 FROM "ExerciseProgress" ep
           WHERE ep."userId" = $2
             AND ep."questId" = q."questId"
             AND ep."exerciseId" = q."exerciseId"
             AND ep.status IN ('WAITING_FOR_AUDIT', 'AUDITING', 'PASSED')
         )
         AND NOT EXISTS (
           SELECT 1 FROM "AuditBlock" b
           WHERE b."userId" = q."userId" AND b."blockedUserId" = $2
         )
       ORDER BY q."joinedAt" ASC`,
      [canonicalQuestId(questId), auditorId, exerciseId || null],
    );
    return result.rows;
  },

  findEligibleExerciseAuditor: async (questId: string, exerciseId: string, auditee: string) => {
    const auditeeId = await userIdByUsername(auditee);
    if (!auditeeId) return null;
    const result = await pool.query(
      `SELECT COALESCE(ga."giteaUsername", lower(split_part(u.email, '@', 1))) AS username
       FROM "ExerciseProgress" ep
       JOIN "User" u ON u.id = ep."userId"
       LEFT JOIN "GiteaAccount" ga ON ga."userId" = u.id
       WHERE ep."questId" = $1
         AND ep."exerciseId" = $2
         AND ep."userId" <> $3
         AND ep.status IN ('WAITING_FOR_AUDIT', 'AUDITING', 'PASSED')
         AND NOT EXISTS (
           SELECT 1 FROM "Audit" a
           WHERE a.status = 'AUDITING'
             AND a."questId" = ep."questId"
             AND a."exerciseId" = ep."exerciseId"
             AND (a."auditorId" = ep."userId" OR a."auditeeId" = ep."userId")
         )
         AND NOT EXISTS (
           SELECT 1 FROM "AuditBlock" b
           WHERE b."userId" = $3 AND b."blockedUserId" = ep."userId"
         )
       ORDER BY RANDOM()
       LIMIT 1`,
      [canonicalQuestId(questId), exerciseId, auditeeId],
    );
    return result.rows[0]?.username || null;
  },

  getAuditPoints: async (username: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) return { username, points: 1, audits_completed: 0 };
    await pool.query(
      `INSERT INTO "AuditPoint" ("userId", points, "auditsCompleted", "updatedAt")
       VALUES ($1, 1, 0, NOW())
       ON CONFLICT ("userId") DO NOTHING`,
      [userId],
    );
    const result = await pool.query(
      `SELECT $1::text AS username, points, "auditsCompleted" AS audits_completed
       FROM "AuditPoint"
       WHERE "userId" = $2`,
      [username, userId],
    );
    return result.rows[0];
  },

  hasCompletedQuest: async (username: string, questId: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) return false;
    const result = await pool.query(
      `SELECT 1 FROM "QuestProgress"
       WHERE "userId" = $1
         AND "questId" = $2
         AND status IN ('READY_FOR_AUDIT', 'WAITING_FOR_AUDIT', 'AUDITING', 'COMPLETED')
       LIMIT 1`,
      [userId, canonicalQuestId(questId)],
    );
    return Boolean(result.rowCount);
  },

  hasPassedExercise: async (username: string, questId: string, exerciseId: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) return false;
    const result = await pool.query(
      `SELECT 1 FROM "ExerciseProgress"
       WHERE "userId" = $1
         AND "questId" = $2
         AND "exerciseId" = $3
         AND status IN ('WAITING_FOR_AUDIT', 'AUDITING', 'PASSED')
       LIMIT 1`,
      [userId, canonicalQuestId(questId), exerciseId],
    );
    return Boolean(result.rowCount);
  },

  createAuditSession: async (auditee: string, auditor: string, questId: string, exerciseId: string, repoUrl: string, expiresAt: Date) => {
    const auditeeId = await userIdByUsername(auditee);
    const auditorId = await userIdByUsername(auditor);
    if (!auditeeId || !auditorId) throw new Error('Auditee or auditor not found');
    const canonical = canonicalQuestId(questId);
    const inserted = await pool.query(
      `INSERT INTO "Audit" ("id", "auditeeId", "auditorId", "questId", "exerciseId", "repoUrl", status, "expiresAt", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'AUDITING', $7, NOW())
       RETURNING id`,
      [randomUUID(), auditeeId, auditorId, canonical, exerciseId, repoUrl, expiresAt],
    );
    const result = await pool.query(`${auditSessionSelect} WHERE a.id = $1`, [inserted.rows[0].id]);

    await pool.query('UPDATE "AuditQueue" SET status = $1 WHERE "userId" = $2 AND "questId" = $3 AND "exerciseId" = $4', ['MATCHED', auditeeId, canonical, exerciseId]);
    await pool.query('UPDATE "ExerciseProgress" SET status = $1, "updatedAt" = NOW() WHERE "userId" = $2 AND "questId" = $3 AND "exerciseId" = $4', ['AUDITING', auditeeId, canonical, exerciseId]);
    return normalizeSessionRow(result.rows[0]);
  },

  getAuditSession: async (sessionId: string | number) => {
    const result = await pool.query(`${auditSessionSelect} WHERE a.id = $1`, [String(sessionId)]);
    return normalizeSessionRow(result.rows[0]);
  },

  getActiveAuditForUser: async (username: string) => {
    const sessions = await dbService.getActiveAuditsForUser(username);
    return sessions[0];
  },

  getActiveAuditsForUser: async (username: string, questId?: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) return [];
    const result = await pool.query(
      `${auditSessionSelect}
       WHERE a.status = 'AUDITING'
         AND (a."auditorId" = $1 OR a."auditeeId" = $1)
         AND ($2::text IS NULL OR a."questId" = $2)
       ORDER BY a."createdAt" DESC`,
      [userId, questId ? canonicalQuestId(questId) : null],
    );
    return Promise.all(result.rows.map(normalizeSessionRow));
  },

  finalizeAuditSession: async (sessionId: string | number, finalStatus: 'PASSED' | 'FAILED', checklist: any, feedback: string) => {
    await pool.query(
      `UPDATE "Audit"
       SET status = $2, "checklistResults" = $3, feedback = $4, "finishedAt" = NOW()
       WHERE id = $1`,
      [String(sessionId), finalStatus, json(checklist), feedback],
    );
    return dbService.getAuditSession(sessionId);
  },

  adjustAuditPointsAfterSession: async (auditee: string, auditor: string) => {
    const auditeeId = await userIdByUsername(auditee);
    const auditorId = await userIdByUsername(auditor);
    if (!auditeeId || !auditorId) return;
    await pool.query(
      `INSERT INTO "AuditPoint" ("userId", points, "auditsCompleted", "updatedAt")
       VALUES ($1, 1, 0, NOW()), ($2, 1, 0, NOW())
       ON CONFLICT ("userId") DO NOTHING`,
      [auditeeId, auditorId],
    );
    await pool.query('UPDATE "AuditPoint" SET points = GREATEST(points - 1, 0), "updatedAt" = NOW() WHERE "userId" = $1', [auditeeId]);
    await pool.query(
      `UPDATE "AuditPoint"
       SET "auditsCompleted" = "auditsCompleted" + 1,
           points = points + CASE WHEN ("auditsCompleted" + 1) % 2 = 0 THEN 1 ELSE 0 END,
           "updatedAt" = NOW()
       WHERE "userId" = $1`,
      [auditorId],
    );
    await pool.query(
      `INSERT INTO "AuditBlock" ("id", "userId", "blockedUserId", reason, "createdAt")
       VALUES ($1, $2, $3, $5, NOW()), ($4, $3, $2, $5, NOW())
       ON CONFLICT ("userId", "blockedUserId", reason) DO NOTHING`,
      [randomUUID(), auditeeId, auditorId, randomUUID(), 'recent_audit'],
    );
  },

  removeFromQueue: async (username: string, questId: string, exerciseId?: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) return;
    await pool.query(
      'DELETE FROM "AuditQueue" WHERE "userId" = $1 AND "questId" = $2 AND ($3::text IS NULL OR "exerciseId" = $3)',
      [userId, canonicalQuestId(questId), exerciseId || null],
    );
  },

  updateStudentProgress: async (username: string, questId: string, status: string, currentExerciseId?: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) throw new Error(`User ${username} not found`);
    await pool.query(
      `INSERT INTO "QuestProgress" ("id", "userId", "questId", status, "currentExerciseId", "startedAt", "completedAt", "updatedAt")
       VALUES ($1, $2, $3, $4, COALESCE($5, 'ex01'), NOW(), CASE WHEN $4 = 'COMPLETED' THEN NOW() ELSE NULL END, NOW())
       ON CONFLICT ("userId", "questId")
       DO UPDATE SET
         status = EXCLUDED.status,
         "currentExerciseId" = COALESCE($5, "QuestProgress"."currentExerciseId"),
         "completedAt" = CASE WHEN EXCLUDED.status = 'COMPLETED' THEN NOW() ELSE "QuestProgress"."completedAt" END,
         "updatedAt" = NOW()`,
      [randomUUID(), userId, canonicalQuestId(questId), status, currentExerciseId || null],
    );
  },

  getStudentProgress: async (username: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) return [];
    const result = await pool.query(
      `SELECT "questId" AS quest_id, status, "currentExerciseId" AS current_exercise_id, "updatedAt" AS updated_at
       FROM "QuestProgress"
       WHERE "userId" = $1
       ORDER BY "updatedAt" DESC`,
      [userId],
    );
    return result.rows;
  },

  recordExercisePass: async (username: string, questId: string, exerciseId: string, results: any) => {
    return dbService.recordExerciseResult(username, questId, exerciseId, 'PASSED', results);
  },

  recordExerciseResult: async (username: string, questId: string, exerciseId: string, status: AuditStatus, results: any) => {
    const userId = await userIdByUsername(username);
    if (!userId) throw new Error(`User ${username} not found`);
    await pool.query(
      `INSERT INTO "ExerciseProgress" ("id", "userId", "questId", "exerciseId", status, results, "passedAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT ("userId", "questId", "exerciseId")
       DO UPDATE SET status = EXCLUDED.status, results = EXCLUDED.results, "passedAt" = NOW(), "updatedAt" = NOW()`,
      [randomUUID(), userId, canonicalQuestId(questId), exerciseId, status, json(results)],
    );
  },

  recordSubmission: async (input: {
    username: string;
    questId: string;
    exerciseId: string;
    commitHash?: string;
    status: string;
    result: any;
    repoFullName?: string;
  }) => {
    const userId = await userIdByUsername(input.username);
    if (!userId) throw new Error(`User ${input.username} not found`);
    const repository = input.repoFullName
      ? await pool.query('SELECT id FROM "GiteaRepository" WHERE "repoFullName" = $1', [input.repoFullName])
      : null;
    const result = await pool.query(
      `INSERT INTO "Submission"
        ("id", "userId", "questId", "exerciseId", "repositoryId", "commitHash", status, result, "submittedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id`,
      [
        randomUUID(),
        userId,
        canonicalQuestId(input.questId),
        input.exerciseId,
        repository?.rows[0]?.id || null,
        input.commitHash || null,
        input.status,
        json(input.result),
      ],
    );
    return result.rows[0];
  },

  getLatestExerciseResult: async (username: string, questId: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) return null;
    const result = await pool.query(
      `SELECT "exerciseId" AS exercise_id, status, results, "passedAt" AS passed_at
       FROM "ExerciseProgress"
       WHERE "userId" = $1 AND "questId" = $2
       ORDER BY "updatedAt" DESC
       LIMIT 1`,
      [userId, canonicalQuestId(questId)],
    );
    return result.rows[0];
  },

  getPassedExercises: async (username: string, questId: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) return [];
    const result = await pool.query(
      `SELECT "exerciseId" AS exercise_id
       FROM "ExerciseProgress"
       WHERE "userId" = $1
         AND "questId" = $2
         AND status IN ('WAITING_FOR_AUDIT', 'AUDITING', 'PASSED')
       ORDER BY "exerciseId" ASC`,
      [userId, canonicalQuestId(questId)],
    );
    return result.rows.map((row) => row.exercise_id);
  },

  getExerciseAuditStates: async (username: string, questId: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) return [];
    const result = await pool.query(
      `SELECT
        ep."exerciseId" AS exercise_id,
        ep.status AS exercise_status,
        a.id AS session_id,
        a.status AS audit_status,
        COALESCE(auditee_ga."giteaUsername", lower(split_part(auditee.email, '@', 1))) AS auditee,
        COALESCE(auditor_ga."giteaUsername", lower(split_part(auditor.email, '@', 1))) AS auditor
       FROM "ExerciseProgress" ep
       LEFT JOIN "Audit" a
         ON a."questId" = ep."questId"
        AND a."exerciseId" = ep."exerciseId"
        AND a.status = 'AUDITING'
        AND (a."auditeeId" = ep."userId" OR a."auditorId" = ep."userId")
       LEFT JOIN "User" auditee ON auditee.id = a."auditeeId"
       LEFT JOIN "User" auditor ON auditor.id = a."auditorId"
       LEFT JOIN "GiteaAccount" auditee_ga ON auditee_ga."userId" = auditee.id
       LEFT JOIN "GiteaAccount" auditor_ga ON auditor_ga."userId" = auditor.id
       WHERE ep."userId" = $1 AND ep."questId" = $2
       ORDER BY ep."exerciseId" ASC`,
      [userId, canonicalQuestId(questId)],
    );
    return result.rows;
  },

  joinAuditQueue: async (username: string, questId: string, exerciseId: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) throw new Error(`User ${username} not found`);
    await pool.query(
      `INSERT INTO "AuditQueue" ("id", "userId", "questId", "exerciseId", status, "joinedAt")
       VALUES ($1, $2, $3, $4, 'WAITING', NOW())
       ON CONFLICT ("userId", "questId", "exerciseId")
       DO UPDATE SET status = 'WAITING', "joinedAt" = NOW()`,
      [randomUUID(), userId, canonicalQuestId(questId), exerciseId],
    );
  },

  createAudit: async (auditee: string, auditor: string, questId: string) => {
    const session = await dbService.createAuditSession(auditee, auditor, questId, 'ex01', '', new Date(Date.now() + 30 * 60 * 1000));
    return session?.id;
  },

  submitAuditResult: async (auditId: string | number, status: string, checklist: any) => {
    const session = await dbService.finalizeAuditSession(auditId, status === 'PASSED' ? 'PASSED' : 'FAILED', checklist, '');
    return session ? { auditee: session.auditee, quest_id: session.quest_id } : null;
  },

  awardQuestCompletionXp: async (username: string, questId: string) => {
    const userId = await userIdByUsername(username);
    if (!userId) return null;
    const canonical = canonicalQuestId(questId);
    const quest = await pool.query('SELECT name, "xpReward" FROM "Quest" WHERE id = $1', [canonical]);
    const amount = quest.rows[0]?.xpReward || 1000;
    const result = await pool.query(
      `INSERT INTO "XPTransaction" ("id", "userId", "questId", amount, "sourceType", "sourceId", description, "createdAt")
       VALUES ($1, $2, $3, $4, 'quest_completion', $3, $5, NOW())
       ON CONFLICT ("userId", "sourceType", "sourceId") DO NOTHING
       RETURNING id, amount`,
      [randomUUID(), userId, canonical, amount, `Completed ${quest.rows[0]?.name || canonical}`],
    );
    return result.rows[0] || null;
  },

  createUser: async () => {
    throw new Error('LMS-local registration has been removed. Use TalentNation account creation.');
  },

  getUserByUsername: userByUsername,

  getUsernameForUserId: userNameById,
};
