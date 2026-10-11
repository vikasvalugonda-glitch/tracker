export function formatCurrency(amount: number, currency: string = '$'): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount).toFixed(2);
  return `${isNegative ? '-' : ''}${currency}${absVal}`;
}

export function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return dateStr;
  }
}

export function formatTimeLabel(dateStr: string, is12Hour: boolean = true): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, {
      hour: is12Hour ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: is12Hour,
    });
  } catch {
    return '';
  }
}

export const CATEGORY_META: Record<
  string, 
  { label: string; icon: string; color: string; bg: string; border: string }
> = {
  Food: {
    label: 'Food & Dining',
    icon: 'Utensils',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  Commute: {
    label: 'Commute & Travel',
    icon: 'Car',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
  },
  Bills: {
    label: 'Bills & Utilities',
    icon: 'Receipt',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  Entertainment: {
    label: 'Entertainment',
    icon: 'Film',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  Misc: {
    label: 'Miscellaneous',
    icon: 'Sparkles',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
};
