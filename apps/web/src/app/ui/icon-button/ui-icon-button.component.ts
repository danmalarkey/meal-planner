import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { UiIconComponent } from '../icon/ui-icon.component';
import { UiIconButtonVariant, UiIconName, UiSize } from '../ui-types';

@Component({
    selector: 'ui-icon-button',
    imports: [NgClass, UiIconComponent],
    template: `
    <button
      type="button"
      [attr.aria-busy]="loading() ? 'true' : null"
      [attr.aria-label]="ariaLabel()"
      [attr.title]="tooltip() || null"
      [disabled]="disabled() || loading()"
      [ngClass]="buttonClasses()"
      (click)="handleClick($event)"
      >
      <span class="ui-icon-button-icon ui-icon-button-layer" [ngClass]="{ 'ui-icon-button-icon--hidden': loading() }">
        <ui-icon [name]="icon()" [size]="iconSize()"></ui-icon>
      </span>
      @if (loading()) {
        <span class="ui-icon-button-spinner ui-icon-button-layer">
          <span class="ui-button-spinner-indicator" aria-hidden="true"></span>
          <span class="ui-visually-hidden">Loading</span>
        </span>
      }
    </button>
    `,
    styleUrl: './ui-icon-button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiIconButtonComponent {
  readonly variant = input<UiIconButtonVariant>('ghost');
  readonly size = input<UiSize>('md');
  readonly icon = input.required<UiIconName>();
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly ariaLabel = input.required<string>();
  readonly tooltip = input<string | undefined>(undefined);

  readonly clicked = output<MouseEvent>();

  protected readonly buttonClasses = computed(() => ({
    'ui-icon-button': true,
    [`ui-icon-button--${this.variant()}`]: true,
    [`ui-icon-button--${this.size()}`]: true
  }));

  protected readonly iconSize = computed<UiSize>(() => (this.size() === 'lg' ? 'md' : 'sm'));

  protected handleClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.clicked.emit(event);
  }
}
