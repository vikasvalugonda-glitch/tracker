import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { calculateBudgetSummary } from '@/lib/budget';
import { InstantFeedbackData } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  payment_method: z.enum(['Card', 'Cash', 'UPI/Online']).default('Card'),
  note: z.string().max(255).optional().nullable(),
  spent_at: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date'); // YYYY-MM-DD
    const range = searchParams.get('range') || 'today';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const db = getDb();
    const todayStr = dateParam || new Date().toISOString().split('T')[0];

    // Build query conditions
    const conditions: string[] = ['user_id = ?'];
    const params: unknown[] = [user.id];

    if (range === 'today') {
      conditions.push('spent_at >= ? AND spent_at <= ?');
      params.push(`${todayStr}T00:00:00.000Z`, `${todayStr}T23:59:59.999Z`);
    } else if (range === '7days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      conditions.push('spent_at >= ?');
      params.push(past7.toISOString());
    } else if (range === 'month') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      conditions.push('spent_at >= ?');
      params.push(past30.toISOString());
    }

    if (category && category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search && search.trim()) {
      conditions.push('(note LIKE ? OR category LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const whereClause = conditions.join(' AND ');

    // Total count for pagination
    const countRow = db.prepare(`SELECT COUNT(id) as count FROM expenses WHERE ${whereClause}`).get(...params) as { count: number };
    const totalCount = countRow ? countRow.count : 0;

    // Fetch expenses
    const query = `
      SELECT id, user_id, amount, category, payment_method, note, spent_at, created_at
      FROM expenses
      WHERE ${whereClause}
      ORDER BY spent_at DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;
    const expenses = db.prepare(query).all(...params, limit, offset);

    // Calculate today's summary metrics
    const summary = calculateBudgetSummary(db, user, todayStr);

    return NextResponse.json({
      expenses,
      summary,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to retrieve expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = createExpenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid expense data' },
        { status: 400 }
      );
    }

    const { amount, category, payment_method, note, spent_at } = result.data;
    const expenseId = randomUUID();
    const spentAtTime = spent_at || new Date().toISOString();
    
    // Sanitize note to prevent XSS
    const cleanNote = note ? note.replace(/[<>]/g, '').trim() : null;

    const db = getDb();

    db.prepare(`
      INSERT INTO expenses (id, user_id, amount, category, payment_method, note, spent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(expenseId, user.id, amount, category, payment_method, cleanNote, spentAtTime);

    // Calculate target date of the expense
    const expenseDateStr = spentAtTime.split('T')[0];
    const summary = calculateBudgetSummary(db, user, expenseDateStr);

    // Generate immediate feedback reminder payload
    const formattedAdded = formatCurrency(amount, user.currency);
    const formattedTotal = formatCurrency(summary.todaySpent, user.currency);
    const formattedRemaining = formatCurrency(Math.max(0, summary.remainingLimit), user.currency);
    const formattedExcess = formatCurrency(summary.excessAmount, user.currency);

    let feedbackMessage = `Added ${formattedAdded}. You've spent ${formattedTotal} today. Remaining limit: ${formattedRemaining}.`;
    if (summary.urgency === 'over_budget') {
      feedbackMessage = `Daily budget exceeded by ${formattedExcess}! Total spent today: ${formattedTotal}.`;
    } else if (summary.urgency === 'warning') {
      feedbackMessage = `Approaching your daily limit! Added ${formattedAdded}. Remaining limit: ${formattedRemaining} (${summary.percentageConsumed}% consumed).`;
    }

    const feedback: InstantFeedbackData = {
      addedAmount: amount,
      category,
      note: cleanNote || undefined,
      paymentMethod: payment_method,
      todaySpent: summary.todaySpent,
      remainingLimit: summary.remainingLimit,
      percentageConsumed: summary.percentageConsumed,
      urgency: summary.urgency,
      excessAmount: summary.excessAmount,
      currency: user.currency,
      message: feedbackMessage,
    };

    const newExpense = {
      id: expenseId,
      user_id: user.id,
      amount,
      category,
      payment_method,
      note: cleanNote,
      spent_at: spentAtTime,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        message: 'Expense recorded successfully',
        expense: newExpense,
        summary,
        feedback,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error logging expense:', error);
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 500 });
  }
}
