import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { calculateBudgetSummary } from '@/lib/budget';

const settingsSchema = z.object({
  daily_limit: z.number().min(1, 'Daily budget must be at least 1').max(1000000),
  monthly_budget: z.number().positive().optional().nullable(),
  budget_mode: z.enum(['daily', 'monthly']).optional(),
  currency: z.string().min(1).max(10),
  rollover_unused: z.boolean(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const summary = calculateBudgetSummary(db, user);

    return NextResponse.json({
      settings: {
        daily_limit: user.daily_limit,
        monthly_budget: user.monthly_budget,
        budget_mode: user.budget_mode || 'daily',
        currency: user.currency,
        rollover_unused: user.rollover_unused,
      },
      summary,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = settingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid settings values' },
        { status: 400 }
      );
    }

    let { daily_limit, monthly_budget, budget_mode, currency, rollover_unused } = result.data;
    const mode = budget_mode || user.budget_mode || 'daily';

    // Automatically sync monthly budget with daily limit based on selected mode
    if (mode === 'monthly' && monthly_budget && monthly_budget > 0) {
      daily_limit = Math.round((monthly_budget / 30) * 100) / 100;
    } else if (daily_limit > 0 && (!monthly_budget || mode === 'daily')) {
      monthly_budget = Math.round(daily_limit * 30 * 100) / 100;
    }

    const db = getDb();

    db.prepare(`
      UPDATE users
      SET daily_limit = ?, monthly_budget = ?, budget_mode = ?, currency = ?, rollover_unused = ?
      WHERE id = ?
    `).run(daily_limit, monthly_budget || null, mode, currency, rollover_unused ? 1 : 0, user.id);

    const updatedUser = {
      ...user,
      daily_limit,
      monthly_budget,
      budget_mode: mode,
      currency,
      rollover_unused,
    };

    const summary = calculateBudgetSummary(db, updatedUser);

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: {
        daily_limit,
        monthly_budget,
        budget_mode: mode,
        currency,
        rollover_unused,
      },
      summary,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
