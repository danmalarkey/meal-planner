import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  LucideArchive,
  LucideArrowDown,
  LucideArrowDownWideNarrow,
  LucideArrowUp,
  LucideArrowUpDown,
  LucideCamera,
  LucideCheck,
  LucideChevronDown,
  LucideChevronRight,
  LucideCircleHelp,
  LucideCircleCheck,
  LucideCopy,
  LucideCookingPot,
  LucideCornerDownLeft,
  LucideCreditCard,
  LucideExternalLink,
  LucideFilm,
  LucideFunnel,
  LucideLayoutGrid,
  LucideHome,
  LucideDynamicIcon,
  LucideImage,
  LucideList,
  LucideLogOut,
  LucideMoreVertical,
  LucideMusic,
  LucidePlus,
  LucideScanLine,
  LucideSearch,
  LucideSettings,
  LucideSparkles,
  LucideSquarePen,
  LucideStar,
  LucideTrendingUp,
  LucideTriangleAlert,
  LucideUser,
  LucideX,
  type LucideIconData
} from '@lucide/angular';
import { UiIconName, UiSize } from '../ui-types';

export const UI_ICONS: Record<UiIconName, LucideIconData> = {
  add: LucidePlus.icon,
  archive: LucideArchive.icon,
  camera: LucideCamera.icon,
  check: LucideCheck.icon,
  close: LucideX.icon,
  copy: LucideCopy.icon,
  'credit-card': LucideCreditCard.icon,
  edit: LucideSquarePen.icon,
  enter: LucideCornerDownLeft.icon,
  'external-link': LucideExternalLink.icon,
  scan: LucideScanLine.icon,
  'check-circle': LucideCircleCheck.icon,
  'chevron-down': LucideChevronDown.icon,
  'chevron-right': LucideChevronRight.icon,
  filter: LucideFunnel.icon,
  film: LucideFilm.icon,
  grid: LucideLayoutGrid.icon,
  help: LucideCircleHelp.icon,
  home: LucideHome.icon,
  'image-list': LucideImage.icon,
  list: LucideList.icon,
  more: LucideMoreVertical.icon,
  music: LucideMusic.icon,
  recipes: LucideCookingPot.icon,
  search: LucideSearch.icon,
  settings: LucideSettings.icon,
  'sign-out': LucideLogOut.icon,
  sort: LucideArrowDownWideNarrow.icon,
  'sort-asc': LucideArrowUp.icon,
  'sort-desc': LucideArrowDown.icon,
  'sort-none': LucideArrowUpDown.icon,
  sparkles: LucideSparkles.icon,
  star: LucideStar.icon,
  trend: LucideTrendingUp.icon,
  user: LucideUser.icon,
  warning: LucideTriangleAlert.icon
};

@Component({
  selector: 'ui-icon',
  imports: [LucideDynamicIcon],
    host: {
        '[class.ui-icon-host--sm]': "size() === 'sm'",
        '[class.ui-icon-host--lg]': "size() === 'lg'"
    },
    template: `
    <svg
      [lucideIcon]="icon()"
      class="ui-icon"
      [class.ui-icon--sm]="size() === 'sm'"
      [class.ui-icon--lg]="size() === 'lg'"
      [class.ui-icon--filled]="filled()"
      [size]="iconSize()"
      [strokeWidth]="1.75"
      [title]="decorative() ? null : ariaLabel()"
      [attr.role]="decorative() ? null : 'img'"
      [attr.aria-label]="decorative() ? null : ariaLabel()"
    ></svg>
  `,
    styleUrl: './ui-icon.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiIconComponent {
  readonly name = input.required<UiIconName>();
  readonly size = input<UiSize>('md');
  readonly filled = input(false);
  readonly decorative = input(true);
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly icon = computed(() => UI_ICONS[this.name()]);

  protected readonly iconSize = computed(() => {
    switch (this.size()) {
      case 'sm':
        return 16;
      case 'lg':
        return 24;
      default:
        return 20;
    }
  });
}
