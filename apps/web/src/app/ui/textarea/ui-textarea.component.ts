import { ChangeDetectionStrategy, Component, computed, ElementRef, effect, inject, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

let nextTextareaId = 0;

@Component({
    selector: 'ui-textarea',
    imports: [NgClass],
    template: `
    <div class="ui-textarea" [ngClass]="{ 'ui-textarea--auto-grow': autoGrow() }">
      <label class="ui-textarea-label" [attr.for]="resolvedId()">{{ label() }}</label>
      <textarea
        #field
        class="ui-textarea-field"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="errorText() ? 'true' : null"
        [attr.id]="resolvedId()"
        [attr.maxlength]="maxLength() ?? null"
        [attr.placeholder]="placeholder() || null"
        [disabled]="disabled()"
        [required]="required()"
        [rows]="rows()"
        [value]="value()"
        (blur)="blurred.emit($event)"
        (input)="handleInput($event)"
      ></textarea>
      @if (helperText() && !errorText()) {
        <p class="ui-textarea-helper" [attr.id]="helperId()">{{ helperText() }}</p>
      }
      @if (errorText()) {
        <p class="ui-textarea-error" [attr.id]="errorId()">{{ errorText() }}</p>
      }
    </div>
    `,
    styleUrl: './ui-textarea.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiTextareaComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly label = input.required<string>();
  readonly value = input('');
  readonly rows = input(4);
  readonly helperText = input<string | undefined>(undefined);
  readonly errorText = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly disabled = input(false);
  readonly required = input(false);
  readonly maxLength = input<number | undefined>(undefined);
  readonly id = input<string | undefined>(undefined);
  readonly autoGrow = input(false);

  readonly valueChange = output<string>();
  readonly blurred = output<FocusEvent>();

  private readonly fallbackId = `ui-textarea-${++nextTextareaId}`;

  protected readonly resolvedId = computed(() => this.id() ?? this.fallbackId);
  protected readonly helperId = computed(() => `${this.resolvedId()}-helper`);
  protected readonly errorId = computed(() => `${this.resolvedId()}-error`);
  protected readonly describedBy = computed(() => this.errorText() ? this.errorId() : this.helperText() ? this.helperId() : null);

  constructor() {
    effect(() => {
      this.value();
      this.autoGrow();
      queueMicrotask(() => this.resizeToContent());
    });
  }

  protected handleInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.resizeToContent(target);
    this.valueChange.emit(target.value);
  }

  focus(options?: FocusOptions): void {
    this.textareaField()?.focus(options);
  }

  private resizeToContent(field = this.textareaField()): void {
    if (!this.autoGrow() || !field) {
      return;
    }

    const styles = window.getComputedStyle(field);
    const lineHeight = this.pixelValue(styles.lineHeight, 24);
    const verticalPadding = this.pixelValue(styles.paddingTop) + this.pixelValue(styles.paddingBottom);
    const verticalBorder = this.pixelValue(styles.borderTopWidth) + this.pixelValue(styles.borderBottomWidth);
    const rowsHeight = (lineHeight * Math.max(field.rows, 1)) + verticalPadding + verticalBorder;

    field.style.height = '0px';
    field.style.height = `${Math.ceil(Math.max(field.scrollHeight + verticalBorder, rowsHeight))}px`;
  }

  private pixelValue(value: string, fallback = 0): number {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private textareaField(): HTMLTextAreaElement | null {
    return this.elementRef.nativeElement.querySelector('textarea');
  }
}
