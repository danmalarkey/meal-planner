import {
  addMealPlanWeeks,
  fromLocalDateKey,
  isPastMealPlanWeek,
  mealPlanWeekLabel,
  mealPlanWeekNavigationLabel,
  startOfMealPlanWeek,
  toLocalDateKey
} from './meal-plan-week';

describe('meal-plan week helpers', () => {
  const wednesday = new Date(2026, 10, 11);

  it('uses Sunday as the centralized week boundary', () => {
    expect(toLocalDateKey(startOfMealPlanWeek(wednesday))).toBe('2026-11-08');
  });

  it('moves by complete local calendar weeks', () => {
    expect(toLocalDateKey(addMealPlanWeeks(startOfMealPlanWeek(wednesday), 1))).toBe('2026-11-15');
  });

  it('parses valid local date keys without a UTC date shift', () => {
    expect(toLocalDateKey(fromLocalDateKey('2026-11-08')!)).toBe('2026-11-08');
    expect(fromLocalDateKey('2026-02-31')).toBeNull();
  });

  it('labels relative weeks and identifies history', () => {
    const current = new Date(2026, 10, 8);
    expect(mealPlanWeekLabel(current, wednesday)).toBe('This week');
    expect(mealPlanWeekLabel(addMealPlanWeeks(current, 1), wednesday)).toBe('Next week');
    expect(isPastMealPlanWeek(addMealPlanWeeks(current, -1), wednesday)).toBeTrue();
  });

  it('uses only This week for the current navigation label and ranges elsewhere', () => {
    const current = new Date(2026, 10, 8);
    expect(mealPlanWeekNavigationLabel(current, wednesday)).toBe('This week');
    expect(mealPlanWeekNavigationLabel(addMealPlanWeeks(current, 1), wednesday)).toBe('Nov 15–21');
  });
});
