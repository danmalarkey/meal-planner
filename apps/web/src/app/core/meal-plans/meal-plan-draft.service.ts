import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MealPlanDraftService {
  private readonly selectedRecipeIdsByWeek = new Map<string, Set<string>>();

  selectedRecipeIds(startsOn: string): ReadonlySet<string> {
    return new Set(this.selectedRecipeIdsByWeek.get(startsOn) ?? []);
  }

  isSelected(startsOn: string, recipeId: string): boolean {
    return this.selectedRecipeIdsByWeek.get(startsOn)?.has(recipeId) ?? false;
  }

  setSelected(startsOn: string, recipeId: string, selected: boolean): void {
    const next = new Set(this.selectedRecipeIdsByWeek.get(startsOn) ?? []);
    if (selected) next.add(recipeId);
    else next.delete(recipeId);

    if (next.size > 0) this.selectedRecipeIdsByWeek.set(startsOn, next);
    else this.selectedRecipeIdsByWeek.delete(startsOn);
  }

  clear(startsOn: string): void {
    this.selectedRecipeIdsByWeek.delete(startsOn);
  }
}
