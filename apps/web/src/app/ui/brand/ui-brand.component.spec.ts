import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiBrandComponent } from './ui-brand.component';

describe('UiBrandComponent', () => {
  let fixture: ComponentFixture<UiBrandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiBrandComponent] }).compileComponents();
    fixture = TestBed.createComponent(UiBrandComponent);
  });

  it('renders the Meal Planner mark and name', () => {
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.ui-brand-mark')?.textContent).toBe('M');
    expect(element.querySelector('.ui-brand-name')?.textContent).toBe('Meal Planner');
  });

  it('supports the compact header size', () => {
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    expect(fixture.nativeElement.classList).toContain('ui-brand--sm');
  });
});
