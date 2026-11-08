import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UiChipComponent } from '../chip/ui-chip.component';
import { UiDrawerComponent } from '../drawer/ui-drawer.component';
import { UiPopoverComponent } from './ui-popover.component';

@Component({
    imports: [UiChipComponent, UiPopoverComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <ui-popover triggerLabel="More actions" panelLabel="Action menu" panelRole="menu">
      <ui-chip
        popover-trigger
        class="ui-popover-chip-trigger"
        size="xs"
        variant="subtle"
        [interactive]="false"
        label="More categories"
        [count]="5"
        iconTrailing="chevron-down"
      ></ui-chip>
      <div popover-panel>
        <button type="button">First action</button>
        <button type="button">Second action</button>
      </div>
    </ui-popover>
  `
})
class PopoverHostComponent {}

@Component({
    imports: [UiPopoverComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <ui-popover
      placement="top-start"
      panelClass="ui-popover-panel--contrast"
      triggerLabel="Show guidance"
      panelLabel="Guidance"
    >
      <span popover-trigger>Guidance</span>
      <p popover-panel>Supported links</p>
    </ui-popover>
  `
})
class ContrastPopoverHostComponent {}

@Component({
    imports: [UiDrawerComponent, UiPopoverComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <ui-drawer [open]="drawerOpen" title="Manage categories" (openChange)="drawerOpen = $event">
      <button type="button" data-testid="drawer-content">Drawer content</button>
      <ui-popover triggerLabel="Category options" panelLabel="Category options">
        <span popover-trigger>Options</span>
        <button type="button" popover-panel>Rename category</button>
      </ui-popover>
    </ui-drawer>
  `
})
class DrawerPopoverHostComponent {
  drawerOpen = true;
}

describe('UiPopoverComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopoverHostComponent, ContrastPopoverHostComponent, DrawerPopoverHostComponent]
    }).compileComponents();
  });

  it('opens from ArrowDown and focuses the first action', fakeAsync(() => {
    const fixture = TestBed.createComponent(PopoverHostComponent);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ui-popover-trigger') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll('.ui-popover-panel button') as NodeListOf<HTMLButtonElement>;
    expect(actions.length).toBe(2);
    expect(document.activeElement).toBe(actions[0]);
  }));

  it('composes a chip trigger without nesting interactive elements', () => {
    const fixture = TestBed.createComponent(PopoverHostComponent);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ui-popover-trigger') as HTMLButtonElement;

    expect(trigger.querySelector('.ui-chip')?.textContent).toContain('More categories');
    expect(trigger.querySelector('.ui-chip-count')?.textContent).toContain('5');
    expect(trigger.querySelector('button')).toBeNull();
  });

  it('closes on Escape and restores focus to the trigger', fakeAsync(() => {
    const fixture = TestBed.createComponent(PopoverHostComponent);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ui-popover-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    tick(180);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-popover-panel')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  }));

  it('supports an upward contrast panel', () => {
    const fixture = TestBed.createComponent(ContrastPopoverHostComponent);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ui-popover-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-popover--top-start')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ui-popover-panel--contrast')).not.toBeNull();
  });

  it('flips alignment and clamps a newly opened panel inside the viewport', fakeAsync(() => {
    const fixture = TestBed.createComponent(PopoverHostComponent);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ui-popover-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const popover = fixture.nativeElement.querySelector('.ui-popover') as HTMLElement;
    const panel = fixture.nativeElement.querySelector('.ui-popover-panel') as HTMLElement;
    spyOn(popover, 'getBoundingClientRect').and.returnValue({
      left: 8,
      right: 72,
      top: 100,
      bottom: 132,
      width: 64,
      height: 32,
      x: 8,
      y: 100,
      toJSON: () => ({})
    });
    spyOnProperty(panel, 'offsetWidth', 'get').and.returnValue(224);
    spyOnProperty(panel, 'offsetHeight', 'get').and.returnValue(200);

    tick(16);

    expect(panel.style.left).toBe('8px');
    expect(panel.style.right).toBe('auto');
  }));

  it('closes from a click elsewhere inside a drawer without closing the drawer', fakeAsync(() => {
    const fixture = TestBed.createComponent(DrawerPopoverHostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ui-popover-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    tick(16);

    const drawerContent = fixture.nativeElement.querySelector('[data-testid="drawer-content"]') as HTMLButtonElement;
    drawerContent.click();
    tick(180);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-popover-panel')).toBeNull();
    expect(fixture.nativeElement.querySelector('.ui-drawer')).not.toBeNull();
    expect(fixture.componentInstance.drawerOpen).toBeTrue();
  }));

  it('lets Escape close the top popover without closing its drawer', fakeAsync(() => {
    const fixture = TestBed.createComponent(DrawerPopoverHostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ui-popover-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    tick(16);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    tick(180);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-popover-panel')).toBeNull();
    expect(fixture.nativeElement.querySelector('.ui-drawer')).not.toBeNull();
    expect(fixture.componentInstance.drawerOpen).toBeTrue();
  }));
});
