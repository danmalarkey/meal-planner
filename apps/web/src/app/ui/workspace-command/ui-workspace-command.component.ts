import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';

import { UiButtonComponent } from '../button/ui-button.component';
import { UiIconButtonComponent } from '../icon-button/ui-icon-button.component';
import { UiInputComponent } from '../input/ui-input.component';
import { UiSegmentedComponent } from '../segmented/ui-segmented.component';
import { UiSegmentedItem } from '../ui-types';

const SEARCH_TRANSITION_MS = 220;

@Component({
  selector: 'ui-workspace-command',
  imports: [UiButtonComponent, UiIconButtonComponent, UiInputComponent, UiSegmentedComponent],
  template: `
    <header class="workspace-command-identity">
      <div class="workspace-command-identity-copy">
        <h1>{{ title() }}</h1>
        @if (description()) {
          <p>{{ description() }}</p>
        }
      </div>
      <div class="workspace-command-identity-actions ui-compact-actions">
        <ui-segmented
          class="workspace-command-view workspace-command-view--icons workspace-compact-view-switch"
          size="sm"
          [ariaLabel]="viewAriaLabel()"
          [items]="viewItems()"
          [value]="viewValue()"
          (valueChange)="viewValueChange.emit($event)"
        ></ui-segmented>
        <ng-content select="[workspace-title-action]"></ng-content>
      </div>
    </header>

    @if (showToolbar()) {
      <section
        class="workspace-command-toolbar"
        [class.workspace-command-toolbar--selection]="selectionMode()"
        [attr.aria-label]="toolbarAriaLabel()"
        >
        @if (selectionMode()) {
          <div class="workspace-command-selection">
            <ng-content select="[workspace-selection]"></ng-content>
          </div>
        } @else {
          <div class="workspace-command-primary">
            <ng-content select="[workspace-primary]"></ng-content>
          </div>
          <div
            class="workspace-command-utilities ui-compact-actions"
            [class.workspace-command-utilities--searching]="searchRendered()"
            (keydown.escape)="closeSearch($event)"
            >
            <ng-content select="[workspace-mobile-primary]"></ng-content>
            @if (searchRendered()) {
              <div
                class="workspace-command-search-expanded"
                [class.workspace-command-search-expanded--open]="searchVisible()"
                [attr.aria-hidden]="searchVisible() ? null : 'true'"
                >
                <ui-input
                  #searchInput
                  [label]="searchLabel()"
                  [hideLabel]="true"
                  type="search"
                  size="sm"
                  [placeholder]="searchPlaceholder()"
                  iconLeading="search"
                  [disabled]="!searchVisible()"
                  [value]="searchValue()"
                  (valueChange)="handleSearchValueChange($event)"
                ></ui-input>
                <ui-icon-button
                  class="workspace-command-search-dismiss"
                  icon="close"
                  size="sm"
                  variant="ghost"
                  [ariaLabel]="'Close ' + searchLabel().toLowerCase()"
                  tooltip="Close search"
                  (clicked)="dismissSearch()"
                ></ui-icon-button>
              </div>
            } @else {
              <ui-button
                class="workspace-command-icon-action"
                size="xs"
                variant="secondary"
                iconLeading="search"
                [ariaLabel]="searchLabel()"
                (clicked)="openSearch()"
                ><span class="ui-visually-hidden">Search</span></ui-button
              >
            }
            <ui-button
              size="xs"
              variant="secondary"
              iconLeading="sort"
              ariaHasPopup="dialog"
              [ariaExpanded]="sortExpanded()"
              [ariaLabel]="sortAriaLabel()"
              (clicked)="sortRequested.emit()"
              >{{ sortLabel() }}</ui-button
            >
            @if (showFilter()) {
              <ui-button
                size="xs"
                variant="secondary"
                iconLeading="filter"
                ariaHasPopup="dialog"
                [ariaExpanded]="filterExpanded()"
                [ariaLabel]="filterAriaLabel()"
                (clicked)="filterRequested.emit()"
                >{{ filterLabel() }}</ui-button
              >
            }
            @if (showSelect()) {
              <ui-button
                class="workspace-command-select-action"
                variant="secondary"
                size="xs"
                (clicked)="selectRequested.emit()"
                >Select</ui-button
              >
            }
            @if (showMore()) {
              <ui-button
                class="workspace-command-mobile-only"
                size="xs"
                variant="secondary"
                iconLeading="more"
                [ariaExpanded]="moreExpanded()"
                [ariaLabel]="moreAriaLabel()"
                (clicked)="moreRequested.emit()"
                >{{ moreLabel() }}</ui-button
              >
            }
            <ng-content select="[workspace-utility]"></ng-content>
          </div>
        }
      </section>
    }
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiWorkspaceCommandComponent implements OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly title = input.required<string>();
  readonly description = input('');
  readonly viewItems = input.required<UiSegmentedItem[]>();
  readonly viewValue = input.required<string>();
  readonly viewAriaLabel = input('Workspace view');
  readonly toolbarAriaLabel = input('Workspace controls');
  readonly showToolbar = input(true);
  readonly selectionMode = input(false);
  readonly searchValue = input('');
  readonly searchLabel = input('Search');
  readonly searchPlaceholder = input('Search');
  readonly sortLabel = input('Updated');
  readonly sortAriaLabel = input('Sort items');
  readonly sortExpanded = input(false);
  readonly showFilter = input(true);
  readonly filterLabel = input('Filter');
  readonly filterAriaLabel = input('Filter items');
  readonly filterExpanded = input(false);
  readonly showSelect = input(true);
  readonly showMore = input(false);
  readonly moreLabel = input('More');
  readonly moreAriaLabel = input('More workspace options');
  readonly moreExpanded = input(false);

  readonly viewValueChange = output<string>();
  readonly searchValueChange = output<string>();
  readonly sortRequested = output<void>();
  readonly filterRequested = output<void>();
  readonly selectRequested = output<void>();
  readonly moreRequested = output<void>();

  private readonly searchInput = viewChild<UiInputComponent>('searchInput');
  private readonly searchOpen = signal(false);
  private readonly searchClosing = signal(false);
  private searchCloseTimer: ReturnType<typeof window.setTimeout> | null = null;

  protected readonly searchVisible = computed(() => this.searchOpen() || this.searchValue().trim().length > 0);
  protected readonly searchRendered = computed(() => this.searchVisible() || this.searchClosing());

  protected openSearch(): void {
    this.clearSearchCloseTimer();
    this.searchClosing.set(false);
    this.searchOpen.set(true);
    this.changeDetector.detectChanges();
    this.searchInput()?.focus({ preventScroll: true });
  }

  protected closeSearch(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.dismissSearch();
  }

  protected dismissSearch(): void {
    if (this.searchValue()) {
      this.searchValueChange.emit('');
    }
    this.beginSearchClose();
  }

  protected handleSearchValueChange(value: string): void {
    const hadQuery = this.searchValue().trim().length > 0;
    this.searchValueChange.emit(value);

    if (hadQuery && !value.trim()) {
      this.beginSearchClose();
    }
  }

  private beginSearchClose(): void {
    this.searchOpen.set(false);
    this.searchClosing.set(true);
    this.clearSearchCloseTimer();

    if (typeof window === 'undefined') {
      this.searchClosing.set(false);
      return;
    }

    this.searchCloseTimer = window.setTimeout(() => {
      this.searchClosing.set(false);
      this.searchCloseTimer = null;
    }, SEARCH_TRANSITION_MS);
  }

  private clearSearchCloseTimer(): void {
    if (this.searchCloseTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.searchCloseTimer);
      this.searchCloseTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.clearSearchCloseTimer();
  }
}
