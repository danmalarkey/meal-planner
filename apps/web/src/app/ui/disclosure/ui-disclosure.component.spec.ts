import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiDisclosureComponent } from './ui-disclosure.component';

@Component({
    imports: [UiDisclosureComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <ui-disclosure title="Categories">
      <button disclosure-action type="button" class="manage-action" (click)="managed.set(true)">Manage</button>
      <p>Category controls</p>
    </ui-disclosure>
  `
})
class DisclosureActionHostComponent {
  readonly managed = signal(false);
}

describe('UiDisclosureComponent', () => {
  let fixture: ComponentFixture<UiDisclosureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiDisclosureComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiDisclosureComponent);
    fixture.componentRef.setInput('title', 'Color family');
  });

  it('announces and toggles its expanded state', () => {
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ui-disclosure-trigger') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.ui-disclosure-panel')).toBeNull();

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.ui-disclosure-panel')).not.toBeNull();
  });

  it('uses the requested initial state and renders a summary', () => {
    fixture.componentRef.setInput('defaultOpen', true);
    fixture.componentRef.setInput('summary', '2 selected');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-disclosure-trigger')?.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.ui-disclosure-summary')?.textContent).toContain('2 selected');
  });

  it('keeps the disclosure chevron as the far-right header control', () => {
    fixture.detectChanges();

    const headingRow = fixture.nativeElement.querySelector('.ui-disclosure-heading-row') as HTMLElement;
    const trailingControl = headingRow.lastElementChild as HTMLElement;

    expect(trailingControl.classList.contains('ui-disclosure-icon')).toBeTrue();
  });

  it('aligns its semantic heading level to the surrounding hierarchy', () => {
    fixture.componentRef.setInput('headingLevel', 4);
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('.ui-disclosure-heading') as HTMLElement;

    expect(heading.getAttribute('role')).toBe('heading');
    expect(heading.getAttribute('aria-level')).toBe('4');
  });

});

describe('UiDisclosureComponent projected actions', () => {
  it('keeps a projected utility action separate from the disclosure toggle', async () => {
    await TestBed.configureTestingModule({
      imports: [DisclosureActionHostComponent]
    }).compileComponents();
    const hostFixture = TestBed.createComponent(DisclosureActionHostComponent);
    hostFixture.detectChanges();

    (hostFixture.nativeElement.querySelector('.manage-action') as HTMLButtonElement).click();
    hostFixture.detectChanges();

    expect(hostFixture.componentInstance.managed()).toBeTrue();
    expect(hostFixture.nativeElement.querySelector('.ui-disclosure-trigger')?.getAttribute('aria-expanded')).toBe('false');
  });
});
