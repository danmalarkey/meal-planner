import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, viewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { UiIconComponent } from '../icon/ui-icon.component';
import { UiButtonSize, UiButtonVariant, UiIconName } from '../ui-types';

@Component({
    selector: 'ui-button',
    imports: [NgClass, UiIconComponent],
    template: `
    <button
      #button
      [attr.aria-busy]="loading() ? 'true' : null"
      [attr.aria-controls]="ariaControls() || null"
      [attr.aria-expanded]="ariaExpanded() === undefined ? null : ariaExpanded() ? 'true' : 'false'"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-haspopup]="ariaHasPopup() || null"
      [attr.aria-pressed]="ariaPressed() === undefined ? null : ariaPressed() ? 'true' : 'false'"
      [disabled]="disabled() || loading()"
      [type]="type()"
      [ngClass]="buttonClasses()"
      (click)="handleClick($event)"
      >
      <span class="ui-button-content ui-button-layer" [ngClass]="{ 'ui-button-content--hidden': loading() }">
        @if (iconLeading()) {
          <span class="ui-button-icon">
            <ui-icon [name]="iconLeading()!" size="sm" [decorative]="true"></ui-icon>
          </span>
        }
        <span class="ui-button-label"><ng-content></ng-content></span>
        @if (iconTrailing()) {
          <span class="ui-button-icon">
            <ui-icon [name]="iconTrailing()!" size="sm" [decorative]="true"></ui-icon>
          </span>
        }
      </span>
      @if (loading()) {
        <span class="ui-button-spinner ui-button-layer">
          <span class="ui-button-spinner-indicator" aria-hidden="true"></span>
          <span class="ui-button-spinner-label">{{ loadingLabel() }}</span>
        </span>
      }
    </button>
    `,
    styleUrl: './ui-button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>('secondary');
  readonly size = input<UiButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly loadingLabel = input('Loading');
  readonly iconLeading = input<UiIconName | undefined>(undefined);
  readonly iconTrailing = input<UiIconName | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaHasPopup = input<'menu' | 'dialog' | 'listbox' | undefined>(undefined);
  readonly ariaPressed = input<boolean | undefined>(undefined);
  readonly ariaControls = input<string | undefined>(undefined);
  readonly ariaExpanded = input<boolean | undefined>(undefined);
  readonly fullWidth = input(false);

  readonly clicked = output<MouseEvent>();
  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('button');

  focus(options?: FocusOptions): void {
    this.button().nativeElement.focus(options);
  }

  protected readonly buttonClasses = computed(() => ({
    'ui-button': true,
    [`ui-button--${this.variant()}`]: true,
    [`ui-button--${this.size()}`]: true,
    'ui-button--full-width': this.fullWidth()
  }));

  protected handleClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.clicked.emit(event);
  }
}
