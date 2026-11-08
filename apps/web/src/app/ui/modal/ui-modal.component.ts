import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  Directive,
  ElementRef,
  HostListener,
  computed,
  effect,
  input,
  OnDestroy,
  output,
  signal,
  viewChild
} from '@angular/core';
import { NgClass } from '@angular/common';
import { UiButtonComponent } from '../button/ui-button.component';
import {
  registerOverlayDismissal,
  UiOverlayDismissal,
  unregisterOverlayDismissal
} from '../overlay/overlay-dismissal-stack';
import { acquireOverlayScrollLock, releaseOverlayScrollLock } from '../overlay/overlay-scroll-lock';

export type UiModalSize = 'sm' | 'md' | 'lg';
export type UiModalMotion = 'default' | 'forward' | 'back';
export type UiModalMobilePresentation = 'sheet' | 'dialog' | 'full-screen';
export type UiModalMobileWidth = 'inset' | 'full';
const UI_MODAL_ANIMATION_MS = 260;

@Directive({
  selector: '[modal-footer]',
  standalone: true
})
export class UiModalFooterDirective {}

@Component({
    selector: 'ui-modal',
    imports: [NgClass, UiButtonComponent],
    template: `
    @if (isRendered()) {
      <div
        class="ui-modal-backdrop"
        [class.ui-modal-backdrop--closing]="isClosing()"
        [class.ui-modal-backdrop--mobile-dialog]="mobilePresentation() === 'dialog'"
        [class.ui-modal-backdrop--mobile-full-screen]="mobilePresentation() === 'full-screen'"
        [class.ui-modal-backdrop--mobile-full-width]="mobileWidth() === 'full'"
        (pointerdown)="handleBackdropPointerDown($event)"
        (click)="handleBackdropClick($event)"
        >
        <section
          #panel
          class="ui-modal"
          [ngClass]="modalClasses()"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="ariaDescribedBy() || (description() ? descriptionId : null)"
          (click)="$event.stopPropagation()"
          >
          <header class="ui-modal-header">
            <div>
              <h2 class="ui-modal-title" [attr.id]="titleId">{{ title() }}</h2>
              @if (description()) {
                <p class="ui-modal-description" [attr.id]="descriptionId">{{ description() }}</p>
              }
            </div>
            <ui-button class="ui-modal-close" variant="ghost" size="sm" (clicked)="close()">Close</ui-button>
          </header>
          <div class="ui-modal-body">
            <ng-content></ng-content>
          </div>
          @if (hasFooter()) {
            <footer class="ui-modal-footer">
              <ng-content select="[modal-footer]"></ng-content>
            </footer>
          }
        </section>
      </div>
    }
    `,
    styleUrl: './ui-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiModalComponent implements AfterViewChecked, OnDestroy {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input<string | undefined>(undefined);
  readonly ariaDescribedBy = input<string | undefined>(undefined);
  readonly size = input<UiModalSize>('md');
  readonly motion = input<UiModalMotion>('default');
  readonly mobilePresentation = input<UiModalMobilePresentation>('sheet');
  readonly mobileWidth = input<UiModalMobileWidth>('inset');
  readonly closeOnBackdrop = input(true);
  readonly closeOnEscape = input(true);

  readonly closed = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly modalFooter = contentChild(UiModalFooterDirective);
  private readonly hasFocusedPanel = signal(false);
  protected readonly isRendered = signal(false);
  protected readonly isClosing = signal(false);
  private previousFocusedElement: HTMLElement | null = null;
  private closeTimer?: ReturnType<typeof window.setTimeout>;
  private scrollLockApplied = false;
  private pointerStartedOnBackdrop = false;
  private readonly dismissal: UiOverlayDismissal = {
    dismiss: () => this.close(),
    closeOnEscape: () => this.closeOnEscape()
  };

  protected readonly titleId = `ui-modal-title-${Math.random().toString(36).slice(2, 9)}`;
  protected readonly descriptionId = `ui-modal-description-${Math.random().toString(36).slice(2, 9)}`;
  protected readonly modalClasses = computed(() => ({
    'ui-modal--closing': this.isClosing(),
    'ui-modal--sm': this.size() === 'sm',
    'ui-modal--md': this.size() === 'md',
    'ui-modal--lg': this.size() === 'lg',
    'ui-modal--mobile-dialog': this.mobilePresentation() === 'dialog',
    'ui-modal--mobile-full-screen': this.mobilePresentation() === 'full-screen',
    'ui-modal--mobile-full-width': this.mobileWidth() === 'full',
    'ui-modal--motion-forward': this.motion() === 'forward',
    'ui-modal--motion-back': this.motion() === 'back'
  }));
  protected readonly hasFooter = computed(() => !!this.modalFooter());

  constructor() {
    effect(
      () => {
        if (this.open()) {
          if (this.closeTimer) {
            window.clearTimeout(this.closeTimer);
            this.closeTimer = undefined;
          }

          this.hasFocusedPanel.set(false);
          this.isClosing.set(false);
          this.isRendered.set(true);
          registerOverlayDismissal(this.dismissal);
          return;
        }

        unregisterOverlayDismissal(this.dismissal);

        if (!this.isRendered()) {
          return;
        }

        this.isClosing.set(true);
        this.closeTimer = window.setTimeout(() => {
          this.isClosing.set(false);
          this.isRendered.set(false);
          this.hasFocusedPanel.set(false);
          this.previousFocusedElement?.focus({ preventScroll: true });
          this.closeTimer = undefined;
        }, UI_MODAL_ANIMATION_MS);
      }
    );

    effect(
      () => {
        const shouldLockScroll = this.isRendered();

        if (shouldLockScroll && !this.scrollLockApplied) {
          acquireOverlayScrollLock();
          this.scrollLockApplied = true;
          return;
        }

        if (!shouldLockScroll && this.scrollLockApplied) {
          releaseOverlayScrollLock();
          this.scrollLockApplied = false;
        }
      }
    );
  }

  ngAfterViewChecked(): void {
    if (!this.isRendered() || this.isClosing()) {
      this.hasFocusedPanel.set(false);
      return;
    }

    if (this.hasFocusedPanel()) {
      return;
    }

    this.previousFocusedElement = document.activeElement as HTMLElement | null;
    this.focusInitialTarget();
    this.hasFocusedPanel.set(true);
  }

  protected close(): void {
    this.closed.emit();
  }

  protected handleBackdropPointerDown(event: PointerEvent): void {
    this.pointerStartedOnBackdrop = event.target === event.currentTarget;
  }

  protected handleBackdropClick(event: MouseEvent): void {
    const shouldClose = this.pointerStartedOnBackdrop && event.target === event.currentTarget;
    this.pointerStartedOnBackdrop = false;

    if (shouldClose && this.closeOnBackdrop()) {
      this.close();
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  protected handleTab(event: Event): void {
    if (!this.isRendered() || this.isClosing()) {
      return;
    }

    const panel = this.panel()?.nativeElement;

    if (!panel) {
      return;
    }

    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const keyboardEvent = event as KeyboardEvent;

    if (keyboardEvent.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    }

    if (!keyboardEvent.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  private focusInitialTarget(): void {
    const panel = this.panel()?.nativeElement;

    if (!panel) {
      return;
    }

    const body = panel.querySelector<HTMLElement>('.ui-modal-body');
    const autofocusTarget =
      body?.querySelector<HTMLElement>('[data-overlay-autofocus]') ??
      panel.querySelector<HTMLElement>('[data-overlay-autofocus]');

    if (autofocusTarget) {
      autofocusTarget.focus({ preventScroll: true });
      return;
    }

    const bodyFocusable = body?.querySelector<HTMLElement>(
      'input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
    );

    if (bodyFocusable) {
      bodyFocusable.focus({ preventScroll: true });
      return;
    }

    const panelFocusable = panel.querySelector<HTMLElement>(
      'input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
    );

    if (panelFocusable) {
      panelFocusable.focus({ preventScroll: true });
      return;
    }

    panel.focus({ preventScroll: true });
  }

  ngOnDestroy(): void {
    unregisterOverlayDismissal(this.dismissal);

    if (this.closeTimer) {
      window.clearTimeout(this.closeTimer);
    }

    if (this.scrollLockApplied) {
      releaseOverlayScrollLock();
      this.scrollLockApplied = false;
    }
  }
}
