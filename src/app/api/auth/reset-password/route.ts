import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

const schema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special symbol'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { token, password } = result.data;
    const db = getDb();

    const user = db.prepare(`
      SELECT id, reset_token_expires 
      FROM users 
      WHERE reset_token = ?
    `).get(token) as { id: string; reset_token_expires: string } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired password reset link' }, { status: 400 });
    }

    const expiry = new Date(user.reset_token_expires);
    if (isNaN(expiry.getTime()) || expiry < new Date()) {
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const newHash = await hashPassword(password);

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL 
      WHERE id = ?
    `).run(newHash, user.id);

    return NextResponse.json({
      message: 'Password reset successful! You may now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
