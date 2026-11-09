import { AppShellLayoutComponent } from './layouts/app-shell-layout.component';
import { buildRoutes } from './app.route-definitions';

describe('buildRoutes', () => {
  it('keeps recipes and favorites as reload-safe library routes', () => {
    const shellRoute = buildRoutes(false).find(
      (route) => route.path === '' && route.component === AppShellLayoutComponent
    );
    const recipesRoute = shellRoute?.children?.find((route) => route.path === 'recipes');
    const favoritesRoute = shellRoute?.children?.find((route) => route.path === 'favorites');
    const recipeDetailRoute = shellRoute?.children?.find(
      (route) => route.path === 'recipes/:recipeId'
    );
    const legacyMealRoute = shellRoute?.children?.find((route) => route.path === 'meals/:recipeId');

    expect(recipesRoute?.data?.['recipeScope']).toBe('all');
    expect(favoritesRoute?.data?.['recipeScope']).toBe('favorites');
    expect(favoritesRoute?.redirectTo).toBeUndefined();
    expect(recipeDetailRoute?.loadComponent).toBeDefined();
    expect(legacyMealRoute?.redirectTo).toBe('recipes/:recipeId');
  });
});
