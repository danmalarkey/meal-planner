import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiEmptyStateComponent } from '../../ui/empty-state/ui-empty-state.component';
import { UiIconName } from '../../ui/ui-types';

interface ProductAreaPageData {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: UiIconName;
}

@Component({
  selector: 'app-product-area-placeholder-page',
  imports: [UiEmptyStateComponent],
  template: `
    <section class="page product-area-page">
      <header class="page-header">
        <h1>{{ page.title }}</h1>
      </header>
      <ui-empty-state
        [icon]="page.icon"
        [title]="page.emptyTitle"
        [description]="page.emptyDescription"
      ></ui-empty-state>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductAreaPlaceholderPageComponent {
  protected readonly page = inject(ActivatedRoute).snapshot.data as ProductAreaPageData;
}
