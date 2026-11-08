import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { UiIconComponent } from '../icon/ui-icon.component';
import { UiIconName, UiStatus } from '../ui-types';

@Component({
    selector: 'ui-alert',
    imports: [NgClass, UiIconComponent],
    template: `
    <section class="ui-alert" [ngClass]="alertClasses()" [attr.role]="variant() === 'danger' ? 'alert' : 'status'">
      @if (resolvedIcon()) {
        <div class="ui-alert-icon">
          <ui-icon [name]="resolvedIcon()!" ariaLabel="Alert icon" [decorative]="true"></ui-icon>
        </div>
      }
      <div class="ui-alert-copy">
        @if (title()) {
          <p class="ui-alert-title">{{ title() }}</p>
        }
        @if (description()) {
          <p class="ui-alert-description">{{ description() }}</p>
        }
        <ng-content></ng-content>
      </div>
    </section>
    `,
    styleUrl: './ui-alert.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiAlertComponent {
  readonly variant = input<UiStatus>('neutral');
  readonly title = input<string | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly icon = input<UiIconName | undefined>(undefined);

  protected readonly alertClasses = computed(() => ({
    'ui-alert--neutral': this.variant() === 'neutral',
    'ui-alert--info': this.variant() === 'info',
    'ui-alert--success': this.variant() === 'success',
    'ui-alert--warning': this.variant() === 'warning',
    'ui-alert--danger': this.variant() === 'danger'
  }));

  protected readonly resolvedIcon = computed<UiIconName | undefined>(() => {
    if (this.icon()) {
      return this.icon();
    }

    switch (this.variant()) {
      case 'info':
        return 'sparkles';
      case 'success':
        return 'check-circle';
      case 'warning':
      case 'danger':
        return 'warning';
      default:
        return undefined;
    }
  });
}
