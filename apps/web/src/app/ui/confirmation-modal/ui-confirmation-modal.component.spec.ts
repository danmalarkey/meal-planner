import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiConfirmationModalComponent } from './ui-confirmation-modal.component';

describe('UiConfirmationModalComponent', () => {
  let fixture: ComponentFixture<UiConfirmationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiConfirmationModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiConfirmationModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('question', 'Delete item?');
    fixture.componentRef.setInput('message', 'This permanently removes the recipe from Meal Planner.');
    fixture.componentRef.setInput('confirmLabel', 'Delete item');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('keeps the question in the header and the consequence in the body', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const title = fixture.nativeElement.querySelector('.ui-modal-title') as HTMLElement;
    const message = fixture.nativeElement.querySelector('.ui-confirmation-modal-message') as HTMLElement;

    expect(title.textContent?.trim()).toBe('Delete item?');
    expect(fixture.nativeElement.querySelector('.ui-modal-description')).toBeNull();
    expect(message.textContent?.trim()).toBe('This permanently removes the recipe from Meal Planner.');
    expect(dialog.getAttribute('aria-describedby')).toBe(message.id);
    expect(dialog.classList).toContain('ui-modal--mobile-dialog');
    expect(fixture.nativeElement.querySelector('.ui-modal-backdrop--mobile-dialog')).not.toBeNull();
  });

  it('emits the shared cancel and confirm actions', () => {
    let closed = false;
    let confirmed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));
    fixture.componentInstance.confirmed.subscribe(() => (confirmed = true));

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.trim() === 'Cancel')?.click();
    buttons.find((button) => button.textContent?.trim() === 'Delete item')?.click();

    expect(closed).toBeTrue();
    expect(confirmed).toBeTrue();
  });
});
