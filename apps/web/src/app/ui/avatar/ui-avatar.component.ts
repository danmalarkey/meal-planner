import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { UiSize } from '../ui-types';

@Component({
    selector: 'ui-avatar',
    imports: [],
    template: `
    <span class="ui-avatar" [class.ui-avatar--sm]="size() === 'sm'" [class.ui-avatar--lg]="size() === 'lg'">
      @if (src()) {
        <img class="ui-avatar-image" [src]="src()" [alt]="alt() || ''" />
      } @else {
        {{ computedInitials() }}
      }
    </span>
    `,
    styleUrl: './ui-avatar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiAvatarComponent {
  readonly name = input<string | undefined>(undefined);
  readonly initials = input<string | undefined>(undefined);
  readonly src = input<string | undefined>(undefined);
  readonly alt = input<string | undefined>(undefined);
  readonly size = input<UiSize>('md');

  protected readonly computedInitials = computed(() => {
    if (this.initials()) {
      return this.initials();
    }

    if (!this.name()) {
      return '?';
    }

    return this.name()!
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });
}
