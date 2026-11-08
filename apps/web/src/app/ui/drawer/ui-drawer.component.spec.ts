import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiButtonComponent } from '../button/ui-button.component';
import { UiDrawerComponent } from './ui-drawer.component';

@Component({
    imports: [UiButtonComponent, UiDrawerComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <ui-drawer [open]="true" title="Edit item" [companionOpen]="companionOpen" companionLabel="Item photos">
      <div drawer-companion data-testid="drawer-companion-content">Larger item photo</div>
      <p data-testid="drawer-body-copy">Item details</p>
      <div drawer-footer [class.ui-drawer-actions--split]="splitActions">
        <ui-button variant="danger">Delete</ui-button>
        <ui-button variant="ghost">Cancel</ui-button>
        <ui-button variant="primary-elevated" [loading]="saving">Save changes</ui-button>
      </div>
    </ui-drawer>
  `
})
class DrawerFooterHostComponent {
  splitActions = false;
  saving = false;
  companionOpen = false;
}

@Component({
    imports: [UiDrawerComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <ui-drawer
      [open]="railOpen"
      title="Item details"
      desktopPresentation="inspector"
      (openChange)="railOpen = $event"
    >
      <p>Item rail</p>
    </ui-drawer>
    <ui-drawer [open]="editorOpen" title="Edit recipe" (openChange)="editorOpen = $event">
      <p>Recipe editor</p>
    </ui-drawer>
  `
})
class StackedDrawerHostComponent {
  railOpen = true;
  editorOpen = false;
}

describe('UiDrawerComponent', () => {
  let fixture: ComponentFixture<UiDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiDrawerComponent, StackedDrawerHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiDrawerComponent);
    fixture.componentRef.setInput('title', 'Filters');
    fixture.componentRef.setInput('open', true);
  });

  it('keeps default body padding unless the composed pattern owns its spacing', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-drawer')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ui-drawer--body-flush')).toBeNull();
  });

  it('exposes a flush body variant without changing other drawers', async () => {
    fixture.componentRef.setInput('bodyPadding', 'flush');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-drawer--body-flush')).not.toBeNull();
  });

  it('exposes a compact width for navigation drawers', async () => {
    fixture.componentRef.setInput('size', 'sm');
    fixture.componentRef.setInput('title', 'Settings');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-drawer--sm')).not.toBeNull();
  });

  it('exposes a full-height mobile presentation for long workflows', async () => {
    fixture.componentRef.setInput('mobilePresentation', 'full-height');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-drawer--mobile-full-height')).not.toBeNull();
  });

  it('uses non-modal complementary semantics for the desktop inspector presentation', async () => {
    fixture.componentRef.setInput('desktopPresentation', 'inspector');
    const drawer = fixture.componentInstance as unknown as {
      desktopViewport: { set: (matches: boolean) => void };
    };
    drawer.desktopViewport.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const inspector = fixture.nativeElement.querySelector('[role="complementary"]') as HTMLElement;
    expect(inspector).not.toBeNull();
    expect(inspector.getAttribute('aria-modal')).toBeNull();
    expect(fixture.nativeElement.querySelector('.ui-drawer-backdrop--desktop-inspector')).not.toBeNull();
  });

  it('projects drawer actions into the shared footer instead of the scrollable body', async () => {
    const hostFixture = TestBed.createComponent(DrawerFooterHostComponent);
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    hostFixture.detectChanges();

    const body = hostFixture.nativeElement.querySelector('.ui-drawer-body') as HTMLElement;
    const footer = hostFixture.nativeElement.querySelector('.ui-drawer-footer') as HTMLElement;
    const actionGroup = footer.querySelector('[drawer-footer]') as HTMLElement;

    expect(body.querySelector('[data-testid="drawer-body-copy"]')?.textContent).toContain('Item details');
    expect(body.querySelector('[drawer-footer]')).toBeNull();
    expect(actionGroup).not.toBeNull();
    expect(actionGroup.querySelectorAll('ui-button')).toHaveSize(3);
  });

  it('projects optional companion content beside the drawer without adding it to the drawer body', async () => {
    const hostFixture = TestBed.createComponent(DrawerFooterHostComponent);
    hostFixture.componentInstance.companionOpen = true;
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    hostFixture.detectChanges();

    const dialog = hostFixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const companion = dialog.querySelector('.ui-drawer-companion') as HTMLElement;
    const body = dialog.querySelector('.ui-drawer-body') as HTMLElement;

    expect(companion.getAttribute('aria-label')).toBe('Item photos');
    expect(companion.querySelector('[data-testid="drawer-companion-content"]')?.textContent).toContain(
      'Larger item photo'
    );
    expect(body.querySelector('[drawer-companion]')).toBeNull();
    expect(dialog.querySelector('.ui-drawer')).not.toBeNull();
  });

  it('applies the shared compact spacing and alignment contract', async () => {
    const hostFixture = TestBed.createComponent(DrawerFooterHostComponent);
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    hostFixture.detectChanges();

    const actionGroup = hostFixture.nativeElement.querySelector('[drawer-footer]') as HTMLElement;
    const button = actionGroup.querySelector('.ui-button') as HTMLButtonElement;
    const actionStyles = window.getComputedStyle(actionGroup);
    const buttonStyles = window.getComputedStyle(button);

    expect(actionStyles.display).toBe('flex');
    expect(actionStyles.justifyContent).toBe('flex-end');
    expect(actionStyles.gap).toBe('8px');
    expect(buttonStyles.minHeight).toBe('36px');
    expect(buttonStyles.fontSize).toBe('14px');
  });

  it('supports split action placement without changing action content or state', async () => {
    const hostFixture = TestBed.createComponent(DrawerFooterHostComponent);
    hostFixture.componentInstance.splitActions = true;
    hostFixture.componentInstance.saving = true;
    hostFixture.detectChanges();
    await hostFixture.whenStable();
    hostFixture.detectChanges();

    const actionGroup = hostFixture.nativeElement.querySelector('[drawer-footer]') as HTMLElement;
    const buttons = Array.from(actionGroup.querySelectorAll('button')) as HTMLButtonElement[];

    expect(actionGroup.classList.contains('ui-drawer-actions--split')).toBeTrue();
    expect(buttons[0].textContent?.trim()).toBe('Delete');
    expect(buttons[1].textContent?.trim()).toBe('Cancel');
    expect(buttons[2].getAttribute('aria-busy')).toBe('true');
    expect(buttons[2].querySelector('.ui-button-spinner-label')?.textContent).toContain('Loading');
    expect(buttons[2].disabled).toBeTrue();
  });

  it('lets Escape close only the top drawer in a stacked inspector flow', () => {
    const hostFixture = TestBed.createComponent(StackedDrawerHostComponent);
    hostFixture.detectChanges();

    hostFixture.componentInstance.editorOpen = true;
    hostFixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    hostFixture.detectChanges();

    expect(hostFixture.componentInstance.editorOpen).toBeFalse();
    expect(hostFixture.componentInstance.railOpen).toBeTrue();
  });
});
