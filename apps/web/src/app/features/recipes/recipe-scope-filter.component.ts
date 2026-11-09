import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiChipComponent } from '../../ui/chip/ui-chip.component';

export type RecipeScope = 'all' | 'favorites';

@Component({
  selector: 'app-recipe-scope-filter',
  imports: [UiChipComponent],
  template: `
    <div class="recipe-scope-filter" [attr.aria-label]="ariaLabel()">
      <ui-chip
        label="All recipes"
        size="sm"
        [selected]="value() === 'all'"
        [ariaPressed]="value() === 'all'"
        (clicked)="valueChange.emit('all')"
      ></ui-chip>
      <ui-chip
        label="Favorites"
        size="sm"
        [selected]="value() === 'favorites'"
        [ariaPressed]="value() === 'favorites'"
        (clicked)="valueChange.emit('favorites')"
      ></ui-chip>
    </div>
  `,
  styles: `
    .recipe-scope-filter {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeScopeFilterComponent {
  readonly value = input.required<RecipeScope>();
  readonly ariaLabel = input('Recipe view');
  readonly valueChange = output<RecipeScope>();
}
