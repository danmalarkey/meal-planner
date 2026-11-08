import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiBrandSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-brand',
  standalone: true,
  template: `
    <span class="ui-brand-mark" aria-hidden="true">M</span>
    <span class="ui-brand-name">{{ label() }}</span>
  `,
  styleUrl: './ui-brand.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-brand--sm]': "size() === 'sm'",
    '[class.ui-brand--md]': "size() === 'md'",
    '[class.ui-brand--lg]': "size() === 'lg'"
  }
})
export class UiBrandComponent {
  readonly label = input('Meal Planner');
  readonly size = input<UiBrandSize>('md');
}
