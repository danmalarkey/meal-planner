import { Injectable, signal } from '@angular/core';
import { UiStatus } from '../ui-types';

export type ToastPlacement = 'top' | 'bottom';
export type ToastAction = {
  label: string;
  callback: () => void;
};
export type ToastOptions = {
  placement?: ToastPlacement;
  trigger?: EventTarget | null;
  clientY?: number | null;
  action?: ToastAction;
};

type ToastItem = {
  id: string;
  variant: Exclude<UiStatus, 'neutral'>;
  message: string;
  placement: ToastPlacement;
  closing: boolean;
  action?: ToastAction;
};

@Injectable({ providedIn: 'root' })
export class UiToastService {
  readonly toasts = signal<ToastItem[]>([]);

  success(message: string, options: ToastPlacement | ToastOptions = 'top'): void {
    this.show('success', message, options);
  }

  info(message: string, options: ToastPlacement | ToastOptions = 'top'): void {
    this.show('info', message, options);
  }

  warning(message: string, options: ToastPlacement | ToastOptions = 'top'): void {
    this.show('warning', message, options);
  }

  error(message: string, options: ToastPlacement | ToastOptions = 'top'): void {
    this.show('danger', message, options);
  }

  dismiss(id: string): void {
    let shouldRemove = false;

    this.toasts.update((items) =>
      items.map((item) => {
        if (item.id !== id || item.closing) {
          return item;
        }

        shouldRemove = true;
        return { ...item, closing: true };
      })
    );

    if (shouldRemove) {
      window.setTimeout(() => this.remove(id), 260);
    }
  }

  performAction(id: string): void {
    const action = this.toasts().find((item) => item.id === id)?.action;
    if (!action) return;
    this.dismiss(id);
    action.callback();
  }

  private show(variant: Exclude<UiStatus, 'neutral'>, message: string, options: ToastPlacement | ToastOptions): void {
    const id = Math.random().toString(36).slice(2, 9);
    const placement = this.resolvePlacement(options);
    const action = typeof options === 'string' ? undefined : options.action;
    this.toasts.update((items) => [
      ...items,
      { id, variant, message, placement, closing: false, action }
    ]);
    window.setTimeout(() => this.dismiss(id), action ? 8000 : 5200);
  }

  private remove(id: string): void {
    this.toasts.update((items) => items.filter((item) => item.id !== id));
  }

  private resolvePlacement(options: ToastPlacement | ToastOptions): ToastPlacement {
    if (typeof options === 'string') {
      return options;
    }

    if (options.placement) {
      return options.placement;
    }

    const clientY = this.resolveClientY(options);

    if (clientY === null || typeof window === 'undefined') {
      return 'top';
    }

    return clientY > window.innerHeight / 2 ? 'bottom' : 'top';
  }

  private resolveClientY(options: ToastOptions): number | null {
    if (options.clientY !== undefined && options.clientY !== null) {
      return options.clientY;
    }

    const target = options.trigger;

    if (!(target instanceof Element)) {
      return null;
    }

    const rect = target.getBoundingClientRect();
    return rect.top + rect.height / 2;
  }
}
