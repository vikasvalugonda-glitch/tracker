import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { calculateBudgetSummary } from '@/lib/budget';

const updateExpenseSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero').optional(),
  category: z.string().min(1).optional(),
  payment_method: z.enum(['Card', 'Cash', 'UPI/Online']).optional(),
  note: z.string().max(255).optional().nullable(),
  spent_at: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = updateExpenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid expense update' },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = db.prepare('SELECT id, spent_at FROM expenses WHERE id = ? AND user_id = ?').get(id, user.id) as {
      id: string;
      spent_at: string;
    } | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found or access denied' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (result.data.amount !== undefined) {
      updates.push('amount = ?');
      values.push(result.data.amount);
    }
    if (result.data.category !== undefined) {
      updates.push('category = ?');
      values.push(result.data.category);
    }
    if (result.data.payment_method !== undefined) {
      updates.push('payment_method = ?');
      values.push(result.data.payment_method);
    }
    if (result.data.note !== undefined) {
      const clean = result.data.note ? result.data.note.replace(/[<>]/g, '').trim() : null;
      updates.push('note = ?');
      values.push(clean);
    }
    if (result.data.spent_at !== undefined) {
      updates.push('spent_at = ?');
      values.push(result.data.spent_at);
    }

    if (updates.length > 0) {
      values.push(id, user.id);
      db.prepare(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    }

    const updatedExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    const summary = calculateBudgetSummary(db, user);

    return NextResponse.json({
      message: 'Expense updated successfully',
      expense: updatedExpense,
      summary,
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const info = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(id, user.id);

    if (info.changes === 0) {
      return NextResponse.json({ error: 'Expense not found or access denied' }, { status: 404 });
    }

    const summary = calculateBudgetSummary(db, user);

    return NextResponse.json({
      message: 'Expense deleted successfully',
      summary,
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
