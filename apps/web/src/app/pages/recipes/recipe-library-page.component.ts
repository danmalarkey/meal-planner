import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  RecipeRepositoryService,
  RecipeSummary
} from '../../core/recipes/recipe-repository.service';
import { RecipeCardComponent } from '../../features/recipes/recipe-card.component';
import {
  RecipeScope,
  RecipeScopeFilterComponent
} from '../../features/recipes/recipe-scope-filter.component';
import { UiAlertComponent } from '../../ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../ui/button/ui-button.component';
import { UiDrawerComponent } from '../../ui/drawer/ui-drawer.component';
import { UiEmptyStateComponent } from '../../ui/empty-state/ui-empty-state.component';
import { UiFilterSummaryComponent } from '../../ui/filter-summary/ui-filter-summary.component';
import { UiInputComponent } from '../../ui/input/ui-input.component';
import { UiRadioGroupComponent } from '../../ui/radio-group/ui-radio-group.component';
import { UiToastService } from '../../ui/toast/ui-toast.service';
import { UiFilterChip, UiRadioOption } from '../../ui/ui-types';

type RecipeTimeFilter = 'any' | 'up-to-30' | '31-to-45' | 'over-45';

@Component({
  selector: 'app-recipe-library-page',
  imports: [
    RecipeCardComponent,
    RecipeScopeFilterComponent,
    UiAlertComponent,
    UiButtonComponent,
    UiDrawerComponent,
    UiEmptyStateComponent,
    UiFilterSummaryComponent,
    UiInputComponent,
    UiRadioGroupComponent
  ],
  template: `
    <section class="page recipe-library-page">
      <header class="page-header">
        <h1>{{ pageTitle }}</h1>
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
          description="Recipes you add will appear here."
        ></ui-empty-state>
      } @else {
        <div class="recipe-library-toolbar">
          <app-recipe-scope-filter
            [value]="libraryView"
            (valueChange)="setLibraryView($event)"
          ></app-recipe-scope-filter>
          <div class="recipe-library-controls">
            <ui-input
              label="Search recipes"
              [hideLabel]="true"
              type="search"
              placeholder="Search recipes"
              iconLeading="search"
              [clearable]="true"
              [value]="query()"
              (valueChange)="query.set($event)"
            ></ui-input>
            <ui-button
              variant="secondary"
              iconLeading="filter"
              ariaHasPopup="dialog"
              [ariaExpanded]="filtersOpen()"
              ariaControls="recipe-filters"
              (clicked)="openFilters()"
            >{{ filterButtonLabel() }}</ui-button>
          </div>
        </div>

        @if (appliedFilterChips().length > 0) {
          <ui-filter-summary
            [chips]="appliedFilterChips()"
            (chipRemoved)="removeFilter($event)"
          ></ui-filter-summary>
        }

        <div class="recipe-grid">
          @for (recipe of filteredRecipes(); track recipe.id) {
            <app-recipe-card
              [recipe]="recipe"
              [showFavoriteToggle]="true"
              [detailQueryParams]="recipeDetailQueryParams"
              [favoritePending]="favoritePendingIds().has(recipe.id)"
              (favoriteChange)="setFavorite(recipe, $event)"
            ></app-recipe-card>
          } @empty {
            @if (showFavoritesEmptyState()) {
              <ui-empty-state
                icon="star"
                title="No favorites yet"
                description="Tap the star on a recipe to add it to your favorites."
                [primaryCta]="{ label: 'Show all recipes' }"
                (primaryClicked)="setLibraryView('all')"
              ></ui-empty-state>
            } @else {
              <ui-empty-state
                icon="search"
                title="No matching recipes"
                description="Try another search or clear your filters."
                [primaryCta]="{ label: 'Clear filters' }"
                (primaryClicked)="clearAllFilters()"
              ></ui-empty-state>
            }
          }
        </div>
      }
    </section>

    <ui-drawer
      [open]="filtersOpen()"
      title="Filter recipes"
      size="sm"
      (openChange)="filtersOpen.set($event)"
    >
      <div id="recipe-filters" class="ui-filter-stack">
        <section class="ui-filter-section">
          <ui-radio-group
            label="Cooking time"
            [options]="timeFilterOptions"
            [value]="draftTimeFilter()"
            (valueChange)="draftTimeFilter.set(asTimeFilter($event))"
          ></ui-radio-group>
        </section>
        <section class="ui-filter-section">
          <ui-radio-group
            label="Servings"
            [options]="servingFilterOptions()"
            [value]="draftServingsFilter()"
            (valueChange)="draftServingsFilter.set($event)"
          ></ui-radio-group>
        </section>
      </div>
      <div drawer-footer class="ui-drawer-actions ui-drawer-actions--split">
        <ui-button variant="ghost" (clicked)="clearDraftFilters()">Clear</ui-button>
        <ui-button variant="primary" (clicked)="applyFilters()">
          Show {{ draftResultCount() }} recipes
        </ui-button>
      </div>
    </ui-drawer>
  `,
  styleUrl: './recipe-library-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeLibraryPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repository = inject(RecipeRepositoryService);
  private readonly toast = inject(UiToastService);

  protected readonly recipes = signal<RecipeSummary[]>([]);
  protected readonly libraryView: RecipeScope =
    this.route.snapshot.data['recipeScope'] === 'favorites' ? 'favorites' : 'all';
  protected readonly pageTitle = this.libraryView === 'favorites' ? 'Favorites' : 'Recipes';
  protected readonly recipeDetailQueryParams =
    this.libraryView === 'favorites' ? { returnTo: '/favorites' } : null;
  protected readonly query = signal('');
  protected readonly filtersOpen = signal(false);
  protected readonly timeFilter = signal<RecipeTimeFilter>('any');
  protected readonly servingsFilter = signal('any');
  protected readonly draftTimeFilter = signal<RecipeTimeFilter>('any');
  protected readonly draftServingsFilter = signal('any');
  protected readonly favoritePendingIds = signal<ReadonlySet<string>>(new Set());
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly loadingCards = [1, 2, 3, 4, 5, 6];
  protected readonly timeFilterOptions: UiRadioOption[] = [
    { value: 'any', label: 'Any time' },
    { value: 'up-to-30', label: '30 minutes or less' },
    { value: '31-to-45', label: '31–45 minutes' },
    { value: 'over-45', label: 'More than 45 minutes' }
  ];

  protected readonly servingFilterOptions = computed<UiRadioOption[]>(() => [
    { value: 'any', label: 'Any servings' },
    ...[...new Set(this.recipes().map((recipe) => recipe.baseServings))]
      .sort((left, right) => left - right)
      .map((servings) => ({ value: String(servings), label: `${servings} servings` }))
  ]);
  protected readonly filteredRecipes = computed(() =>
    this.filterRecipes(this.timeFilter(), this.servingsFilter())
  );
  protected readonly draftResultCount = computed(
    () => this.filterRecipes(this.draftTimeFilter(), this.draftServingsFilter()).length
  );
  protected readonly activeFilterCount = computed(
    () => Number(this.timeFilter() !== 'any') + Number(this.servingsFilter() !== 'any')
  );
  protected readonly filterButtonLabel = computed(() => {
    const count = this.activeFilterCount();
    return count ? `Filter (${count})` : 'Filter';
  });
  protected readonly appliedFilterChips = computed<UiFilterChip[]>(() => {
    const chips: UiFilterChip[] = [];
    if (this.timeFilter() !== 'any') {
      chips.push({
        id: 'time',
        text: this.timeFilterOptions.find((option) => option.value === this.timeFilter())?.label ?? '',
        removable: true,
        removeAriaLabel: 'Remove cooking time filter'
      });
    }
    if (this.servingsFilter() !== 'any') {
      chips.push({
        id: 'servings',
        text: `${this.servingsFilter()} servings`,
        removable: true,
        removeAriaLabel: 'Remove servings filter'
      });
    }
    return chips;
  });
  protected readonly showFavoritesEmptyState = computed(
    () =>
      this.libraryView === 'favorites' &&
      !this.query().trim() &&
      this.activeFilterCount() === 0
  );

  ngOnInit(): void {
    void this.loadRecipes();
  }

  protected openFilters(): void {
    this.draftTimeFilter.set(this.timeFilter());
    this.draftServingsFilter.set(this.servingsFilter());
    this.filtersOpen.set(true);
  }

  protected setLibraryView(scope: RecipeScope): void {
    if (scope === this.libraryView) return;
    void this.router.navigateByUrl(scope === 'favorites' ? '/favorites' : '/recipes');
  }

  protected applyFilters(): void {
    this.timeFilter.set(this.draftTimeFilter());
    this.servingsFilter.set(this.draftServingsFilter());
    this.filtersOpen.set(false);
  }

  protected clearDraftFilters(): void {
    this.draftTimeFilter.set('any');
    this.draftServingsFilter.set('any');
  }

  protected clearAllFilters(): void {
    this.query.set('');
    this.timeFilter.set('any');
    this.servingsFilter.set('any');
  }

  protected async setFavorite(recipe: RecipeSummary, favorite: boolean): Promise<void> {
    this.favoritePendingIds.update((current) => new Set(current).add(recipe.id));
    try {
      await this.repository.setFavorite(recipe.id, favorite);
      this.recipes.update((recipes) =>
        recipes.map((item) => (item.id === recipe.id ? { ...item, isFavorite: favorite } : item))
      );
    } catch {
      this.toast.error('Could not update this favorite. Try again.');
    } finally {
      this.favoritePendingIds.update((current) => {
        const next = new Set(current);
        next.delete(recipe.id);
        return next;
      });
    }
  }

  protected removeFilter(filter: UiFilterChip): void {
    if (filter.id === 'time') this.timeFilter.set('any');
    if (filter.id === 'servings') this.servingsFilter.set('any');
  }

  protected asTimeFilter(value: string): RecipeTimeFilter {
    return value as RecipeTimeFilter;
  }

  private async loadRecipes(): Promise<void> {
    try {
      this.recipes.set(await this.repository.listRecipes());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Please refresh and try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private filterRecipes(timeFilter: RecipeTimeFilter, servingsFilter: string): RecipeSummary[] {
    const query = this.query().trim().toLocaleLowerCase();
    return this.recipes().filter((recipe) => {
      const matchesQuery = !query || recipe.title.toLocaleLowerCase().includes(query);
      const matchesView = this.libraryView === 'all' || recipe.isFavorite;
      const matchesServings =
        servingsFilter === 'any' || recipe.baseServings === Number(servingsFilter);
      return (
        matchesView &&
        matchesQuery &&
        matchesServings &&
        this.matchesTime(recipe.minutes, timeFilter)
      );
    });
  }

  private matchesTime(minutes: number | null, filter: RecipeTimeFilter): boolean {
    if (filter === 'any') return true;
    if (minutes === null) return false;
    if (filter === 'up-to-30') return minutes <= 30;
    if (filter === '31-to-45') return minutes > 30 && minutes <= 45;
    return minutes > 45;
  }
}
