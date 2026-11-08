import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiToastComponent, UiToastVariant } from './ui-toast.component';

describe('UiToastComponent', () => {
  let fixture: ComponentFixture<UiToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiToastComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiToastComponent);
    fixture.componentRef.setInput('message', 'Notification message');
  });

  it('renders the system title and status class for every supported variant', () => {
    const expectations: Array<[UiToastVariant, string]> = [
      ['success', 'Success'],
      ['info', 'Update'],
      ['warning', 'Attention'],
      ['danger', 'Issue']
    ];

    for (const [variant, title] of expectations) {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();

      const toast = fixture.nativeElement.querySelector('.ui-toast') as HTMLElement;

      expect(toast.classList.contains(`ui-toast--${variant}`)).toBeTrue();
      expect(toast.querySelector('.ui-toast-title')?.textContent).toContain(title);
      expect(toast.querySelector('.ui-toast-message')?.textContent).toContain('Notification message');
    }
  });

  it('uses alert semantics for an issue and emits dismissal requests', () => {
    const dismissed = jasmine.createSpy('dismissed');
    fixture.componentRef.setInput('variant', 'danger');
    fixture.componentInstance.dismissed.subscribe(dismissed);
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.ui-toast') as HTMLElement;
    const dismissButton = fixture.nativeElement.querySelector('.ui-toast-dismiss') as HTMLButtonElement;

    expect(toast.getAttribute('role')).toBe('alert');
    dismissButton.click();
    expect(dismissed).toHaveBeenCalled();
  });

  it('renders and emits an optional action', () => {
    const actionClicked = jasmine.createSpy('actionClicked');
    fixture.componentRef.setInput('actionLabel', 'Undo');
    fixture.componentInstance.actionClicked.subscribe(actionClicked);
    fixture.detectChanges();

    const action = fixture.nativeElement.querySelector('.ui-toast-action') as HTMLButtonElement;
    expect(action.textContent).toContain('Undo');
    action.click();
    expect(actionClicked).toHaveBeenCalled();
  });
});
