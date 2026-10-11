import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT spent_at, category, amount, payment_method, note
      FROM expenses
      WHERE user_id = ?
      ORDER BY spent_at DESC
    `).all(user.id) as {
      spent_at: string;
      category: string;
      amount: number;
      payment_method: string;
      note: string | null;
    }[];

    // Build CSV
    const headers = ['Date', 'Category', 'Amount', 'Currency', 'Payment Method', 'Notes'];
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      const date = r.spent_at ? r.spent_at.replace('T', ' ').substring(0, 19) : '';
      const cat = `"${(r.category || '').replace(/"/g, '""')}"`;
      const amt = r.amount.toFixed(2);
      const curr = `"${user.currency}"`;
      const method = `"${(r.payment_method || '').replace(/"/g, '""')}"`;
      const notes = `"${(r.note || '').replace(/"/g, '""')}"`;
      csvLines.push([date, cat, amt, curr, method, notes].join(','));
    }

    const csvContent = csvLines.join('\n');
    const today = new Date().toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="daily-expenses-${today}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV export:', error);
    return NextResponse.json({ error: 'Failed to export expenses' }, { status: 500 });
  }
}
