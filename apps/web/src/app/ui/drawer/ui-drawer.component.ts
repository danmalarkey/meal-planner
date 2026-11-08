import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
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

type UiDrawerSize = 'sm' | 'md' | 'lg';
type UiDrawerBodyPadding = 'default' | 'flush';
type UiDrawerMobilePresentation = 'sheet' | 'full-height';
type UiDrawerDesktopPresentation = 'modal' | 'inspector';
const UI_DRAWER_ANIMATION_MS = 260;
const UI_DRAWER_DESKTOP_QUERY = '(min-width: 64rem)';

@Component({
    selector: 'ui-drawer',
    imports: [NgClass, UiButtonComponent],
    template: `
    @if (isRendered()) {
      <div
        class="ui-drawer-backdrop"
        [class.ui-drawer-backdrop--closing]="isClosing()"
        [class.ui-drawer-backdrop--desktop-inspector]="isDesktopInspectorActive()"
        (pointerdown)="handleBackdropPointerDown($event)"
        (click)="handleBackdropClick($event)"
        >
        <div
          #panel
          class="ui-drawer-layout"
          [class.ui-drawer-layout--with-companion]="companionOpen()"
          [attr.role]="isDesktopInspectorActive() ? 'complementary' : 'dialog'"
          [attr.aria-modal]="isDesktopInspectorActive() ? null : 'true'"
          tabindex="-1"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="description() ? descriptionId : null"
          >
          @if (companionOpen()) {
            <section
              class="ui-drawer-companion"
              [attr.aria-label]="companionLabel()"
              (pointerdown)="$event.stopPropagation()"
              (click)="$event.stopPropagation()"
              >
              <ng-content select="[drawer-companion]"></ng-content>
            </section>
          }
          <aside class="ui-drawer" [ngClass]="drawerClasses()" (click)="$event.stopPropagation()">
            <header class="ui-drawer-header">
              <div>
                <h2 class="ui-drawer-title" [attr.id]="titleId">{{ title() }}</h2>
                @if (description()) {
                  <p class="ui-drawer-description" [attr.id]="descriptionId">{{ description() }}</p>
                }
              </div>
              <ui-button class="ui-drawer-close" variant="ghost" size="sm" (clicked)="close()">Close</ui-button>
            </header>
            <div class="ui-drawer-body">
              <ng-content select=":not([drawer-footer]):not([drawer-companion])"></ng-content>
            </div>
            <footer class="ui-drawer-footer">
              <ng-content select="[drawer-footer]"></ng-content>
            </footer>
          </aside>
        </div>
      </div>
    }
    `,
    styleUrl: './ui-drawer.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiDrawerComponent implements AfterViewChecked, OnDestroy {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input<string | undefined>(undefined);
  readonly size = input<UiDrawerSize>('md');
  readonly bodyPadding = input<UiDrawerBodyPadding>('default');
  readonly mobilePresentation = input<UiDrawerMobilePresentation>('sheet');
  readonly desktopPresentation = input<UiDrawerDesktopPresentation>('modal');
  readonly closeOnBackdrop = input(true);
  readonly closeOnEscape = input(true);
  readonly companionOpen = input(false);
  readonly companionLabel = input('Related content');

  readonly openChange = output<boolean>();
  readonly closed = output<void>();
  readonly opened = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly hasInitializedOpenState = signal(false);
  private readonly desktopViewportQuery =
    typeof window !== 'undefined' ? window.matchMedia(UI_DRAWER_DESKTOP_QUERY) : null;
  private readonly desktopViewport = signal(this.desktopViewportQuery?.matches ?? false);
  protected readonly isDesktopInspectorActive = computed(
    () => this.desktopPresentation() === 'inspector' && this.desktopViewport() && !this.companionOpen()
  );
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
  private readonly handleDesktopViewportChange = (event: MediaQueryListEvent): void => {
    this.desktopViewport.set(event.matches);
  };

  protected readonly titleId = `ui-drawer-title-${Math.random().toString(36).slice(2, 9)}`;
  protected readonly descriptionId = `ui-drawer-description-${Math.random().toString(36).slice(2, 9)}`;
  protected readonly drawerClasses = computed(() => ({
    'ui-drawer--closing': this.isClosing(),
    'ui-drawer--sm': this.size() === 'sm',
    'ui-drawer--md': this.size() === 'md',
    'ui-drawer--lg': this.size() === 'lg',
    'ui-drawer--body-flush': this.bodyPadding() === 'flush',
    'ui-drawer--mobile-full-height': this.mobilePresentation() === 'full-height'
  }));

  constructor() {
    this.desktopViewportQuery?.addEventListener('change', this.handleDesktopViewportChange);

    effect(
      () => {
        if (this.open()) {
          if (this.closeTimer) {
            window.clearTimeout(this.closeTimer);
            this.closeTimer = undefined;
          }

          this.hasInitializedOpenState.set(false);
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
          this.hasInitializedOpenState.set(false);
          this.closed.emit();
          this.previousFocusedElement?.focus({ preventScroll: true });
          this.closeTimer = undefined;
        }, UI_DRAWER_ANIMATION_MS);
      }
    );

    effect(
      () => {
        const shouldLockScroll = this.isRendered() && !this.isDesktopInspectorActive();

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
      this.hasInitializedOpenState.set(false);
      return;
    }

    if (this.hasInitializedOpenState()) {
      return;
    }

    this.previousFocusedElement = document.activeElement as HTMLElement | null;
    if (!this.isDesktopInspectorActive()) {
      this.focusInitialTarget();
    }
    this.opened.emit();
    this.hasInitializedOpenState.set(true);
  }

  protected close(): void {
    this.openChange.emit(false);
  }

  protected handleBackdropPointerDown(event: PointerEvent): void {
    this.pointerStartedOnBackdrop = event.target === event.currentTarget;
  }

  protected handleBackdropClick(event: MouseEvent): void {
    if (this.isDesktopInspectorActive()) {
      return;
    }

    const shouldClose = this.pointerStartedOnBackdrop && event.target === event.currentTarget;
    this.pointerStartedOnBackdrop = false;

    if (shouldClose && this.closeOnBackdrop()) {
      this.close();
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  protected handleTab(event: Event): void {
    if (!this.isRendered() || this.isClosing() || this.isDesktopInspectorActive()) {
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
      last.focus();
    }

    if (!keyboardEvent.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusInitialTarget(): void {
    const panel = this.panel()?.nativeElement;

    if (!panel) {
      return;
    }

    const body = panel.querySelector<HTMLElement>('.ui-drawer-body');
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
    this.desktopViewportQuery?.removeEventListener('change', this.handleDesktopViewportChange);

    if (this.closeTimer) {
      window.clearTimeout(this.closeTimer);
    }

    if (this.scrollLockApplied) {
      releaseOverlayScrollLock();
      this.scrollLockApplied = false;
    }
  }
}
