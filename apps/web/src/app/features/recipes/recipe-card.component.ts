import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { RecipeSummary } from '../../core/recipes/recipe-repository.service';
import { UiIconComponent } from '../../ui/icon/ui-icon.component';
import { UiIconName } from '../../ui/ui-types';
import { RecipeFavoriteButtonComponent } from './recipe-favorite-button.component';

@Component({
  selector: 'app-recipe-card',
  imports: [RecipeFavoriteButtonComponent, RouterLink, UiIconComponent],
  template: `
    <article
      class="recipe-card"
      [class.recipe-card--selectable]="selectable()"
      [class.recipe-card--selected]="selected()"
      [class.recipe-card--dimmed]="dimmed()"
    >
      <a
        class="recipe-card-detail-link"
        [routerLink]="detailLink() ?? ['/recipes', recipe().id]"
        [queryParams]="detailQueryParams()"
        [attr.aria-label]="'View ' + recipe().title"
      >
        <div class="recipe-card-media">
          @if (recipe().imageUrl) {
            <img [src]="recipe().imageUrl" [alt]="recipe().title" loading="lazy" />
          } @else {
            <div class="recipe-card-placeholder" aria-hidden="true">Recipe</div>
          }
        </div>
      </a>
      <div class="recipe-card-body">
        <h2>{{ recipe().title }}</h2>
        @if (showFavoriteToggle()) {
          <app-recipe-favorite-button
            [recipeTitle]="recipe().title"
            [favorite]="recipe().isFavorite"
            [pending]="favoritePending()"
            (favoriteChange)="favoriteChange.emit($event)"
          ></app-recipe-favorite-button>
        }
      </div>

      @if (selectable()) {
        <button
          type="button"
          class="recipe-card-selection"
          [class.recipe-card-selection--idle-icon]="!selected() && !!selectionIdleIcon()"
          [class.recipe-card-selection--idle-check]="!selected() && selectionIdleIcon() === 'check'"
          [disabled]="selectionDisabled()"
          [attr.aria-label]="selectionLabel()"
          [attr.aria-pressed]="selected()"
          (click)="selectionChange.emit(!selected())"
        >
          @if (selected()) {
            <ui-icon name="check" size="sm"></ui-icon>
          } @else if (selectionIdleIcon()) {
            <ui-icon [name]="selectionIdleIcon()!" size="sm"></ui-icon>
          }
        </button>
      }
    </article>
  `,
  styleUrl: './recipe-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeCardComponent {
  readonly recipe = input.required<RecipeSummary>();
  readonly selectable = input(false);
  readonly selected = input(false);
  readonly dimmed = input(false);
  readonly selectionDisabled = input(false);
  readonly selectionIdleIcon = input<UiIconName | null>(null);
  readonly selectionAriaLabel = input<string | null>(null);
  readonly detailLink = input<string | readonly (string | number)[] | null>(null);
  readonly detailQueryParams = input<Params | null>(null);
  readonly showFavoriteToggle = input(false);
  readonly favoritePending = input(false);
  readonly selectionChange = output<boolean>();
  readonly favoriteChange = output<boolean>();

  protected selectionLabel(): string {
    if (this.selectionAriaLabel()) return this.selectionAriaLabel()!;
    if (this.selectionDisabled()) return `${this.recipe().title} is already in this meal plan`;
    return this.selected()
      ? `Remove ${this.recipe().title} from this meal plan draft`
      : `Add ${this.recipe().title} to this meal plan draft`;
  }
}
