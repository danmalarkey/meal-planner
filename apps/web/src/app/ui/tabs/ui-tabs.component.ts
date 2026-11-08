import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';


type UiTabItem = {
  label: string;
  value: string;
};

type UiTabsVariant = 'pill' | 'underline';

@Component({
    selector: 'ui-tabs',
    imports: [],
    template: `
    <div
      class="ui-tabs"
      [class.ui-tabs--underline]="variant() === 'underline'"
      [attr.aria-label]="ariaLabel() || null"
      role="tablist"
      >
      @for (item of items(); track trackByValue($index, item); let itemIndex = $index) {
        <button
          type="button"
          class="ui-tabs-tab"
          [class.ui-tabs-tab--active]="item.value === selected()"
          [attr.id]="tabId(item)"
          [attr.aria-controls]="panelId(item)"
          [attr.aria-selected]="item.value === selected()"
          [attr.tabindex]="item.value === selected() ? 0 : -1"
          role="tab"
          (click)="selectedChange.emit(item.value)"
          (keydown)="handleKeydown($event, itemIndex)"
          >
          {{ item.label }}
        </button>
      }
    </div>
    `,
    styleUrl: './ui-tabs.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiTabsComponent {
  readonly items = input.required<UiTabItem[]>();
  readonly selected = input.required<string>();
  readonly variant = input<UiTabsVariant>('pill');
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly idPrefix = input(`ui-tabs-${Math.random().toString(36).slice(2, 9)}`);

  readonly selectedChange = output<string>();

  protected readonly trackByValue = (_: number, item: UiTabItem): string => item.value;

  protected tabId(item: UiTabItem): string {
    return `${this.idPrefix()}-tab-${this.idPart(item.value)}`;
  }

  protected panelId(item: UiTabItem): string {
    return `${this.idPrefix()}-panel-${this.idPart(item.value)}`;
  }

  protected handleKeydown(event: KeyboardEvent, index: number): void {
    const items = this.items();
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % items.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = items.length - 1;
    }

    if (nextIndex === null || !items[nextIndex]) {
      return;
    }

    event.preventDefault();
    this.selectedChange.emit(items[nextIndex].value);
    const tabs = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[nextIndex]?.focus();
  }

  private idPart(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  }
}
