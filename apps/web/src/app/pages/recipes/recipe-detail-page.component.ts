import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MealPlanDraftService } from '../../core/meal-plans/meal-plan-draft.service';
import { MealPlanRepositoryService } from '../../core/meal-plans/meal-plan-repository.service';
import { fromLocalDateKey, isPastMealPlanWeek } from '../../core/meal-plans/meal-plan-week';
import {
  RecipeDetail,
  RecipeIngredient,
  RecipeRepositoryService
} from '../../core/recipes/recipe-repository.service';
import {
  formatRecipeQuantity,
  scaleRecipeIngredientLine,
  scaleRecipeQuantity,
  SupportedRecipeServings
} from '../../core/recipes/recipe-scaling';
import { RecipeFavoriteButtonComponent } from '../../features/recipes/recipe-favorite-button.component';
import { UiAlertComponent } from '../../ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../ui/button/ui-button.component';
import { UiIconComponent } from '../../ui/icon/ui-icon.component';
import { UiPopoverComponent } from '../../ui/popover/ui-popover.component';
import { UiTabsComponent } from '../../ui/tabs/ui-tabs.component';
import { UiToastService } from '../../ui/toast/ui-toast.service';

@Component({
  selector: 'app-recipe-detail-page',
  imports: [
    RecipeFavoriteButtonComponent,
    RouterLink,
    UiAlertComponent,
    UiButtonComponent,
    UiIconComponent,
    UiPopoverComponent,
    UiTabsComponent
  ],
  template: `
    <section
      class="page recipe-detail-page"
      [class.recipe-detail-page--edge-to-edge]="loading() || !!recipe()"
    >
      <a class="recipe-back-link" [routerLink]="backLink" [queryParams]="backQueryParams">
        <span class="recipe-back-icon" aria-hidden="true">←</span>
        <span class="recipe-back-label">{{ backLabel }}</span>
      </a>

      @if (error()) {
        <ui-alert
          variant="danger"
          title="We couldn't load this recipe"
          [description]="error()!"
        ></ui-alert>
      } @else if (loading()) {
        <div class="recipe-detail-loading" aria-busy="true">
          <span class="ui-skeleton-block recipe-detail-loading-image"></span>
          <div class="recipe-detail-loading-heading">
            <span class="ui-skeleton-block recipe-detail-loading-eyebrow"></span>
            <span class="ui-skeleton-block recipe-detail-loading-title"></span>
            <span class="ui-skeleton-block recipe-detail-loading-copy"></span>
            <span class="ui-skeleton-block recipe-detail-loading-control"></span>
          </div>
        </div>
      } @else if (recipe(); as currentRecipe) {
        <header class="recipe-detail-hero">
          <div class="recipe-detail-image">
            @if (currentRecipe.imageUrl) {
              <img [src]="currentRecipe.imageUrl" [alt]="currentRecipe.title" />
            } @else {
              <div class="recipe-detail-image-placeholder" aria-hidden="true">Recipe</div>
            }
            <app-recipe-favorite-button
              class="recipe-detail-favorite-control"
              [recipeTitle]="currentRecipe.title"
              [favorite]="currentRecipe.isFavorite"
              [pending]="favoritePending()"
              (favoriteChange)="setFavorite($event)"
            ></app-recipe-favorite-button>
          </div>
          <div class="recipe-detail-heading">
            <h1>{{ currentRecipe.title }}</h1>
            <div class="recipe-detail-meta">
              @if (currentRecipe.minutes) {
                <span>{{ currentRecipe.minutes }} minutes</span>
                <span aria-hidden="true">•</span>
              }
              <ui-popover
                placement="bottom-start"
                triggerLabel="Choose recipe servings"
                panelLabel="Recipe servings"
              >
                <span popover-trigger class="recipe-serving-trigger">
                  {{ selectedServings() }} servings
                  <ui-icon class="ui-popover-caret" name="chevron-down" size="sm"></ui-icon>
                </span>
                <div popover-panel class="ui-popover-menu recipe-serving-menu">
                  @for (servings of servingOptions; track servings) {
                    <button
                      type="button"
                      class="ui-popover-action"
                      [class.ui-popover-action--active]="selectedServings() === servings"
                      [attr.aria-current]="selectedServings() === servings ? 'true' : null"
                      (click)="setServings(servings.toString())"
                    >{{ servings }} servings</button>
                  }
                </div>
              </ui-popover>
            </div>
            @if (planningWeekKey) {
              <div class="recipe-detail-actions">
                <ui-button
                  variant="primary"
                  [disabled]="addedToPlan()"
                  (clicked)="addToPlan()"
                >{{ addedToPlan() ? 'Added to plan' : 'Add to plan' }}</ui-button>
              </div>
            } @else {
              <div class="recipe-detail-actions">
                @if (plannedMealEntryId()) {
                  <ui-button
                    variant="secondary"
                    [ariaPressed]="cooked()"
                    [loading]="updatingCooked()"
                    loadingLabel="Saving"
                    (clicked)="toggleCooked()"
                  >{{ cooked() ? 'Cooked' : 'Cooked?' }}</ui-button>
                }
                <ui-button variant="primary" (clicked)="startCooking()">Start cooking</ui-button>
              </div>
            }
          </div>
        </header>

        @if (cookedError()) {
          <ui-alert
            variant="danger"
            title="We couldn't update this meal"
            [description]="cookedError()!"
          ></ui-alert>
        }

        <div #recipeTabs class="recipe-mobile-tabs">
          <ui-tabs
            idPrefix="recipe-content"
            ariaLabel="Recipe content"
            variant="underline"
            [items]="contentTabs"
            [selected]="activeContent()"
            (selectedChange)="setActiveContent($event)"
          ></ui-tabs>
        </div>

        <div class="recipe-detail-grid">
          <section
            id="recipe-content-panel-ingredients"
            class="recipe-panel recipe-ingredients-panel"
            [class.recipe-panel--active]="activeContent() === 'ingredients'"
          >
            <div class="recipe-section-heading">
              <h2>Ingredients</h2>
            </div>
            <ul class="recipe-ingredient-list">
              @for (ingredient of currentRecipe.ingredients; track ingredient.position) {
                <li>
                  <span class="recipe-ingredient-name">{{ ingredient.ingredientName }}</span>
                  @if (ingredientAmount(ingredient, currentRecipe); as amount) {
                    <span class="recipe-ingredient-amount">{{ amount }}</span>
                  }
                </li>
              }
            </ul>
          </section>

          <aside
            id="recipe-content-panel-cookware"
            class="recipe-panel recipe-cookware-panel"
            [class.recipe-panel--active]="activeContent() === 'cookware'"
          >
            <h2>Cookware</h2>
            <ul class="recipe-cookware-list">
              @for (item of currentRecipe.cookware; track item.position) {
                <li>{{ item.name }}</li>
              }
            </ul>
          </aside>
        </div>

        <section
          #directions
          id="recipe-content-panel-instructions"
          class="recipe-panel recipe-directions-panel"
          [class.recipe-panel--active]="activeContent() === 'instructions'"
        >
          <h2>Directions</h2>
          <ol class="recipe-step-list">
            @for (step of currentRecipe.steps; track step.position) {
              <li>
                <div class="recipe-step-copy">
                  <p>{{ step.instruction }}</p>
                  @if (step.ingredientLines.length) {
                    <ul class="recipe-step-ingredients">
                      @for (line of step.ingredientLines; track line) {
                        <li>{{ stepIngredientText(line, currentRecipe) }}</li>
                      }
                    </ul>
                  }
                </div>
              </li>
            }
          </ol>
        </section>

        @if (planningWeekKey) {
          <div class="recipe-mobile-action">
            <ui-button
              variant="primary-elevated"
              size="lg"
              [fullWidth]="true"
              [disabled]="addedToPlan()"
              (clicked)="addToPlan()"
            >{{ addedToPlan() ? 'Added to plan' : 'Add to plan' }}</ui-button>
          </div>
        } @else {
          <div
            class="recipe-mobile-action"
            [class.recipe-mobile-action--split]="!!plannedMealEntryId()"
          >
            @if (plannedMealEntryId()) {
              <ui-button
                variant="secondary"
                size="lg"
                [fullWidth]="true"
                [ariaPressed]="cooked()"
                [loading]="updatingCooked()"
                loadingLabel="Saving"
                (clicked)="toggleCooked()"
              >{{ cooked() ? 'Cooked' : 'Cooked?' }}</ui-button>
            }
            <ui-button
              variant="primary-elevated"
              size="lg"
              [fullWidth]="true"
              (clicked)="startCooking()"
            >
              Start cooking
            </ui-button>
          </div>
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly repository = inject(RecipeRepositoryService);
  private readonly mealPlans = inject(MealPlanRepositoryService);
  private readonly draft = inject(MealPlanDraftService);
  private readonly toast = inject(UiToastService);
  private readonly requestedPlanWeek = this.route.snapshot.queryParamMap.get('planWeek');
  private readonly requestedReturnTo = this.route.snapshot.queryParamMap.get('returnTo');
  private readonly requestedMealPlanEntry = this.route.snapshot.queryParamMap.get('mealPlanEntry');
  private readonly parsedPlanWeek = fromLocalDateKey(this.requestedPlanWeek);

  protected readonly planningWeekKey =
    this.parsedPlanWeek &&
    !isPastMealPlanWeek(this.parsedPlanWeek) &&
    this.requestedReturnTo === `/meal-plan/build/${this.requestedPlanWeek}`
      ? this.requestedPlanWeek
      : null;
  private readonly hasPlannedMealContext = Boolean(
    this.parsedPlanWeek &&
      this.requestedReturnTo === '/meal-plan' &&
      this.requestedMealPlanEntry &&
      /^[0-9a-f-]{36}$/i.test(this.requestedMealPlanEntry)
  );
  protected readonly backLink = this.planningWeekKey
    ? `/meal-plan/build/${this.planningWeekKey}`
    : this.hasPlannedMealContext
      ? '/meal-plan'
      : this.requestedReturnTo === '/favorites'
        ? '/favorites'
        : '/recipes';
  protected readonly backQueryParams = this.hasPlannedMealContext
    ? { week: this.requestedPlanWeek }
    : null;
  protected readonly backLabel = this.planningWeekKey || this.hasPlannedMealContext
    ? 'Back to meal plan'
    : this.requestedReturnTo === '/favorites'
      ? 'Favorites'
      : 'All recipes';

  protected readonly recipe = signal<RecipeDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cookedError = signal<string | null>(null);
  protected readonly cooked = signal(false);
  protected readonly updatingCooked = signal(false);
  protected readonly favoritePending = signal(false);
  protected readonly plannedMealEntryId = signal<string | null>(null);
  protected readonly selectedServings = signal<SupportedRecipeServings>(4);
  protected readonly activeContent = signal<'cookware' | 'ingredients' | 'instructions'>('ingredients');
  protected readonly addedToPlan = signal(
    this.route.snapshot.queryParamMap.get('planned') === '1' ||
      Boolean(
        this.planningWeekKey &&
          this.draft.isSelected(
            this.planningWeekKey,
            this.route.snapshot.paramMap.get('recipeId') ?? ''
          )
      )
  );
  private readonly recipeTabs = viewChild<ElementRef<HTMLElement>>('recipeTabs');
  private readonly directions = viewChild<ElementRef<HTMLElement>>('directions');
  protected readonly servingOptions: SupportedRecipeServings[] = [2, 4, 6];
  protected readonly contentTabs = [
    { label: 'Cookware', value: 'cookware' },
    { label: 'Ingredients', value: 'ingredients' },
    { label: 'Instructions', value: 'instructions' }
  ];

  ngOnInit(): void {
    void this.loadRecipe();
  }

  protected setServings(value: string): void {
    const servings = Number(value);
    if (servings === 2 || servings === 4 || servings === 6) {
      this.selectedServings.set(servings);
    }
  }

  protected setActiveContent(value: string): void {
    if (value === 'cookware' || value === 'ingredients' || value === 'instructions') {
      this.activeContent.set(value);
    }
  }

  protected startCooking(): void {
    this.activeContent.set('instructions');
    queueMicrotask(() =>
      (this.directions() ?? this.recipeTabs())?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    );
  }

  protected async toggleCooked(): Promise<void> {
    const entryId = this.plannedMealEntryId();
    if (!entryId || this.updatingCooked()) return;

    const nextCooked = !this.cooked();
    this.updatingCooked.set(true);
    this.cookedError.set(null);
    try {
      await this.mealPlans.setCooked(entryId, nextCooked);
      this.cooked.set(nextCooked);
    } catch (error) {
      this.cookedError.set(
        error instanceof Error ? error.message : 'Please try updating the cooked status again.'
      );
    } finally {
      this.updatingCooked.set(false);
    }
  }

  protected async setFavorite(favorite: boolean): Promise<void> {
    const currentRecipe = this.recipe();
    if (!currentRecipe || this.favoritePending()) return;

    this.favoritePending.set(true);
    try {
      await this.repository.setFavorite(currentRecipe.id, favorite);
      this.recipe.update((recipe) => (recipe ? { ...recipe, isFavorite: favorite } : recipe));
    } catch {
      this.toast.error('Could not update this favorite. Try again.');
    } finally {
      this.favoritePending.set(false);
    }
  }

  protected addToPlan(): void {
    const recipeId = this.recipe()?.id;
    if (!this.planningWeekKey || !recipeId || this.addedToPlan()) return;
    this.draft.setSelected(this.planningWeekKey, recipeId, true);
    this.addedToPlan.set(true);
  }

  protected ingredientAmount(ingredient: RecipeIngredient, recipe: RecipeDetail): string | null {
    const scaled = scaleRecipeQuantity(
      ingredient.normalizedQuantity,
      recipe.baseServings,
      this.selectedServings()
    );
    const quantity = formatRecipeQuantity(scaled);
    if (!quantity) return null;

    const unit = this.displayUnit(ingredient.normalizedUnit, scaled);
    return [quantity, unit].filter(Boolean).join(' ');
  }

  protected ingredientText(ingredient: RecipeIngredient, recipe: RecipeDetail): string {
    const amount = this.ingredientAmount(ingredient, recipe);
    return amount
      ? `${amount} ${ingredient.ingredientName}`
      : ingredient.displayText;
  }

  protected stepIngredientText(line: string, recipe: RecipeDetail): string {
    const recipeIngredient = recipe.ingredients.find(
      (ingredient) => ingredient.displayText === line
    );
    if (recipeIngredient) return this.ingredientText(recipeIngredient, recipe);
    return scaleRecipeIngredientLine(line, recipe.baseServings, this.selectedServings());
  }

  private displayUnit(unit: string | null, quantity: number | null): string | null {
    if (!unit || quantity === null) return unit;
    if (Math.abs(quantity - 1) >= 0.001) return unit;

    const singularUnits: Record<string, string> = {
      cups: 'cup',
      tablespoons: 'tablespoon',
      teaspoons: 'teaspoon',
      ounces: 'ounce',
      pounds: 'pound',
      cloves: 'clove',
      cans: 'can',
      sticks: 'stick',
      pieces: 'piece'
    };
    return singularUnits[unit.toLowerCase()] ?? unit;
  }

  private async loadRecipe(): Promise<void> {
    const recipeId = this.route.snapshot.paramMap.get('recipeId');
    if (!recipeId) {
      this.error.set('This recipe link is incomplete.');
      this.loading.set(false);
      return;
    }

    try {
      const [recipe, plan] = await Promise.all([
        this.repository.getRecipe(recipeId),
        this.hasPlannedMealContext && this.requestedPlanWeek
          ? this.mealPlans.getWeek(this.requestedPlanWeek)
          : Promise.resolve(null)
      ]);
      this.recipe.set(recipe);
      if (recipe.baseServings === 2 || recipe.baseServings === 4 || recipe.baseServings === 6) {
        this.selectedServings.set(recipe.baseServings);
      }
      if (plan && this.requestedMealPlanEntry) {
        const plannedMeal = plan.meals.find(
          (meal) => meal.entryId === this.requestedMealPlanEntry && meal.recipe.id === recipe.id
        );
        if (!plannedMeal) throw new Error('This meal is no longer part of that meal plan.');
        this.plannedMealEntryId.set(plannedMeal.entryId);
        this.cooked.set(Boolean(plannedMeal.cookedAt));
        this.selectedServings.set(plannedMeal.plannedServings);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Please return to recipes and try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
