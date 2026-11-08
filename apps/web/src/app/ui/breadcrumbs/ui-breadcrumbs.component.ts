import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../icon/ui-icon.component';
import { UiBreadcrumbItem } from '../ui-types';

@Component({
    selector: 'ui-breadcrumbs',
    imports: [RouterLink, UiIconComponent],
    template: `
    <nav class="ui-breadcrumbs" aria-label="Breadcrumb">
      <ol class="ui-breadcrumbs-list">
        @for (item of items(); track item; let isLast = $last) {
          <li class="ui-breadcrumbs-item">
            @if (item.path && !isLast) {
              <a class="ui-breadcrumbs-link" [routerLink]="item.path">
                {{ item.label }}
              </a>
            } @else {
              <span class="ui-breadcrumbs-current" [attr.aria-current]="isLast ? 'page' : null">{{ item.label }}</span>
            }
            @if (!isLast) {
              <ui-icon class="ui-breadcrumbs-separator" name="chevron-right" size="sm"></ui-icon>
            }
          </li>
        }
      </ol>
    </nav>
    `,
    styleUrl: './ui-breadcrumbs.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiBreadcrumbsComponent {
  readonly items = input.required<UiBreadcrumbItem[]>();
}
