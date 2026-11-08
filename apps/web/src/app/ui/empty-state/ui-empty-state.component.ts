import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiButtonComponent } from '../button/ui-button.component';
import { UiIconComponent } from '../icon/ui-icon.component';
import { UiIconName } from '../ui-types';

@Component({
    selector: 'ui-empty-state',
    imports: [UiButtonComponent, UiIconComponent],
    template: `
    <section class="ui-empty-state">
      @if (icon()) {
        <div class="ui-empty-state-icon-wrap">
          <ui-icon class="ui-empty-state-icon" [name]="icon()!" size="lg"></ui-icon>
        </div>
      }
      <h3 class="ui-empty-state-title">{{ title() }}</h3>
      @if (description()) {
        <p class="ui-empty-state-description">{{ description() }}</p>
      }
      @if (primaryCta() || secondaryCta()) {
        <div class="ui-empty-state-actions">
          @if (primaryCta()) {
            <ui-button variant="primary" (clicked)="primaryClicked.emit()">
              {{ primaryCta()!.label }}
            </ui-button>
          }
          @if (secondaryCta()) {
            <ui-button [variant]="secondaryCta()!.variant ?? 'ghost'" (clicked)="secondaryClicked.emit()">
              {{ secondaryCta()!.label }}
            </ui-button>
          }
        </div>
      }
      @if (customActions()) {
        <ng-content select="[empty-state-actions]"></ng-content>
      }
    </section>
    `,
    styleUrl: './ui-empty-state.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiEmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string | undefined>(undefined);
  readonly icon = input<UiIconName | undefined>(undefined);
  readonly primaryCta = input<{ label: string } | undefined>(undefined);
  readonly secondaryCta = input<{ label: string; variant?: 'ghost' | 'link' } | undefined>(undefined);
  readonly customActions = input(false);

  readonly primaryClicked = output<void>();
  readonly secondaryClicked = output<void>();
}
