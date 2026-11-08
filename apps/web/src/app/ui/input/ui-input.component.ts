import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  signal
} from '@angular/core';
import { NgClass } from '@angular/common';
import { UiIconComponent } from '../icon/ui-icon.component';
import { UiIconName, UiSize } from '../ui-types';

let nextInputId = 0;

@Component({
    selector: 'ui-input',
    imports: [NgClass, UiIconComponent],
    template: `
    <div class="ui-input" [ngClass]="inputClasses()">
      <label class="ui-input-label" [attr.for]="resolvedId()">{{ label() }}</label>
      <div class="ui-input-field-wrap">
        @if (iconLeading()) {
          <span class="ui-input-icon">
            <ui-icon [name]="iconLeading()!" size="sm" [decorative]="true"></ui-icon>
          </span>
        }
        <div class="ui-input-control">
          <input
            class="ui-input-field"
            [attr.role]="suggestionOptions().length > 0 ? 'combobox' : null"
            [attr.aria-activedescendant]="activeSuggestionId()"
            [attr.aria-autocomplete]="suggestionOptions().length > 0 ? 'list' : null"
            [attr.aria-controls]="suggestionOptions().length > 0 ? suggestionsId() : null"
            [attr.aria-describedby]="describedBy()"
            [attr.aria-expanded]="suggestionOptions().length > 0 ? suggestionsOpen() : null"
            [attr.aria-invalid]="errorText() ? 'true' : null"
            [attr.autocomplete]="resolvedAutocomplete()"
            [attr.data-overlay-autofocus]="autofocusTarget() ? '' : null"
            [attr.id]="resolvedId()"
            [attr.maxlength]="maxLength() ?? null"
            [attr.name]="name() || null"
            [attr.placeholder]="placeholder() || null"
            [disabled]="disabled()"
            [readOnly]="readonly()"
            [required]="required()"
            [type]="type()"
            [value]="resolvedValue()"
            (blur)="handleBlur($event)"
            (focus)="handleFocus()"
            (input)="handleInput($event)"
            (keydown)="handleKeydown($event)"
            />
          @if (suggestionsOpen()) {
            <div
              class="ui-input-suggestions ui-popover-panel"
              [attr.id]="suggestionsId()"
              role="listbox"
              [attr.aria-labelledby]="suggestionsLabelId()"
              >
              <p class="ui-input-suggestions-label" [attr.id]="suggestionsLabelId()">{{ suggestionsLabel() }}</p>
              <div class="ui-popover-menu">
                @for (suggestion of filteredSuggestions(); track suggestion; let index = $index) {
                  <button
                    type="button"
                    class="ui-popover-action ui-input-suggestion"
                    [class.ui-popover-action--active]="isActiveSuggestion(index)"
                    [attr.id]="suggestionId(index)"
                    role="option"
                    tabindex="-1"
                    [attr.aria-selected]="isActiveSuggestion(index)"
                    (click)="selectSuggestion(suggestion, $event)"
                    (pointerdown)="selectSuggestion(suggestion, $event)"
                    >
                    <span class="ui-input-suggestion-text">{{ suggestion }}</span>
                    @if (suggestionBadge(suggestion); as badge) {
                      <span class="ui-input-suggestion-badge">{{ badge }}</span>
                    }
                  </button>
                }
              </div>
            </div>
          }
        </div>
        @if (clearable() && resolvedValue()) {
          <button
            type="button"
            class="ui-input-clear"
            [disabled]="disabled()"
            (click)="clear()"
            >
            Clear
          </button>
        }
        @if (keyboardHint()) {
          <span class="ui-input-keyboard-hint" aria-hidden="true">
            <ui-icon name="enter" size="sm" [decorative]="true"></ui-icon>
            <span>{{ keyboardHint() }}</span>
          </span>
        }
        @if (iconTrailing()) {
          <span class="ui-input-icon">
            <ui-icon [name]="iconTrailing()!" size="sm" [decorative]="true"></ui-icon>
          </span>
        }
      </div>
      @if (helperText() && !errorText()) {
        <div class="ui-input-helper" [attr.id]="helperId()">
          <span>{{ helperText() }}</span>
          <ng-content select="[input-helper-action]"></ng-content>
        </div>
      }
      @if (errorText()) {
        <p class="ui-input-error" [attr.id]="errorId()">
          {{ errorText() }}
        </p>
      }
    </div>
    `,
    styleUrl: './ui-input.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiInputComponent implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly label = input.required<string>();
  readonly hideLabel = input(false);
  readonly value = input<string | null | undefined>('');
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'date' | 'search'>('text');
  readonly placeholder = input<string | undefined>(undefined);
  readonly helperText = input<string | undefined>(undefined);
  readonly errorText = input<string | undefined>(undefined);
  readonly disabled = input(false);
  readonly required = input(false);
  readonly readonly = input(false);
  readonly size = input<UiSize>('md');
  readonly id = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  readonly autocomplete = input<string | undefined>(undefined);
  readonly iconLeading = input<UiIconName | undefined>(undefined);
  readonly iconTrailing = input<UiIconName | undefined>(undefined);
  readonly clearable = input(false);
  readonly keyboardHint = input<string | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined);
  readonly autofocusTarget = input(false);
  readonly suggestions = input<readonly string[]>([]);
  readonly suggestionBadges = input<Readonly<Record<string, string>>>({});
  readonly suggestionsLabel = input('Existing matches');
  readonly showSuggestionsOnFocus = input(false);
  readonly suggestionsPlacement = input<'bottom' | 'top'>('bottom');
  readonly suggestionsTone = input<'light' | 'contrast'>('light');

  readonly valueChange = output<string>();
  readonly blurred = output<FocusEvent>();
  readonly suggestionSelected = output<string>();
  readonly submitted = output<void>();

  private readonly fallbackId = `ui-input-${++nextInputId}`;
  protected readonly activeSuggestionIndex = signal<number | null>(null);
  private readonly suggestionsFocused = signal(false);
  private readonly resolvedSuggestionsPlacement = signal<'bottom' | 'top'>('bottom');
  private suggestionPlacementFrame: number | null = null;

  protected readonly resolvedId = computed(() => this.id() ?? this.fallbackId);
  protected readonly resolvedValue = computed(() => this.value() ?? '');
  protected readonly suggestionsId = computed(() => `${this.resolvedId()}-suggestions`);
  protected readonly suggestionsLabelId = computed(() => `${this.resolvedId()}-suggestions-label`);
  protected readonly helperId = computed(() => `${this.resolvedId()}-helper`);
  protected readonly errorId = computed(() => `${this.resolvedId()}-error`);
  protected readonly suggestionOptions = computed(() => this.uniqueSuggestions(this.suggestions()));
  protected readonly filteredSuggestions = computed(() =>
    this.filterSuggestions(this.resolvedValue(), this.suggestionOptions(), this.showSuggestionsOnFocus())
  );
  protected readonly hasSuggestionQuery = computed(() => this.normalizeSuggestion(this.resolvedValue()).length > 0);
  protected readonly suggestionsOpen = computed(
    () =>
      this.suggestionsFocused() &&
      (this.hasSuggestionQuery() || this.showSuggestionsOnFocus()) &&
      !this.disabled() &&
      !this.readonly() &&
      this.filteredSuggestions().length > 0
  );
  protected readonly activeSuggestionId = computed(() => {
    const activeIndex = this.activeSuggestionIndex();
    return this.suggestionsOpen() && activeIndex !== null ? this.suggestionId(activeIndex) : null;
  });
  protected readonly resolvedAutocomplete = computed(() => {
    if (this.autocomplete()) {
      return this.autocomplete();
    }

    return this.suggestionOptions().length > 0 ? 'off' : null;
  });

  protected readonly describedBy = computed(() => {
    if (this.errorText()) {
      return this.errorId();
    }

    if (this.helperText()) {
      return this.helperId();
    }

    return null;
  });

  protected readonly inputClasses = computed(() => ({
    'ui-input--sm': this.size() === 'sm',
    'ui-input--md': this.size() === 'md',
    'ui-input--lg': this.size() === 'lg',
    'ui-input--label-hidden': this.hideLabel(),
    'ui-input--error': !!this.errorText(),
    'ui-input--suggestions-top': this.resolvedSuggestionsPlacement() === 'top',
    'ui-input--suggestions-contrast': this.suggestionsTone() === 'contrast'
  }));

  protected handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.activeSuggestionIndex.set(null);
    this.valueChange.emit(target.value);
    this.scheduleSuggestionPlacement();
  }

  protected handleFocus(): void {
    this.resolvedSuggestionsPlacement.set(this.suggestionsPlacement());
    this.suggestionsFocused.set(true);
    this.scheduleSuggestionPlacement();
  }

  protected handleBlur(event: FocusEvent): void {
    this.suggestionsFocused.set(false);
    this.blurred.emit(event);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (this.suggestionsOpen()) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.moveSuggestion(1);
          return;
        case 'ArrowUp':
          event.preventDefault();
          this.moveSuggestion(-1);
          return;
        case 'Home':
          event.preventDefault();
          this.activeSuggestionIndex.set(0);
          return;
        case 'End':
          event.preventDefault();
          this.activeSuggestionIndex.set(this.filteredSuggestions().length - 1);
          return;
        case 'Enter':
          if (this.activeSuggestionIndex() !== null) {
            event.preventDefault();
            const suggestion = this.filteredSuggestions()[this.activeSuggestionIndex()!];
            this.valueChange.emit(suggestion);
            this.suggestionSelected.emit(suggestion);
            this.suggestionsFocused.set(false);
          }
          return;
        case 'Escape':
          event.preventDefault();
          this.suggestionsFocused.set(false);
          return;
      }
    }

    if (event.key === 'Escape' && this.type() === 'search' && this.clearable() && this.resolvedValue()) {
      event.preventDefault();
      this.clear();
      return;
    }

    if (event.key === 'Enter') {
      this.submitted.emit();
    }
  }

  protected clear(): void {
    this.valueChange.emit('');
  }

  focus(options?: FocusOptions): void {
    (this.elementRef.nativeElement.querySelector('input') as HTMLInputElement | null)?.focus(options);
  }

  ngOnDestroy(): void {
    if (this.suggestionPlacementFrame !== null) {
      window.cancelAnimationFrame(this.suggestionPlacementFrame);
    }
  }

  protected suggestionId(index: number): string {
    return `${this.suggestionsId()}-${index}`;
  }

  protected isActiveSuggestion(index: number): boolean {
    return this.activeSuggestionIndex() === index;
  }

  protected suggestionBadge(value: string): string | null {
    return this.suggestionBadges()[value] ?? null;
  }

  protected selectSuggestion(value: string, event: Event): void {
    event.preventDefault();

    if (!this.suggestionsFocused()) {
      return;
    }

    this.valueChange.emit(value);
    this.suggestionSelected.emit(value);
    this.suggestionsFocused.set(false);
  }

  private moveSuggestion(delta: number): void {
    const suggestionCount = this.filteredSuggestions().length;

    if (suggestionCount === 0) {
      this.activeSuggestionIndex.set(0);
      return;
    }

    const currentIndex = this.activeSuggestionIndex();
    const nextIndex =
      currentIndex === null
        ? delta > 0
          ? 0
          : suggestionCount - 1
        : (currentIndex + delta + suggestionCount) % suggestionCount;

    this.activeSuggestionIndex.set(nextIndex);
  }

  private scheduleSuggestionPlacement(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.suggestionPlacementFrame !== null) {
      window.cancelAnimationFrame(this.suggestionPlacementFrame);
    }

    this.suggestionPlacementFrame = window.requestAnimationFrame(() => {
      this.suggestionPlacementFrame = null;
      this.resolveSuggestionPlacement();
    });
  }

  private resolveSuggestionPlacement(): void {
    if (!this.suggestionsOpen()) {
      return;
    }

    const host = this.elementRef.nativeElement as HTMLElement;
    const control = host.querySelector<HTMLElement>('.ui-input-control');
    const panel = host.querySelector<HTMLElement>('.ui-input-suggestions');

    if (!control || !panel) {
      return;
    }

    const boundary = this.findClippingAncestor(control);
    const boundaryRect = boundary?.getBoundingClientRect();
    const controlRect = control.getBoundingClientRect();
    const panelHeight = panel.getBoundingClientRect().height || panel.scrollHeight;
    const boundaryTop = boundaryRect?.top ?? 0;
    const boundaryBottom = boundaryRect?.bottom ?? window.innerHeight;
    const collisionGap = 10;
    const spaceAbove = Math.max(0, controlRect.top - boundaryTop - collisionGap);
    const spaceBelow = Math.max(0, boundaryBottom - controlRect.bottom - collisionGap);
    const preferred = this.suggestionsPlacement();
    const preferredSpace = preferred === 'top' ? spaceAbove : spaceBelow;
    const alternateSpace = preferred === 'top' ? spaceBelow : spaceAbove;
    const resolved = panelHeight > preferredSpace && alternateSpace > preferredSpace
      ? preferred === 'top'
        ? 'bottom'
        : 'top'
      : preferred;

    this.resolvedSuggestionsPlacement.set(resolved);
  }

  private findClippingAncestor(element: HTMLElement): HTMLElement | null {
    let ancestor = element.parentElement;

    while (ancestor && ancestor !== document.body) {
      const styles = window.getComputedStyle(ancestor);
      const overflow = `${styles.overflow} ${styles.overflowY}`;

      if (/auto|scroll|hidden|clip/.test(overflow)) {
        return ancestor;
      }

      ancestor = ancestor.parentElement;
    }

    return null;
  }

  private uniqueSuggestions(values: readonly string[]): string[] {
    const seen = new Set<string>();

    return values
      .map((value) => value.trim())
      .filter((value) => {
        if (!value) {
          return false;
        }

        const key = value.toLowerCase();

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
  }

  private filterSuggestions(query: string, values: readonly string[], showAllWhenEmpty: boolean): string[] {
    const normalizedQuery = this.normalizeSuggestion(query);

    if (!normalizedQuery) {
      return showAllWhenEmpty ? [...values].slice(0, 8) : [];
    }

    return values
      .filter((value) => this.normalizeSuggestion(value).includes(normalizedQuery))
      .slice(0, 8);
  }

  private normalizeSuggestion(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '');
  }
}
