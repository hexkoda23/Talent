import { createHash, generateKeyPairSync } from 'crypto';
import jwt from 'jsonwebtoken';
import type { LmsSessionUser } from './sessionService';
import { userDisplayName } from './identity';
import { config } from '../config/env';

type AuthCodeRecord = {
  user: LmsSessionUser;
  clientId: string;
  redirectUri: string;
  scope: string;
  nonce?: string;
  expiresAt: number;
};

type AccessTokenRecord = {
  user: LmsSessionUser;
  clientId: string;
  scope: string;
  expiresAt: number;
};

const randomToken = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privatePem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
const publicJwk = publicKey.export({ format: 'jwk' }) as { kty: string; n: string; e: string };
const kid = createHash('sha256').update(`${publicJwk.n}.${publicJwk.e}`).digest('base64url');

const issuer = () => config.oidc.issuer.replace(/\/+$/, '');

const parseScope = (scope: string | undefined) => {
  const requested = (scope || 'openid profile email').trim().split(/\s+/).filter(Boolean);
  if (!requested.includes('openid')) requested.unshift('openid');
  return Array.from(new Set(requested)).join(' ');
};

const ensureClient = (clientId: string, clientSecret?: string) => {
  if (clientId !== config.oidc.clientId) throw new Error('Invalid client_id');
  if (clientSecret !== undefined && clientSecret !== config.oidc.clientSecret) throw new Error('Invalid client_secret');
};

/**
 * OIDC bridge used by Gitea.
 *
 * Main auth remains in TalentNation. This service turns LMS sessions into OIDC
 * authorization codes, access tokens, and signed id_tokens that Gitea can trust.
 */
export const authService = {
  authCodes: new Map<string, AuthCodeRecord>(),
  accessTokens: new Map<string, AccessTokenRecord>(),

  issuer,

  metadata: () => {
    const base = issuer();
    return {
      issuer: base,
      authorization_endpoint: `${base}/api/v1/auth/authorize`,
      token_endpoint: `${base}/api/v1/auth/token`,
      userinfo_endpoint: `${base}/api/v1/auth/userinfo`,
      jwks_uri: `${base}/.well-known/jwks.json`,
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['openid', 'profile', 'email'],
      claims_supported: ['sub', 'name', 'preferred_username', 'email', 'roles'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      grant_types_supported: ['authorization_code'],
    };
  },

  jwks: () => ({
    keys: [{
      kty: publicJwk.kty,
      use: 'sig',
      alg: 'RS256',
      kid,
      n: publicJwk.n,
      e: publicJwk.e,
    }],
  }),

  generateAuthCode: (user: LmsSessionUser, input: {
    clientId: string;
    redirectUri: string;
    scope?: string;
    nonce?: string;
  }) => {
    ensureClient(input.clientId);
    const code = randomToken('code');
    authService.authCodes.set(code, {
      user,
      clientId: input.clientId,
      redirectUri: input.redirectUri,
      scope: parseScope(input.scope),
      nonce: input.nonce,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    setTimeout(() => authService.authCodes.delete(code), 5 * 60 * 1000);
    return code;
  },

  exchangeCodeForToken: (input: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }) => {
    ensureClient(input.clientId, input.clientSecret);
    const record = authService.authCodes.get(input.code);
    if (!record || record.expiresAt < Date.now()) {
      authService.authCodes.delete(input.code);
      throw new Error('Invalid or expired authorization code');
    }
    if (record.clientId !== input.clientId) throw new Error('Authorization code client mismatch');
    if (record.redirectUri !== input.redirectUri) throw new Error('Authorization code redirect_uri mismatch');

    authService.authCodes.delete(input.code);
    const accessToken = randomToken('at');
    authService.accessTokens.set(accessToken, {
      user: record.user,
      clientId: input.clientId,
      scope: record.scope,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    const now = Math.floor(Date.now() / 1000);
    const idToken = jwt.sign(
      {
        iss: issuer(),
        sub: record.user.id,
        aud: input.clientId,
        exp: now + 3600,
        iat: now,
        auth_time: now,
        nonce: record.nonce,
        email: record.user.email,
        name: userDisplayName(record.user),
        preferred_username: record.user.username,
      },
      privatePem,
      {
        algorithm: 'RS256',
        keyid: kid,
      },
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: record.scope,
      id_token: idToken,
    };
  },

  getUserForAccessToken: (token: string) => {
    const record = authService.accessTokens.get(token);
    if (!record || record.expiresAt < Date.now()) {
      authService.accessTokens.delete(token);
      return null;
    }
    return record.user;
  },

  userinfo: (user: LmsSessionUser) => ({
    sub: user.id,
    name: userDisplayName(user),
    preferred_username: user.username,
    username: user.username,
    email: user.email,
    roles: user.roles,
  }),
};
