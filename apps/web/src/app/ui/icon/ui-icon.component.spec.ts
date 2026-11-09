import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiIconComponent } from './ui-icon.component';

describe('UiIconComponent', () => {
  let fixture: ComponentFixture<UiIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiIconComponent] }).compileComponents();
    fixture = TestBed.createComponent(UiIconComponent);
    fixture.componentRef.setInput('name', 'star');
  });

  it('renders an explicitly filled icon state', () => {
    fixture.componentRef.setInput('filled', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('svg').classList).toContain('ui-icon--filled');
  });
});
