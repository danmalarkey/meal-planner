import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  RecipeRepositoryService,
  RecipeSummary
} from '../../core/recipes/recipe-repository.service';
import { RecipeCardComponent } from '../../features/recipes/recipe-card.component';
import { UiAlertComponent } from '../../ui/alert/ui-alert.component';
import { UiEmptyStateComponent } from '../../ui/empty-state/ui-empty-state.component';

@Component({
  selector: 'app-recipe-library-page',
  imports: [RecipeCardComponent, UiAlertComponent, UiEmptyStateComponent],
  template: `
    <section class="page recipe-library-page">
      <header class="page-header">
        <h1>Favorites</h1>
      </header>

      @if (error()) {
        <ui-alert
          variant="danger"
          title="We couldn't load your favorites"
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
          title="No favorites yet"
          description="Imported favorite meals will appear here."
        ></ui-empty-state>
      } @else {
        <div class="recipe-grid">
          @for (recipe of recipes(); track recipe.id) {
            <app-recipe-card [recipe]="recipe"></app-recipe-card>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeLibraryPageComponent implements OnInit {
  private readonly repository = inject(RecipeRepositoryService);

  protected readonly recipes = signal<RecipeSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly loadingCards = [1, 2, 3, 4, 5, 6];

  ngOnInit(): void {
    void this.loadRecipes();
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
}
