export function mealPlannerPageTitle(pageName?: string | null): string {
  const normalizedPageName = pageName?.trim();
  return normalizedPageName ? `Meal Planner | ${normalizedPageName}` : 'Meal Planner';
}
