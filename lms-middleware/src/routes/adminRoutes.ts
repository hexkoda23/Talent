import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { sessionService } from '../services/sessionService';

const router = Router();

router.use(sessionService.requireAdminSession);

router.get('/quests', adminController.listQuests);
router.get('/quests/:id', adminController.getQuestDetail);
router.post('/quests', adminController.saveQuest);
router.put('/quests/:id', adminController.saveQuest);
router.delete('/quests/:id', adminController.deleteQuest);

export default router;
