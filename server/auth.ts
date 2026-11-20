import 'dotenv/config';
import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.ts';

const FALLBACK_JWT_SECRET = crypto.randomBytes(64).toString('hex');
const FALLBACK_SESSION_SECRET = crypto.randomBytes(64).toString('hex');
const FALLBACK_CSRF_SECRET = crypto.randomBytes(32).toString('hex');

function isConfiguredSecret(value: string | undefined): value is string {
  return Boolean(
    value &&
      value.trim().length >= 32 &&
      !value.startsWith('CHANGE_ME') &&
      !value.startsWith('YOUR_') &&
      !value.startsWith('MY_')
  );
}

export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  return isConfiguredSecret(s) ? s : FALLBACK_JWT_SECRET;
}

export function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  return isConfiguredSecret(s) ? s : FALLBACK_SESSION_SECRET;
}

export function getCsrfSecret(): string {
  const s = process.env.CSRF_SECRET;
  return isConfiguredSecret(s) ? s : FALLBACK_CSRF_SECRET;
}

export function generateCsrfToken(seed: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${seed}:${nonce}`;
  const sig = crypto.createHmac('sha256', getCsrfSecret()).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

export function verifyCsrfToken(token: string, expectedSeed: string): boolean {
  const parts = token.split(':');
  if (parts.length !== 3) return false;
  const [seed, nonce, sig] = parts;
  if (seed !== expectedSeed || !nonce || !sig) return false;
  const expectedSig = crypto.createHmac('sha256', getCsrfSecret()).update(`${seed}:${nonce}`).digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expectedSig, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const AUTH_COOKIE_NAME = 'casavente_session';

export interface AuthPayload {
  userId: number;
  email: string;
  role: 'CLIENT' | 'ADMIN';
}

export interface AuthedRequest extends Request {
  user?: AuthPayload;
}

export function signAuthToken(payload: AuthPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d', algorithm: 'HS256' });
}

export function verifyAuthToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthPayload;
  } catch {
    return null;
  }
}

export function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

export function attachOptionalUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const decoded = verifyAuthToken(token);
    if (decoded) {
      const userRow = db
        .prepare('SELECT id, email, role, is_active FROM users WHERE id = ?')
        .get(decoded.userId) as { id: number; email: string; role: 'CLIENT' | 'ADMIN'; is_active: number } | undefined;
      if (userRow && userRow.is_active === 1) {
        req.user = {
          userId: userRow.id,
          email: userRow.email,
          role: userRow.role,
        };
      }
    }
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentification requise pour accéder à cette ressource.' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentification administrateur requise.' });
    return;
  }
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Accès refusé : privilèges administrateur requis.' });
    return;
  }
  next();
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}
