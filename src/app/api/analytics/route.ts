import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { AnalyticsData } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const db = getDb();

    // 1. Weekly 7-day trend
    const weeklyTrend: AnalyticsData['weeklyTrend'] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const start = `${dateStr}T00:00:00.000Z`;
      const end = `${dateStr}T23:59:59.999Z`;

      const row = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as spent
        FROM expenses
        WHERE user_id = ? AND spent_at >= ? AND spent_at <= ?
      `).get(user.id, start, end) as { spent: number };

      const spent = Math.round(Number(row?.spent || 0) * 100) / 100;
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });

      weeklyTrend.push({
        date: dateStr,
        dayName,
        spent,
        limit: user.daily_limit,
        isOverBudget: spent > user.daily_limit,
      });
    }

    // 2. Compliance calculation over past N days (e.g. 30 days)
    let compliantDays = 0;
    let totalDaysAnalyzed = days;
    let totalSpend = 0;
    let highestDaySpend = 0;

    for (let i = 0; i < days; i++) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const start = `${dateStr}T00:00:00.000Z`;
      const end = `${dateStr}T23:59:59.999Z`;

      const row = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as spent
        FROM expenses
        WHERE user_id = ? AND spent_at >= ? AND spent_at <= ?
      `).get(user.id, start, end) as { spent: number };

      const daySpent = Number(row?.spent || 0);
      totalSpend += daySpent;
      if (daySpent > highestDaySpend) {
        highestDaySpend = daySpent;
      }
      if (daySpent <= user.daily_limit) {
        compliantDays++;
      }
    }

    const complianceScore = Math.round((compliantDays / totalDaysAnalyzed) * 100);

    // 3. Category Breakdown (over period)
    const startDate = new Date(now.getTime() - days * 86400000).toISOString();
    const catRows = db.prepare(`
      SELECT 
        category,
        COALESCE(SUM(amount), 0) as total,
        COUNT(id) as count
      FROM expenses
      WHERE user_id = ? AND spent_at >= ?
      GROUP BY category
      ORDER BY total DESC
    `).all(user.id, startDate) as { category: string; total: number; count: number }[];

    const catTotalSum = catRows.reduce((acc, curr) => acc + Number(curr.total), 0) || 1;
    const categoryBreakdown = catRows.map((r) => ({
      category: r.category,
      total: Math.round(Number(r.total) * 100) / 100,
      count: Number(r.count),
      percentage: Math.round((Number(r.total) / catTotalSum) * 100),
    }));

    // 4. Payment breakdown
    const payRows = db.prepare(`
      SELECT 
        payment_method as method,
        COALESCE(SUM(amount), 0) as total,
        COUNT(id) as count
      FROM expenses
      WHERE user_id = ? AND spent_at >= ?
      GROUP BY payment_method
      ORDER BY total DESC
    `).all(user.id, startDate) as { method: string; total: number; count: number }[];

    const paymentBreakdown = payRows.map((r) => ({
      method: r.method || 'Card',
      total: Math.round(Number(r.total) * 100) / 100,
      count: Number(r.count),
    }));

    // 5. Largest single expense
    const largestRow = db.prepare(`
      SELECT COALESCE(MAX(amount), 0) as maxAmount
      FROM expenses
      WHERE user_id = ? AND spent_at >= ?
    `).get(user.id, startDate) as { maxAmount: number };

    const highestExpenseAmount = Number(largestRow?.maxAmount || 0);

    const analytics: AnalyticsData = {
      weeklyTrend,
      categoryBreakdown,
      paymentBreakdown,
      compliance: {
        compliantDays,
        totalDays: totalDaysAnalyzed,
        complianceScore,
      },
      metrics: {
        avgDailySpend: Math.round((totalSpend / days) * 100) / 100,
        highestDaySpend: Math.round(highestDaySpend * 100) / 100,
        highestExpenseAmount: Math.round(highestExpenseAmount * 100) / 100,
        totalPeriodSpend: Math.round(totalSpend * 100) / 100,
      },
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}
