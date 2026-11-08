import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiTabsComponent } from './ui-tabs.component';

describe('UiTabsComponent', () => {
  let fixture: ComponentFixture<UiTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiTabsComponent] }).compileComponents();
    fixture = TestBed.createComponent(UiTabsComponent);
    fixture.componentRef.setInput('items', [
      { label: 'Details', value: 'details' },
      { label: 'Organize', value: 'organize' },
      { label: 'History', value: 'history' }
    ]);
    fixture.componentRef.setInput('selected', 'details');
    fixture.componentRef.setInput('idPrefix', 'inspector');
    fixture.detectChanges();
  });

  it('connects tabs to panels and uses roving tab stops', () => {
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;

    expect(tabs[0].id).toBe('inspector-tab-details');
    expect(tabs[0].getAttribute('aria-controls')).toBe('inspector-panel-details');
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].tabIndex).toBe(-1);
  });

  it('selects and focuses the next tab with arrow keys', () => {
    const changes: string[] = [];
    fixture.componentInstance.selectedChange.subscribe((value) => changes.push(value));
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;

    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(changes).toEqual(['organize']);
    expect(document.activeElement).toBe(tabs[1]);
  });
});
