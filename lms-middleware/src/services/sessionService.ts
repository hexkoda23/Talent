import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '../config/env';
import { dbService, PlatformUser } from './dbService';

export interface LmsSessionUser {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  organizationId: string;
  roles: string[];
}

interface StoredSession {
  user: LmsSessionUser;
  expiresAt: number;
}

type LaunchPayload = {
  sub: string;
  email: string;
  organizationId: string;
  roles: string[];
  purpose: string;
};

const sessions = new Map<string, StoredSession>();
const oneDayMs = 24 * 60 * 60 * 1000;
const adminRoles = new Set(['superadmin', 'campus_admin', 'coding_mentor']);

const parseCookies = (header: string | undefined) => {
  const cookies = new Map<string, string>();
  if (!header) return cookies;

  header.split(';').forEach((part) => {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName) return;
    cookies.set(rawName, decodeURIComponent(rawValue.join('=')));
  });

  return cookies;
};

const asSessionUser = (user: PlatformUser): LmsSessionUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  organizationId: user.organizationId,
  roles: user.roles,
});

const getReturnUrl = () => config.mainBackend.userAppUrl;

export const sessionService = {
  verifyLaunchTicket: (ticket: string) => {
    const payload = jwt.verify(ticket, config.auth.launchSecret, {
      audience: 'talentnation-lms',
      issuer: 'talentnation-api',
    }) as LaunchPayload;

    if (payload.purpose !== 'lms_launch') {
      throw new Error('Invalid launch ticket purpose');
    }

    return payload;
  },

  createSession: (res: Response, user: PlatformUser) => {
    const sessionId = randomUUID();
    sessions.set(sessionId, {
      user: asSessionUser(user),
      expiresAt: Date.now() + oneDayMs,
    });

    res.cookie(config.auth.cookieName, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: oneDayMs,
      path: '/',
    });

    return sessionId;
  },

  clearSession: (req: Request, res: Response) => {
    const sessionId = parseCookies(req.headers.cookie).get(config.auth.cookieName);
    if (sessionId) sessions.delete(sessionId);
    res.clearCookie(config.auth.cookieName, { path: '/' });
  },

  getSession: async (req: Request) => {
    const sessionId = parseCookies(req.headers.cookie).get(config.auth.cookieName);
    if (!sessionId) return null;

    const stored = sessions.get(sessionId);
    if (!stored || stored.expiresAt < Date.now()) {
      sessions.delete(sessionId);
      return null;
    }

    const latest = await dbService.getPlatformUserById(stored.user.id);
    if (!latest || !latest.isActive) {
      sessions.delete(sessionId);
      return null;
    }

    stored.user = asSessionUser(latest);
    return stored.user;
  },

  requireSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await sessionService.getSession(req);
      if (!user) {
        return res.status(401).json({
          error: 'LMS session required',
          returnUrl: getReturnUrl(),
        });
      }

      (req as any).lmsUser = user;
      next();
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'LMS session required' });
    }
  },

  requireAdminSession: async (req: Request, res: Response, next: NextFunction) => {
    await sessionService.requireSession(req, res, () => {
      const user = (req as any).lmsUser as LmsSessionUser | undefined;
      if (!user?.roles.some((role) => adminRoles.has(role))) {
        return res.status(403).json({ error: 'Admin role required' });
      }
      next();
    });
  },
};

export const getLmsUser = (req: Request) => (req as any).lmsUser as LmsSessionUser | undefined;

export const isLmsAdmin = (user?: LmsSessionUser | null) => Boolean(user?.roles.some((role) => adminRoles.has(role)));
