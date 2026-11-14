import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.ts';

const RUNTIME_SECRET =
  process.env.JWT_SECRET && process.env.JWT_SECRET !== 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET'
    ? process.env.JWT_SECRET
    : crypto.randomBytes(32).toString('hex');

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
  return jwt.sign(payload, RUNTIME_SECRET, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, RUNTIME_SECRET) as AuthPayload;
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
