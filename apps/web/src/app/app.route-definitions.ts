import { Routes } from '@angular/router';
import {
  redirectAuthenticatedUserChildGuard,
  redirectAuthenticatedUserGuard,
  requireAuthChildGuard,
  requireAuthGuard
} from './core/auth/auth.guards';
import { mealPlannerPageTitle } from './core/routing/page-title';
import { AppShellLayoutComponent } from './layouts/app-shell-layout.component';
import { AuthShellLayoutComponent } from './layouts/auth-shell-layout.component';

export function buildRoutes(includeDesignSystem: boolean): Routes {
  const protectedChildren: Routes = [
    {
      path: '',
      redirectTo: 'meal-plan',
      pathMatch: 'full'
    },
    {
      path: 'meal-plan/build/:startsOn',
      loadComponent: () =>
        import('./pages/meal-plan/meal-plan-builder-page.component').then(
          (module) => module.MealPlanBuilderPageComponent
        ),
      title: mealPlannerPageTitle('Create meal plan')
    },
    {
      path: 'meal-plan',
      loadComponent: () =>
        import('./pages/meal-plan/meal-plan-page.component').then(
          (module) => module.MealPlanPageComponent
        ),
      title: mealPlannerPageTitle('Meal plan')
    },
    {
      path: 'groceries',
      loadComponent: () =>
        import('./pages/groceries/groceries-page.component').then(
          (module) => module.GroceriesPageComponent
        ),
      title: mealPlannerPageTitle('Groceries')
    },
    {
      path: 'recipes',
      loadComponent: () =>
        import('./pages/recipes/recipe-library-page.component').then(
          (module) => module.RecipeLibraryPageComponent
        ),
      title: mealPlannerPageTitle('Recipes'),
      data: { recipeScope: 'all' }
    },
    {
      path: 'recipes/:recipeId',
      loadComponent: () =>
        import('./pages/recipes/recipe-detail-page.component').then(
          (module) => module.RecipeDetailPageComponent
        ),
      title: mealPlannerPageTitle('Recipe')
    },
    {
      path: 'settings',
      loadComponent: () =>
        import('./pages/settings/settings-page.component').then(
          (module) => module.SettingsPageComponent
        ),
      title: mealPlannerPageTitle('Settings')
    },
    {
      path: 'favorites/:recipeId',
      redirectTo: 'recipes/:recipeId'
    },
    {
      path: 'favorites',
      loadComponent: () =>
        import('./pages/recipes/recipe-library-page.component').then(
          (module) => module.RecipeLibraryPageComponent
        ),
      title: mealPlannerPageTitle('Favorites'),
      data: { recipeScope: 'favorites' }
    },
    {
      path: 'meals/:recipeId',
      redirectTo: 'recipes/:recipeId'
    }
  ];

  if (includeDesignSystem) {
    protectedChildren.push({
      path: 'design-system',
      loadComponent: () =>
        import('./pages/design-system/design-system-page.component').then(
          (module) => module.DesignSystemPageComponent
        ),
      title: mealPlannerPageTitle('Design system')
    });
  }

  return [
    {
      path: 'signin',
      component: AuthShellLayoutComponent,
      canActivate: [redirectAuthenticatedUserGuard],
      canActivateChild: [redirectAuthenticatedUserChildGuard],
      children: [
        {
          path: '',
          loadComponent: () =>
            import('./pages/auth/sign-in-page.component').then((module) => module.SignInPageComponent),
          title: mealPlannerPageTitle('Sign in'),
          pathMatch: 'full'
        }
      ]
    },
    {
      path: 'signup',
      component: AuthShellLayoutComponent,
      canActivate: [redirectAuthenticatedUserGuard],
      canActivateChild: [redirectAuthenticatedUserChildGuard],
      children: [
        {
          path: '',
          loadComponent: () =>
            import('./pages/auth/sign-up-page.component').then((module) => module.SignUpPageComponent),
          title: mealPlannerPageTitle('Create account'),
          pathMatch: 'full'
        }
      ]
    },
    {
      path: 'forgot-password',
      component: AuthShellLayoutComponent,
      canActivate: [redirectAuthenticatedUserGuard],
      canActivateChild: [redirectAuthenticatedUserChildGuard],
      children: [
        {
          path: '',
          loadComponent: () =>
            import('./pages/auth/password-recovery-page.component').then(
              (module) => module.PasswordRecoveryPageComponent
            ),
          title: mealPlannerPageTitle('Reset password'),
          data: { mode: 'request' },
          pathMatch: 'full'
        }
      ]
    },
    {
      path: 'auth/update-password',
      component: AuthShellLayoutComponent,
      children: [
        {
          path: '',
          loadComponent: () =>
            import('./pages/auth/password-recovery-page.component').then(
              (module) => module.PasswordRecoveryPageComponent
            ),
          title: mealPlannerPageTitle('Choose password'),
          data: { mode: 'update' },
          pathMatch: 'full'
        }
      ]
    },
    {
      path: '',
      component: AppShellLayoutComponent,
      canActivate: [requireAuthGuard],
      canActivateChild: [requireAuthChildGuard],
      children: protectedChildren
    },
    { path: '**', redirectTo: 'meal-plan' }
  ];
}
