import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { UiIconComponent } from '../icon/ui-icon.component';
import { UiSegmentedItem, UiSize } from '../ui-types';

@Component({
    selector: 'ui-segmented',
    imports: [UiIconComponent],
    template: `
    <div class="ui-segmented" [class.ui-segmented--sm]="size() === 'sm'" role="radiogroup" [attr.aria-label]="ariaLabel()">
      @for (item of items(); track item; let index = $index) {
        <button
          type="button"
          class="ui-segmented-item"
          [class.ui-segmented-item--active]="item.id === value()"
          [disabled]="item.disabled"
          role="radio"
          [attr.aria-checked]="item.id === value()"
          (click)="select(item.id)"
          (keydown)="handleKeydown($event, index)"
          >
          @if (item.icon) {
            <span class="ui-segmented-icon">
              <ui-icon [name]="item.icon" size="sm" [decorative]="true"></ui-icon>
            </span>
          }
          <span class="ui-segmented-label">{{ item.label }}</span>
        </button>
      }
    </div>
    `,
    styleUrl: './ui-segmented.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiSegmentedComponent {
  readonly items = input.required<UiSegmentedItem[]>();
  readonly value = input.required<string>();
  readonly size = input<UiSize>('md');
  readonly ariaLabel = input.required<string>();

  readonly valueChange = output<string>();

  protected select(id: string): void {
    this.valueChange.emit(id);
  }

  protected handleKeydown(event: KeyboardEvent, index: number): void {
    const items = this.items().filter((item) => !item.disabled);
    const currentIndex = items.findIndex((item) => item.id === this.items()[index].id);

    if (currentIndex < 0) {
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.valueChange.emit(items[(currentIndex + 1) % items.length].id);
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.valueChange.emit(items[(currentIndex - 1 + items.length) % items.length].id);
    }
  }
}
