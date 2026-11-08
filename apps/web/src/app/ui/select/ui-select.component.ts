import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { UiIconComponent } from '../icon/ui-icon.component';
import { UiPopoverComponent } from '../popover/ui-popover.component';
import { UiSelectOption } from '../ui-types';

let nextSelectId = 0;

@Component({
    selector: 'ui-select',
    imports: [UiIconComponent, UiPopoverComponent],
    template: `
    <div class="ui-select">
      <label class="ui-select-label" [attr.id]="labelId()" [attr.for]="resolvedId()">{{ label() }}</label>

      <ui-popover
        placement="bottom-start"
        panelRole="dialog"
        autoClose="all"
        panelClass="ui-popover-panel--contained ui-popover-panel--select-menu"
        [disabled]="disabled()"
        [triggerLabel]="label()"
        [panelLabel]="label() + ' options'"
        >
        <span
          popover-trigger
          class="ui-select-trigger"
          [class.ui-select-trigger--placeholder]="!selectedLabel()"
          [class.ui-select-trigger--error]="!!errorText()"
          [class.ui-select-trigger--disabled]="disabled()"
          [attr.id]="resolvedId()"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-invalid]="errorText() ? 'true' : null"
          [attr.aria-labelledby]="labelId()"
          >
          <span class="ui-select-trigger-copy">{{ selectedLabel() ?? placeholder() ?? 'Select an option' }}</span>
          <ui-icon class="ui-select-trigger-icon ui-popover-caret" name="chevron-down" size="sm"></ui-icon>
        </span>

        <div popover-panel class="ui-select-menu">
          <header class="ui-select-menu-header">
            <h3 class="ui-select-menu-title" [attr.id]="menuTitleId()">{{ label() }}</h3>
            @if (menuHelperText()) {
              <p class="ui-select-menu-copy">{{ menuHelperText() }}</p>
            }
          </header>
          <div class="ui-select-menu-options" role="listbox" [attr.aria-labelledby]="menuTitleId()">
            @if (placeholder()) {
              <button
                type="button"
                class="ui-select-option"
                [class.ui-select-option--active]="value() === null"
                role="option"
                [attr.aria-selected]="value() === null"
                (click)="selectValue(null)"
                >
                <span class="ui-select-option-copy">{{ placeholder() }}</span>
              </button>
            }

            @for (option of options(); track trackByValue($index, option)) {
              <button
                type="button"
                class="ui-select-option"
                [class.ui-select-option--active]="option.value === value()"
                [disabled]="option.disabled"
                role="option"
                [attr.aria-selected]="option.value === value()"
                (click)="selectValue(option.value)"
                >
                <span class="ui-select-option-copy">{{ option.label }}</span>
                @if (option.value === value()) {
                  <ui-icon class="ui-select-option-check" name="check" size="sm"></ui-icon>
                }
              </button>
            }
          </div>
        </div>
      </ui-popover>

      @if (helperText() && !errorText()) {
        <p class="ui-select-helper" [attr.id]="helperId()">{{ helperText() }}</p>
      }
      @if (errorText()) {
        <p class="ui-select-error" [attr.id]="errorId()">{{ errorText() }}</p>
      }
    </div>
    `,
    styleUrl: './ui-select.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiSelectComponent {
  readonly label = input.required<string>();
  readonly value = input<string | null>(null);
  readonly options = input.required<UiSelectOption[]>();
  readonly placeholder = input<string | undefined>(undefined);
  readonly helperText = input<string | undefined>(undefined);
  readonly menuHelperText = input<string | undefined>(undefined);
  readonly errorText = input<string | undefined>(undefined);
  readonly disabled = input(false);
  readonly required = input(false);
  readonly id = input<string | undefined>(undefined);

  readonly valueChange = output<string | null>();

  private readonly fallbackId = `ui-select-${++nextSelectId}`;

  protected readonly resolvedId = computed(() => this.id() ?? this.fallbackId);
  protected readonly labelId = computed(() => `${this.resolvedId()}-label`);
  protected readonly helperId = computed(() => `${this.resolvedId()}-helper`);
  protected readonly errorId = computed(() => `${this.resolvedId()}-error`);
  protected readonly menuTitleId = computed(() => `${this.resolvedId()}-menu-title`);
  protected readonly describedBy = computed(() =>
    this.errorText() ? this.errorId() : this.helperText() ? this.helperId() : null
  );
  protected readonly selectedLabel = computed(
    () => this.options().find((option) => option.value === this.value())?.label
  );

  protected readonly trackByValue = (_: number, option: UiSelectOption): string => option.value;

  protected selectValue(value: string | null): void {
    if (this.disabled()) {
      return;
    }

    this.valueChange.emit(value);
  }
}
