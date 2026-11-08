import { mealPlannerPageTitle } from './page-title';

describe('mealPlannerPageTitle', () => {
  it('formats a Meal Planner page title', () => {
    expect(mealPlannerPageTitle('Recipes')).toBe('Meal Planner | Recipes');
  });

  it('normalizes empty page names to the product title', () => {
    expect(mealPlannerPageTitle('  ')).toBe('Meal Planner');
  });
});
