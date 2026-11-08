import { Directive, ElementRef, HostBinding, input, OnDestroy } from '@angular/core';

const DEFAULT_HIGHLIGHT_DURATION_MS = 2500;
const ACTIVE_CLASS = 'ui-scroll-highlight-target--active';

@Directive({
  selector: '[uiScrollHighlight]',
  standalone: true
})
export class UiScrollHighlightDirective implements OnDestroy {
  readonly uiScrollHighlightDuration = input(DEFAULT_HIGHLIGHT_DURATION_MS);
  readonly uiScrollHighlightBlock = input<ScrollLogicalPosition>('nearest');

  @HostBinding('class.ui-scroll-highlight-target')
  protected readonly hostClass = true;

  private clearTimer: ReturnType<typeof window.setTimeout> | null = null;
  private rafId: number | null = null;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngOnDestroy(): void {
    this.clear();
  }

  highlight(duration = this.uiScrollHighlightDuration()): void {
    const element = this.elementRef.nativeElement;

    this.clear();

    element.classList.remove(ACTIVE_CLASS);
    void element.offsetWidth;
    element.scrollIntoView({ behavior: 'smooth', block: this.uiScrollHighlightBlock(), inline: 'nearest' });

    this.rafId = window.requestAnimationFrame(() => {
      element.classList.add(ACTIVE_CLASS);
      this.rafId = null;

      this.clearTimer = window.setTimeout(() => {
        element.classList.remove(ACTIVE_CLASS);
        this.clearTimer = null;
      }, duration);
    });
  }

  clear(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.clearTimer) {
      window.clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }

    this.elementRef.nativeElement.classList.remove(ACTIVE_CLASS);
  }
}
