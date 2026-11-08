import { ChangeDetectionStrategy, Component, OnInit, input, signal } from '@angular/core';

import { UiIconComponent } from '../icon/ui-icon.component';

let nextDisclosureId = 0;

@Component({
    selector: 'ui-disclosure',
    imports: [UiIconComponent],
    template: `
    <section class="ui-disclosure" [class.ui-disclosure--open]="expanded()">
      <div class="ui-disclosure-heading-row" (click)="toggle()">
        <div
          class="ui-disclosure-heading"
          role="heading"
          [attr.aria-level]="headingLevel()"
          >
          <button
            type="button"
            class="ui-disclosure-trigger"
            [attr.aria-expanded]="expanded()"
            [attr.aria-controls]="panelId"
            [attr.id]="triggerId"
            >
            <span class="ui-disclosure-title">{{ title() }}</span>
            @if (summary()) {
              <span class="ui-disclosure-summary">{{ summary() }}</span>
            }
          </button>
        </div>
        <div class="ui-disclosure-action" (click)="$event.stopPropagation()">
          <ng-content select="[disclosure-action]"></ng-content>
        </div>
        <ui-icon class="ui-disclosure-icon" name="chevron-down" size="sm" [decorative]="true"></ui-icon>
      </div>

      @if (expanded()) {
        <div
          class="ui-disclosure-panel"
          role="region"
          [attr.id]="panelId"
          [attr.aria-labelledby]="triggerId"
          >
          <ng-content></ng-content>
        </div>
      }
    </section>
    `,
    styleUrl: './ui-disclosure.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiDisclosureComponent implements OnInit {
  readonly title = input.required<string>();
  readonly summary = input<string | null>(null);
  readonly defaultOpen = input(false);
  readonly headingLevel = input<2 | 3 | 4 | 5 | 6>(3);

  private readonly disclosureId = ++nextDisclosureId;
  protected readonly expanded = signal(false);
  protected readonly triggerId = `ui-disclosure-trigger-${this.disclosureId}`;
  protected readonly panelId = `ui-disclosure-panel-${this.disclosureId}`;

  ngOnInit(): void {
    this.expanded.set(this.defaultOpen());
  }

  protected toggle(): void {
    this.expanded.update((current) => !current);
  }
}
