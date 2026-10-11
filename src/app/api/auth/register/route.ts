import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special symbol'),
  daily_limit: z.number().min(1).default(50.0),
  currency: z.string().min(1).max(10).default('$'),
  rollover_unused: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid registration input' },
        { status: 400 }
      );
    }

    const { email, password, daily_limit, currency, rollover_unused } = result.data;
    const cleanEmail = email.trim().toLowerCase();

    const db = getDb();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const userId = randomUUID();
    const passwordHash = await hashPassword(password);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, daily_limit, currency, rollover_unused)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      cleanEmail,
      passwordHash,
      daily_limit,
      currency,
      rollover_unused ? 1 : 0
    );

    // Create session token
    const token = await signToken({ userId, email: cleanEmail });

    const user = {
      id: userId,
      email: cleanEmail,
      daily_limit,
      currency,
      rollover_unused,
    };

    const response = NextResponse.json({
      message: 'Registration successful',
      user,
    });

    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating account' },
      { status: 500 }
    );
  }
}
