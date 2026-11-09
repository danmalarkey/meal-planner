import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiIconComponent } from '../../ui/icon/ui-icon.component';

@Component({
  selector: 'app-recipe-favorite-button',
  imports: [UiIconComponent],
  template: `
    <button
      type="button"
      class="recipe-favorite-button"
      [class.recipe-favorite-button--active]="favorite()"
      [disabled]="pending()"
      [attr.aria-label]="favoriteLabel()"
      [attr.aria-pressed]="favorite()"
      (click)="favoriteChange.emit(!favorite())"
    >
      <ui-icon name="star" size="sm" [filled]="favorite()"></ui-icon>
    </button>
  `,
  styleUrl: './recipe-favorite-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeFavoriteButtonComponent {
  readonly recipeTitle = input.required<string>();
  readonly favorite = input(false);
  readonly pending = input(false);
  readonly favoriteChange = output<boolean>();

  protected favoriteLabel(): string {
    return this.favorite()
      ? `Remove ${this.recipeTitle()} from favorites`
      : `Add ${this.recipeTitle()} to favorites`;
  }
}
