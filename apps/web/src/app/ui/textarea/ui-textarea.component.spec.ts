import { TestBed } from '@angular/core/testing';
import { UiTextareaComponent } from './ui-textarea.component';

describe('UiTextareaComponent', () => {
  it('keeps an empty auto-grow field at its declared row height', async () => {
    await TestBed.configureTestingModule({ imports: [UiTextareaComponent] }).compileComponents();
    const fixture = TestBed.createComponent(UiTextareaComponent);
    fixture.componentRef.setInput('label', 'Description');
    fixture.componentRef.setInput('rows', 2);
    fixture.componentRef.setInput('autoGrow', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const emptyHeight = Number.parseFloat(field.style.height);
    field.value = 'd';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(emptyHeight).toBeGreaterThan(0);
    expect(Number.parseFloat(field.style.height)).toBe(emptyHeight);
  });
});
