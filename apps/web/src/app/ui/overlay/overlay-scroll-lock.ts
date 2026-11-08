let overlayScrollLockCount = 0;
const OVERLAY_SCROLL_LOCK_CLASS = 'ui-overlay-scroll-locked';
const OVERLAY_SCROLL_LOCK_OFFSET_VAR = '--ui-overlay-scroll-lock-offset';
const OVERLAY_SCROLL_LOCK_SCROLLBAR_VAR = '--ui-overlay-scroll-lock-scrollbar-width';

let overlayScrollTop = 0;
let overlayScrollLeft = 0;
let overlayScrollbarWidth = 0;

function hasDocument(): boolean {
  return typeof document !== 'undefined' && !!document.documentElement && !!document.body;
}

function applyOverlayScrollLock(): void {
  if (!hasDocument()) {
    return;
  }

  overlayScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  overlayScrollLeft = window.scrollX || document.documentElement.scrollLeft || 0;
  overlayScrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);

  document.documentElement.classList.add(OVERLAY_SCROLL_LOCK_CLASS);
  document.body.classList.add(OVERLAY_SCROLL_LOCK_CLASS);
  document.body.style.setProperty(OVERLAY_SCROLL_LOCK_OFFSET_VAR, `${overlayScrollTop}px`);
  document.body.style.setProperty(OVERLAY_SCROLL_LOCK_SCROLLBAR_VAR, `${overlayScrollbarWidth}px`);
}

function removeOverlayScrollLock(): void {
  if (!hasDocument()) {
    return;
  }

  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.classList.remove(OVERLAY_SCROLL_LOCK_CLASS);
  document.body.classList.remove(OVERLAY_SCROLL_LOCK_CLASS);
  document.body.style.removeProperty(OVERLAY_SCROLL_LOCK_OFFSET_VAR);
  document.body.style.removeProperty(OVERLAY_SCROLL_LOCK_SCROLLBAR_VAR);
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(overlayScrollLeft, overlayScrollTop);
  document.documentElement.style.scrollBehavior = previousScrollBehavior;

  overlayScrollTop = 0;
  overlayScrollLeft = 0;
  overlayScrollbarWidth = 0;
}

export function acquireOverlayScrollLock(): void {
  if (!hasDocument()) {
    return;
  }

  overlayScrollLockCount += 1;

  if (overlayScrollLockCount === 1) {
    applyOverlayScrollLock();
  }
}

export function releaseOverlayScrollLock(): void {
  if (!hasDocument() || overlayScrollLockCount === 0) {
    return;
  }

  overlayScrollLockCount -= 1;

  if (overlayScrollLockCount === 0) {
    removeOverlayScrollLock();
  }
}
