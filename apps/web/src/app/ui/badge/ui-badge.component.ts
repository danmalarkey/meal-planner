import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { UiIconComponent } from '../icon/ui-icon.component';
import { UiIconName, UiStatus } from '../ui-types';

@Component({
    selector: 'ui-badge',
    imports: [NgClass, UiIconComponent],
    template: `
    <span class="ui-badge" [ngClass]="badgeClasses()">
      @if (icon()) {
        <span class="ui-badge-icon">
          <ui-icon [name]="icon()!" size="sm" [decorative]="true"></ui-icon>
        </span>
      }
      <span>{{ text() }}</span>
    </span>
    `,
    styleUrl: './ui-badge.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiBadgeComponent {
  readonly variant = input<UiStatus>('neutral');
  readonly size = input<'sm' | 'md'>('md');
  readonly text = input.required<string>();
  readonly icon = input<UiIconName | undefined>(undefined);

  protected readonly badgeClasses = computed(() => ({
    'ui-badge--neutral': this.variant() === 'neutral',
    'ui-badge--info': this.variant() === 'info',
    'ui-badge--success': this.variant() === 'success',
    'ui-badge--warning': this.variant() === 'warning',
    'ui-badge--danger': this.variant() === 'danger',
    [`ui-badge--${this.size()}`]: true
  }));
}
