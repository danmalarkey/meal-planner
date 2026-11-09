import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  GroceryDestination,
  GroceryItem,
  GroceryRepositoryService,
  GroceryWeek
} from '../../core/groceries/grocery-repository.service';
import {
  addMealPlanWeeks,
  fromLocalDateKey,
  mealPlanWeekNavigationLabel,
  startOfMealPlanWeek,
  toLocalDateKey
} from '../../core/meal-plans/meal-plan-week';
import { formatRecipeQuantity } from '../../core/recipes/recipe-scaling';
import { WeekNavigationComponent } from '../../features/weeks/week-navigation.component';
import { UiAlertComponent } from '../../ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../ui/button/ui-button.component';
import { UiChipComponent } from '../../ui/chip/ui-chip.component';
import { UiConfirmationModalComponent } from '../../ui/confirmation-modal/ui-confirmation-modal.component';
import { UiDrawerComponent } from '../../ui/drawer/ui-drawer.component';
import { UiEmptyStateComponent } from '../../ui/empty-state/ui-empty-state.component';
import { UiIconComponent } from '../../ui/icon/ui-icon.component';
import { UiInputComponent } from '../../ui/input/ui-input.component';
import { UiPopoverComponent } from '../../ui/popover/ui-popover.component';
import { UiSelectComponent } from '../../ui/select/ui-select.component';
import { UiToastService } from '../../ui/toast/ui-toast.service';
import { UiSelectOption } from '../../ui/ui-types';

type GroceryGroup = {
  category: string;
  remaining: GroceryItem[];
  completed: GroceryItem[];
};

const GROCERY_CATEGORIES = [
  'Produce',
  'Meat & Poultry',
  'Seafood',
  'Dairy & Eggs',
  'Dairy & Alternatives',
  'Bakery & Bread',
  'Pasta, Rice & Grains',
  'Canned & Jarred',
  'Condiments & Sauces',
  'Spices & Seasonings',
  'Baking',
  'Nuts, Seeds & Dried Fruit',
  'Frozen',
  'Snacks & Breakfast',
  'Pantry & Other',
  'Household',
  'Other'
] as const;

@Component({
  selector: 'app-groceries-page',
  imports: [
    UiAlertComponent,
    UiButtonComponent,
    UiChipComponent,
    UiConfirmationModalComponent,
    UiDrawerComponent,
    UiEmptyStateComponent,
    UiIconComponent,
    UiInputComponent,
    UiPopoverComponent,
    UiSelectComponent,
    WeekNavigationComponent
  ],
  template: `
    <section class="page grocery-page" [class.grocery-page--selecting]="selecting()">
      <header class="grocery-navigation week-page-heading">
        <app-week-navigation
          title="Groceries"
          [label]="weekNavigationLabel()"
          ariaLabel="Choose grocery week"
          (previous)="moveWeek(-1)"
          (next)="moveWeek(1)"
        ></app-week-navigation>

        @if (!error() && !loading()) {
          <div class="grocery-list-bar">
            <nav class="grocery-list-tabs" aria-label="Grocery lists">
              <ui-chip
                label="All items"
                size="sm"
                [selected]="activeDestinationId() === 'all'"
                [ariaPressed]="activeDestinationId() === 'all'"
                (clicked)="chooseList('all')"
              ></ui-chip>
              @for (destination of board()!.destinations; track destination.id) {
                <ui-chip
                  [label]="destination.name"
                  size="sm"
                  [selected]="activeDestinationId() === destination.id"
                  [ariaPressed]="activeDestinationId() === destination.id"
                  (clicked)="chooseList(destination.id)"
                ></ui-chip>
              }
            </nav>

            <ui-popover
              placement="bottom-end"
              panelRole="menu"
              autoClose="inside"
              triggerLabel="Grocery actions"
              panelLabel="Grocery actions"
            >
              <span popover-trigger class="grocery-actions-trigger">
                <ui-icon name="more"></ui-icon>
              </span>
              <div popover-panel class="grocery-actions-menu">
                <button type="button" class="ui-popover-action" role="menuitem" (click)="openManualItem()">
                  Add item
                </button>
                @if (!hasMealPlanItems() && (board()?.items?.length ?? 0) > 0) {
                  <button
                    type="button"
                    class="ui-popover-action"
                    role="menuitem"
                    [disabled]="syncing()"
                    (click)="addMealPlanGroceries()"
                  >Add meal ingredients</button>
                }
                @if ((board()?.items?.length ?? 0) > 0) {
                  <button type="button" class="ui-popover-action" role="menuitem" (click)="toggleSelecting()">
                    {{ selecting() ? 'Cancel moving items' : 'Move items' }}
                  </button>
                }
                <button type="button" class="ui-popover-action" role="menuitem" (click)="openListDrawer()">
                  New list
                </button>
                @if (activeDestination(); as destination) {
                  <button
                    type="button"
                    class="ui-popover-action ui-popover-action--danger"
                    role="menuitem"
                    (click)="listToDelete.set(destination)"
                  >Delete list</button>
                }
                @if (completedItemCount() > 0) {
                  <button type="button" class="ui-popover-action" role="menuitem" (click)="showGottenItems.update(show => !show)">
                    {{ showGottenItems() ? 'Hide gotten items' : 'Show gotten items' }}
                  </button>
                }
              </div>
            </ui-popover>
          </div>
        }
      </header>

      @if (error()) {
        <ui-alert
          variant="danger"
          title="We couldn't load these groceries"
          [description]="error()!"
        ></ui-alert>
      } @else if (loading()) {
        <div class="grocery-loading" aria-label="Loading groceries" aria-busy="true">
          @for (section of loadingSections; track section) {
            <section>
              <span class="ui-skeleton-block grocery-loading-heading"></span>
              <span class="ui-skeleton-block grocery-loading-row"></span>
              <span class="ui-skeleton-block grocery-loading-row"></span>
            </section>
          }
        </div>
      } @else {
        @if (categoryGroups().length > 0) {
          <div class="grocery-groups">
            @for (group of categoryGroups(); track group.category) {
              <section class="grocery-group" [attr.aria-labelledby]="categoryId(group.category)">
                <h2 [attr.id]="categoryId(group.category)">
                  <span>{{ group.category }}</span>
                  <span class="grocery-group-total">{{ group.remaining.length + group.completed.length }}</span>
                </h2>
                <ul class="grocery-items">
                  @for (item of visibleGroupItems(group); track item.id) {
                    <li
                      class="grocery-item"
                      [class.grocery-item--completed]="!!item.gottenAt"
                      animate.enter="ui-show-hide-enter"
                      animate.leave="ui-show-hide-leave"
                    >
                      @if (selecting()) {
                        <button
                          type="button"
                          class="grocery-item-check grocery-item-check--selection"
                          [class.grocery-item-check--active]="selectedItemIds().has(item.id)"
                          [attr.aria-pressed]="selectedItemIds().has(item.id)"
                          [attr.aria-label]="selectionLabel(item)"
                          (click)="toggleItemSelection(item.id)"
                        >
                          @if (selectedItemIds().has(item.id)) {
                            <ui-icon name="check" size="sm"></ui-icon>
                          }
                        </button>
                      } @else {
                        <button
                          type="button"
                          class="grocery-item-check"
                          [class.grocery-item-check--active]="!!item.gottenAt"
                          [attr.aria-pressed]="!!item.gottenAt"
                          [attr.aria-label]="gottenLabel(item)"
                          [disabled]="updatingItemId() === item.id"
                          (click)="setGotten(item, !item.gottenAt)"
                        >
                          @if (item.gottenAt) {
                            <ui-icon name="check" size="sm"></ui-icon>
                          }
                        </button>
                      }

                      @if (selecting()) {
                        <button
                          type="button"
                          class="grocery-item-copy"
                          (click)="toggleItemSelection(item.id)"
                        >
                          <span class="grocery-item-details">
                            <span class="grocery-item-name">{{ item.name }}</span>
                            @if (activeDestinationId() === 'all' && destinationName(item.destinationId); as destination) {
                              <span class="grocery-item-destination">{{ destination }}</span>
                            }
                          </span>
                          @if (amount(item); as itemAmount) {
                            <span class="grocery-item-amount">{{ itemAmount }}</span>
                          }
                        </button>
                      } @else {
                        <button type="button" class="grocery-item-copy" (click)="openEditItem(item)">
                          <span class="grocery-item-details">
                            <span class="grocery-item-name">{{ item.name }}</span>
                            @if (activeDestinationId() === 'all' && destinationName(item.destinationId); as destination) {
                              <span class="grocery-item-destination">{{ destination }}</span>
                            }
                          </span>
                          @if (amount(item); as itemAmount) {
                            <span class="grocery-item-amount">{{ itemAmount }}</span>
                          }
                        </button>
                      }
                    </li>
                  }
                </ul>
              </section>
            }
          </div>
        } @else if (assignmentDestination()) {
          <ui-empty-state
            icon="list"
            title="No grocery items to add"
            [primaryCta]="{ label: 'Done' }"
            (primaryClicked)="cancelSelecting()"
          ></ui-empty-state>
        } @else if (activeDestinationId() !== 'all') {
          <ui-empty-state
            icon="list"
            title="No items in this list"
            [primaryCta]="{ label: 'Move items here' }"
            (primaryClicked)="startAssigningTo(activeDestinationId())"
          ></ui-empty-state>
        } @else {
          <ui-empty-state
            icon="list"
            title="Your grocery list is empty"
            [primaryCta]="{ label: 'Add groceries' }"
            [secondaryCta]="{ label: 'Add an item' }"
            (primaryClicked)="addMealPlanGroceries()"
            (secondaryClicked)="openManualItem()"
          ></ui-empty-state>
        }
      }
    </section>

    @if (selecting()) {
      <div
        class="grocery-selection-bar"
        role="region"
        aria-label="Move grocery items"
        aria-live="polite"
        animate.enter="ui-bottom-toolbar-enter"
        animate.leave="ui-bottom-toolbar-leave"
      >
        <div class="grocery-selection-copy">
          <strong>Move items</strong>
          <span>
            @if (selectedItemIds().size > 0) {
              {{ selectedItemIds().size }} selected
            } @else {
              Select items
            }
          </span>
        </div>
        <div class="grocery-selection-actions">
          <ui-button variant="ghost" size="sm" (clicked)="cancelSelecting()">Cancel</ui-button>
          @if (assignmentDestination(); as destination) {
            <ui-button
              variant="primary"
              size="sm"
              [disabled]="selectedItemIds().size === 0"
              (clicked)="moveSelectedItems(destination.id)"
            >Move to {{ destination.name }}</ui-button>
          } @else {
            <ui-button
              variant="primary"
              size="sm"
              [disabled]="selectedItemIds().size === 0"
              (clicked)="moveDrawerOpen.set(true)"
            >Move</ui-button>
          }
        </div>
      </div>
    }

    <ui-drawer
      [open]="manualDrawerOpen()"
      title="Add item"
      size="sm"
      (openChange)="manualDrawerOpen.set($event)"
    >
      <div class="grocery-drawer-fields">
        <ui-input
          label="Item"
          [value]="manualName()"
          placeholder="What do you need?"
          [autofocusTarget]="true"
          [suggestions]="ingredientSuggestions()"
          suggestionsLabel="Ingredients"
          (valueChange)="manualName.set($event)"
          (submitted)="saveManualItem()"
        ></ui-input>
        <ui-input
          label="Amount"
          [value]="manualAmount()"
          placeholder="Optional, e.g. 2 cans"
          (valueChange)="manualAmount.set($event)"
        ></ui-input>
        <ui-select
          label="Category"
          [value]="manualCategory()"
          [options]="categoryOptions"
          (valueChange)="manualCategory.set($event ?? 'Other')"
        ></ui-select>
        @if (board()?.destinations?.length) {
          <ui-select
            label="List"
            [value]="manualDestinationId()"
            placeholder="All items only"
            [options]="destinationOptions()"
            (valueChange)="manualDestinationId.set($event)"
          ></ui-select>
        }
      </div>
      <div drawer-footer class="grocery-drawer-footer">
        <ui-button
          variant="primary"
          [fullWidth]="true"
          [disabled]="!manualName().trim()"
          [loading]="savingManualItem()"
          loadingLabel="Adding item"
          (clicked)="saveManualItem()"
        >Add item</ui-button>
      </div>
    </ui-drawer>

    <ui-confirmation-modal
      [open]="!!listToDelete()"
      [question]="'Delete ' + (listToDelete()?.name ?? 'this list') + '?'"
      message="Its grocery items will stay in All items."
      confirmLabel="Delete list"
      [loading]="deletingList()"
      loadingLabel="Deleting list"
      [closeOnBackdrop]="!deletingList()"
      [closeOnEscape]="!deletingList()"
      (closed)="listToDelete.set(null)"
      (confirmed)="deleteList()"
    ></ui-confirmation-modal>

    <ui-drawer
      [open]="editDrawerOpen()"
      title="Edit item"
      size="sm"
      (openChange)="editDrawerOpen.set($event)"
    >
      <div class="grocery-drawer-fields">
        <ui-input
          label="Item"
          [value]="editName()"
          [autofocusTarget]="true"
          [suggestions]="ingredientSuggestions()"
          [showSuggestionsOnFocus]="true"
          suggestionsLabel="Ingredients"
          (valueChange)="editName.set($event)"
          (submitted)="saveEditedItem()"
        ></ui-input>
        <ui-input
          label="Amount"
          [value]="editAmount()"
          placeholder="Optional, e.g. 2 cans"
          (valueChange)="editAmount.set($event)"
        ></ui-input>
        <ui-select
          label="Category"
          [value]="editCategory()"
          [options]="categoryOptions"
          (valueChange)="editCategory.set($event ?? 'Other')"
        ></ui-select>
        <ui-select
          label="List"
          [value]="editDestinationId()"
          placeholder="All items only"
          [options]="destinationOptions()"
          (valueChange)="editDestinationId.set($event)"
        ></ui-select>
      </div>
      <div drawer-footer class="grocery-drawer-footer">
        <ui-button
          variant="primary"
          [fullWidth]="true"
          [disabled]="!editName().trim()"
          [loading]="savingEditedItem()"
          loadingLabel="Saving item"
          (clicked)="saveEditedItem()"
        >Save changes</ui-button>
      </div>
    </ui-drawer>

    <ui-drawer
      [open]="listDrawerOpen()"
      title="New grocery list"
      size="sm"
      (openChange)="listDrawerOpen.set($event)"
    >
      <ui-input
        label="List name"
        [value]="newListName()"
        placeholder="Costco, Target..."
        [autofocusTarget]="true"
        (valueChange)="newListName.set($event)"
        (submitted)="saveList()"
      ></ui-input>
      <div drawer-footer class="grocery-drawer-footer">
        <ui-button
          variant="primary"
          [fullWidth]="true"
          [disabled]="!newListName().trim()"
          [loading]="savingList()"
          loadingLabel="Creating list"
          (clicked)="saveList()"
        >Create list</ui-button>
      </div>
    </ui-drawer>

    <ui-drawer
      [open]="moveDrawerOpen()"
      title="Move to list"
      description="Items stay visible in All items."
      size="sm"
      bodyPadding="flush"
      (openChange)="moveDrawerOpen.set($event)"
    >
      <div class="grocery-move-options">
        @if (!selectedItemsAlreadyIn(null)) {
          <button type="button" (click)="moveSelectedItems(null)">All items only</button>
        }
        @for (destination of board()?.destinations ?? []; track destination.id) {
          @if (!selectedItemsAlreadyIn(destination.id)) {
            <button type="button" (click)="moveSelectedItems(destination.id)">
              {{ destination.name }}
            </button>
          }
        }
      </div>
    </ui-drawer>
  `,
  styleUrl: './groceries-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroceriesPageComponent implements OnInit {
  private readonly groceries = inject(GroceryRepositoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToastService);
  private loadSequence = 0;

  protected readonly currentWeek = startOfMealPlanWeek(new Date());
  protected readonly selectedWeek = signal(
    fromLocalDateKey(this.route.snapshot.queryParamMap.get('week')) ?? this.currentWeek
  );
  protected readonly board = signal<GroceryWeek | null>(null);
  protected readonly loading = signal(true);
  protected readonly syncing = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showGottenItems = signal(false);
  protected readonly recentlyGottenItemIds = signal<ReadonlySet<string>>(new Set());
  protected readonly selecting = signal(false);
  protected readonly selectedItemIds = signal<Set<string>>(new Set());
  protected readonly activeDestinationId = signal<string>('all');
  protected readonly listToDelete = signal<GroceryDestination | null>(null);
  protected readonly deletingList = signal(false);
  protected readonly assignmentDestinationId = signal<string | null>(null);
  protected readonly updatingItemId = signal<string | null>(null);
  protected readonly manualDrawerOpen = signal(false);
  protected readonly manualName = signal('');
  protected readonly manualAmount = signal('');
  protected readonly manualCategory = signal<string>('Other');
  protected readonly manualDestinationId = signal<string | null>(null);
  protected readonly ingredientSuggestions = signal<string[]>([]);
  protected readonly savingManualItem = signal(false);
  protected readonly listDrawerOpen = signal(false);
  protected readonly newListName = signal('');
  protected readonly savingList = signal(false);
  protected readonly moveDrawerOpen = signal(false);
  protected readonly editDrawerOpen = signal(false);
  protected readonly editingItemId = signal<string | null>(null);
  protected readonly editName = signal('');
  protected readonly editAmount = signal('');
  protected readonly editCategory = signal<string>('Other');
  protected readonly editDestinationId = signal<string | null>(null);
  protected readonly savingEditedItem = signal(false);
  protected readonly loadingSections = [1, 2, 3];
  protected readonly categoryOptions: UiSelectOption[] = GROCERY_CATEGORIES.map((category) => ({
    value: category,
    label: category
  }));

  protected readonly selectedStartsOn = computed(() => toLocalDateKey(this.selectedWeek()));
  protected readonly weekNavigationLabel = computed(() =>
    mealPlanWeekNavigationLabel(this.selectedWeek())
  );
  protected readonly destinationOptions = computed<UiSelectOption[]>(() =>
    (this.board()?.destinations ?? []).map((destination) => ({
      value: destination.id,
      label: destination.name
    }))
  );
  protected readonly assignmentDestination = computed(() => {
    const destinationId = this.assignmentDestinationId();
    return destinationId
      ? this.board()?.destinations.find((destination) => destination.id === destinationId) ?? null
      : null;
  });
  protected readonly activeDestination = computed(() => {
    const destinationId = this.activeDestinationId();
    return destinationId === 'all'
      ? null
      : this.board()?.destinations.find((destination) => destination.id === destinationId) ?? null;
  });
  protected readonly hasMealPlanItems = computed(() =>
    (this.board()?.items ?? []).some((item) => item.sourceKind === 'meal_plan')
  );
  protected readonly itemsInActiveList = computed(() => {
    const items = this.board()?.items ?? [];
    const assignmentDestinationId = this.assignmentDestinationId();
    if (assignmentDestinationId) {
      return items.filter((item) => item.destinationId !== assignmentDestinationId);
    }
    const destinationId = this.activeDestinationId();
    return destinationId === 'all'
      ? items
      : items.filter((item) => item.destinationId === destinationId);
  });
  protected readonly completedItemCount = computed(
    () => this.itemsInActiveList().filter((item) => !!item.gottenAt).length
  );
  protected readonly categoryGroups = computed<GroceryGroup[]>(() => {
    const items = this.itemsInActiveList();
    const grouped = new Map<string, GroceryItem[]>();

    for (const item of items) {
      const group = grouped.get(item.category) ?? [];
      group.push(item);
      grouped.set(item.category, group);
    }

    return [...grouped.entries()]
      .sort(([left], [right]) => this.categoryRank(left) - this.categoryRank(right) || left.localeCompare(right))
      .map(([category, groupItems]) => ({
        category,
        remaining: groupItems
          .filter((item) => !item.gottenAt)
          .sort((left, right) => left.name.localeCompare(right.name)),
        completed: groupItems
          .filter((item) => item.gottenAt)
          .sort((left, right) => left.name.localeCompare(right.name))
      }));
  });

  ngOnInit(): void {
    void this.loadWeek();
  }

  protected moveWeek(amount: number): void {
    this.selectedWeek.set(addMealPlanWeeks(this.selectedWeek(), amount));
    this.resetViewState();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { week: this.selectedStartsOn() },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    void this.loadWeek();
  }

  protected async addMealPlanGroceries(): Promise<void> {
    this.syncing.set(true);
    this.error.set(null);
    try {
      const board = await this.groceries.syncFromMealPlan(this.selectedStartsOn());
      this.board.set(board);
      if (!board.items.some((item) => item.sourceKind === 'meal_plan')) {
        this.toast.info('No meal-plan ingredients were found for this week.');
      }
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.syncing.set(false);
    }
  }

  protected async setGotten(item: GroceryItem, gotten: boolean): Promise<void> {
    this.updatingItemId.set(item.id);
    this.error.set(null);
    try {
      await this.groceries.setGotten(item.id, gotten);
      if (gotten && !this.showGottenItems()) {
        this.recentlyGottenItemIds.update((current) => new Set(current).add(item.id));
      }
      this.board.update((board) =>
        board
          ? {
              ...board,
              items: board.items.map((candidate) =>
                candidate.id === item.id
                  ? { ...candidate, gottenAt: gotten ? new Date().toISOString() : null }
                  : candidate
              )
            }
          : board
      );
      if (gotten && !this.showGottenItems()) {
        window.setTimeout(() => {
          this.recentlyGottenItemIds.update((current) => {
            const next = new Set(current);
            next.delete(item.id);
            return next;
          });
        }, 80);
      } else if (!gotten) {
        this.recentlyGottenItemIds.update((current) => {
          const next = new Set(current);
          next.delete(item.id);
          return next;
        });
      }
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.updatingItemId.set(null);
    }
  }

  protected toggleSelecting(): void {
    if (this.selecting()) {
      this.cancelSelecting();
      return;
    }

    if (this.activeDestinationId() !== 'all') {
      this.startAssigningTo(this.activeDestinationId());
      return;
    }

    this.selecting.set(true);
    this.selectedItemIds.set(new Set());
  }

  protected chooseList(destinationId: string): void {
    this.assignmentDestinationId.set(null);
    this.selecting.set(false);
    this.selectedItemIds.set(new Set());
    this.activeDestinationId.set(destinationId);
  }

  protected startAssigningTo(destinationId: string): void {
    if (!this.board()?.destinations.some((destination) => destination.id === destinationId)) return;
    this.assignmentDestinationId.set(destinationId);
    this.activeDestinationId.set('all');
    this.selecting.set(true);
    this.selectedItemIds.set(new Set());
  }

  protected cancelSelecting(): void {
    const assignmentDestinationId = this.assignmentDestinationId();
    this.assignmentDestinationId.set(null);
    this.selecting.set(false);
    this.selectedItemIds.set(new Set());
    if (assignmentDestinationId) this.activeDestinationId.set(assignmentDestinationId);
  }

  protected visibleGroupItems(group: GroceryGroup): GroceryItem[] {
    if (this.showGottenItems()) return [...group.remaining, ...group.completed];

    const recentlyGottenIds = this.recentlyGottenItemIds();
    return [
      ...group.remaining,
      ...group.completed.filter((item) => recentlyGottenIds.has(item.id))
    ].sort((left, right) => left.name.localeCompare(right.name));
  }

  protected toggleItemSelection(itemId: string): void {
    if (!this.selecting()) return;
    this.selectedItemIds.update((current) => {
      const next = new Set(current);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  }

  protected async moveSelectedItems(destinationId: string | null): Promise<void> {
    const itemIds = [...this.selectedItemIds()];
    if (itemIds.length === 0) return;
    try {
      await this.groceries.assignDestination(itemIds, destinationId);
      this.board.update((board) =>
        board
          ? {
              ...board,
              items: board.items.map((item) =>
                this.selectedItemIds().has(item.id) ? { ...item, destinationId } : item
              )
            }
          : board
      );
      this.moveDrawerOpen.set(false);
      this.assignmentDestinationId.set(null);
      this.selecting.set(false);
      this.selectedItemIds.set(new Set());
      this.activeDestinationId.set(destinationId ?? 'all');
    } catch (error) {
      this.error.set(this.errorMessage(error));
    }
  }

  protected selectedItemsAlreadyIn(destinationId: string | null): boolean {
    const selectedIds = this.selectedItemIds();
    if (selectedIds.size === 0) return false;

    return (this.board()?.items ?? [])
      .filter((item) => selectedIds.has(item.id))
      .every((item) => item.destinationId === destinationId);
  }

  protected openManualItem(): void {
    this.manualName.set('');
    this.manualAmount.set('');
    this.manualCategory.set('Other');
    this.manualDestinationId.set(
      this.activeDestinationId() === 'all' ? null : this.activeDestinationId()
    );
    this.manualDrawerOpen.set(true);
    void this.loadIngredientSuggestions();
  }

  protected openEditItem(item: GroceryItem): void {
    this.editingItemId.set(item.id);
    this.editName.set(item.name);
    this.editAmount.set(this.amount(item) ?? '');
    this.editCategory.set(item.category);
    this.editDestinationId.set(item.destinationId);
    this.editDrawerOpen.set(true);
    void this.loadIngredientSuggestions();
  }

  protected async saveEditedItem(): Promise<void> {
    const itemId = this.editingItemId();
    if (!itemId || !this.editName().trim() || this.savingEditedItem()) return;

    const update = {
      name: this.editName().trim(),
      category: this.editCategory(),
      amountText: this.editAmount().trim() || null,
      destinationId: this.editDestinationId()
    };

    this.savingEditedItem.set(true);
    try {
      await this.groceries.updateItem(itemId, update);
      this.board.update((board) =>
        board
          ? {
              ...board,
              items: board.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      name: update.name,
                      category: update.category,
                      amountText: update.amountText,
                      destinationId: update.destinationId
                    }
                  : item
              )
            }
          : board
      );
      this.editDrawerOpen.set(false);
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.savingEditedItem.set(false);
    }
  }

  protected async saveManualItem(): Promise<void> {
    if (!this.manualName().trim() || this.savingManualItem()) return;
    this.savingManualItem.set(true);
    try {
      await this.groceries.addManualItem({
        startsOn: this.selectedStartsOn(),
        name: this.manualName(),
        category: this.manualCategory(),
        amountText: this.manualAmount(),
        destinationId: this.manualDestinationId()
      });
      this.board.set(await this.groceries.getWeek(this.selectedStartsOn()));
      this.manualDrawerOpen.set(false);
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.savingManualItem.set(false);
    }
  }

  protected openListDrawer(): void {
    this.newListName.set('');
    this.listDrawerOpen.set(true);
  }

  protected async saveList(): Promise<void> {
    if (!this.newListName().trim() || this.savingList()) return;
    this.savingList.set(true);
    try {
      const destination = await this.groceries.createDestination(this.newListName());
      this.board.update((board) =>
        board
          ? {
              ...board,
              destinations: [...board.destinations, destination].sort((left, right) =>
                left.name.localeCompare(right.name)
              )
            }
          : board
      );
      this.listDrawerOpen.set(false);
      this.startAssigningTo(destination.id);
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.savingList.set(false);
    }
  }

  protected async deleteList(): Promise<void> {
    const destination = this.listToDelete();
    if (!destination || this.deletingList()) return;

    this.deletingList.set(true);
    this.error.set(null);
    try {
      await this.groceries.deleteDestination(destination.id);
      this.board.update((board) =>
        board
          ? {
              ...board,
              destinations: board.destinations.filter((item) => item.id !== destination.id),
              items: board.items.map((item) =>
                item.destinationId === destination.id ? { ...item, destinationId: null } : item
              )
            }
          : board
      );
      this.listToDelete.set(null);
      this.cancelSelecting();
      this.activeDestinationId.set('all');
      this.toast.success(`${destination.name} deleted.`);
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.deletingList.set(false);
    }
  }

  protected destinationName(destinationId: string | null): string | null {
    if (!destinationId) return null;
    return this.board()?.destinations.find((destination) => destination.id === destinationId)?.name ?? null;
  }

  protected amount(item: GroceryItem): string | null {
    if (item.amountText) return item.amountText;
    const quantity = formatRecipeQuantity(item.quantity);
    return quantity ? [quantity, item.unit].filter(Boolean).join(' ') : item.unit;
  }

  protected categoryId(category: string): string {
    return `grocery-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  }

  protected selectionLabel(item: GroceryItem): string {
    return `${this.selectedItemIds().has(item.id) ? 'Deselect' : 'Select'} ${item.name}`;
  }

  protected gottenLabel(item: GroceryItem): string {
    return `Mark ${item.name} as ${item.gottenAt ? 'not gotten' : 'gotten'}`;
  }

  private async loadWeek(): Promise<void> {
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.error.set(null);
    try {
      const board = await this.groceries.getWeek(this.selectedStartsOn());
      if (sequence === this.loadSequence) {
        this.board.set(board);
      }
    } catch (error) {
      if (sequence === this.loadSequence) this.error.set(this.errorMessage(error));
    } finally {
      if (sequence === this.loadSequence) this.loading.set(false);
    }
  }

  private async loadIngredientSuggestions(): Promise<void> {
    if (this.ingredientSuggestions().length > 0) return;
    try {
      this.ingredientSuggestions.set(await this.groceries.listIngredientNames());
    } catch {
      // Suggestions are optional; item entry remains fully usable without them.
    }
  }

  private resetViewState(): void {
    this.activeDestinationId.set('all');
    this.recentlyGottenItemIds.set(new Set());
    this.selecting.set(false);
    this.assignmentDestinationId.set(null);
    this.selectedItemIds.set(new Set());
  }

  private categoryRank(category: string): number {
    const index = GROCERY_CATEGORIES.indexOf(category as (typeof GROCERY_CATEGORIES)[number]);
    return index < 0 ? GROCERY_CATEGORIES.length - 1 : index;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Please try again.';
  }
}
