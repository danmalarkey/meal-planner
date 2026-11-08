export interface UiOverlayDismissal {
  readonly root?: HTMLElement;
  readonly dismiss: (restoreFocus: boolean) => void;
  readonly closeOnEscape: () => boolean;
  readonly closeOnOutsideClick?: () => boolean;
}

const openOverlayStack: UiOverlayDismissal[] = [];

function handleDocumentClick(event: MouseEvent): void {
  const activeOverlay = openOverlayStack[openOverlayStack.length - 1];

  if (
    activeOverlay?.root &&
    activeOverlay.closeOnOutsideClick?.() &&
    !activeOverlay.root.contains(event.target as Node)
  ) {
    activeOverlay.dismiss(false);
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') {
    return;
  }

  const activeOverlay = openOverlayStack[openOverlayStack.length - 1];

  if (!activeOverlay) {
    return;
  }

  event.stopImmediatePropagation();

  if (!activeOverlay.closeOnEscape()) {
    return;
  }

  event.preventDefault();
  activeOverlay.dismiss(true);
}

export function registerOverlayDismissal(overlay: UiOverlayDismissal): void {
  const existingIndex = openOverlayStack.indexOf(overlay);

  if (existingIndex >= 0) {
    openOverlayStack.splice(existingIndex, 1);
  }

  openOverlayStack.push(overlay);

  if (openOverlayStack.length === 1 && typeof document !== 'undefined') {
    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('keydown', handleDocumentKeydown, true);
  }
}

export function unregisterOverlayDismissal(overlay: UiOverlayDismissal): void {
  const index = openOverlayStack.indexOf(overlay);

  if (index >= 0) {
    openOverlayStack.splice(index, 1);
  }

  if (openOverlayStack.length === 0 && typeof document !== 'undefined') {
    document.removeEventListener('click', handleDocumentClick, true);
    document.removeEventListener('keydown', handleDocumentKeydown, true);
  }
}
