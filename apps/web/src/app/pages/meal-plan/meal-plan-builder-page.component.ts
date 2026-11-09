import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MealPlanDraftService } from '../../core/meal-plans/meal-plan-draft.service';
import { MealPlanRepositoryService } from '../../core/meal-plans/meal-plan-repository.service';
import {
  fromLocalDateKey,
  isPastMealPlanWeek
} from '../../core/meal-plans/meal-plan-week';
import {
  RecipeRepositoryService,
  RecipeSummary
} from '../../core/recipes/recipe-repository.service';
import { RecipeCardComponent } from '../../features/recipes/recipe-card.component';
import {
  RecipeScope,
  RecipeScopeFilterComponent
} from '../../features/recipes/recipe-scope-filter.component';
import { MealThumbnailStackComponent } from '../../features/meal-plans/meal-thumbnail-stack.component';
import { UiAlertComponent } from '../../ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../ui/button/ui-button.component';
import { UiDrawerComponent } from '../../ui/drawer/ui-drawer.component';
import { UiEmptyStateComponent } from '../../ui/empty-state/ui-empty-state.component';
import { UiIconButtonComponent } from '../../ui/icon-button/ui-icon-button.component';
import { UiInputComponent } from '../../ui/input/ui-input.component';

@Component({
  selector: 'app-meal-plan-builder-page',
  imports: [
    RecipeCardComponent,
    RecipeScopeFilterComponent,
    MealThumbnailStackComponent,
    UiAlertComponent,
    UiButtonComponent,
    UiDrawerComponent,
    UiEmptyStateComponent,
    UiIconButtonComponent,
    UiInputComponent
  ],
  template: `
    <section class="meal-plan-builder-page">
      <header class="page-header meal-plan-builder-header">
        <h1>Create meal plan</h1>
        <ui-button variant="ghost" size="sm" (clicked)="cancel()">Cancel</ui-button>
      </header>

      @if (error()) {
        <ui-alert
          variant="danger"
          title="We couldn't load your recipes"
          [description]="error()!"
        ></ui-alert>
      } @else if (loading()) {
        <div class="recipe-grid" aria-label="Loading recipes" aria-busy="true">
          @for (item of loadingCards; track item) {
            <div class="recipe-card-skeleton ui-loading-shell-card">
              <span class="ui-skeleton-block recipe-card-skeleton-image"></span>
              <span class="ui-skeleton-block recipe-card-skeleton-title"></span>
            </div>
          }
        </div>
      } @else if (recipes().length === 0) {
        <ui-empty-state
          icon="image-list"
          title="No recipes yet"
          description="Add recipes before building a plan."
        ></ui-empty-state>
      } @else {
        <div class="meal-plan-builder-filters">
          <app-recipe-scope-filter
            ariaLabel="Recipes available for this meal plan"
            [value]="recipeScope()"
            (valueChange)="recipeScope.set($event)"
          ></app-recipe-scope-filter>
          <ui-input
            label="Find meals to add"
            type="search"
            placeholder="Search recipes"
            iconLeading="search"
            [clearable]="true"
            [value]="query()"
            (valueChange)="query.set($event)"
          ></ui-input>
        </div>

        <div class="recipe-grid" aria-label="Meals available to add to this meal plan">
          @for (recipe of filteredRecipes(); track recipe.id) {
            <app-recipe-card
              [recipe]="recipe"
              [selectable]="true"
              [selected]="selectedRecipeIds().has(recipe.id)"
              selectionIdleIcon="add"
              [detailLink]="['/meals', recipe.id]"
              [detailQueryParams]="recipeDetailQuery()"
              (selectionChange)="setSelected(recipe.id, $event)"
            ></app-recipe-card>
          } @empty {
            <ui-empty-state
              icon="search"
              title="No matching recipes"
              description="Try another meal name."
            ></ui-empty-state>
          }
        </div>
      }
    </section>

    @if (!loading() && !error() && recipes().length && selectedRecipeIds().size > 0) {
      <div class="meal-plan-builder-actions" aria-live="polite">
        <button
          type="button"
          class="meal-plan-builder-selection"
          [disabled]="selectedRecipeIds().size === 0"
          aria-haspopup="dialog"
          [attr.aria-expanded]="reviewOpen()"
          aria-controls="meal-plan-review"
          [attr.aria-label]="selectedRecipeSummary()"
          (click)="reviewOpen.set(true)"
        >
          <app-meal-thumbnail-stack [recipes]="selectedRecipes()"></app-meal-thumbnail-stack>
        </button>
        <ui-button
          variant="primary"
          [disabled]="selectedRecipeIds().size === 0"
          [loading]="saving()"
          loadingLabel="Saving meal plan"
          (clicked)="save()"
        >Build</ui-button>
      </div>
    }

    <ui-drawer
      [open]="reviewOpen()"
      title="Review your plan"
      size="sm"
      bodyPadding="flush"
      (openChange)="reviewOpen.set($event)"
    >
      <div id="meal-plan-review" class="meal-plan-review-list">
        @for (recipe of selectedRecipes(); track recipe.id) {
          <article class="meal-plan-review-item">
            <div class="meal-plan-review-image" aria-hidden="true">
              @if (recipe.imageUrl) {
                <img [src]="recipe.imageUrl" alt="" />
              } @else {
                <span>{{ recipe.title.slice(0, 1) }}</span>
              }
            </div>
            <div class="meal-plan-review-copy">
              <h3>{{ recipe.title }}</h3>
              <p>4 servings</p>
            </div>
            <ui-icon-button
              variant="destructive"
              size="sm"
              icon="close"
              [ariaLabel]="'Remove ' + recipe.title + ' from this meal plan'"
              (clicked)="removeFromReview(recipe.id)"
            ></ui-icon-button>
          </article>
        }
      </div>
      <div drawer-footer class="meal-plan-review-footer">
        <ui-button
          variant="primary"
          size="lg"
          [fullWidth]="true"
          [disabled]="selectedRecipeIds().size === 0"
          [loading]="saving()"
          loadingLabel="Saving meal plan"
          (clicked)="save()"
        >Build this meal plan</ui-button>
      </div>
    </ui-drawer>
  `,
  styleUrl: './meal-plan-builder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MealPlanBuilderPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mealPlans = inject(MealPlanRepositoryService);
  private readonly draft = inject(MealPlanDraftService);
  private readonly recipeRepository = inject(RecipeRepositoryService);
  private readonly startsOn = this.route.snapshot.paramMap.get('startsOn') ?? '';
  private readonly targetWeek = fromLocalDateKey(this.startsOn);

  protected readonly recipes = signal<RecipeSummary[]>([]);
  protected readonly selectedRecipeIds = signal<ReadonlySet<string>>(
    this.draft.selectedRecipeIds(this.startsOn)
  );
  protected readonly query = signal('');
  protected readonly recipeScope = signal<RecipeScope>('all');
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly reviewOpen = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loadingCards = [1, 2, 3, 4, 5, 6];

  protected readonly filteredRecipes = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    return this.recipes().filter(
      (recipe) =>
        (this.recipeScope() === 'all' || recipe.isFavorite) &&
        (!query || recipe.title.toLocaleLowerCase().includes(query))
    );
  });
  protected readonly selectedRecipes = computed(() => {
    const recipeById = new Map(this.recipes().map((recipe) => [recipe.id, recipe] as const));
    return [...this.selectedRecipeIds()].flatMap((recipeId) => {
      const recipe = recipeById.get(recipeId);
      return recipe ? [recipe] : [];
    });
  });
  protected readonly selectedRecipeSummary = computed(
    () => `Selected meals: ${this.selectedRecipes().map((recipe) => recipe.title).join(', ')}`
  );
  ngOnInit(): void {
    if (!this.targetWeek || isPastMealPlanWeek(this.targetWeek)) {
      void this.cancel();
      return;
    }
    void this.load();
  }

  protected setSelected(recipeId: string, selected: boolean): void {
    this.draft.setSelected(this.startsOn, recipeId, selected);
    this.selectedRecipeIds.update((current) => {
      const next = new Set(current);
      if (selected) next.add(recipeId);
      else next.delete(recipeId);
      return next;
    });
  }

  protected removeFromReview(recipeId: string): void {
    this.setSelected(recipeId, false);
    if (this.selectedRecipeIds().size === 0) this.reviewOpen.set(false);
  }

  protected recipeDetailQuery(): Record<string, string> {
    return {
      returnTo: `/meal-plan/build/${this.startsOn}`,
      planWeek: this.startsOn
    };
  }

  protected async save(): Promise<void> {
    if (this.selectedRecipeIds().size === 0) return;

    this.saving.set(true);
    this.error.set(null);
    try {
      await this.mealPlans.createPlan(this.startsOn, [...this.selectedRecipeIds()]);
      this.draft.clear(this.startsOn);
      await this.returnToPlan();
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected cancel(): void {
    this.draft.clear(this.startsOn);
    void this.returnToPlan();
  }

  private async load(): Promise<void> {
    try {
      const [recipes, plan] = await Promise.all([
        this.recipeRepository.listRecipes(),
        this.mealPlans.getWeek(this.startsOn)
      ]);
      if (plan.meals.length > 0) {
        this.draft.clear(this.startsOn);
        await this.returnToPlan();
        return;
      }
      this.recipes.set(recipes);
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  private returnToPlan(): Promise<boolean> {
    return this.router.navigate(['/meal-plan'], {
      queryParams: this.targetWeek ? { week: this.startsOn } : undefined
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Please refresh and try again.';
  }
}
