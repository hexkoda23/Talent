import path from 'path';
import express from 'express';
import routes from './routes';
import { sessionService } from './services/sessionService';
import { dbService } from './services/dbService';
import { giteaService } from './services/giteaService';
import { config } from './config/env';
import { authService } from './services/authService';

const app = express();
const allowedNext = /^\/(quests|audits|quest\/[^/?#]+|audit\/[^/?#]+|admin|admin\/quest\/[^/?#]+)$/;

const safeNextPath = (value: unknown) => {
  const next = typeof value === 'string' ? value : '/quests';
  return allowedNext.test(next) ? next : '/quests';
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'LMS Middleware is running' });
});

app.get('/.well-known/openid-configuration', (_req, res) => {
  res.json(authService.metadata());
});

app.get('/.well-known/jwks.json', (_req, res) => {
  res.json(authService.jwks());
});

app.get('/sso/consume', async (req, res) => {
  try {
    const ticket = String(req.query.ticket || '');
    if (!ticket) throw new Error('Missing launch ticket');

    const payload = sessionService.verifyLaunchTicket(ticket);
    const user = await dbService.getPlatformUserById(payload.sub);
    if (!user || !user.isActive) throw new Error('TalentNation user not found or inactive');

    const account = await dbService.ensureGiteaAccount(user.id, user.username, user.email);
    try {
      await giteaService.createUser(account.giteaUsername, user.email);
    } catch (error: any) {
      console.warn(`[SSO] Gitea user provisioning skipped/failed: ${error.message}`);
    }

    sessionService.createSession(res, { ...user, username: account.giteaUsername });
    res.redirect(safeNextPath(req.query.next));
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error || 'launch_failed');
    console.error('[SSO] Launch failed:', message);
    const returnUrl = new URL(config.mainBackend.userAppUrl);
    returnUrl.searchParams.set('lms_error', message);
    res.redirect(returnUrl.toString());
  }
});

app.use('/api/v1', routes);

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

export default app;
