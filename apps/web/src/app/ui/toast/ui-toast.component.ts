import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { UiIconComponent } from '../icon/ui-icon.component';
import { UiIconName, UiStatus } from '../ui-types';
import type { ToastPlacement } from './ui-toast.service';

export type UiToastVariant = Exclude<UiStatus, 'neutral'>;

@Component({
    selector: 'ui-toast',
    imports: [NgClass, UiIconComponent],
    template: `
    <article
      class="ui-toast"
      [ngClass]="toastClasses()"
      [attr.role]="variant() === 'danger' ? 'alert' : 'status'"
    >
      <div class="ui-toast-header">
        <div class="ui-toast-heading">
          <ui-icon [name]="resolvedIcon()" size="sm" [decorative]="true"></ui-icon>
          <p class="ui-toast-title">{{ resolvedTitle() }}</p>
        </div>
        <button type="button" class="ui-toast-dismiss" (click)="dismissed.emit()">Dismiss</button>
      </div>
      <div class="ui-toast-body">
        <p class="ui-toast-message">{{ message() }}</p>
        @if (actionLabel()) {
          <button type="button" class="ui-toast-action" (click)="actionClicked.emit()">
            {{ actionLabel() }}
          </button>
        }
      </div>
    </article>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiToastComponent {
  readonly variant = input<UiToastVariant>('info');
  readonly message = input.required<string>();
  readonly placement = input<ToastPlacement>('top');
  readonly closing = input(false);
  readonly actionLabel = input<string | undefined>(undefined);
  readonly dismissed = output<void>();
  readonly actionClicked = output<void>();

  protected readonly toastClasses = computed(() => ({
    [`ui-toast--${this.variant()}`]: true,
    [`ui-toast--${this.placement()}`]: true,
    'ui-toast--closing': this.closing()
  }));

  protected readonly resolvedTitle = computed(() => {
    switch (this.variant()) {
      case 'success':
        return 'Success';
      case 'warning':
        return 'Attention';
      case 'danger':
        return 'Issue';
      case 'info':
      default:
        return 'Update';
    }
  });

  protected readonly resolvedIcon = computed<UiIconName>(() => {
    switch (this.variant()) {
      case 'success':
        return 'check-circle';
      case 'warning':
      case 'danger':
        return 'warning';
      case 'info':
      default:
        return 'sparkles';
    }
  });
}
