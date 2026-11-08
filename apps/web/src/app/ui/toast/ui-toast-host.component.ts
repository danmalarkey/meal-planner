import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastPlacement, UiToastService } from './ui-toast.service';
import { UiToastComponent } from './ui-toast.component';

@Component({
    selector: 'ui-toast-host',
    imports: [UiToastComponent],
    template: `
    @if (topToasts().length > 0) {
      <div class="ui-toast-host ui-toast-host--top">
        @for (toast of topToasts(); track toast) {
          <ui-toast
            [variant]="toast.variant"
            [message]="toast.message"
            [actionLabel]="toast.action?.label"
            placement="top"
            [closing]="toast.closing"
            (actionClicked)="toastService.performAction(toast.id)"
            (dismissed)="toastService.dismiss(toast.id)"
          ></ui-toast>
        }
      </div>
    }

    @if (bottomToasts().length > 0) {
      <div class="ui-toast-host ui-toast-host--bottom">
        @for (toast of bottomToasts(); track toast) {
          <ui-toast
            [variant]="toast.variant"
            [message]="toast.message"
            [actionLabel]="toast.action?.label"
            placement="bottom"
            [closing]="toast.closing"
            (actionClicked)="toastService.performAction(toast.id)"
            (dismissed)="toastService.dismiss(toast.id)"
          ></ui-toast>
        }
      </div>
    }
    `,
    styleUrl: './ui-toast-host.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiToastHostComponent {
  protected readonly toastService = inject(UiToastService);

  protected topToasts() {
    return this.toastsByPlacement('top');
  }

  protected bottomToasts() {
    return this.toastsByPlacement('bottom');
  }

  private toastsByPlacement(placement: ToastPlacement) {
    return this.toastService.toasts().filter((toast) => toast.placement === placement);
  }
}
