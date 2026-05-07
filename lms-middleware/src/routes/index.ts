import { Router } from 'express';
import { getQuestAccess, getQuestManifest, listQuests, startQuest } from '../controllers/questController';
import { handleGiteaWebhook } from '../controllers/webhookController';
import {
  authorize,
  getStudentProfile,
  getStudentProgress,
  login,
  logout,
  register,
  session,
  token,
  userinfo,
} from '../controllers/authController';
import { assignAudit, bookAudit, getAuditAvailable, getAuditCode, getAuditQueue, getAuditSession, getMyAudit, submitAudit } from '../controllers/auditController';
import { getQuestProgress, runExerciseTests, submitExerciseTests } from '../controllers/exerciseController';
import { sessionService } from '../services/sessionService';
import adminRoutes from './adminRoutes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'active', version: 'v1', message: 'LMS Middleware API' });
});

router.get('/auth/session', session);
router.post('/auth/logout', logout);
router.get('/auth/authorize', sessionService.requireSession, authorize);
router.post('/auth/token', token);
router.get('/auth/userinfo', userinfo);
router.post('/auth/login', login);
router.post('/auth/register', register);

router.post('/webhooks/gitea', handleGiteaWebhook);

router.use(sessionService.requireSession);

router.use('/admin', adminRoutes);

router.get('/me/progress', getStudentProgress);
router.get('/me/profile', getStudentProfile);
router.get('/students/progress/:username', getStudentProgress);
router.get('/students/profile/:username', getStudentProfile);

router.get('/quests', listQuests);
router.post('/quests/start', startQuest);
router.post('/quests/:questId/start', startQuest);
router.get('/quests/:questId/access', getQuestAccess);
router.get('/quests/:questId/access/:studentUsername', getQuestAccess);
router.get('/quests/:questId/progress', getQuestProgress);
router.get('/quests/:questId/progress/:studentUsername', getQuestProgress);
router.get('/quests/:questId/manifest', getQuestManifest);
router.post('/quests/:questId/exercises/:exerciseId/run', runExerciseTests);
router.post('/quests/:questId/exercises/:exerciseId/submit', submitExerciseTests);

router.get('/audits/queue', getAuditQueue);
router.post('/audits/book', bookAudit);
router.post('/audits/submit', submitAudit);

router.get('/audit/available', getAuditAvailable);
router.post('/audit/assign', assignAudit);
router.get('/audit/session/:sessionId', getAuditSession);
router.get('/audit/session/:sessionId/code', getAuditCode);
router.get('/audit/my', getMyAudit);
router.get('/audit/my/:username', getMyAudit);
router.post('/audit/submit', submitAudit);

export default router;
