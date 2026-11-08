import { TestBed } from '@angular/core/testing';
import { UiCheckboxComponent } from './ui-checkbox.component';

describe('UiCheckboxComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiCheckboxComponent]
    }).compileComponents();
  });

  it('keeps native checkbox semantics behind the styled control', () => {
    const fixture = TestBed.createComponent(UiCheckboxComponent);
    fixture.componentRef.setInput('label', 'Include uncategorized');
    fixture.componentRef.setInput('checked', true);
    fixture.componentRef.setInput('count', 27);
    fixture.detectChanges();

    const field = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const control = fixture.nativeElement.querySelector('.ui-checkbox-control') as HTMLElement;

    expect(field.checked).toBeTrue();
    expect(control).not.toBeNull();
    expect(control.querySelector('ui-icon')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ui-checkbox-label')?.textContent).toContain('Include uncategorized');
    expect(fixture.nativeElement.querySelector('.ui-checkbox-count')?.textContent).toContain('27');
  });

  it('emits checked changes from the native field', () => {
    const fixture = TestBed.createComponent(UiCheckboxComponent);
    fixture.componentRef.setInput('label', 'Include uncategorized');
    fixture.detectChanges();

    let nextChecked: boolean | undefined;
    fixture.componentInstance.checkedChange.subscribe((checked) => {
      nextChecked = checked;
    });

    const field = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    field.checked = true;
    field.dispatchEvent(new Event('change'));

    expect(nextChecked).toBeTrue();
  });
});
