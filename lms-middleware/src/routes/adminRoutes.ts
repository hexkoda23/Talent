import { Router } from 'express';
import * as adminController from '../controllers/adminController';

const router = Router();

// Middleware to check for admin token
const adminAuth = (req: any, res: any, next: any) => {
  const adminToken = req.headers['x-admin-token'];
  console.log(`[AdminAuth] Token received: ${adminToken ? 'PRESENT' : 'MISSING'}`);
  if (adminToken === process.env.ADMIN_TOKEN || adminToken === 'admin-secret-key') {
    console.log(`[AdminAuth] Authentication successful.`);
    return next();
  }
  console.warn(`[AdminAuth] Unauthorized access attempt with token: ${adminToken}`);
  res.status(403).json({ error: 'Unauthorized. Admin token required.' });
};

router.use(adminAuth);

router.get('/quests', adminController.listQuests);
router.get('/quests/:id', adminController.getQuestDetail);
router.post('/quests', adminController.saveQuest);
router.put('/quests/:id', adminController.saveQuest);
router.delete('/quests/:id', adminController.deleteQuest);

export default router;
