import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { getDb } from '@/lib/db';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const cleanEmail = result.data.email.trim().toLowerCase();
    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail) as { id: string } | undefined;

    if (!user) {
      // Even if user not found, return safe message to prevent email enumeration
      return NextResponse.json({
        message: 'If that email exists in our records, a password reset link has been issued.',
      });
    }

    const token = randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    db.prepare(`
      UPDATE users 
      SET reset_token = ?, reset_token_expires = ?
      WHERE id = ?
    `).run(token, expires, user.id);

    return NextResponse.json({
      message: 'Password reset link generated successfully.',
      simulatedToken: token, // Provided for direct in-app testing convenience
      simulatedResetUrl: `/forgot-password?token=${token}`,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process password reset' }, { status: 500 });
  }
}
