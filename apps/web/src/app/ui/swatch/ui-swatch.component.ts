import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type UiSwatchSize = 'sm' | 'md' | 'fill';

@Component({
  selector: 'ui-swatch',
  standalone: true,
  host: {
    '[class.ui-swatch-host--fill]': 'size() === "fill"'
  },
  template: `
    <span
      class="ui-swatch"
      [class.ui-swatch--sm]="size() === 'sm'"
      [class.ui-swatch--fill]="size() === 'fill'"
      [style.background-color]="resolvedColor()"
      aria-hidden="true"
    ></span>
  `,
  styleUrl: './ui-swatch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiSwatchComponent {
  readonly color = input.required<string>();
  readonly size = input<UiSwatchSize>('md');

  protected readonly resolvedColor = computed(() => {
    const color = this.color().trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color : 'transparent';
  });
}
