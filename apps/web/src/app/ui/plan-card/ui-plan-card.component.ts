import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiBadgeComponent } from '../badge/ui-badge.component';
import { UiIconComponent } from '../icon/ui-icon.component';
import { UiStatus } from '../ui-types';

let nextPlanCardId = 0;

@Component({
    selector: 'ui-plan-card',
    imports: [UiBadgeComponent, UiIconComponent],
    template: `
    <article
      class="ui-card ui-card--group ui-plan-card"
      [class.ui-plan-card--featured]="appearance() === 'featured'"
      [class.ui-plan-card--selected]="selected()"
      [attr.aria-current]="selected() ? 'true' : null"
      [attr.aria-labelledby]="headingId"
    >
      <header class="ui-plan-card-header">
        <div class="ui-plan-card-heading">
          <span class="ui-plan-card-context">{{ context() }}</span>
          <h3 class="ui-plan-card-title" [id]="headingId">{{ title() }}</h3>
        </div>
        <div class="ui-plan-card-badges">
          @if (tier()) {
            <ui-badge [text]="tier()!"></ui-badge>
          }
          @if (statusText()) {
            <ui-badge [variant]="statusVariant()" [text]="statusText()!"></ui-badge>
          }
        </div>
      </header>

      <div class="ui-plan-card-body">
        @if (price()) {
          <strong class="ui-plan-card-price">{{ price() }}</strong>
        }
        @if (description()) {
          <p class="ui-plan-card-description">{{ description() }}</p>
        }
        @if (detail()) {
          <p class="ui-plan-card-detail">{{ detail() }}</p>
        }
        @if (features().length) {
          <ul class="ui-plan-card-features" aria-label="Plan features">
            @for (feature of features(); track feature) {
              <li>
                <ui-icon name="check" size="sm" [decorative]="true"></ui-icon>
                <span>{{ feature }}</span>
              </li>
            }
          </ul>
        }
        <ng-content></ng-content>
      </div>

      @if (showActions()) {
        <footer class="ui-plan-card-footer">
          <div class="ui-plan-card-actions">
            <ng-content select="[plan-actions]"></ng-content>
          </div>
        </footer>
      }
    </article>
  `,
    styleUrl: './ui-plan-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiPlanCardComponent {
  readonly context = input.required<string>();
  readonly title = input.required<string>();
  readonly tier = input<'Free' | 'Pro' | null>(null);
  readonly price = input<string | null>(null);
  readonly description = input<string | null>(null);
  readonly detail = input<string | null>(null);
  readonly statusText = input<string | null>(null);
  readonly statusVariant = input<UiStatus>('neutral');
  readonly features = input<readonly string[]>([]);
  readonly appearance = input<'default' | 'featured'>('default');
  readonly selected = input(false);
  readonly showActions = input(false);

  protected readonly headingId = `ui-plan-card-${++nextPlanCardId}`;
}
