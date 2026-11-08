import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RecipeSummary } from '../../core/recipes/recipe-repository.service';
import { UiTooltipComponent } from '../../ui/tooltip/ui-tooltip.component';

@Component({
  selector: 'app-meal-thumbnail-stack',
  imports: [UiTooltipComponent],
  template: `
    <span class="meal-thumbnail-stack" aria-hidden="true">
      @for (recipe of visibleRecipes(); track recipe.id) {
        <ui-tooltip [text]="recipe.title" [focusable]="false">
          <span class="meal-thumbnail">
            @if (recipe.imageUrl) {
              <img [src]="recipe.imageUrl" alt="" />
            } @else {
              {{ recipe.title.slice(0, 1) }}
            }
          </span>
        </ui-tooltip>
      }
      @if (overflowCount() > 0) {
        <span class="meal-thumbnail meal-thumbnail--overflow">+{{ overflowCount() }}</span>
      }
    </span>
  `,
  styleUrl: './meal-thumbnail-stack.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MealThumbnailStackComponent {
  readonly recipes = input.required<readonly RecipeSummary[]>();
  readonly limit = input(4);

  protected readonly visibleRecipes = computed(() => this.recipes().slice(0, this.limit()));
  protected readonly overflowCount = computed(() =>
    Math.max(0, this.recipes().length - this.visibleRecipes().length)
  );
}
