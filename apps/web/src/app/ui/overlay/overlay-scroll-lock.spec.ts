import { acquireOverlayScrollLock, releaseOverlayScrollLock } from './overlay-scroll-lock';

const LOCK_CLASS = 'ui-overlay-scroll-locked';
const OFFSET_VAR = '--ui-overlay-scroll-lock-offset';
const SCROLLBAR_VAR = '--ui-overlay-scroll-lock-scrollbar-width';

describe('overlayScrollLock', () => {
  let originalClientWidth: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalClientWidth = Object.getOwnPropertyDescriptor(document.documentElement, 'clientWidth');
  });

  afterEach(() => {
    while (document.body.classList.contains(LOCK_CLASS)) {
      releaseOverlayScrollLock();
    }

    if (originalClientWidth) {
      Object.defineProperty(document.documentElement, 'clientWidth', originalClientWidth);
    }
  });

  it('applies scroll lock classes and restores the original scroll position', () => {
    spyOnProperty(window, 'scrollY', 'get').and.returnValue(240);
    spyOnProperty(window, 'scrollX', 'get').and.returnValue(12);
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1200);
    spyOn(window, 'scrollTo');
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 1184
    });

    acquireOverlayScrollLock();

    expect(document.documentElement.classList.contains(LOCK_CLASS)).toBeTrue();
    expect(document.body.classList.contains(LOCK_CLASS)).toBeTrue();
    expect(document.body.style.getPropertyValue(OFFSET_VAR)).toBe('240px');
    expect(document.body.style.getPropertyValue(SCROLLBAR_VAR)).toBe('16px');

    releaseOverlayScrollLock();

    expect(document.documentElement.classList.contains(LOCK_CLASS)).toBeFalse();
    expect(document.body.classList.contains(LOCK_CLASS)).toBeFalse();
    expect(document.body.style.getPropertyValue(OFFSET_VAR)).toBe('');
    expect(document.body.style.getPropertyValue(SCROLLBAR_VAR)).toBe('');
    expect(window.scrollTo).toHaveBeenCalledWith(12, 240);
  });

  it('keeps the page locked until the final nested release', () => {
    spyOn(window, 'scrollTo');

    acquireOverlayScrollLock();
    acquireOverlayScrollLock();

    releaseOverlayScrollLock();

    expect(document.body.classList.contains(LOCK_CLASS)).toBeTrue();
    expect(window.scrollTo).not.toHaveBeenCalled();

    releaseOverlayScrollLock();

    expect(document.body.classList.contains(LOCK_CLASS)).toBeFalse();
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });
});
