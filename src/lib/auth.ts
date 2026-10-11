import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from './db';
import { User } from './types';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'tracker-super-secret-jwt-key-2026-secure-sign-antigravity';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
export const COOKIE_NAME = 'tracker_session';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function getAuthUser(req?: NextRequest): Promise<User | null> {
  let token: string | undefined;

  if (req) {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (cookie) {
      token = cookie.value;
    } else {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } else {
    // In server components/route handlers using next/headers
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(COOKIE_NAME);
      token = cookie?.value;
    } catch {
      // Fallback
    }
  }

  if (!token) return null;

  const verified = await verifyToken(token);
  if (!verified) return null;

  try {
    const db = getDb();
    const userRow = db.prepare(`
      SELECT id, email, daily_limit, monthly_budget, budget_mode, currency, rollover_unused, created_at
      FROM users WHERE id = ?
    `).get(verified.userId) as {
      id: string;
      email: string;
      daily_limit: number;
      monthly_budget: number | null;
      budget_mode: string | null;
      currency: string;
      rollover_unused: number;
      created_at: string;
    } | undefined;

    if (!userRow) return null;

    return {
      id: userRow.id,
      email: userRow.email,
      daily_limit: Number(userRow.daily_limit),
      monthly_budget: userRow.monthly_budget !== null && userRow.monthly_budget !== undefined ? Number(userRow.monthly_budget) : null,
      budget_mode: (userRow.budget_mode as 'daily' | 'monthly') || 'daily',
      currency: userRow.currency || '$',
      rollover_unused: Boolean(userRow.rollover_unused),
      created_at: userRow.created_at,
    };
  } catch (error) {
    console.error('Error fetching auth user:', error);
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
