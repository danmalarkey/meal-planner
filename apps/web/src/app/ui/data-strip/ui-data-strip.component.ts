import { ChangeDetectionStrategy, Component, HostBinding, input } from '@angular/core';

type UiDataStripSize = 'sm' | 'md';

@Component({
    selector: 'ui-data-strip',
    imports: [],
    template: `
    <div class="ui-data-strip">
      <div class="ui-data-strip-copy">
        <span class="ui-data-strip-label">{{ label() }}</span>
        @if (description()) {
          <p class="ui-data-strip-description">{{ description() }}</p>
        }
      </div>
      <div class="ui-data-strip-trailing">
        <span class="ui-data-strip-value-content">
          @if (valueMeta()) {
            <span class="ui-data-strip-value-meta">{{ valueMeta() }}</span>
          }
          <span class="ui-data-strip-value">{{ value() }}</span>
        </span>
        <span class="ui-data-strip-action"><ng-content select="[data-strip-action]"></ng-content></span>
      </div>
    </div>
    `,
    styleUrl: './ui-data-strip.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiDataStripComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly valueMeta = input<string | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly size = input<UiDataStripSize>('md');

  @HostBinding('class.ui-data-strip-host')
  protected readonly hostClass = true;

  @HostBinding('class.ui-data-strip-host--sm')
  protected get isSmall(): boolean {
    return this.size() === 'sm';
  }
}
