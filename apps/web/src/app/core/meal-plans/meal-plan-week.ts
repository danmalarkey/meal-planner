export const WEEK_STARTS_ON = 0;

export function startOfMealPlanWeek(value: Date): Date {
  const result = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const daysSinceWeekStart = (result.getDay() - WEEK_STARTS_ON + 7) % 7;
  result.setDate(result.getDate() - daysSinceWeekStart);
  return result;
}

export function addMealPlanWeeks(value: Date, amount: number): Date {
  const result = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  result.setDate(result.getDate() + amount * 7);
  return result;
}

export function toLocalDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromLocalDateKey(value: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;

  const result = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toLocalDateKey(result) === value ? result : null;
}

export function mealPlanWeekLabel(value: Date, today = new Date()): string {
  const selected = startOfMealPlanWeek(value);
  const current = startOfMealPlanWeek(today);
  const differenceInWeeks = Math.round(
    (selected.getTime() - current.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  if (differenceInWeeks === 0) return 'This week';
  if (differenceInWeeks === 1) return 'Next week';
  if (differenceInWeeks === -1) return 'Last week';

  return selected.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: selected.getFullYear() === current.getFullYear() ? undefined : 'numeric'
  });
}

export function mealPlanWeekRangeLabel(value: Date): string {
  const start = startOfMealPlanWeek(value);
  const end = addMealPlanWeeks(start, 1);
  end.setDate(end.getDate() - 1);
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  const endLabel = end.toLocaleDateString(
    undefined,
    sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' }
  );
  return `${startLabel}–${endLabel}`;
}

export function mealPlanWeekNavigationLabel(value: Date, today = new Date()): string {
  return mealPlanWeekLabel(value, today) === 'This week'
    ? 'This week'
    : mealPlanWeekRangeLabel(value);
}

export function isPastMealPlanWeek(value: Date, today = new Date()): boolean {
  return startOfMealPlanWeek(value).getTime() < startOfMealPlanWeek(today).getTime();
}
