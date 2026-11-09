import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RecipeSummary } from '../../core/recipes/recipe-repository.service';
import { RecipeCardComponent } from './recipe-card.component';

@Component({ template: '' })
class RecipeDetailTestComponent {}

@Component({
  imports: [RecipeCardComponent],
  template: `
    <app-recipe-card
      [recipe]="recipe"
      [selectable]="selectable()"
      [showFavoriteToggle]="showFavoriteToggle()"
      [detailQueryParams]="detailQueryParams()"
      (selectionChange)="selectionCount = selectionCount + 1"
      (favoriteChange)="favoriteChange = $event"
    ></app-recipe-card>
  `
})
class RecipeCardTestHostComponent {
  readonly recipe: RecipeSummary = {
    id: 'recipe-1',
    title: 'Test meal',
    minutes: 30,
    baseServings: 4,
    imageUrl: null,
    dietaryAssessment: null,
    isFavorite: true
  };
  readonly detailQueryParams = signal<Record<string, string>>({
    mealPlanEntry: 'entry-1',
    planWeek: '2026-11-01',
    returnTo: '/meal-plan'
  });
  readonly selectable = signal(true);
  readonly showFavoriteToggle = signal(false);
  selectionCount = 0;
  favoriteChange: boolean | null = null;
}

describe('RecipeCardComponent', () => {
  let fixture: ComponentFixture<RecipeCardTestHostComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeCardTestHostComponent],
      providers: [
        provideRouter([
          { path: 'recipes/:recipeId', component: RecipeDetailTestComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeCardTestHostComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('opens recipe detail when the selectable card content is clicked', async () => {
    const detailLink = fixture.nativeElement.querySelector(
      '.recipe-card-detail-link'
    ) as HTMLAnchorElement;

    detailLink.click();
    await fixture.whenStable();

    expect(router.url).toBe(
      '/recipes/recipe-1?mealPlanEntry=entry-1&planWeek=2026-11-01&returnTo=%2Fmeal-plan'
    );
  });

  it('keeps the selection control separate from recipe navigation', async () => {
    const selection = fixture.nativeElement.querySelector(
      '.recipe-card-selection'
    ) as HTMLButtonElement;

    selection.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.selectionCount).toBe(1);
    expect(router.url).toBe('/');
  });

  it('keeps the favorite control separate from recipe navigation', async () => {
    fixture.componentInstance.selectable.set(false);
    fixture.componentInstance.showFavoriteToggle.set(true);
    fixture.detectChanges();

    const favorite = fixture.nativeElement.querySelector(
      '.recipe-favorite-button'
    ) as HTMLButtonElement;

    favorite.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.favoriteChange).toBeFalse();
    expect(router.url).toBe('/');
  });

  it('shows an existing favorite as selected', () => {
    fixture.componentInstance.selectable.set(false);
    fixture.componentInstance.showFavoriteToggle.set(true);
    fixture.detectChanges();

    const favorite = fixture.nativeElement.querySelector(
      '.recipe-favorite-button'
    ) as HTMLButtonElement;

    expect(favorite.classList).toContain('recipe-favorite-button--active');
    expect(favorite.getAttribute('aria-pressed')).toBe('true');
    expect(favorite.querySelector('svg')?.classList).toContain('ui-icon--filled');
  });

  it('preserves library return context when opening a recipe', async () => {
    fixture.componentInstance.selectable.set(false);
    fixture.componentInstance.detailQueryParams.set({ returnTo: '/favorites' });
    fixture.detectChanges();

    const detailLink = fixture.nativeElement.querySelector(
      '.recipe-card-detail-link'
    ) as HTMLAnchorElement;

    detailLink.click();
    await fixture.whenStable();

    expect(router.url).toBe('/recipes/recipe-1?returnTo=%2Ffavorites');
  });
});
