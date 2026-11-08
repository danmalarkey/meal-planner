import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiBadgeComponent } from '../badge/ui-badge.component';
import { UiButtonComponent } from '../button/ui-button.component';
import { UiChipComponent } from '../chip/ui-chip.component';
import { UiEmptyStateComponent } from '../empty-state/ui-empty-state.component';
import { UiIconComponent } from '../icon/ui-icon.component';
import { UiSwatchComponent } from '../swatch/ui-swatch.component';
import { UiIconName, UiTableColumn, UiTableLink, UiTableSort, UiTableVariant } from '../ui-types';

@Component({
    selector: 'ui-table',
    imports: [
    UiBadgeComponent,
    UiButtonComponent,
    UiChipComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    UiSwatchComponent
],
    template: `
    <div
      class="ui-table-wrap"
      [class.ui-table-wrap--dense]="dense()"
      [class.ui-table-wrap--reference]="variant() === 'reference'"
      [class.ui-table-wrap--embedded]="variant() === 'embedded'"
      >
      @if (rows().length > 0) {
        <table class="ui-table">
          <thead>
            <tr>
              @if (selectable()) {
                <th class="ui-table-select">
                  <input
                    type="checkbox"
                    [checked]="allSelected()"
                    [attr.aria-label]="'Select all rows'"
                    (change)="toggleAll($event)"
                    />
                </th>
              }
              @for (column of columns(); track column) {
                <th
                  scope="col"
                  [style.width]="column.width ?? null"
                  class="ui-table-header-cell"
                  [class.ui-table-header-cell--sortable]="column.sortable"
                  [class.ui-table-cell--nowrap]="column.nowrap"
                  >
                  @if (column.sortable) {
                    <button
                      type="button"
                      class="ui-table-sort"
                      [class.ui-table-sort--active]="sort()?.columnId === column.id"
                      (click)="toggleSort(column.id)"
                      >
                      <span class="ui-table-header-label">{{ column.label }}</span>
                      <span class="ui-table-sort-indicator" aria-hidden="true">
                        <ui-icon [name]="sortIndicator(column.id)" size="sm" [decorative]="true"></ui-icon>
                      </span>
                    </button>
                  } @else {
                    <span class="ui-table-header-label">{{ column.label }}</span>
                  }
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row) {
              <tr
                [class.ui-table-row--selected]="isSelected(row)"
                [class.ui-table-row--active]="isActive(row)"
                [class.ui-table-row--clickable]="rowClickable()"
                [attr.aria-current]="isActive(row) ? 'true' : null"
                [attr.tabindex]="rowClickable() ? '0' : null"
                (click)="handleRowClick(row)"
                (keydown.enter)="handleRowKeydown(row, $event)"
                (keydown.space)="handleRowKeydown(row, $event)"
                >
                @if (selectable()) {
                  <td class="ui-table-select">
                    <span class="ui-table-cell-label">Select</span>
                    <input
                      type="checkbox"
                      [checked]="isSelected(row)"
                      [attr.aria-label]="'Select row'"
                      (click)="$event.stopPropagation()"
                      (change)="toggleSelection(row, $event)"
                      />
                  </td>
                }
                @for (column of columns(); track column) {
                  <td
                    [attr.data-label]="column.label"
                    [class.ui-table-cell--nowrap]="column.nowrap"
                    [class.ui-table-cell--code]="column.cellType === 'code'"
                    >
                    @switch (column.cellType) {
                      @case ('code') {
                        <code>{{ resolveCell(column, row) }}</code>
                      }
                      @case ('action') {
                        @if (isActionAvailable(column, row)) {
                          <ui-button
                            variant="link"
                            size="sm"
                            [disabled]="isActionDisabled(column, row)"
                            (click)="$event.stopPropagation()"
                            (clicked)="handleCellAction(column, row, $event)"
                            >
                            {{ resolveCell(column, row) }}
                          </ui-button>
                        } @else {
                          {{ resolveCell(column, row) }}
                        }
                      }
                      @case ('badges') {
                        <span class="ui-table-badges">
                          @for (badge of resolveBadges(column, row); track badge) {
                            <ui-badge
                              [variant]="badge.variant ?? 'neutral'"
                              [text]="badge.text"
                            ></ui-badge>
                          }
                        </span>
                      }
                      @case ('chips') {
                        <span class="ui-table-chips">
                          @for (chip of resolveChips(column, row); track chip) {
                            <ui-chip
                              size="xs"
                              variant="neutral"
                              [interactive]="false"
                              [label]="chip.text"
                            ></ui-chip>
                          }
                        </span>
                      }
                      @case ('links') {
                        <span class="ui-table-links">
                          @for (link of resolveLinks(column, row); track link) {
                            <a
                              [class.ui-text-link]="link.appearance !== 'button'"
                              [class.ui-button]="link.appearance === 'button'"
                              [class.ui-button--secondary]="link.appearance === 'button'"
                              [class.ui-button--sm]="link.appearance === 'button'"
                              [href]="link.url"
                              target="_blank"
                              rel="noopener noreferrer"
                              [attr.aria-label]="link.ariaLabel ?? null"
                            >{{ link.label }}</a>
                          }
                        </span>
                      }
                      @case ('media') {
                        <span class="ui-table-media-cell">
                          @if (resolveSwatchColor(column, row); as swatchColor) {
                            <ui-swatch
                              [color]="swatchColor"
                            ></ui-swatch>
                          } @else {
                            @if (resolveImageUrl(column, row); as imageUrl) {
                              <span class="ui-table-media-thumb" aria-hidden="true">
                                <img [src]="imageUrl" alt="" loading="lazy" />
                              </span>
                            }
                          }
                          <span class="ui-table-media-copy">
                            <span class="ui-table-media-title">{{ resolveCell(column, row) }}</span>
                            @if (resolveDescription(column, row); as description) {
                              <span class="ui-table-media-description">
                                {{ description }}
                              </span>
                            }
                          </span>
                        </span>
                      }
                      @default {
                        {{ resolveCell(column, row) }}
                      }
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      } @else {
        @if (!loading()) {
          <ui-empty-state
            [title]="emptyState()?.title ?? 'No results yet'"
            [description]="$safeNavigationMigration(emptyState()?.description)"
            [primaryCta]="emptyState()?.ctaLabel ? { label: emptyState()!.ctaLabel! } : undefined"
            (primaryClicked)="emptyAction.emit()"
          ></ui-empty-state>
        } @else {
          <div class="ui-table-loading">Loading table data...</div>
        }
      }

    </div>
    `,
    styleUrl: './ui-table.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiTableComponent<RowData extends Record<string, unknown>> {
  readonly columns = input.required<UiTableColumn<RowData>[]>();
  readonly rows = input.required<RowData[]>();
  readonly rowKey = input.required<(row: RowData) => string>();
  readonly variant = input<UiTableVariant>('default');
  readonly sort = input<UiTableSort | undefined>(undefined);
  readonly selectable = input(false);
  readonly rowClickable = input(false);
  readonly selectedKeys = input<string[]>([]);
  readonly activeKey = input<string | null>(null);
  readonly dense = input(false);
  readonly loading = input(false);
  readonly emptyState = input<{ title: string; description?: string; ctaLabel?: string } | undefined>(undefined);

  readonly sortChange = output<UiTableSort>();
  readonly selectionChange = output<string[]>();
  readonly rowClicked = output<RowData>();
  readonly emptyAction = output<void>();

  protected isActive(row: RowData): boolean {
    return this.activeKey() === this.rowKey()(row);
  }

  protected resolveCell(column: UiTableColumn<RowData>, row: RowData): string {
    if (column.value) {
      return column.value(row);
    }

    const value = row[column.id];
    return value == null ? '' : String(value);
  }

  protected resolveDescription(column: UiTableColumn<RowData>, row: RowData): string {
    return column.description?.(row) ?? '';
  }

  protected resolveImageUrl(column: UiTableColumn<RowData>, row: RowData): string | null {
    return column.imageUrl?.(row) ?? null;
  }

  protected resolveSwatchColor(column: UiTableColumn<RowData>, row: RowData): string | null {
    return column.swatchColor?.(row) ?? null;
  }

  protected resolveBadges(column: UiTableColumn<RowData>, row: RowData) {
    return column.badges?.(row) ?? [];
  }

  protected resolveChips(column: UiTableColumn<RowData>, row: RowData) {
    return column.chips?.(row) ?? [];
  }

  protected resolveLinks(column: UiTableColumn<RowData>, row: RowData): UiTableLink[] {
    return column.links?.(row) ?? [];
  }

  protected sortIndicator(columnId: string): UiIconName {
    if (this.sort()?.columnId !== columnId) {
      return 'sort-none';
    }

    return this.sort()?.direction === 'asc' ? 'sort-asc' : 'sort-desc';
  }

  protected toggleSort(columnId: string): void {
    if (this.sort()?.columnId === columnId) {
      this.sortChange.emit({
        columnId,
        direction: this.sort()?.direction === 'asc' ? 'desc' : 'asc'
      });
      return;
    }

    this.sortChange.emit({ columnId, direction: 'asc' });
  }

  protected handleCellAction(column: UiTableColumn<RowData>, row: RowData, event: MouseEvent): void {
    event.stopPropagation();

    if (this.isActionDisabled(column, row)) {
      return;
    }

    column.action?.(row);
  }

  protected isActionDisabled(column: UiTableColumn<RowData>, row: RowData): boolean {
    return column.actionDisabled?.(row) ?? false;
  }

  protected isActionAvailable(column: UiTableColumn<RowData>, row: RowData): boolean {
    return column.actionAvailable?.(row) ?? true;
  }

  protected isSelected(row: RowData): boolean {
    return this.selectedKeys().includes(this.rowKey()(row));
  }

  protected allSelected(): boolean {
    return this.rows().length > 0 && this.rows().every((row) => this.isSelected(row));
  }

  protected toggleAll(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectionChange.emit(target.checked ? this.rows().map((row) => this.rowKey()(row)) : []);
  }

  protected toggleSelection(row: RowData, event: Event): void {
    const target = event.target as HTMLInputElement;
    const key = this.rowKey()(row);
    const next = target.checked
      ? [...this.selectedKeys(), key]
      : this.selectedKeys().filter((selectedKey) => selectedKey !== key);

    this.selectionChange.emit(next);
  }

  protected handleRowClick(row: RowData): void {
    if (!this.rowClickable()) {
      return;
    }

    this.rowClicked.emit(row);
  }

  protected handleRowKeydown(row: RowData, event: Event): void {
    if (!this.rowClickable()) {
      return;
    }

    event.preventDefault();
    this.rowClicked.emit(row);
  }
}
