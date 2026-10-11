import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    const db = getDb();
    const demoUser = db.prepare(`
      SELECT id, email, daily_limit, currency, rollover_unused
      FROM users WHERE email = ?
    `).get('demo@tracker.local') as {
      id: string;
      email: string;
      daily_limit: number;
      currency: string;
      rollover_unused: number;
    } | undefined;

    if (!demoUser) {
      return NextResponse.json({ error: 'Demo account not initialized' }, { status: 500 });
    }

    const token = await signToken({ userId: demoUser.id, email: demoUser.email });

    const user = {
      id: demoUser.id,
      email: demoUser.email,
      daily_limit: Number(demoUser.daily_limit),
      currency: demoUser.currency || '$',
      rollover_unused: Boolean(demoUser.rollover_unused),
    };

    const response = NextResponse.json({
      message: 'Demo login successful',
      user,
    });

    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Failed to authenticate demo user' }, { status: 500 });
  }
}
