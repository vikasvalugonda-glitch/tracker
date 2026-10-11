import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid login details' },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const cleanEmail = email.trim().toLowerCase();

    const db = getDb();
    const userRow = db.prepare(`
      SELECT id, email, password_hash, daily_limit, currency, rollover_unused
      FROM users WHERE email = ?
    `).get(cleanEmail) as {
      id: string;
      email: string;
      password_hash: string;
      daily_limit: number;
      currency: string;
      rollover_unused: number;
    } | undefined;

    if (!userRow) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, userRow.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = await signToken({ userId: userRow.id, email: userRow.email });

    const user = {
      id: userRow.id,
      email: userRow.email,
      daily_limit: Number(userRow.daily_limit),
      currency: userRow.currency || '$',
      rollover_unused: Boolean(userRow.rollover_unused),
    };

    const response = NextResponse.json({
      message: 'Logged in successfully',
      user,
    });

    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
