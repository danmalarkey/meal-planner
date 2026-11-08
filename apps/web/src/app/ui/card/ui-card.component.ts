import { ChangeDetectionStrategy, Component, HostBinding, HostListener, input, output } from '@angular/core';

import { UiCardAppearance, UiCardVariant } from '../ui-types';

@Component({
    selector: 'ui-card',
    imports: [],
    template: `
    @if (title() || subtitle()) {
      <div class="ui-card-header">
        <div>
          @if (title()) {
            <h3 class="ui-card-title">{{ title() }}</h3>
          }
          @if (subtitle()) {
            <p class="ui-card-subtitle">{{ subtitle() }}</p>
          }
        </div>
        <div class="ui-card-actions">
          <ng-content select="[card-actions]"></ng-content>
        </div>
      </div>
    }
    <div class="ui-card-body">
      <ng-content></ng-content>
    </div>
    @if (showFooter()) {
      <div class="ui-card-footer">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    }
    `,
    styleUrl: './ui-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'ui-card'
    }
})
export class UiCardComponent {
  readonly title = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);
  readonly variant = input<UiCardVariant>('surface');
  readonly appearance = input<UiCardAppearance>('default');
  readonly interactive = input(false);
  readonly dense = input(false);
  readonly showFooter = input(false);

  readonly activated = output<void>();

  @HostBinding('class.ui-card--interactive')
  protected get isInteractive(): boolean {
    return this.interactive();
  }

  @HostBinding('class.ui-card--dense')
  protected get isDense(): boolean {
    return this.dense();
  }

  @HostBinding('class.ui-card--group')
  protected get isGroup(): boolean {
    return this.variant() === 'group';
  }

  @HostBinding('class.ui-card--shadow')
  protected get hasShadowAppearance(): boolean {
    return this.appearance() === 'shadow';
  }

  @HostBinding('class.ui-card--floating')
  protected get hasFloatingAppearance(): boolean {
    return this.appearance() === 'floating';
  }

  @HostBinding('attr.tabindex')
  protected get tabindex(): number | null {
    return this.interactive() ? 0 : null;
  }

  @HostBinding('attr.role')
  protected get role(): string | null {
    return this.interactive() ? 'button' : null;
  }

  @HostListener('keydown.enter')
  protected handleEnter(): void {
    if (this.interactive()) {
      this.activated.emit();
    }
  }

  @HostListener('keydown.space', ['$event'])
  protected handleSpace(event: Event): void {
    if (this.interactive()) {
      event.preventDefault();
      this.activated.emit();
    }
  }
}
