import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButtonComponent } from '../button/ui-button.component';
import { UiModalComponent, UiModalFooterDirective, UiModalSize } from '../modal/ui-modal.component';
import { UiButtonVariant } from '../ui-types';

@Component({
    selector: 'ui-confirmation-modal',
    imports: [UiButtonComponent, UiModalComponent, UiModalFooterDirective],
    template: `
    <ui-modal
      [open]="open()"
      [title]="question()"
      [size]="size()"
      mobilePresentation="dialog"
      [ariaDescribedBy]="messageId"
      [closeOnBackdrop]="closeOnBackdrop()"
      [closeOnEscape]="closeOnEscape()"
      (closed)="closed.emit()"
    >
      <div
        class="ui-confirmation-modal-content"
        [class.ui-confirmation-modal-content--media]="layout() === 'media'"
      >
        <ng-content select="[confirmation-leading]"></ng-content>
        <p class="ui-confirmation-modal-message" [id]="messageId">{{ message() }}</p>
        <div class="ui-confirmation-modal-details">
          <ng-content></ng-content>
        </div>
      </div>

      <div modal-footer class="ui-action-row ui-action-row--nowrap ui-action-row--end">
        <ui-button variant="ghost" (clicked)="closed.emit()">{{ cancelLabel() }}</ui-button>
        <ui-button
          [variant]="confirmVariant()"
          [loading]="loading()"
          [loadingLabel]="loadingLabel()"
          (clicked)="confirmed.emit($event)"
        >
          {{ confirmLabel() }}
        </ui-button>
      </div>
    </ui-modal>
  `,
    styleUrl: './ui-confirmation-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiConfirmationModalComponent {
  readonly open = input(false);
  readonly question = input.required<string>();
  readonly message = input.required<string>();
  readonly layout = input<'stacked' | 'media'>('stacked');
  readonly size = input<UiModalSize>('sm');
  readonly cancelLabel = input('Cancel');
  readonly confirmLabel = input.required<string>();
  readonly confirmVariant = input<UiButtonVariant>('destructive');
  readonly loading = input(false);
  readonly loadingLabel = input('Working');
  readonly closeOnBackdrop = input(true);
  readonly closeOnEscape = input(true);

  readonly closed = output<void>();
  readonly confirmed = output<MouseEvent>();

  protected readonly messageId = `ui-confirmation-modal-message-${Math.random().toString(36).slice(2, 9)}`;
}
