import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiButtonComponent } from '../button/ui-button.component';
import { UiPlanCardComponent } from './ui-plan-card.component';

@Component({
    imports: [UiButtonComponent, UiPlanCardComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <ui-plan-card
      context="Current plan"
      title="Meal Planner Free"
      tier="Free"
      description="Shared recipes and meal plans."
      [features]="['Recipe and grocery planning']"
      [selected]="true"
      [showActions]="true"
    >
      <ui-button plan-actions variant="primary" size="sm">View Pro plans</ui-button>
    </ui-plan-card>
  `
})
class PlanCardHostComponent {}

describe('UiPlanCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlanCardHostComponent] }).compileComponents();
  });

  it('renders one consistent plan identity and projected workflow actions', () => {
    const fixture = TestBed.createComponent(PlanCardHostComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const article = element.querySelector('article');
    const heading = element.querySelector('h3');

    expect(heading?.textContent?.trim()).toBe('Meal Planner Free');
    expect(article?.getAttribute('aria-labelledby')).toBe(heading?.id);
    expect(element.querySelector('.ui-badge')?.textContent?.trim()).toBe('Free');
    expect(element.textContent).toContain('Shared recipes and meal plans.');
    expect(element.textContent).toContain('Recipe and grocery planning');
    expect(article?.classList).toContain('ui-plan-card--selected');
    expect(article?.getAttribute('aria-current')).toBe('true');
    expect(element.querySelector('.ui-plan-card-footer button')?.textContent?.trim()).toBe('View Pro plans');
  });
});
