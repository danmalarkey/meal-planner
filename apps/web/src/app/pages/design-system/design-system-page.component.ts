import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UiAlertComponent } from '../../ui/alert/ui-alert.component';
import { UiAvatarComponent } from '../../ui/avatar/ui-avatar.component';
import { UiBadgeComponent } from '../../ui/badge/ui-badge.component';
import { UiBrandComponent } from '../../ui/brand/ui-brand.component';
import { UiBreadcrumbsComponent } from '../../ui/breadcrumbs/ui-breadcrumbs.component';
import { UiButtonComponent } from '../../ui/button/ui-button.component';
import { UiCardComponent } from '../../ui/card/ui-card.component';
import { UiCheckboxComponent } from '../../ui/checkbox/ui-checkbox.component';
import { UiChipComponent } from '../../ui/chip/ui-chip.component';
import { UiConfirmationModalComponent } from '../../ui/confirmation-modal/ui-confirmation-modal.component';
import { UiDataStripComponent } from '../../ui/data-strip/ui-data-strip.component';
import { UiDisclosureComponent } from '../../ui/disclosure/ui-disclosure.component';
import { UiDrawerComponent } from '../../ui/drawer/ui-drawer.component';
import { UiEmptyStateComponent } from '../../ui/empty-state/ui-empty-state.component';
import { UiFilterSummaryComponent } from '../../ui/filter-summary/ui-filter-summary.component';
import { UiIconButtonComponent } from '../../ui/icon-button/ui-icon-button.component';
import { UI_ICONS, UiIconComponent } from '../../ui/icon/ui-icon.component';
import { UiInputComponent } from '../../ui/input/ui-input.component';
import { UiModalComponent, UiModalFooterDirective } from '../../ui/modal/ui-modal.component';
import { UiPlanCardComponent } from '../../ui/plan-card/ui-plan-card.component';
import { UiPopoverComponent } from '../../ui/popover/ui-popover.component';
import { UiRadioGroupComponent } from '../../ui/radio-group/ui-radio-group.component';
import { UiSegmentedComponent } from '../../ui/segmented/ui-segmented.component';
import { UiSelectComponent } from '../../ui/select/ui-select.component';
import { UiSwatchComponent } from '../../ui/swatch/ui-swatch.component';
import { UiTableComponent } from '../../ui/table/ui-table.component';
import { UiTabsComponent } from '../../ui/tabs/ui-tabs.component';
import { UiTextareaComponent } from '../../ui/textarea/ui-textarea.component';
import { UiToastService } from '../../ui/toast/ui-toast.service';
import { UiToggleComponent } from '../../ui/toggle/ui-toggle.component';
import {
  UiFilterChip,
  UiIconName,
  UiRadioOption,
  UiSegmentedItem,
  UiSelectOption,
  UiTableColumn
} from '../../ui/ui-types';
import { UiWorkspaceCommandComponent } from '../../ui/workspace-command/ui-workspace-command.component';
import { UiWorkspaceResultsSummaryComponent } from '../../ui/workspace-results-summary/ui-workspace-results-summary.component';
import { AccountMenuComponent } from '../../features/account/account-menu.component';

type RecipeRow = Record<string, unknown> & {
  id: string;
  recipe: string;
  time: string;
  status: string;
};

@Component({
  selector: 'app-design-system-page',
  imports: [
    AccountMenuComponent,
    UiAlertComponent,
    UiAvatarComponent,
    UiBadgeComponent,
    UiBrandComponent,
    UiBreadcrumbsComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCheckboxComponent,
    UiChipComponent,
    UiConfirmationModalComponent,
    UiDataStripComponent,
    UiDisclosureComponent,
    UiDrawerComponent,
    UiEmptyStateComponent,
    UiFilterSummaryComponent,
    UiIconButtonComponent,
    UiIconComponent,
    UiInputComponent,
    UiModalComponent,
    UiModalFooterDirective,
    UiPlanCardComponent,
    UiPopoverComponent,
    UiRadioGroupComponent,
    UiSegmentedComponent,
    UiSelectComponent,
    UiSwatchComponent,
    UiTableComponent,
    UiTabsComponent,
    UiTextareaComponent,
    UiToggleComponent,
    UiWorkspaceCommandComponent,
    UiWorkspaceResultsSummaryComponent
  ],
  templateUrl: './design-system-page.component.html',
  styleUrl: './design-system-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignSystemPageComponent {
  private readonly toasts = inject(UiToastService);

  protected readonly checked = signal(true);
  protected readonly toggled = signal(false);
  protected readonly radioValue = signal('balanced');
  protected readonly segmentedValue = signal('week');
  protected readonly selectedTab = signal('preview');
  protected readonly selectValue = signal<string | null>('dinner');
  protected readonly modalOpen = signal(false);
  protected readonly drawerOpen = signal(false);
  protected readonly confirmationOpen = signal(false);
  protected readonly workspaceView = signal('cards');
  protected readonly workspaceSearch = signal('');

  protected readonly colors = [
    { name: 'Primary', value: 'var(--color-primary)' },
    { name: 'Primary soft', value: 'var(--color-primary-soft)' },
    { name: 'Surface', value: 'var(--color-surface)' },
    { name: 'Page wash', value: 'var(--color-page-wash)' },
    { name: 'Text', value: 'var(--color-text-primary)' },
    { name: 'Border', value: 'var(--color-border)' }
  ];
  protected readonly selectOptions: UiSelectOption[] = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' }
  ];
  protected readonly radioOptions: UiRadioOption[] = [
    { value: 'quick', label: 'Quick meals' },
    { value: 'balanced', label: 'Balanced week' },
    { value: 'batch', label: 'Batch cooking' }
  ];
  protected readonly segmentedItems: UiSegmentedItem[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' }
  ];
  protected readonly tabs = [
    { label: 'Preview', value: 'preview' },
    { label: 'Usage', value: 'usage' },
    { label: 'Accessibility', value: 'accessibility' }
  ];
  protected readonly breadcrumbs = [
    { label: 'Favorites', path: '/favorites' },
    { label: 'Weeknight pasta' }
  ];
  protected readonly filterChips: UiFilterChip[] = [
    { id: 'meal', text: 'Dinner', removable: true },
    { id: 'time', text: 'Under 30 minutes', removable: true }
  ];
  protected readonly iconNames = Object.keys(UI_ICONS) as UiIconName[];
  protected readonly tableColumns: UiTableColumn<RecipeRow>[] = [
    { id: 'recipe', label: 'Recipe', sortable: true },
    { id: 'time', label: 'Time', sortable: true },
    { id: 'status', label: 'Status' }
  ];
  protected readonly tableRows: RecipeRow[] = [
    { id: '1', recipe: 'Weeknight pasta', time: '25 min', status: 'Planned' },
    { id: '2', recipe: 'Roasted vegetables', time: '40 min', status: 'Saved' }
  ];
  protected readonly featureRegistry = [
    { name: 'Account menu', selector: 'app-account-menu', source: 'features/account' },
    { name: 'Camera capture', selector: 'ui-camera-capture', source: 'ui/camera-capture' },
    { name: 'Filter summary', selector: 'ui-filter-summary', source: 'ui/filter-summary' },
    { name: 'Plan card', selector: 'ui-plan-card', source: 'ui/plan-card' },
    { name: 'Toast host', selector: 'ui-toast-host', source: 'ui/toast' },
    { name: 'Workspace command', selector: 'ui-workspace-command', source: 'ui/workspace-command' },
    { name: 'Workspace results summary', selector: 'ui-workspace-results-summary', source: 'ui/workspace-results-summary' }
  ];

  protected readonly rowKey = (row: RecipeRow) => row.id;

  protected showToast(): void {
    this.toasts.success('Meal plan saved.');
  }

  protected showAccountMenuFeedback(): void {
    this.toasts.info('Sign out requested from the account menu demo.');
  }
}
