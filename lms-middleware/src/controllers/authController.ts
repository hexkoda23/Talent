import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { authService } from '../services/authService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-super-secret-key'; 

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  try {
    const passwordHash = Buffer.from(password).toString('base64');
    const user = await dbService.createUser(username, email, passwordHash);
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await dbService.getUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const passwordHash = Buffer.from(password).toString('base64');
    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { username: user.username, email: user.email } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStudentProgress = async (req: Request, res: Response) => {
  const { username } = req.params;
  try {
    const progress = await dbService.getStudentProgress(username);
    res.json({ progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStudentProfile = async (req: Request, res: Response) => {
  const { username } = req.params;
  try {
    const progress = await dbService.getStudentProgress(username);
    const auditPoints = await dbService.getAuditPoints(username);
    
    // Calculate aggregate stats
    const completedQuests = progress.filter(p => p.status === 'COMPLETED').length;
    
    // Total XP is the sum of XP from all completed quests
    // We approximate it for now as 1000 XP per completed quest + 100 XP per passed exercise
    const totalXp = progress.reduce((acc, p) => {
      if (p.status === 'COMPLETED') return acc + 1000;
      return acc;
    }, 0);
    
    res.json({
      username,
      level: Math.floor(totalXp / 1000) + 1,
      xp: totalXp,
      completedQuests,
      auditPoints: auditPoints?.points || 1,
      auditsCompleted: auditPoints?.audits_completed || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// OAuth2 logic for Gitea SSO
export const authorize = (req: Request, res: Response) => {
  const { redirect_uri, state, client_id } = req.query;
  // This would typically show a login page, but since Gitea is calling this,
  // we assume the user is already authenticated in the LMS.
  // For the demo, we use a placeholder or the last logged in user.
  const username = 'dotunbey'; 
  const email = 'dotun@example.com';
  const code = authService.generateAuthCode(username, email);
  const redirectUrl = `${redirect_uri as string}?code=${code}&state=${state as string}`;
  res.redirect(redirectUrl);
};

export const token = (req: Request, res: Response) => {
  const { code } = req.body;
  try {
    const result = authService.exchangeCodeForToken(code);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const userinfo = (req: Request, res: Response) => {
  // In real app, verify the access token from Gitea
  res.json({
    sub: 'dotunbey',
    name: 'Dotun Bey',
    preferred_username: 'dotunbey',
    email: 'dotun@example.com'
  });
};
