export type PaymentMethod = 'Card' | 'Cash' | 'UPI/Online';

export type ExpenseCategory = 
  | 'Food' 
  | 'Commute' 
  | 'Bills' 
  | 'Entertainment' 
  | 'Misc';

export interface User {
  id: string;
  email: string;
  daily_limit: number;
  monthly_budget?: number | null;
  budget_mode?: 'daily' | 'monthly';
  currency: string;
  rollover_unused: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory | string;
  payment_method: PaymentMethod | string;
  note?: string | null;
  spent_at: string;
  created_at: string;
}

export type UrgencyTier = 'normal' | 'warning' | 'over_budget';

export interface BudgetSummary {
  todaySpent: number;
  dailyLimit: number;
  monthlyBudget: number;
  monthSpent: number;
  monthRemaining: number;
  budgetMode: 'daily' | 'monthly';
  effectiveLimit: number;
  remainingLimit: number;
  percentageConsumed: number;
  urgency: UrgencyTier;
  excessAmount: number;
  transactionCount: number;
  rolloverBonus: number;
  currency: string;
}

export interface InstantFeedbackData {
  addedAmount: number;
  category: string;
  note?: string;
  paymentMethod: string;
  todaySpent: number;
  remainingLimit: number;
  percentageConsumed: number;
  urgency: UrgencyTier;
  excessAmount: number;
  currency: string;
  message: string;
}

export interface AnalyticsData {
  weeklyTrend: {
    date: string;
    dayName: string;
    spent: number;
    limit: number;
    isOverBudget: boolean;
  }[];
  categoryBreakdown: {
    category: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  paymentBreakdown: {
    method: string;
    total: number;
    count: number;
  }[];
  compliance: {
    compliantDays: number;
    totalDays: number;
    complianceScore: number; // percentage
  };
  metrics: {
    avgDailySpend: number;
    highestDaySpend: number;
    highestExpenseAmount: number;
    totalPeriodSpend: number;
  };
}
