export type UiSize = 'sm' | 'md' | 'lg';
export type UiButtonSize = 'xs' | UiSize;
export type UiChipSize = 'xs' | UiSize;
export type UiChipVariant = 'neutral' | 'primary' | 'subtle' | 'ghost';

export type UiButtonVariant =
  | 'primary'
  | 'primary-soft'
  | 'primary-elevated'
  | 'secondary'
  | 'secondary-elevated'
  | 'ghost'
  | 'edit-ghost'
  | 'destructive'
  | 'link';

export type UiIconButtonVariant = 'secondary' | 'ghost' | 'destructive';

export type UiIconPosition = 'leading' | 'trailing';

export type UiStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type UiCardVariant = 'surface' | 'group';
export type UiCardAppearance = 'default' | 'shadow' | 'floating';

export type UiIconName =
  | 'add'
  | 'archive'
  | 'camera'
  | 'check'
  | 'close'
  | 'copy'
  | 'credit-card'
  | 'edit'
  | 'enter'
  | 'external-link'
  | 'scan'
  | 'check-circle'
  | 'chevron-down'
  | 'chevron-right'
  | 'filter'
  | 'film'
  | 'grid'
  | 'help'
  | 'home'
  | 'image-list'
  | 'list'
  | 'more'
  | 'music'
  | 'settings'
  | 'sign-out'
  | 'search'
  | 'sort'
  | 'sort-asc'
  | 'sort-desc'
  | 'sort-none'
  | 'sparkles'
  | 'star'
  | 'trend'
  | 'user'
  | 'warning';

export type UiBreadcrumbItem = {
  label: string;
  path?: string;
};

export type UiSegmentedItem = {
  id: string;
  label: string;
  icon?: UiIconName;
  disabled?: boolean;
};

export type UiSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type UiRadioOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type UiFilterChip = {
  id?: string;
  text: string;
  variant?: UiStatus;
  removable?: boolean;
  removeAriaLabel?: string;
};

export type UiTableBadge = {
  text: string;
  variant?: UiStatus;
};

export type UiTableChip = {
  text: string;
};

export type UiTableLink = {
  label: string;
  url: string;
  ariaLabel?: string;
  appearance?: 'link' | 'button';
};

export type UiDataStripItem = {
  label: string;
  value: string;
  valueMeta?: string;
  description?: string;
};

export type UiTableVariant = 'default' | 'reference' | 'embedded';

export type UiTableColumn<RowData> = {
  id: string;
  label: string;
  sortable?: boolean;
  width?: string;
  cellType?: 'text' | 'code' | 'media' | 'action' | 'badges' | 'chips' | 'links';
  nowrap?: boolean;
  value?: (row: RowData) => string;
  description?: (row: RowData) => string;
  imageUrl?: (row: RowData) => string | null | undefined;
  swatchColor?: (row: RowData) => string | null | undefined;
  action?: (row: RowData) => void;
  actionAvailable?: (row: RowData) => boolean;
  actionDisabled?: (row: RowData) => boolean;
  badges?: (row: RowData) => UiTableBadge[];
  chips?: (row: RowData) => UiTableChip[];
  links?: (row: RowData) => UiTableLink[];
};

export type UiTableSortDirection = 'asc' | 'desc';

export type UiTableSort = {
  columnId: string;
  direction: UiTableSortDirection;
};
