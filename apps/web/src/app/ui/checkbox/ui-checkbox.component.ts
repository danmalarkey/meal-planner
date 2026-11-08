import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiIconComponent } from '../icon/ui-icon.component';

let nextCheckboxId = 0;

@Component({
    selector: 'ui-checkbox',
    imports: [UiIconComponent],
    template: `
    <label
      class="ui-checkbox"
      [class.ui-checkbox--with-helper]="!!helperText()"
      [class.ui-checkbox--checked]="checked()"
      [class.ui-checkbox--disabled]="disabled()"
      [attr.for]="resolvedId"
      >
      <input
        class="ui-checkbox-field"
        [attr.id]="resolvedId"
        type="checkbox"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="handleChange($event)"
        />
      <span class="ui-checkbox-control" aria-hidden="true">
        @if (checked()) {
          <ui-icon name="check" size="sm" [decorative]="true"></ui-icon>
        }
      </span>
      <span class="ui-checkbox-copy">
        <span class="ui-checkbox-label-row">
          <span class="ui-checkbox-label">{{ label() }}</span>
          @if (count() !== undefined && count() !== null) {
            <span class="ui-checkbox-count">
              {{ count() }}
            </span>
          }
        </span>
        @if (helperText()) {
          <span class="ui-checkbox-helper">{{ helperText() }}</span>
        }
      </span>
    </label>
    `,
    styleUrl: './ui-checkbox.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiCheckboxComponent {
  readonly label = input.required<string>();
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly helperText = input<string | undefined>(undefined);
  readonly count = input<number | string | null | undefined>(undefined);

  readonly checkedChange = output<boolean>();

  protected readonly resolvedId = `ui-checkbox-${++nextCheckboxId}`;

  protected handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checkedChange.emit(target.checked);
  }
}
