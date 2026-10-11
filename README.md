# SpendPulse — Daily Spending & Budget Tracker

**SpendPulse** is a production-ready, fully responsive, and secure Daily Spending & Budget Tracker web application built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, and **SQLite**.

The core focus of SpendPulse is **immediate user feedback**: every time an expense is logged, the user instantly receives a live in-app banner/toast, audio cue, and real-time dashboard progress calculation indicating total spent today, remaining daily limit, and percentage consumed.

---

## 🌟 Key Features

### 1. Immediate Spending Feedback & Reminder System (Core USP)
- **Instant Urgency Toast & Receipt Card**: Whenever an expense is submitted, immediate notification displays:
  > *"Added [Amount]. You've spent [Total Today] today. Remaining limit: [Remaining Limit]."*
- **Dynamic Urgency Tiers & Badges**:
  - **Normal (<80% limit)**: Calm subtle emerald badge & audio chime indicating budget is on track.
  - **Warning (80%–99% limit)**: Glowing amber alert banner indicating the user is approaching their daily threshold.
  - **Over Budget (≥100% limit)**: High-priority red pulsating alert banner showing exact excess amount over budget and warning chime.
- **Audio Feedback Engine**: Web Audio API synthesizer for instant audio cues (with one-click mute toggle in the navbar).

### 2. Daily Budget Dashboard
- **Hero Metric Card**: Dynamic circular radial progress meter displaying `Today's Spent / Daily Limit` with percentage and glowing drop-shadow.
- **Remaining Balance Card**: Color-coded balance remaining for the active 24-hour cycle.
- **Transaction Feed**: Filterable list of today's expenses with inline edit and delete capabilities.
- **Quick-Add Expense Modal**: Fast expense logging with preset increments (`+$5`, `+$10`, `+$20`, `+$50`), category pills (Food, Commute, Bills, Entertainment, Misc), and payment methods (Card, Cash, UPI/Online).
- **Export to CSV**: Download all transactions formatted as CSV.

### 3. User Onboarding & Settings
- **Daily Budget Configuration**: User defines their daily spending limit and preferred currency symbol (`$`, `€`, `£`, `₹`, `¥`, `₩`, etc.).
- **Rollover Option (Toggle)**: Option to either reset daily limit at midnight (`00:00` local time) or roll over unspent funds to increase the active day's spending capacity.
- **Active Threshold Previews**: Clear visualization of 80% and 100% notification triggers.

### 4. Analytics & Historical Insights
- **Daily Limit Compliance Score**: Track spending discipline (e.g., *"Kept under budget 28 out of 30 days — 93% Compliance Score"*).
- **7-Day Spending Trend**: Daily bar chart comparing daily expenditures directly against the user's daily budget line.
- **Category & Payment Distribution**: Visual breakdown of spending by category and payment method.
- **Key Metrics**: Average daily spend, peak single day spend, and largest single transaction.

### 5. Authentication & Security
- **Endpoints**: `/login`, `/register`, `/forgot-password`, `/api/auth/*`.
- **1-Click Demo Account**: Instant preview button for rapid review and testing.
- **Password Complexity**: Enforces minimum 8 characters, at least one number, and at least one special symbol.
- **Password Hashing**: `bcryptjs` with salt rounds.
- **Session Security**: HttpOnly secure cookies with `jose` JWT verification and CSRF protection.
- **Next.js 16 Route Protection**: Proxy route protection redirecting unauthenticated users to `/login`.
- **Row-Level Security (RLS)**: Strict user-scoped SQL queries preventing unauthorized access to financial data.

---

## 🗄️ Database Schema

Implemented with SQLite (`better-sqlite3`) in `tracker.db`:

```sql
-- Users / Profiles
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  daily_limit REAL DEFAULT 50.00,
  currency TEXT DEFAULT '$',
  rollover_unused INTEGER DEFAULT 0,
  reset_token TEXT,
  reset_token_expires TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Expenses
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT DEFAULT 'Card',
  note TEXT,
  spent_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_expenses_user_spent ON expenses(user_id, spent_at);
CREATE INDEX idx_users_email ON users(email);
```

---

## 🚀 Getting Started

1. **Start the Development Server**:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.
3. Click **"Instant Preview: 1-Click Demo Account"** to immediately test the populated demo environment, or create a new account with custom budget limits.
