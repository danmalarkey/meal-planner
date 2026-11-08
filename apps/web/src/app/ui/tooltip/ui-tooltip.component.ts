import { ChangeDetectionStrategy, Component, input, OnDestroy, signal } from '@angular/core';

let nextTooltipId = 0;
const TOOLTIP_EXIT_MS = 160;

@Component({
  selector: 'ui-tooltip',
  template: `
    <span
      class="ui-tooltip-anchor"
      [attr.tabindex]="focusable() ? 0 : null"
      [attr.aria-describedby]="focusable() && isRendered() ? tooltipId : null"
      (pointerenter)="handlePointerEnter()"
      (pointerleave)="handlePointerLeave()"
      (focusin)="handleFocusIn()"
      (focusout)="handleFocusOut()"
    >
      <ng-content></ng-content>
      @if (isRendered()) {
        <span
          [attr.id]="tooltipId"
          class="ui-tooltip ui-tooltip--anchored"
          [class.ui-tooltip--closing]="isClosing()"
          role="tooltip"
        >
          {{ text() }}
        </span>
      }
    </span>
  `,
  styleUrl: './ui-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiTooltipComponent implements OnDestroy {
  readonly text = input.required<string>();
  readonly focusable = input(true);

  protected readonly isRendered = signal(false);
  protected readonly isClosing = signal(false);
  protected readonly tooltipId = `ui-tooltip-${++nextTooltipId}`;
  private hovered = false;
  private focused = false;
  private closeTimer?: ReturnType<typeof window.setTimeout>;

  protected handlePointerEnter(): void {
    this.hovered = true;
    this.show();
  }

  protected handlePointerLeave(): void {
    this.hovered = false;
    if (!this.focused) this.hide();
  }

  protected handleFocusIn(): void {
    this.focused = true;
    this.show();
  }

  protected handleFocusOut(): void {
    this.focused = false;
    if (!this.hovered) this.hide();
  }

  ngOnDestroy(): void {
    if (this.closeTimer) window.clearTimeout(this.closeTimer);
  }

  private show(): void {
    if (this.closeTimer) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
    this.isClosing.set(false);
    this.isRendered.set(true);
  }

  private hide(): void {
    if (!this.isRendered() || this.isClosing()) return;
    this.isClosing.set(true);
    this.closeTimer = window.setTimeout(() => {
      this.isClosing.set(false);
      this.isRendered.set(false);
      this.closeTimer = undefined;
    }, TOOLTIP_EXIT_MS);
  }
}
