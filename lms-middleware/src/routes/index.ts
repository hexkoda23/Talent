import { Router } from 'express';
import { getQuestAccess, startQuest, listQuests } from '../controllers/questController';

import { handleGiteaWebhook } from '../controllers/webhookController';
import { authorize, token, userinfo, login, register, getStudentProgress, getStudentProfile } from '../controllers/authController';
import { assignAudit, bookAudit, getAuditAvailable, getAuditCode, getAuditQueue, getAuditSession, getMyAudit, submitAudit } from '../controllers/auditController';
import { getQuestProgress, runExerciseTests, submitExerciseTests } from '../controllers/exerciseController';
import { manifestService } from '../services/manifestService';

import adminRoutes from './adminRoutes';

const router = Router();

// Mount admin routes
router.use('/admin', adminRoutes);

/**
 * @route GET /api/v1
 */
router.get('/', (req, res) => {
  res.json({ status: 'active', version: 'v1', message: 'LMS Middleware API' });
});


/**
 * @route GET /api/auth/authorize
 * @desc OAuth2 Authorize endpoint
 */
router.get('/auth/authorize', authorize);

/**
 * @route POST /api/auth/token
 * @desc OAuth2 Token endpoint
 */
router.post('/auth/token', token);

/**
 * @route GET /api/auth/userinfo
 * @desc OAuth2 Userinfo endpoint
 */
router.get('/auth/userinfo', userinfo);

/**
 * @route POST /api/auth/login
 */
router.post('/auth/login', login);

/**
 * @route POST /api/auth/register
 */
router.post('/auth/register', register);

/**
 * @route GET /api/students/progress/:username
 */
router.get('/students/progress/:username', getStudentProgress);
router.get('/students/profile/:username', getStudentProfile);

/**
 * @route GET /api/quests
 * @desc Get the list of all available quests
 */
router.get('/quests', listQuests);

/**
 * @route POST /api/quests/start
 * @desc Provision a new quest environment for a student
 */
router.post('/quests/start', startQuest);

/**
 * @route GET /api/quests/:questId/access/:studentUsername
 * @desc Return the student's Gitea repository access details for a quest
 */
router.get('/quests/:questId/access/:studentUsername', getQuestAccess);

/**
 * @route POST /api/quests/:questId/exercises/:exerciseId/run
 * @desc Run configured exercise tests against submitted code
 */
router.post('/quests/:questId/exercises/:exerciseId/run', runExerciseTests);

/**
 * @route POST /api/quests/:questId/exercises/:exerciseId/submit
 * @desc Run hidden official tests and unlock the next exercise on pass
 */
router.post('/quests/:questId/exercises/:exerciseId/submit', submitExerciseTests);

/**
 * @route GET /api/quests/:questId/progress/:studentUsername
 * @desc Return exercise-level progress for the quest workspace
 */
router.get('/quests/:questId/progress/:studentUsername', getQuestProgress);

/**
 * @route POST /webhooks/gitea
 * @desc Receive test results from Gitea Actions
 */
router.post('/webhooks/gitea', handleGiteaWebhook);

/**
 * @route GET /api/audits/queue
 */
router.get('/audits/queue', getAuditQueue);

/**
 * @route POST /api/audits/book
 */
router.post('/audits/book', bookAudit);

/**
 * @route POST /api/audits/submit
 */
router.post('/audits/submit', submitAudit);

router.get('/audit/available', getAuditAvailable);
router.post('/audit/assign', assignAudit);
router.get('/audit/session/:sessionId', getAuditSession);
router.get('/audit/session/:sessionId/code', getAuditCode);
router.get('/audit/my/:username', getMyAudit);
router.post('/audit/submit', submitAudit);

/**
 * @route GET /api/quests/:questId/manifest
 */
router.get('/quests/:questId/manifest', (req, res) => {
  const { questId } = req.params;
  const manifest = manifestService.getPublicManifest(questId);
  if (manifest) res.json(manifest);
  else res.status(404).json({ error: 'Manifest not found' });
});



export default router;
