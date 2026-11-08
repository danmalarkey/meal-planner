import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UiSelectComponent } from './ui-select.component';

@Component({
  imports: [UiSelectComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="ui-drawer-body">
      <ui-select
        label="Purchase price currency"
        placeholder="Not recorded"
        [options]="options"
      ></ui-select>
    </div>
  `
})
class DrawerSelectHostComponent {
  readonly options = Array.from({ length: 30 }, (_, index) => ({
    value: `C${index}`,
    label: `Currency ${index}`
  }));
}

describe('UiSelectComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiSelectComponent, DrawerSelectHostComponent]
    }).compileComponents();
  });

  it('opens from ArrowDown and focuses the selected option', fakeAsync(() => {
    const fixture = TestBed.createComponent(UiSelectComponent);
    fixture.componentRef.setInput('label', 'Category');
    fixture.componentRef.setInput('value', 'watch');
    fixture.componentRef.setInput('options', [
      { value: 'camera', label: 'Camera' },
      { value: 'watch', label: 'Watch' },
      { value: 'record', label: 'Record' }
    ]);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ui-popover-trigger') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const selectedOption = fixture.nativeElement.querySelector(
      '.ui-select-option[aria-selected="true"]'
    ) as HTMLButtonElement | null;

    expect(selectedOption?.textContent).toContain('Watch');
    expect(document.activeElement).toBe(selectedOption);
  }));

  it('keeps long drawer menus above surrounding content and scrolls options internally', () => {
    const fixture = TestBed.createComponent(DrawerSelectHostComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.ui-popover-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const popover = fixture.nativeElement.querySelector('.ui-popover') as HTMLElement;
    const panel = fixture.nativeElement.querySelector('.ui-popover-panel--select-menu') as HTMLElement;
    const options = fixture.nativeElement.querySelector('.ui-select-menu-options') as HTMLElement;

    expect(getComputedStyle(popover).zIndex).toBe('100');
    expect(getComputedStyle(options).overflowY).toBe('auto');
    expect(getComputedStyle(panel).maxHeight).not.toBe('none');
  });
});
