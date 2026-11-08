import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiBadgeComponent } from '../badge/ui-badge.component';
import { UiChipComponent } from '../chip/ui-chip.component';
import { UiDataStripComponent } from '../data-strip/ui-data-strip.component';
import { UiFilterChip, UiDataStripItem } from '../ui-types';

@Component({
    selector: 'ui-filter-summary',
    imports: [UiBadgeComponent, UiChipComponent, UiDataStripComponent],
    template: `
    <section class="ui-filter-summary">
      @if (chips().length > 0) {
        <div class="ui-filter-summary-chips">
          @for (chip of chips(); track trackChip($index, chip)) {
            @if (chip.removable) {
              <ui-chip
                [size]="density() === 'compact' ? 'xs' : 'sm'"
                [variant]="density() === 'compact' ? 'subtle' : 'neutral'"
                [interactive]="false"
                [selected]="density() === 'default'"
                [label]="chip.text"
                [removable]="true"
                [removeAriaLabel]="chip.removeAriaLabel"
                (removed)="chipRemoved.emit(chip)"
              ></ui-chip>
            } @else {
              <ui-badge [variant]="chip.variant ?? 'neutral'" [text]="chip.text"></ui-badge>
            }
          }
        </div>
      }

      @if (details().length > 0) {
        <div class="ui-filter-summary-details">
          @for (detail of details(); track trackDetail($index, detail)) {
            <ui-data-strip
              [label]="detail.label"
              [value]="detail.value"
              [valueMeta]="detail.valueMeta"
              [description]="detail.description"
            ></ui-data-strip>
          }
        </div>
      }
    </section>
    `,
    styleUrl: './ui-filter-summary.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiFilterSummaryComponent {
  readonly chips = input<UiFilterChip[]>([]);
  readonly details = input<UiDataStripItem[]>([]);
  readonly density = input<'default' | 'compact'>('default');
  readonly chipRemoved = output<UiFilterChip>();

  protected readonly trackChip = (_: number, chip: UiFilterChip): string => chip.id ?? chip.text;
  protected readonly trackDetail = (_: number, detail: UiDataStripItem): string =>
    `${detail.label}-${detail.value}`;
}
