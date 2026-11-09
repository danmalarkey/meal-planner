import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MealPlanRepositoryService,
  MealPlanWeek,
  PlannedMeal
} from '../../core/meal-plans/meal-plan-repository.service';
import {
  addMealPlanWeeks,
  fromLocalDateKey,
  isPastMealPlanWeek,
  mealPlanWeekLabel,
  mealPlanWeekNavigationLabel,
  mealPlanWeekRangeLabel,
  startOfMealPlanWeek,
  toLocalDateKey
} from '../../core/meal-plans/meal-plan-week';
import { MealThumbnailStackComponent } from '../../features/meal-plans/meal-thumbnail-stack.component';
import { PlannedMealCardComponent } from '../../features/meal-plans/planned-meal-card.component';
import { WeekNavigationComponent } from '../../features/weeks/week-navigation.component';
import { UiAlertComponent } from '../../ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../ui/button/ui-button.component';
import { UiEmptyStateComponent } from '../../ui/empty-state/ui-empty-state.component';
import { UiToastService } from '../../ui/toast/ui-toast.service';

@Component({
  selector: 'app-meal-plan-page',
  imports: [
    PlannedMealCardComponent,
    MealThumbnailStackComponent,
    WeekNavigationComponent,
    UiAlertComponent,
    UiButtonComponent,
    UiEmptyStateComponent
  ],
  template: `
    <section class="page meal-plan-page">
      <app-week-navigation
        class="week-page-heading"
        title="Meal plan"
        [label]="weekNavigationLabel()"
        ariaLabel="Choose meal-plan week"
        (previous)="moveWeek(-1)"
        (next)="moveWeek(1)"
      ></app-week-navigation>

      @if (error()) {
        <ui-alert
          variant="danger"
          title="We couldn't load this meal plan"
          [description]="error()!"
        ></ui-alert>
      } @else if (loading()) {
        <div class="recipe-grid" aria-label="Loading meal plan" aria-busy="true">
          @for (item of loadingCards; track item) {
            <div class="recipe-card-skeleton ui-loading-shell-card">
              <span class="ui-skeleton-block recipe-card-skeleton-image"></span>
              <span class="ui-skeleton-block recipe-card-skeleton-title"></span>
            </div>
          }
        </div>
      } @else if (plan()?.meals?.length) {
        @if (historical()) {
          <ui-alert
            class="meal-plan-reuse-alert"
            variant="info"
            title="Use this plan again"
            description="Copy these meals into a new week. This past plan will stay unchanged."
          >
            <div class="meal-plan-reuse-actions">
              <ui-button
                variant="secondary"
                size="sm"
                [loading]="copyingTo() === currentWeekKey"
                (clicked)="reusePlan(currentWeek)"
              >This week</ui-button>
              <ui-button
                variant="primary"
                size="sm"
                [loading]="copyingTo() === nextWeekKey"
                (clicked)="reusePlan(nextWeek)"
              >Next week</ui-button>
            </div>
          </ui-alert>
        }

        <div class="recipe-grid" [attr.aria-label]="weekLabel() + ' meal plan'">
          @for (meal of plan()!.meals; track meal.entryId) {
            <app-planned-meal-card
              [meal]="meal"
              [planWeek]="plan()!.startsOn"
              [updating]="updatingEntryId() === meal.entryId"
              (cookedChange)="setCooked(meal, $event)"
            ></app-planned-meal-card>
          }
        </div>
        @if (historical()) {
          <p class="page-meta">Past meal choices are read-only. Cooked status can still be corrected.</p>
        }
      } @else if (historical()) {
        <ui-empty-state
          icon="list"
          title="No meals were saved for this week"
          description="Past weeks stay as history and can't be changed."
        ></ui-empty-state>
      } @else {
        <div class="meal-plan-empty">
          <ui-empty-state
            icon="add"
            title="No meals planned"
            [description]="'Choose recipes to add to ' + weekLabel().toLowerCase() + '.'"
            [primaryCta]="{ label: 'Create meal plan' }"
            (primaryClicked)="openBuilder()"
          ></ui-empty-state>

          @if (recentPlans().length > 0) {
            <section class="meal-plan-recent" aria-labelledby="recent-plans-title">
              <h2 id="recent-plans-title">Recent plans</h2>
              <div class="meal-plan-recent-list">
                @for (recentPlan of recentPlans(); track recentPlan.id) {
                  <article class="meal-plan-recent-row">
                    <button
                      type="button"
                      class="meal-plan-recent-source"
                      [attr.aria-label]="'View meal plan from ' + planRangeLabel(recentPlan.startsOn)"
                      (click)="viewPlan(recentPlan.startsOn)"
                    >
                      <app-meal-thumbnail-stack
                        [recipes]="planRecipes(recentPlan)"
                      ></app-meal-thumbnail-stack>
                      <span>{{ planRangeLabel(recentPlan.startsOn) }}</span>
                    </button>
                    <ui-button
                      variant="secondary"
                      size="sm"
                      [loading]="copyingSourceId() === recentPlan.id"
                      (clicked)="reusePlan(selectedWeek(), recentPlan)"
                    >Use</ui-button>
                  </article>
                }
              </div>
            </section>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MealPlanPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mealPlans = inject(MealPlanRepositoryService);
  private readonly toast = inject(UiToastService);
  private loadSequence = 0;

  protected readonly currentWeek = startOfMealPlanWeek(new Date());
  protected readonly nextWeek = addMealPlanWeeks(this.currentWeek, 1);
  protected readonly currentWeekKey = toLocalDateKey(this.currentWeek);
  protected readonly nextWeekKey = toLocalDateKey(this.nextWeek);
  protected readonly selectedWeek = signal(
    fromLocalDateKey(this.route.snapshot.queryParamMap.get('week')) ?? this.currentWeek
  );
  protected readonly plan = signal<MealPlanWeek | null>(null);
  protected readonly loading = signal(true);
  protected readonly updatingEntryId = signal<string | null>(null);
  protected readonly copyingTo = signal<string | null>(null);
  protected readonly copyingSourceId = signal<string | null>(null);
  protected readonly recentPlans = signal<MealPlanWeek[]>([]);
  protected readonly undoingCopy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loadingCards = [1, 2, 3, 4];

  protected readonly weekLabel = computed(() => mealPlanWeekLabel(this.selectedWeek()));
  protected readonly weekNavigationLabel = computed(() =>
    mealPlanWeekNavigationLabel(this.selectedWeek())
  );
  protected readonly historical = computed(() => isPastMealPlanWeek(this.selectedWeek()));

  ngOnInit(): void {
    void this.loadSelectedWeek();
  }

  protected moveWeek(amount: number): void {
    this.selectedWeek.set(addMealPlanWeeks(this.selectedWeek(), amount));
    void this.syncSelectedWeekUrl();
    void this.loadSelectedWeek();
  }

  protected openBuilder(): void {
    if (this.plan()?.meals.length) return;
    void this.router.navigate(['/meal-plan/build', toLocalDateKey(this.selectedWeek())]);
  }

  protected async setCooked(meal: PlannedMeal, cooked: boolean): Promise<void> {
    this.updatingEntryId.set(meal.entryId);
    this.error.set(null);
    try {
      await this.mealPlans.setCooked(meal.entryId, cooked);
      this.plan.update((plan) =>
        plan
          ? {
              ...plan,
              meals: plan.meals.map((item) =>
                item.entryId === meal.entryId
                  ? { ...item, cookedAt: cooked ? new Date().toISOString() : null }
                  : item
              )
            }
          : plan
      );
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.updatingEntryId.set(null);
    }
  }

  protected async reusePlan(targetWeek: Date, sourcePlan = this.plan()): Promise<void> {
    const sourcePlanId = sourcePlan?.id;
    if (!sourcePlanId) return;

    const targetKey = toLocalDateKey(targetWeek);
    this.copyingTo.set(targetKey);
    this.copyingSourceId.set(sourcePlanId);
    this.error.set(null);
    try {
      const copiedPlan = await this.mealPlans.copyPlan(sourcePlanId, targetKey);
      this.plan.set(copiedPlan);
      this.selectedWeek.set(targetWeek);
      this.recentPlans.set([]);
      if (copiedPlan.id) {
        const copiedPlanId = copiedPlan.id;
        this.toast.success(`Plan added from ${this.planRangeLabel(sourcePlan.startsOn)}.`, {
          action: {
            label: 'Undo',
            callback: () => void this.undoLastCopy(copiedPlanId, targetKey)
          }
        });
      }
      await this.syncSelectedWeekUrl();
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.copyingTo.set(null);
      this.copyingSourceId.set(null);
    }
  }

  protected async undoLastCopy(copiedPlanId: string, targetStartsOn: string): Promise<void> {
    if (this.undoingCopy()) return;

    this.undoingCopy.set(true);
    this.error.set(null);
    try {
      await this.mealPlans.deletePlan(copiedPlanId);
      if (toLocalDateKey(this.selectedWeek()) === targetStartsOn && this.plan()?.id === copiedPlanId) {
        this.plan.set({ id: null, startsOn: targetStartsOn, meals: [] });
        this.recentPlans.set(await this.mealPlans.getRecentPlans(targetStartsOn));
      }
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.undoingCopy.set(false);
    }
  }

  protected viewPlan(startsOn: string): void {
    const week = fromLocalDateKey(startsOn);
    if (!week) return;
    this.selectedWeek.set(week);
    void this.syncSelectedWeekUrl();
    void this.loadSelectedWeek();
  }

  protected planRangeLabel(startsOn: string): string {
    const week = fromLocalDateKey(startsOn);
    return week ? mealPlanWeekRangeLabel(week) : startsOn;
  }

  protected planRecipes(plan: MealPlanWeek) {
    return plan.meals.map((meal) => meal.recipe);
  }

  private async loadSelectedWeek(): Promise<void> {
    const sequence = ++this.loadSequence;
    const weekKey = toLocalDateKey(this.selectedWeek());
    this.loading.set(true);
    this.error.set(null);

    try {
      const plan = await this.mealPlans.getWeek(weekKey);
      const recentPlans =
        plan.meals.length === 0 && !isPastMealPlanWeek(this.selectedWeek())
          ? await this.mealPlans.getRecentPlans(weekKey)
          : [];
      if (sequence !== this.loadSequence) return;
      this.plan.set(plan);
      this.recentPlans.set(recentPlans);
    } catch (error) {
      if (sequence === this.loadSequence) this.error.set(this.errorMessage(error));
    } finally {
      if (sequence === this.loadSequence) this.loading.set(false);
    }
  }

  private syncSelectedWeekUrl(): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { week: toLocalDateKey(this.selectedWeek()) },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Please refresh and try again.';
  }
}
