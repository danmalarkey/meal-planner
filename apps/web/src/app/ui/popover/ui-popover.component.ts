import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  input,
  OnDestroy,
  output,
  signal,
  viewChild
} from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { UiButtonComponent } from '../button/ui-button.component';
import {
  registerOverlayDismissal,
  UiOverlayDismissal,
  unregisterOverlayDismissal
} from '../overlay/overlay-dismissal-stack';
import { UiButtonSize, UiButtonVariant } from '../ui-types';

export type UiPopoverPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
type UiPopoverAutoClose = 'all' | 'inside' | 'outside' | 'none';
type UiPopoverPanelRole = 'menu' | 'dialog' | 'listbox';

let nextPopoverId = 0;
const POPOVER_VIEWPORT_GUTTER_PX = 16;
const POPOVER_GAP_PX = 8;

@Component({
    selector: 'ui-popover',
    imports: [NgClass, NgTemplateOutlet, UiButtonComponent],
    template: `
    <div #popover class="ui-popover" [ngClass]="popoverClasses()">
      @if (triggerButtonVariant()) {
        <ui-button
          #buttonTrigger
          [variant]="triggerButtonVariant()!"
          [size]="triggerButtonSize()"
          [ariaControls]="panelId"
          [ariaExpanded]="isRendered()"
          [ariaHasPopup]="panelRole()"
          [ariaLabel]="triggerLabel()"
          [disabled]="disabled()"
          (clicked)="toggle()"
          (keydown)="handleTriggerKeydown($event)"
          >
          <ng-container *ngTemplateOutlet="triggerContent"></ng-container>
        </ui-button>
      } @else {
        <button
          #trigger
          type="button"
          class="ui-popover-trigger"
          [attr.aria-controls]="panelId"
          [attr.aria-disabled]="disabled() ? 'true' : null"
          [attr.aria-expanded]="isRendered()"
          [attr.aria-haspopup]="panelRole()"
          [attr.aria-label]="triggerLabel() || null"
          [disabled]="disabled()"
          (click)="toggle()"
          (keydown)="handleTriggerKeydown($event)"
          >
          <ng-container *ngTemplateOutlet="triggerContent"></ng-container>
        </button>
      }

      <ng-template #triggerContent>
        <ng-content select="[popover-trigger]"></ng-content>
      </ng-template>

      @if (isRendered()) {
        <div
          #panel
          [attr.id]="panelId"
          class="ui-popover-panel"
          [ngClass]="panelClassNames()"
          [attr.aria-label]="panelLabel() || null"
          [attr.role]="panelRole()"
          tabindex="-1"
          (click)="handlePanelClick($event)"
          (keydown)="handlePanelKeydown($event)"
          >
          <ng-content select="[popover-panel]"></ng-content>
        </div>
      }
    </div>
    `,
    styleUrl: './ui-popover.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiPopoverComponent implements OnDestroy {
  readonly placement = input<UiPopoverPlacement>('bottom-end');
  readonly autoClose = input<UiPopoverAutoClose>('all');
  readonly panelRole = input<UiPopoverPanelRole>('menu');
  readonly triggerLabel = input<string | undefined>(undefined);
  readonly triggerButtonVariant = input<UiButtonVariant | null>(null);
  readonly triggerButtonSize = input<UiButtonSize>('sm');
  readonly panelLabel = input<string | undefined>(undefined);
  readonly panelClass = input<string | undefined>(undefined);
  readonly disabled = input(false);
  readonly openChange = output<boolean>();

  protected readonly isRendered = signal(false);
  protected readonly isClosing = signal(false);
  protected readonly panelId = `ui-popover-panel-${++nextPopoverId}`;
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly buttonTrigger = viewChild<UiButtonComponent>('buttonTrigger');
  private readonly popover = viewChild<ElementRef<HTMLElement>>('popover');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private closeTimer?: ReturnType<typeof window.setTimeout>;
  private positionFrame?: number;
  private restoreFocusOnClose = false;
  private readonly dismissal: UiOverlayDismissal;

  protected readonly popoverClasses = computed(() => ({
    'ui-popover--open': this.isRendered(),
    'ui-popover--bottom-start': this.placement() === 'bottom-start',
    'ui-popover--bottom-end': this.placement() === 'bottom-end',
    'ui-popover--top-start': this.placement() === 'top-start',
    'ui-popover--top-end': this.placement() === 'top-end'
  }));

  protected readonly panelClassNames = computed(() => [
    ...(this.isClosing() ? ['ui-popover-panel--closing'] : []),
    ...(this.panelClass()?.split(/\s+/).filter(Boolean) ?? [])
  ]);

  constructor(elementRef: ElementRef<HTMLElement>) {
    this.dismissal = {
      root: elementRef.nativeElement,
      dismiss: (restoreFocus) => this.close(restoreFocus),
      closeOnEscape: () => true,
      closeOnOutsideClick: () => this.shouldCloseOnOutsideClick()
    };
  }

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }

    if (this.isRendered()) {
      this.close(true);
      return;
    }

    this.open();
  }

  protected handleTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      if (!this.isRendered()) {
        this.open(event.key === 'ArrowUp' ? 'last' : 'active');
        return;
      }

      this.focusPanelItem(event.key === 'ArrowUp' ? 'last' : 'active');
    }
  }

  protected handlePanelClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    const forceCloseTarget = target?.closest('[data-popover-close]');

    if (forceCloseTarget) {
      this.close(false);
      return;
    }

    if (!this.shouldCloseOnInsideClick()) {
      return;
    }

    const actionableTarget = target?.closest('a[href], button:not(:disabled), [role="menuitem"], [role="option"]');

    if (actionableTarget) {
      this.close(false);
    }
  }

  protected handlePanelKeydown(event: KeyboardEvent): void {
    if (!this.isRendered()) {
      return;
    }

    const items = this.getFocusableItems();

    if (items.length === 0) {
      return;
    }

    const currentIndex = Math.max(items.indexOf(document.activeElement as HTMLElement), 0);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        items[(currentIndex + 1) % items.length].focus();
        return;
      case 'ArrowUp':
        event.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length].focus();
        return;
      case 'Home':
        event.preventDefault();
        items[0].focus();
        return;
      case 'End':
        event.preventDefault();
        items[items.length - 1].focus();
        return;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        return;
      case 'Tab':
        if (this.panelRole() === 'dialog') {
          return;
        }

        this.close(false);
        return;
      default:
        return;
    }
  }

  protected open(focusTarget: 'active' | 'first' | 'last' | 'none' = this.defaultFocusTarget()): void {
    if (this.closeTimer) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }

    this.restoreFocusOnClose = false;
    this.isClosing.set(false);
    this.isRendered.set(true);
    registerOverlayDismissal(this.dismissal);
    this.openChange.emit(true);
    this.schedulePanelPosition();
    queueMicrotask(() => this.focusPanelItem(focusTarget));
  }

  protected close(restoreFocus = false): void {
    if (!this.isRendered()) {
      return;
    }

    unregisterOverlayDismissal(this.dismissal);
    this.restoreFocusOnClose = restoreFocus;
    this.isClosing.set(true);
    this.closeTimer = window.setTimeout(() => {
      this.isClosing.set(false);
      this.isRendered.set(false);
      this.openChange.emit(false);
      if (this.restoreFocusOnClose) {
        this.trigger()?.nativeElement.focus({ preventScroll: true });
        this.buttonTrigger()?.focus({ preventScroll: true });
      }
      this.restoreFocusOnClose = false;
      this.closeTimer = undefined;
    }, 180);
  }

  private shouldCloseOnInsideClick(): boolean {
    return this.autoClose() === 'all' || this.autoClose() === 'inside';
  }

  private shouldCloseOnOutsideClick(): boolean {
    return this.autoClose() === 'all' || this.autoClose() === 'outside';
  }

  @HostListener('window:resize')
  protected handleViewportResize(): void {
    if (this.isRendered()) {
      this.schedulePanelPosition();
    }
  }

  private schedulePanelPosition(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.positionFrame !== undefined) {
      window.cancelAnimationFrame(this.positionFrame);
    }

    this.positionFrame = window.requestAnimationFrame(() => {
      this.positionFrame = undefined;
      this.positionPanelWithinViewport();
    });
  }

  private positionPanelWithinViewport(): void {
    const popover = this.popover()?.nativeElement;
    const panel = this.panel()?.nativeElement;

    if (!popover || !panel || typeof window === 'undefined') {
      return;
    }

    const anchor = popover.getBoundingClientRect();
    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    const viewportRight = window.innerWidth - POPOVER_VIEWPORT_GUTTER_PX;
    const viewportBottom = window.innerHeight - POPOVER_VIEWPORT_GUTTER_PX;
    const startLeft = anchor.left;
    const endLeft = anchor.right - panelWidth;
    const prefersStart = this.placement().endsWith('start');
    let viewportLeft = prefersStart ? startLeft : endLeft;

    if (prefersStart && viewportLeft + panelWidth > viewportRight && endLeft >= POPOVER_VIEWPORT_GUTTER_PX) {
      viewportLeft = endLeft;
    } else if (!prefersStart && viewportLeft < POPOVER_VIEWPORT_GUTTER_PX && startLeft + panelWidth <= viewportRight) {
      viewportLeft = startLeft;
    }

    viewportLeft = Math.min(
      Math.max(viewportLeft, POPOVER_VIEWPORT_GUTTER_PX),
      Math.max(POPOVER_VIEWPORT_GUTTER_PX, viewportRight - panelWidth)
    );

    const spaceAbove = anchor.top - POPOVER_VIEWPORT_GUTTER_PX - POPOVER_GAP_PX;
    const spaceBelow = viewportBottom - anchor.bottom - POPOVER_GAP_PX;
    const prefersTop = this.placement().startsWith('top');
    const positionAbove = prefersTop
      ? panelHeight <= spaceAbove || spaceAbove >= spaceBelow
      : panelHeight > spaceBelow && spaceAbove > spaceBelow;
    let viewportTop = positionAbove
      ? anchor.top - POPOVER_GAP_PX - panelHeight
      : anchor.bottom + POPOVER_GAP_PX;

    viewportTop = Math.min(
      Math.max(viewportTop, POPOVER_VIEWPORT_GUTTER_PX),
      Math.max(POPOVER_VIEWPORT_GUTTER_PX, viewportBottom - panelHeight)
    );

    panel.style.left = `${viewportLeft - anchor.left}px`;
    panel.style.right = 'auto';
    panel.style.top = `${viewportTop - anchor.top}px`;
    panel.style.bottom = 'auto';
  }

  private defaultFocusTarget(): 'active' | 'first' {
    return this.panelRole() === 'dialog' ? 'first' : 'active';
  }

  private focusPanelItem(target: 'active' | 'first' | 'last' | 'none'): void {
    if (target === 'none') {
      return;
    }

    const panel = this.panel()?.nativeElement;

    if (!panel) {
      return;
    }

    const items = this.getFocusableItems();

    if (items.length === 0) {
      panel.focus({ preventScroll: true });
      return;
    }

    if (target === 'last') {
      items[items.length - 1].focus({ preventScroll: true });
      return;
    }

    if (target === 'active') {
      const selected = panel.querySelector<HTMLElement>('[aria-selected="true"], [aria-current="true"]');

      if (selected) {
        selected.focus({ preventScroll: true });
        return;
      }
    }

    items[0].focus({ preventScroll: true });
  }

  private getFocusableItems(): HTMLElement[] {
    const panel = this.panel()?.nativeElement;

    if (!panel) {
      return [];
    }

    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [role="menuitem"], [role="option"], [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  ngOnDestroy(): void {
    unregisterOverlayDismissal(this.dismissal);

    if (this.closeTimer) {
      window.clearTimeout(this.closeTimer);
    }

    if (this.positionFrame !== undefined) {
      window.cancelAnimationFrame(this.positionFrame);
    }
  }
}
