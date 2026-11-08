
import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBrandComponent } from '../../ui/brand/ui-brand.component';
import { UiCardComponent } from '../../ui/card/ui-card.component';

@Component({
    selector: 'app-auth-page-frame',
    imports: [RouterLink, UiBrandComponent, UiCardComponent],
    template: `
    <main class="auth-page">
      <header class="auth-page-header">
        <a routerLink="/" aria-label="Meal Planner home"><ui-brand></ui-brand></a>
      </header>

      <div class="auth-page-shell">
        <section class="auth-page-introduction" aria-labelledby="authIntroductionTitle">
          <h1 id="authIntroductionTitle">{{ introductionTitle() }}</h1>
          <p>
            <strong>{{ introductionLead() }}</strong>
            {{ introductionDescription() }}
          </p>

          <div class="auth-page-principles" aria-label="Meal Planner principles">
            <span>Household-first</span>
            <span>Plan together</span>
            <span>Shop from one list</span>
          </div>
        </section>

        <ui-card class="auth-page-card" appearance="floating">
          <header class="auth-page-card-header">
            <h2 id="authCardTitle">{{ cardTitle() }}</h2>
            @if (cardDescription()) {
              <p>{{ cardDescription() }}</p>
            }
          </header>

          <ng-content></ng-content>
        </ui-card>
      </div>
    </main>
    `,
    styleUrl: './auth-page-frame.component.scss',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthPageFrameComponent {
  readonly cardTitle = input.required<string>();
  readonly cardDescription = input<string | undefined>(undefined);
  readonly introductionTitle = input('Plan meals together.');
  readonly introductionLead = input('One shared place for the household.');
  readonly introductionDescription = input('Keep recipes, weekly plans, and grocery needs connected.');
}
