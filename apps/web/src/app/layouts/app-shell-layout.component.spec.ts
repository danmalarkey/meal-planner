import { primaryNavigationSection } from './app-shell-layout.component';

describe('primaryNavigationSection', () => {
  it('keeps meal plan active while viewing a planned recipe', () => {
    expect(
      primaryNavigationSection(
        '/recipes/recipe-1?mealPlanEntry=entry-1&returnTo=%2Fmeal-plan&planWeek=2026-11-09'
      )
    ).toBe('meal-plan');
    expect(
      primaryNavigationSection(
        '/recipes/recipe-1?returnTo=%2Fmeal-plan%2Fbuild%2F2026-11-16&planWeek=2026-11-16'
      )
    ).toBe('meal-plan');
  });

  it('keeps recipes active for recipe-library and favorite contexts', () => {
    expect(primaryNavigationSection('/recipes/recipe-1')).toBe('recipes');
    expect(primaryNavigationSection('/recipes/recipe-1?returnTo=%2Ffavorites')).toBe('recipes');
    expect(primaryNavigationSection('/favorites')).toBe('recipes');
  });

  it('selects the direct meal plan and groceries sections', () => {
    expect(primaryNavigationSection('/meal-plan?week=2026-11-09')).toBe('meal-plan');
    expect(primaryNavigationSection('/groceries')).toBe('groceries');
  });
});
