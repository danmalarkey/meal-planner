import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiRadioOption } from '../ui-types';

let nextRadioGroupId = 0;

@Component({
    selector: 'ui-radio-group',
    imports: [],
    template: `
    <fieldset class="ui-radio-group" [disabled]="disabled()">
      <legend class="ui-radio-group-label">{{ label() }}</legend>
      @for (option of options(); track option) {
        <label class="ui-radio-option">
          <input
            type="radio"
            [attr.name]="groupName"
            [value]="option.value"
            [checked]="option.value === value()"
            [disabled]="option.disabled || disabled()"
            (change)="valueChange.emit(option.value)"
            />
          <span>{{ option.label }}</span>
        </label>
      }
    </fieldset>
    `,
    styleUrl: './ui-radio-group.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiRadioGroupComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly options = input.required<UiRadioOption[]>();
  readonly disabled = input(false);

  readonly valueChange = output<string>();

  protected readonly groupName = `ui-radio-group-${++nextRadioGroupId}`;
}
