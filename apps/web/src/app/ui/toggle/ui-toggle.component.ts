import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';


let nextToggleId = 0;

@Component({
    selector: 'ui-toggle',
    imports: [],
    template: `
    <label class="ui-toggle" [attr.for]="resolvedId">
      <span class="ui-toggle-copy">
        <span class="ui-toggle-label">{{ label() }}</span>
        @if (description()) {
          <span class="ui-toggle-description">{{ description() }}</span>
        }
      </span>
      <span class="ui-toggle-switch">
        <input
          class="ui-toggle-field"
          [attr.id]="resolvedId"
          type="checkbox"
          role="switch"
          [checked]="checked()"
          [disabled]="disabled()"
          (change)="handleChange($event)"
          />
        <span class="ui-toggle-track" [class.ui-toggle-track--checked]="checked()">
          <span class="ui-toggle-thumb"></span>
        </span>
      </span>
    </label>
    `,
    styleUrl: './ui-toggle.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiToggleComponent {
  readonly label = input.required<string>();
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly description = input<string | undefined>(undefined);

  readonly checkedChange = output<boolean>();

  protected readonly resolvedId = `ui-toggle-${++nextToggleId}`;

  protected handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checkedChange.emit(target.checked);
  }
}
