import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Params } from '@angular/router';
import { PlannedMeal } from '../../core/meal-plans/meal-plan-repository.service';
import { RecipeCardComponent } from '../recipes/recipe-card.component';

@Component({
  selector: 'app-planned-meal-card',
  imports: [RecipeCardComponent],
  template: `
    <app-recipe-card
      [recipe]="meal().recipe"
      [selectable]="true"
      [selected]="!!meal().cookedAt"
      [dimmed]="!!meal().cookedAt"
      selectionIdleIcon="check"
      [selectionDisabled]="updating()"
      [selectionAriaLabel]="cookedActionLabel()"
      [detailLink]="['/meals', meal().recipe.id]"
      [detailQueryParams]="detailQueryParams()"
      (selectionChange)="cookedChange.emit($event)"
    ></app-recipe-card>
  `,
  styleUrl: './planned-meal-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlannedMealCardComponent {
  readonly meal = input.required<PlannedMeal>();
  readonly planWeek = input.required<string>();
  readonly updating = input(false);
  readonly cookedChange = output<boolean>();

  protected cookedActionLabel(): string {
    if (this.updating()) return `Saving cooked state for ${this.meal().recipe.title}`;
    return this.meal().cookedAt
      ? `Mark ${this.meal().recipe.title} as not cooked`
      : `Mark ${this.meal().recipe.title} as cooked`;
  }

  protected detailQueryParams(): Params {
    return {
      mealPlanEntry: this.meal().entryId,
      planWeek: this.planWeek(),
      returnTo: '/meal-plan'
    };
  }
}
