import { Request, Response } from 'express';
import { dbService, pool } from '../services/dbService';
import { authService } from '../services/authService';
import { getLmsUser, isLmsAdmin, sessionService } from '../services/sessionService';
import { config } from '../config/env';

const requestedUsername = (req: Request) => {
  const sessionUser = getLmsUser(req);
  const paramUsername = req.params.username;
  if (!paramUsername || paramUsername === 'me') return sessionUser?.username || '';
  if (sessionUser && (sessionUser.username === paramUsername || isLmsAdmin(sessionUser))) return paramUsername;
  return sessionUser?.username || paramUsername;
};

export const session = async (req: Request, res: Response) => {
  const user = await sessionService.getSession(req);
  if (!user) return res.status(401).json({ authenticated: false, returnUrl: config.mainBackend.userAppUrl });
  res.json({ authenticated: true, user });
};

export const logout = async (req: Request, res: Response) => {
  sessionService.clearSession(req, res);
  res.status(204).send();
};

export const register = async (_req: Request, res: Response) => {
  res.status(410).json({
    error: 'LMS-local registration has been removed. Create users in TalentNation.',
    returnUrl: config.mainBackend.userAppUrl,
  });
};

export const login = async (_req: Request, res: Response) => {
  res.status(410).json({
    error: 'LMS-local login has been removed. Launch from TalentNation.',
    returnUrl: config.mainBackend.userAppUrl,
  });
};

export const getStudentProgress = async (req: Request, res: Response) => {
  const username = requestedUsername(req);
  try {
    const progress = await dbService.getStudentProgress(username);
    res.json({ progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStudentProfile = async (req: Request, res: Response) => {
  const username = requestedUsername(req);
  try {
    const progress = await dbService.getStudentProgress(username);
    const auditPoints = await dbService.getAuditPoints(username);
    const completedQuests = progress.filter((item: any) => item.status === 'COMPLETED').length;
    const xpResult = await dbService.getPlatformUserByUsername(username);
    const totalXp = xpResult ? await getUserXp(xpResult.id) : 0;

    res.json({
      username,
      level: Math.floor(totalXp / 1000) + 1,
      xp: totalXp,
      completedQuests,
      auditPoints: auditPoints?.points || 1,
      auditsCompleted: auditPoints?.audits_completed || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const getUserXp = async (userId: string) => {
  const result = await pool.query('SELECT COALESCE(SUM(amount), 0)::int AS xp FROM "XPTransaction" WHERE "userId" = $1', [userId]);
  return result.rows[0]?.xp || 0;
};

export const authorize = async (req: Request, res: Response) => {
  const user = getLmsUser(req);
  if (!user) return res.redirect(config.mainBackend.userAppUrl);

  const { redirect_uri, state, client_id, response_type, scope, nonce } = req.query;
  if (!redirect_uri || typeof redirect_uri !== 'string') {
    return res.status(400).json({ error: 'redirect_uri is required' });
  }
  if (!client_id || typeof client_id !== 'string') {
    return res.status(400).json({ error: 'client_id is required' });
  }
  if (response_type && response_type !== 'code') {
    return res.status(400).json({ error: 'Only response_type=code is supported' });
  }

  const code = authService.generateAuthCode(user, {
    clientId: client_id,
    redirectUri: redirect_uri,
    scope: typeof scope === 'string' ? scope : undefined,
    nonce: typeof nonce === 'string' ? nonce : undefined,
  });
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state && typeof state === 'string') redirectUrl.searchParams.set('state', state);
  res.redirect(redirectUrl.toString());
};

export const token = (req: Request, res: Response) => {
  const grantType = String(req.body.grant_type || '');
  const code = String(req.body.code || '');
  const redirectUri = String(req.body.redirect_uri || '');
  const basic = req.headers.authorization?.startsWith('Basic ')
    ? Buffer.from(String(req.headers.authorization).slice('Basic '.length), 'base64').toString('utf8')
    : '';
  const [basicClientId, basicClientSecret] = basic ? basic.split(':', 2) : [];
  const clientId = String(req.body.client_id || basicClientId || '');
  const clientSecret = String(req.body.client_secret || basicClientSecret || '');

  if (grantType && grantType !== 'authorization_code') {
    return res.status(400).json({ error: 'Unsupported grant_type' });
  }
  if (!code || !clientId || !clientSecret || !redirectUri) {
    return res.status(400).json({ error: 'Missing code, client_id, client_secret, or redirect_uri' });
  }

  try {
    const result = authService.exchangeCodeForToken({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const userinfo = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const tokenValue = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  const tokenUser = tokenValue ? authService.getUserForAccessToken(tokenValue) : null;
  const sessionUser = tokenUser || getLmsUser(req) || await sessionService.getSession(req);

  if (!sessionUser) return res.status(401).json({ error: 'No active LMS user' });
  res.json(authService.userinfo(sessionUser));
};
