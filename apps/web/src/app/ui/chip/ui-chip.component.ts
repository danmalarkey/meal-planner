import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { UiIconComponent } from '../icon/ui-icon.component';
import { UiChipSize, UiChipVariant, UiIconName } from '../ui-types';

@Component({
    selector: 'ui-chip',
    imports: [NgClass, UiIconComponent],
    template: `
    @if (rendersInteractiveSurface()) {
      <button
        type="button"
        class="ui-chip"
        [ngClass]="chipClasses()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-pressed]="ariaPressed() === null ? null : ariaPressed() ? 'true' : 'false'"
        (click)="handleClick($event)"
        >
        @if (iconLeading()) {
          <span class="ui-chip-icon">
            <ui-icon [name]="iconLeading()!" size="sm" [decorative]="true"></ui-icon>
          </span>
        }
        @if (swatchColor()) {
          <span
            class="ui-chip-swatch"
            [style.background-color]="swatchColor()"
            aria-hidden="true"
          ></span>
        }
        <span class="ui-chip-label">{{ label() }}</span>
        @if (hasCount()) {
          <span class="ui-chip-count">{{ count() }}</span>
        }
        @if (iconTrailing()) {
          <span class="ui-chip-icon">
            <ui-icon [name]="iconTrailing()!" size="sm" [decorative]="true"></ui-icon>
          </span>
        }
        @if (removable()) {
          <button
            type="button"
            class="ui-chip-remove"
            [attr.aria-label]="removeAriaLabel() || ('Remove ' + label())"
            (click)="handleRemove($event)"
            >
            <ui-icon name="close" size="sm" [decorative]="true"></ui-icon>
          </button>
        }
      </button>
    } @else {
      <span class="ui-chip" [ngClass]="chipClasses()">
        @if (iconLeading()) {
          <span class="ui-chip-icon">
            <ui-icon [name]="iconLeading()!" size="sm" [decorative]="true"></ui-icon>
          </span>
        }
        @if (swatchColor()) {
          <span
            class="ui-chip-swatch"
            [style.background-color]="swatchColor()"
            aria-hidden="true"
          ></span>
        }
        <span class="ui-chip-label">{{ label() }}</span>
        @if (hasCount()) {
          <span class="ui-chip-count">{{ count() }}</span>
        }
        @if (iconTrailing()) {
          <span class="ui-chip-icon">
            <ui-icon [name]="iconTrailing()!" size="sm" [decorative]="true"></ui-icon>
          </span>
        }
        @if (removable()) {
          <button
            type="button"
            class="ui-chip-remove"
            [attr.aria-label]="removeAriaLabel() || ('Remove ' + label())"
            (click)="handleRemove($event)"
            >
            <ui-icon name="close" size="sm" [decorative]="true"></ui-icon>
          </button>
        }
      </span>
    }

    `,
    styleUrl: './ui-chip.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiChipComponent {
  readonly label = input.required<string>();
  readonly variant = input<UiChipVariant>('neutral');
  readonly size = input<UiChipSize>('md');
  readonly selected = input(false);
  readonly interactive = input(true);
  readonly disabled = input(false);
  readonly count = input<number | string | null | undefined>(undefined);
  readonly iconLeading = input<UiIconName | undefined>(undefined);
  readonly iconTrailing = input<UiIconName | undefined>(undefined);
  readonly swatchColor = input<string | null | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaPressed = input<boolean | null>(null);
  readonly removable = input(false);
  readonly removeAriaLabel = input<string | undefined>(undefined);

  readonly clicked = output<MouseEvent>();
  readonly removed = output<MouseEvent>();

  protected readonly hasCount = computed(() => this.count() !== null && this.count() !== undefined && this.count() !== '');
  protected readonly rendersInteractiveSurface = computed(() => this.interactive() && !this.removable());

  protected readonly chipClasses = computed(() => ({
    'ui-chip--interactive': this.rendersInteractiveSurface(),
    'ui-chip--selected': this.selected(),
    [`ui-chip--${this.variant()}`]: true,
    [`ui-chip--${this.size()}`]: true
  }));

  protected handleClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.clicked.emit(event);
  }

  protected handleRemove(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removed.emit(event);
  }
}
