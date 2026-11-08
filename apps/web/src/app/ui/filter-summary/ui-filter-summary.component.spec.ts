import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiFilterChip } from '../ui-types';
import { UiFilterSummaryComponent } from './ui-filter-summary.component';

describe('UiFilterSummaryComponent', () => {
  let fixture: ComponentFixture<UiFilterSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiFilterSummaryComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiFilterSummaryComponent);
  });

  it('keeps status-only filters non-interactive', () => {
    fixture.componentRef.setInput('chips', [{ text: 'Status: Needs review', variant: 'warning' }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ui-badge')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ui-chip-remove')).toBeNull();
  });

  it('emits the selected filter when a removable chip is cleared', () => {
    const chip: UiFilterChip = {
      id: 'color-family:Pink',
      text: 'Color family: Pink',
      removable: true
    };
    let removed: UiFilterChip | undefined;

    fixture.componentRef.setInput('chips', [chip]);
    fixture.componentInstance.chipRemoved.subscribe((value) => {
      removed = value;
    });
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.ui-chip-remove') as HTMLButtonElement).click();

    expect(removed).toEqual(chip);
  });

  it('uses the dense chip size for compact applied-filter summaries', () => {
    fixture.componentRef.setInput('chips', [{ text: 'Condition: Good', removable: true }]);
    fixture.componentRef.setInput('density', 'compact');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-chip--xs')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ui-chip--subtle')).not.toBeNull();
  });

  it('matches selected workspace chips at the default density', () => {
    fixture.componentRef.setInput('chips', [{ text: 'Category: Thread', removable: true }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-chip--sm.ui-chip--neutral.ui-chip--selected')).not.toBeNull();
  });
});
