import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'tracker.db');

// Ensure db directory exists if DB_PATH has a subfolder
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: Database.Database) {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
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

    CREATE TABLE IF NOT EXISTS expenses (
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

    CREATE INDEX IF NOT EXISTS idx_expenses_user_spent ON expenses(user_id, spent_at);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  try {
    db.exec(`ALTER TABLE users ADD COLUMN monthly_budget REAL DEFAULT NULL;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN budget_mode TEXT DEFAULT 'daily';`);
  } catch {}

  // Check if demo user exists, if not seed demo user
  const demoUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@tracker.local') as { id: string } | undefined;
  if (!demoUser) {
    const demoId = 'demo-user-id-0001-4991';
    const passwordHash = bcrypt.hashSync('Demo123!@#', 10);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, daily_limit, currency, rollover_unused)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(demoId, 'demo@tracker.local', passwordHash, 65.00, '$', 1);

    // Seed realistic past 7 days expenses
    const now = new Date();
    const insertExp = db.prepare(`
      INSERT INTO expenses (id, user_id, amount, category, payment_method, note, spent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Past 6 days
    for (let i = 6; i >= 1; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      
      insertExp.run(
        `demo-exp-past-${i}-1`,
        demoId,
        14.50 + (i * 2 % 7),
        'Food',
        'Card',
        'Lunch special & iced coffee',
        `${dateStr}T12:30:00.000Z`
      );
      insertExp.run(
        `demo-exp-past-${i}-2`,
        demoId,
        6.00 + (i % 4),
        'Commute',
        'Card',
        'Metro transit pass',
        `${dateStr}T08:45:00.000Z`
      );
      if (i % 2 === 0) {
        insertExp.run(
          `demo-exp-past-${i}-3`,
          demoId,
          18.00,
          'Entertainment',
          'UPI/Online',
          'Cinema tickets & snack',
          `${dateStr}T19:20:00.000Z`
        );
      }
    }

    // Today's expenses (e.g. $38 out of $65 -> ~58% consumed)
    const todayStr = now.toISOString().split('T')[0];
    insertExp.run(
      'demo-exp-today-1',
      demoId,
      12.50,
      'Food',
      'Card',
      'Artisan Bagel & Oat Latte',
      `${todayStr}T09:15:00.000Z`
    );
    insertExp.run(
      'demo-exp-today-2',
      demoId,
      7.50,
      'Commute',
      'Card',
      'Subway ride',
      `${todayStr}T10:30:00.000Z`
    );
    insertExp.run(
      'demo-exp-today-3',
      demoId,
      18.00,
      'Food',
      'UPI/Online',
      'Healthy Salad & Fresh Juice',
      `${todayStr}T13:45:00.000Z`
    );
  }
}
