import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButtonComponent } from '../../ui/button/ui-button.component';

@Component({
  selector: 'app-week-navigation',
  imports: [UiButtonComponent],
  template: `
    <div class="week-heading">
      <header class="week-heading-header">
        <h1>
          <span>{{ title() }}</span>
          @if (titleMeta()) {
            <span class="week-heading-title-meta">{{ titleMeta() }}</span>
          }
        </h1>
      </header>
      <nav class="week-navigation" [attr.aria-label]="ariaLabel()">
        <ui-button
          variant="ghost"
          size="sm"
          ariaLabel="Previous week"
          [disabled]="previousDisabled()"
          (clicked)="previous.emit()"
        >
          <span class="week-navigation-arrow" aria-hidden="true">←</span>
          <span class="week-navigation-action-label">Previous</span>
        </ui-button>
        <span class="week-navigation-title">{{ label() }}</span>
        <ui-button
          variant="ghost"
          size="sm"
          ariaLabel="Next week"
          [disabled]="nextDisabled()"
          (clicked)="next.emit()"
        >
          <span class="week-navigation-arrow" aria-hidden="true">→</span>
          <span class="week-navigation-action-label">Next</span>
        </ui-button>
      </nav>
    </div>
  `,
  styleUrl: './week-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeekNavigationComponent {
  readonly title = input.required<string>();
  readonly titleMeta = input<string | null>(null);
  readonly label = input.required<string>();
  readonly ariaLabel = input('Choose week');
  readonly previousDisabled = input(false);
  readonly nextDisabled = input(false);

  readonly previous = output<void>();
  readonly next = output<void>();
}
