import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { UiButtonComponent } from '../button/ui-button.component';
import { UiWorkspaceCommandComponent } from './ui-workspace-command.component';

@Component({
  imports: [UiButtonComponent, UiWorkspaceCommandComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ui-workspace-command
      title="Recipes"
      description="Browse every item."
      [viewItems]="viewItems"
      [viewValue]="view()"
      [searchValue]="search()"
      searchLabel="Search recipes"
      searchPlaceholder="Search recipes"
      sortLabel="Updated"
      [showSelect]="false"
      [showMore]="true"
      moreAriaLabel="Open recipes view options"
      (viewValueChange)="view.set($event)"
      (searchValueChange)="search.set($event)"
      (sortRequested)="sortRequests.set(sortRequests() + 1)"
      (moreRequested)="moreRequests.set(moreRequests() + 1)"
      >
      <ui-button workspace-title-action (clicked)="addRequests.set(addRequests() + 1)">Add item</ui-button>
    </ui-workspace-command>
  `
})
class WorkspaceCommandHostComponent {
  readonly viewItems = [
    { id: 'table', label: 'Table', icon: 'list' as const },
    { id: 'cards', label: 'Cards', icon: 'grid' as const }
  ];
  readonly view = signal('table');
  readonly search = signal('');
  readonly sortRequests = signal(0);
  readonly moreRequests = signal(0);
  readonly addRequests = signal(0);
}

describe('UiWorkspaceCommandComponent', () => {
  let fixture: ComponentFixture<WorkspaceCommandHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WorkspaceCommandHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(WorkspaceCommandHostComponent);
    fixture.detectChanges();
  });

  it('owns the shared identity, presentation, and utility layout', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Recipes');
    expect(fixture.nativeElement.querySelector('.workspace-command-identity-actions').textContent).toContain('Add item');
    expect(fixture.nativeElement.querySelector('.workspace-command-toolbar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Select"]')).toBeNull();
    const more = fixture.nativeElement.querySelector('[aria-label="Open recipes view options"]') as HTMLButtonElement;
    expect(more).not.toBeNull();
    more.click();
    expect(fixture.componentInstance.moreRequests()).toBe(1);
  });

  it('keeps identity and utility buttons on the shared compact action height', () => {
    const identityButton = fixture.nativeElement.querySelector('.workspace-command-identity-actions .ui-button') as HTMLElement;
    const utilityButton = fixture.nativeElement.querySelector('.workspace-command-utilities .ui-button') as HTMLElement;

    expect(getComputedStyle(identityButton).minHeight).toBe('26px');
    expect(getComputedStyle(utilityButton).minHeight).toBe('26px');
  });

  it('opens and autofocuses search, then keeps it rendered through the closing animation', fakeAsync(() => {
    const focus = spyOn(HTMLInputElement.prototype, 'focus').and.callThrough();
    const searchTrigger = fixture.nativeElement.querySelector('[aria-label="Search recipes"]') as HTMLButtonElement;
    searchTrigger.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    expect(focus).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.workspace-command-utilities--searching')).not.toBeNull();

    input.value = 'camera';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.search()).toBe('camera');

    const close = fixture.nativeElement.querySelector('[aria-label="Close search recipes"]') as HTMLButtonElement;
    close.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.search()).toBe('');
    expect(fixture.nativeElement.querySelector('.workspace-command-search-expanded')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.workspace-command-utilities--searching')).not.toBeNull();

    tick(220);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.workspace-command-search-expanded')).toBeNull();
    expect(fixture.nativeElement.querySelector('.workspace-command-utilities--searching')).toBeNull();
  }));
});
