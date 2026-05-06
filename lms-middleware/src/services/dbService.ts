import { Pool } from 'pg';
import { config } from '../config/env';

export const pool = new Pool({
  connectionString: config.db.url,
});

interface LocalUser {
  username: string;
  email: string;
  password_hash: string;
}

interface LocalProgress {
  quest_id: string;
  status: string;
  current_exercise_id: string;
  updated_at: Date;
}

interface LocalAuditSession {
  id: number;
  auditee: string;
  auditor: string;
  quest_id: string;
  exercise_id: string;
  repo_url?: string;
  status: string;
  checklist_results?: any;
  feedback?: string;
  expires_at: Date;
  created_at: Date;
  finished_at?: Date;
}

const localUsers = new Map<string, LocalUser>();
const localStudentProgress = new Map<string, LocalProgress>();
const localExerciseProgress = new Set<string>();
const localExerciseResults = new Map<string, any>();
const localAuditPoints = new Map<string, { points: number; audits_completed: number }>();
const localAuditSessions = new Map<number, LocalAuditSession>();
const localAuditBlocks = new Set<string>();
let localAuditId = 1;

const isConnectionError = (error: any) => (
  error?.code === 'ECONNREFUSED' ||
  error?.code === 'ENOTFOUND' ||
  error?.message?.includes('ECONNREFUSED') ||
  error?.message?.includes('getaddrinfo ENOTFOUND')
);

const progressKey = (username: string, questId: string) => `${username}:${questId}`;
const exerciseKey = (username: string, questId: string, exerciseId: string) => `${username}:${questId}:${exerciseId}`;
const blockKey = (username: string, blockedUsername: string) => `${username}:${blockedUsername}`;

/**
 * Database service for PostgreSQL operations.
 */
export const dbService = {
  ensureAuditSchema: async () => {
    const statements = [
      `CREATE TABLE IF NOT EXISTS audit_points (
        username VARCHAR(255) PRIMARY KEY,
        points INTEGER DEFAULT 1,
        audits_completed INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS audit_sessions (
        id SERIAL PRIMARY KEY,
        auditee VARCHAR(255) NOT NULL,
        auditor VARCHAR(255) NOT NULL,
        quest_id VARCHAR(100) NOT NULL,
        exercise_id VARCHAR(100) NOT NULL DEFAULT 'ex01',
        repo_url TEXT,
        status VARCHAR(50) DEFAULT 'AUDITING',
        checklist_results JSONB,
        feedback TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS audit_blocks (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        blocked_username VARCHAR(255) NOT NULL,
        reason VARCHAR(100) DEFAULT 'recent_audit',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `ALTER TABLE audit_queue ADD COLUMN IF NOT EXISTS exercise_id VARCHAR(100) NOT NULL DEFAULT 'ex01'`,
      `ALTER TABLE audit_sessions ADD COLUMN IF NOT EXISTS exercise_id VARCHAR(100) NOT NULL DEFAULT 'ex01'`,
      `ALTER TABLE audit_queue DROP CONSTRAINT IF EXISTS audit_queue_username_quest_id_key`,
      `CREATE UNIQUE INDEX IF NOT EXISTS audit_queue_username_quest_exercise_idx ON audit_queue(username, quest_id, exercise_id)`,
      'CREATE INDEX IF NOT EXISTS idx_audit_sessions_status ON audit_sessions(status)',
      'CREATE INDEX IF NOT EXISTS idx_audit_queue_exercise ON audit_queue(quest_id, exercise_id, status)',
      'CREATE INDEX IF NOT EXISTS idx_audit_blocks_users ON audit_blocks(username, blocked_username)',
    ];

    try {
      for (const statement of statements) await pool.query(statement);
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
    }
  },

  /**
   * Get the audit queue for a quest.
   */
  getAuditQueue: async (questId: string, exerciseId?: string) => {
    const query = `
      SELECT username, quest_id, exercise_id, joined_at
      FROM audit_queue
      WHERE status = 'WAITING'
        AND quest_id = $1
        AND ($2::text IS NULL OR exercise_id = $2)
    `;
    const result = await pool.query(query, [questId, exerciseId || null]);
    return result.rows;
  },

  getQueueStatusForUser: async (username: string, questId?: string) => {
    const query = `
      SELECT q.username, q.quest_id, q.exercise_id, q.joined_at, q.status
      FROM audit_queue q
      WHERE q.username = $1
        AND ($2::text IS NULL OR q.quest_id = $2)
    `;
    try {
      const result = await pool.query(query, [username, questId || null]);
      return result.rows;
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      return [];
    }
  },

  getAvailableAudits: async (questId: string, auditor: string, exerciseId?: string) => {
    const query = `
      SELECT q.username, q.quest_id, q.exercise_id, q.joined_at, COALESCE(p.points, 1) AS audit_points
      FROM audit_queue q
      LEFT JOIN audit_points p ON p.username = q.username
      WHERE q.status = 'WAITING'
        AND q.quest_id = $1
        AND q.username <> $2
        AND ($3::text IS NULL OR q.exercise_id = $3)
        AND COALESCE(p.points, 1) >= 1
        AND EXISTS (
          SELECT 1 FROM exercise_progress ep
          WHERE ep.username = $2
            AND ep.quest_id = q.quest_id
            AND ep.exercise_id = q.exercise_id
            AND ep.status IN ('WAITING_FOR_AUDIT', 'AUDITING', 'PASSED')
        )
        AND NOT EXISTS (
          SELECT 1 FROM audit_blocks b
          WHERE b.username = q.username AND b.blocked_username = $2
        )
      ORDER BY q.joined_at ASC
    `;
    try {
      const result = await pool.query(query, [questId, auditor, exerciseId || null]);
      return result.rows;
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      return Array.from(localStudentProgress.entries())
        .filter(([, value]) => value.quest_id === questId && ['READY_FOR_AUDIT', 'WAITING_FOR_AUDIT'].includes(value.status))
        .map(([key, value]) => ({ username: key.split(':')[0], quest_id: value.quest_id, joined_at: value.updated_at, audit_points: localAuditPoints.get(key.split(':')[0])?.points ?? 1 }))
        .filter((item) => item.username !== auditor && !localAuditBlocks.has(blockKey(item.username, auditor)));
    }
  },

  findEligibleExerciseAuditor: async (questId: string, exerciseId: string, auditee: string) => {
    const query = `
      SELECT ep.username
      FROM exercise_progress ep
      WHERE ep.quest_id = $1
        AND ep.exercise_id = $2
        AND ep.username <> $3
        AND ep.status IN ('WAITING_FOR_AUDIT', 'AUDITING', 'PASSED')
        AND NOT EXISTS (
          SELECT 1 FROM audit_sessions s
          WHERE s.status = 'AUDITING'
            AND s.quest_id = ep.quest_id
            AND s.exercise_id = ep.exercise_id
            AND (s.auditor = ep.username OR s.auditee = ep.username)
        )
        AND NOT EXISTS (
          SELECT 1 FROM audit_blocks b
          WHERE b.username = $3 AND b.blocked_username = ep.username
        )
      ORDER BY RANDOM()
      LIMIT 1
    `;
    try {
      const result = await pool.query(query, [questId, exerciseId, auditee]);
      return result.rows[0]?.username || null;
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      return Array.from(localExerciseProgress)
        .map((key) => key.split(':'))
        .find(([username, qid, eid]) => username !== auditee && qid === questId && eid === exerciseId)?.[0] || null;
    }
  },

  getAuditPoints: async (username: string) => {
    try {
      await pool.query(
        `INSERT INTO audit_points (username, points, audits_completed)
         VALUES ($1, 1, 0)
         ON CONFLICT (username) DO NOTHING`,
        [username],
      );
      const result = await pool.query('SELECT username, points, audits_completed FROM audit_points WHERE username = $1', [username]);
      return result.rows[0];
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      if (!localAuditPoints.has(username)) localAuditPoints.set(username, { points: 1, audits_completed: 0 });
      return { username, ...localAuditPoints.get(username) };
    }
  },

  hasCompletedQuest: async (username: string, questId: string) => {
    const query = `
      SELECT 1 FROM student_progress
      WHERE username = $1 AND quest_id = $2 AND status IN ('READY_FOR_AUDIT', 'WAITING_FOR_AUDIT', 'AUDITING', 'COMPLETED')
      LIMIT 1
    `;
    try {
      const result = await pool.query(query, [username, questId]);
      return Boolean(result.rowCount);
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      const status = localStudentProgress.get(progressKey(username, questId))?.status;
      return Boolean(status && ['READY_FOR_AUDIT', 'WAITING_FOR_AUDIT', 'AUDITING', 'COMPLETED'].includes(status));
    }
  },

  hasPassedExercise: async (username: string, questId: string, exerciseId: string) => {
    const query = `
      SELECT 1 FROM exercise_progress
      WHERE username = $1
        AND quest_id = $2
        AND exercise_id = $3
        AND status IN ('WAITING_FOR_AUDIT', 'AUDITING', 'PASSED')
      LIMIT 1
    `;
    try {
      const result = await pool.query(query, [username, questId, exerciseId]);
      return Boolean(result.rowCount);
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      return localExerciseProgress.has(exerciseKey(username, questId, exerciseId));
    }
  },

  createAuditSession: async (auditee: string, auditor: string, questId: string, exerciseId: string, repoUrl: string, expiresAt: Date) => {
    const query = `
      INSERT INTO audit_sessions (auditee, auditor, quest_id, exercise_id, repo_url, status, expires_at)
      VALUES ($1, $2, $3, $4, $5, 'AUDITING', $6)
      RETURNING *
    `;
    try {
      const result = await pool.query(query, [auditee, auditor, questId, exerciseId, repoUrl, expiresAt]);
      await pool.query('UPDATE audit_queue SET status = $1 WHERE username = $2 AND quest_id = $3 AND exercise_id = $4', ['MATCHED', auditee, questId, exerciseId]);
      await pool.query('UPDATE exercise_progress SET status = $1 WHERE username = $2 AND quest_id = $3 AND exercise_id = $4', ['AUDITING', auditee, questId, exerciseId]);
      return result.rows[0];
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      const session = { id: localAuditId++, auditee, auditor, quest_id: questId, exercise_id: exerciseId, repo_url: repoUrl, status: 'AUDITING', expires_at: expiresAt, created_at: new Date() };
      localAuditSessions.set(session.id, session);
      return session;
    }
  },

  getAuditSession: async (sessionId: number) => {
    const query = 'SELECT * FROM audit_sessions WHERE id = $1';
    try {
      const result = await pool.query(query, [sessionId]);
      return result.rows[0];
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      return localAuditSessions.get(sessionId);
    }
  },

  getActiveAuditForUser: async (username: string) => {
    const query = `
      SELECT * FROM audit_sessions
      WHERE status = 'AUDITING' AND (auditor = $1 OR auditee = $1)
      ORDER BY created_at DESC LIMIT 1
    `;
    try {
      const result = await pool.query(query, [username]);
      return result.rows[0];
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      return Array.from(localAuditSessions.values()).find((session) => session.status === 'AUDITING' && (session.auditor === username || session.auditee === username));
    }
  },

  getActiveAuditsForUser: async (username: string, questId?: string) => {
    const query = `
      SELECT * FROM audit_sessions
      WHERE status = 'AUDITING'
        AND (auditor = $1 OR auditee = $1)
        AND ($2::text IS NULL OR quest_id = $2)
      ORDER BY created_at DESC
    `;
    try {
      const result = await pool.query(query, [username, questId || null]);
      return result.rows;
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      return Array.from(localAuditSessions.values())
        .filter((session) => session.status === 'AUDITING' && (session.auditor === username || session.auditee === username) && (!questId || session.quest_id === questId));
    }
  },

  finalizeAuditSession: async (sessionId: number, finalStatus: 'PASSED' | 'FAILED', checklist: any, feedback: string) => {
    const query = `
      UPDATE audit_sessions
      SET status = $2, checklist_results = $3, feedback = $4, finished_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    try {
      const result = await pool.query(query, [sessionId, finalStatus, JSON.stringify(checklist), feedback]);
      return result.rows[0];
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      const session = localAuditSessions.get(sessionId);
      if (!session) return null;
      session.status = finalStatus;
      session.checklist_results = checklist;
      session.feedback = feedback;
      session.finished_at = new Date();
      return session;
    }
  },

  adjustAuditPointsAfterSession: async (auditee: string, auditor: string) => {
    try {
      await pool.query(
        `INSERT INTO audit_points (username, points, audits_completed)
         VALUES ($1, 1, 0), ($2, 1, 0)
         ON CONFLICT (username) DO NOTHING`,
        [auditee, auditor],
      );
      await pool.query(
        'UPDATE audit_points SET points = GREATEST(points - 1, 0), updated_at = NOW() WHERE username = $1',
        [auditee],
      );
      await pool.query(
        `UPDATE audit_points
         SET audits_completed = audits_completed + 1,
             points = points + CASE WHEN (audits_completed + 1) % 2 = 0 THEN 1 ELSE 0 END,
             updated_at = NOW()
         WHERE username = $1`,
        [auditor],
      );
      await pool.query('INSERT INTO audit_blocks (username, blocked_username, reason) VALUES ($1, $2, $3), ($2, $1, $3)', [auditee, auditor, 'recent_audit']);
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      const auditeePoints = localAuditPoints.get(auditee) || { points: 1, audits_completed: 0 };
      auditeePoints.points = Math.max(auditeePoints.points - 1, 0);
      localAuditPoints.set(auditee, auditeePoints);

      const auditorPoints = localAuditPoints.get(auditor) || { points: 1, audits_completed: 0 };
      auditorPoints.audits_completed += 1;
      if (auditorPoints.audits_completed % 2 === 0) auditorPoints.points += 1;
      localAuditPoints.set(auditor, auditorPoints);
      localAuditBlocks.add(blockKey(auditee, auditor));
      localAuditBlocks.add(blockKey(auditor, auditee));
    }
  },

  /**
   * Remove from queue.
   */
  removeFromQueue: async (username: string, questId: string, exerciseId?: string) => {
    const query = 'DELETE FROM audit_queue WHERE username = $1 AND quest_id = $2 AND ($3::text IS NULL OR exercise_id = $3)';
    await pool.query(query, [username, questId, exerciseId || null]);
  },

  /**
   * Update or initialize student progress.
   */
  updateStudentProgress: async (username: string, questId: string, status: string, currentExerciseId?: string) => {
    const query = `
      INSERT INTO student_progress (username, quest_id, status, current_exercise_id)
      VALUES ($1, $2, $3, COALESCE($4, 'ex00'))
      ON CONFLICT (username, quest_id)
      DO UPDATE SET 
        status = EXCLUDED.status, 
        current_exercise_id = COALESCE($4, student_progress.current_exercise_id),
        updated_at = NOW();
    `;
    try {
      await pool.query(query, [username, questId, status, currentExerciseId || null]);
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      const key = progressKey(username, questId);
      const existing = localStudentProgress.get(key);
      localStudentProgress.set(key, {
        quest_id: questId,
        status,
        current_exercise_id: currentExerciseId || existing?.current_exercise_id || 'ex01',
        updated_at: new Date(),
      });
    }
  },

  /**
   * Get all progress for a student.
   */
  getStudentProgress: async (username: string) => {
    const query = 'SELECT quest_id, status, current_exercise_id, updated_at FROM student_progress WHERE username = $1';
    try {
      const result = await pool.query(query, [username]);
      return result.rows;
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      return Array.from(localStudentProgress.entries())
        .filter(([key]) => key.startsWith(`${username}:`))
        .map(([, value]) => value);
    }
  },

  /**
   * Record exercise completion.
   */
  recordExercisePass: async (username: string, questId: string, exerciseId: string, results: any) => {
    const query = `
      INSERT INTO exercise_progress (username, quest_id, exercise_id, status, results)
      VALUES ($1, $2, $3, 'PASSED', $4)
      ON CONFLICT (username, quest_id, exercise_id)
        DO UPDATE SET results = $4, passed_at = NOW();
    `;
    try {
      await pool.query(query, [username, questId, exerciseId, JSON.stringify(results)]);
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      localExerciseProgress.add(exerciseKey(username, questId, exerciseId));
      localExerciseResults.set(exerciseKey(username, questId, exerciseId), {
        status: 'PASSED',
        results,
        updated_at: new Date(),
      });
    }
  },

  /**
   * Record the latest bot result for an exercise.
   */
  recordExerciseResult: async (username: string, questId: string, exerciseId: string, status: 'PASSED' | 'FAILED' | 'WAITING_FOR_AUDIT' | 'AUDITING', results: any) => {
    const query = `
      INSERT INTO exercise_progress (username, quest_id, exercise_id, status, results)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username, quest_id, exercise_id)
        DO UPDATE SET status = $4, results = $5, passed_at = NOW();
    `;
    try {
      await pool.query(query, [username, questId, exerciseId, status, JSON.stringify(results)]);
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      const key = exerciseKey(username, questId, exerciseId);
      if (['PASSED', 'WAITING_FOR_AUDIT', 'AUDITING'].includes(status)) localExerciseProgress.add(key);
      localExerciseResults.set(key, {
        status,
        results,
        updated_at: new Date(),
      });
    }
  },

  /**
   * Get the most recent bot result for a quest.
   */
  getLatestExerciseResult: async (username: string, questId: string) => {
    const query = `
      SELECT exercise_id, status, results, passed_at
      FROM exercise_progress
      WHERE username = $1 AND quest_id = $2
      ORDER BY passed_at DESC
      LIMIT 1
    `;
    try {
      const result = await pool.query(query, [username, questId]);
      return result.rows[0];
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      const latest = Array.from(localExerciseResults.entries())
        .filter(([key]) => key.startsWith(`${username}:${questId}:`))
        .map(([key, value]) => ({
          exercise_id: key.split(':')[2],
          status: value.status,
          results: value.results,
          passed_at: value.updated_at,
        }))
        .sort((a, b) => b.passed_at.getTime() - a.passed_at.getTime())[0];
      return latest;
    }
  },

  /**
   * Get passed exercises for a student.
   */
  getPassedExercises: async (username: string, questId: string) => {
    const query = 'SELECT exercise_id FROM exercise_progress WHERE username = $1 AND quest_id = $2 AND status IN (\'WAITING_FOR_AUDIT\', \'AUDITING\', \'PASSED\')';
    try {
      const result = await pool.query(query, [username, questId]);
      return result.rows.map(r => r.exercise_id);
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      return Array.from(localExerciseProgress)
        .filter((key) => key.startsWith(`${username}:${questId}:`))
        .map((key) => key.split(':')[2]);
    }
  },

  getExerciseAuditStates: async (username: string, questId: string) => {
    const query = `
      SELECT
        ep.exercise_id,
        ep.status AS exercise_status,
        s.id AS session_id,
        s.status AS audit_status,
        s.auditee,
        s.auditor
      FROM exercise_progress ep
      LEFT JOIN audit_sessions s
        ON s.quest_id = ep.quest_id
        AND s.exercise_id = ep.exercise_id
        AND s.status = 'AUDITING'
        AND (s.auditee = ep.username OR s.auditor = ep.username)
      WHERE ep.username = $1 AND ep.quest_id = $2
      ORDER BY ep.exercise_id ASC
    `;
    try {
      const result = await pool.query(query, [username, questId]);
      return result.rows;
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      return Array.from(localExerciseResults.entries())
        .filter(([key]) => key.startsWith(`${username}:${questId}:`))
        .map(([key, value]) => ({
          exercise_id: key.split(':')[2],
          exercise_status: value.status,
          session_id: null,
          audit_status: null,
          auditee: null,
          auditor: null,
        }));
    }
  },

  /**
   * Join the audit queue.
   */
  joinAuditQueue: async (username: string, questId: string, exerciseId: string) => {
    const query = `
      INSERT INTO audit_queue (username, quest_id, exercise_id, status)
      VALUES ($1, $2, $3, 'WAITING')
      ON CONFLICT (username, quest_id, exercise_id)
      DO UPDATE SET status = 'WAITING', joined_at = NOW();
    `;
    try {
      await pool.query(query, [username, questId, exerciseId]);
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
    }
  },

  /**
   * Match an auditor with an auditee.
   */
  createAudit: async (auditee: string, auditor: string, questId: string) => {
    const query = `
      INSERT INTO audits (auditee, auditor, quest_id, status)
      VALUES ($1, $2, $3, 'PENDING')
      RETURNING id;
    `;
    const result = await pool.query(query, [auditee, auditor, questId]);
    
    // Mark as matched in queue
    await pool.query('UPDATE audit_queue SET status = \'MATCHED\' WHERE username = $1 AND quest_id = $2', [auditee, questId]);
    
    return result.rows[0].id;
  },

  /**
   * Submit audit result.
   */
  submitAuditResult: async (auditId: number, status: string, checklist: any) => {
    const query = `
      UPDATE audits 
      SET status = $2, checklist_results = $3, finished_at = NOW() 
      WHERE id = $1
      RETURNING auditee, quest_id;
    `;
    const result = await pool.query(query, [auditId, status, JSON.stringify(checklist)]);
    return result.rows[0];
  },

  /**
   * Create a new user account.
   */
  createUser: async (username: string, email: string, passwordHash: string) => {
    const query = 'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING username, email';
    try {
      const result = await pool.query(query, [username, email, passwordHash]);
      return result.rows[0];
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      if (localUsers.has(username)) {
        const user = { username, email, password_hash: passwordHash };
        localUsers.set(username, user);
        return { username, email };
      }
      const existingEmail = Array.from(localUsers.values()).find((user) => user.email === email);
      if (existingEmail) {
        const user = { username, email, password_hash: passwordHash };
        localUsers.set(username, user);
        return { username, email };
      }
      const user = { username, email, password_hash: passwordHash };
      localUsers.set(username, user);
      return { username, email };
    }
  },

  /**
   * Fetch a user by username.
   */
  getUserByUsername: async (username: string) => {
    const query = 'SELECT * FROM users WHERE username = $1';
    try {
      const result = await pool.query(query, [username]);
      return result.rows[0];
    } catch (error: any) {
      if (!isConnectionError(error)) throw error;
      return localUsers.get(username);
    }
  }
};
