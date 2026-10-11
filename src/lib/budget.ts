import Database from 'better-sqlite3';
import { BudgetSummary, UrgencyTier, User } from './types';

/**
 * Calculates current budget metrics for a given user on a given date (default today).
 */
export function calculateBudgetSummary(
  db: Database.Database,
  user: User,
  clientDateStr?: string // e.g. "2026-10-10"
): BudgetSummary {
  const targetDate = clientDateStr || new Date().toISOString().split('T')[0];
  const startOfToday = `${targetDate}T00:00:00.000Z`;
  const endOfToday = `${targetDate}T23:59:59.999Z`;

  // Get expenses for today
  const todayRow = db.prepare(`
    SELECT 
      COALESCE(SUM(amount), 0) as totalSpent,
      COUNT(id) as count
    FROM expenses
    WHERE user_id = ? AND spent_at >= ? AND spent_at <= ?
  `).get(user.id, startOfToday, endOfToday) as { totalSpent: number; count: number };

  const todaySpent = Math.round(Number(todayRow?.totalSpent || 0) * 100) / 100;
  const transactionCount = Number(todayRow?.count || 0);

  const baseLimit = Number(user.daily_limit) || 50;

  // Month-to-date calculation
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOfMonth = new Date(year, month, 1).toISOString();

  const monthRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as monthSpent
    FROM expenses
    WHERE user_id = ? AND spent_at >= ?
  `).get(user.id, startOfMonth) as { monthSpent: number };

  const monthSpent = Math.round(Number(monthRow?.monthSpent || 0) * 100) / 100;
  const monthlyBudget = user.monthly_budget && user.monthly_budget > 0
    ? Number(user.monthly_budget)
    : Math.round(baseLimit * daysInMonth * 100) / 100;
  const monthRemaining = Math.round((monthlyBudget - monthSpent) * 100) / 100;

  // Rollover calculation if enabled (unspent funds from yesterday rolled over to today)
  let rolloverBonus = 0;
  if (user.rollover_unused) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayStart = `${yesterdayStr}T00:00:00.000Z`;
    const yesterdayEnd = `${yesterdayStr}T23:59:59.999Z`;

    const yesterdayRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as spent
      FROM expenses
      WHERE user_id = ? AND spent_at >= ? AND spent_at <= ?
    `).get(user.id, yesterdayStart, yesterdayEnd) as { spent: number };

    const yesterdaySpent = Number(yesterdayRow?.spent || 0);
    const unspentYesterday = baseLimit - yesterdaySpent;
    if (unspentYesterday > 0) {
      rolloverBonus = Math.min(Math.round(unspentYesterday * 100) / 100, baseLimit);
    }
  }

  // If rollover is disabled, effectiveLimit is strictly baseLimit!
  const effectiveLimit = Math.round((baseLimit + rolloverBonus) * 100) / 100;
  const remainingLimit = Math.round((effectiveLimit - todaySpent) * 100) / 100;

  // Percentage consumed of the configured daily budget
  const percentageConsumed = baseLimit > 0
    ? Math.round((todaySpent / baseLimit) * 1000) / 10
    : 100;

  let urgency: UrgencyTier = 'normal';
  if (todaySpent >= effectiveLimit) {
    urgency = 'over_budget';
  } else if (todaySpent >= baseLimit * 0.8) {
    urgency = 'warning';
  }

  const excessAmount = Math.max(0, Math.round((todaySpent - effectiveLimit) * 100) / 100);

  return {
    todaySpent,
    dailyLimit: baseLimit,
    monthlyBudget,
    monthSpent,
    monthRemaining,
    budgetMode: user.budget_mode || 'daily',
    effectiveLimit,
    remainingLimit,
    percentageConsumed,
    urgency,
    excessAmount,
    transactionCount,
    rolloverBonus,
    currency: user.currency || '$',
  };
}
