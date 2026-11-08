import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { UiInputComponent } from './ui-input.component';

@Component({
    imports: [UiInputComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="input-test-boundary" style="overflow: auto">
      <ui-input
        label="Manual item name"
        [value]="value()"
        [suggestions]="suggestions"
        [suggestionBadges]="suggestionBadges"
        [suggestionsLabel]="suggestionsLabel"
        [suggestionsPlacement]="suggestionsPlacement"
        [showSuggestionsOnFocus]="showSuggestionsOnFocus"
        [keyboardHint]="keyboardHint"
        [hideLabel]="hideLabel"
        helperText="Choose an existing match."
        (valueChange)="value.set($event)"
        (suggestionSelected)="selectedSuggestion.set($event)"
      >
        <span input-helper-action>Which links work?</span>
      </ui-input>
    </div>
  `
})
class InputHostComponent {
  readonly value = signal('');
  readonly selectedSuggestion = signal('');
  readonly suggestions = [
    'At Peace',
    'Bone Thugs-N-Harmony',
    'Freddie Gibbs, Madlib',
    'Pinata',
    ...Array.from({ length: 60 }, (_, index) => `Sorted filler ${index}`),
    'Propagandhi'
  ];
  readonly suggestionBadges = {
    Propagandhi: '1 match in Test'
  };
  suggestionsLabel = 'Existing matches';
  showSuggestionsOnFocus = false;
  suggestionsPlacement: 'bottom' | 'top' = 'bottom';
  keyboardHint: string | undefined = undefined;
  hideLabel = false;
}

@Component({
    imports: [UiInputComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <ui-input
      label="Format"
      [value]="value()"
      [suggestions]="['Vinyl', 'CD', 'Cassette']"
      (valueChange)="value.set($event)"
    ></ui-input>
  `
})
class NullishInputHostComponent {
  readonly value = signal<string | null | undefined>(undefined);
}

describe('UiInputComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputHostComponent, NullishInputHostComponent]
    }).compileComponents();
  });

  it('does not show suggestions on focus before the user types', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-input-suggestions')).toBeNull();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('treats a nullish controlled value as empty and remains editable', () => {
    const fixture = TestBed.createComponent(NullishInputHostComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('');

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'Vinyl';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('Vinyl');
    expect(input.value).toBe('Vinyl');
  });

  it('renders a contextual action beside helper text', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.detectChanges();

    const helper = fixture.nativeElement.querySelector('.ui-input-helper') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(helper.textContent).toContain('Choose an existing match.');
    expect(helper.textContent).toContain('Which links work?');
    expect(input.getAttribute('aria-describedby')).toBe(helper.id);
  });

  it('can visually hide its label while preserving the accessible label relationship', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.componentInstance.hideLabel = true;
    fixture.detectChanges();

    const control = fixture.nativeElement.querySelector('.ui-input') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;

    expect(control.classList).toContain('ui-input--label-hidden');
    expect(label.textContent?.trim()).toBe('Manual item name');
    expect(label.htmlFor).toBe(input.id);
  });

  it('shows matching suggestions after typing', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'Freddie Gibbs';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('[role="option"]') as NodeListOf<HTMLButtonElement>;
    expect(options.length).toBe(1);
    expect(options[0].textContent?.trim()).toBe('Freddie Gibbs, Madlib');
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
    expect(options[0].getAttribute('aria-selected')).toBe('false');
  });

  it('flips top suggestions below the input when the scroll boundary would clip them', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.componentInstance.suggestionsPlacement = 'top';
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'Prop';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const boundary = fixture.nativeElement.querySelector('.input-test-boundary') as HTMLElement;
    const control = fixture.nativeElement.querySelector('.ui-input-control') as HTMLElement;
    const panel = fixture.nativeElement.querySelector('.ui-input-suggestions') as HTMLElement;
    spyOn(boundary, 'getBoundingClientRect').and.returnValue({ top: 100, bottom: 700 } as DOMRect);
    spyOn(control, 'getBoundingClientRect').and.returnValue({ top: 140, bottom: 190 } as DOMRect);
    spyOn(panel, 'getBoundingClientRect').and.returnValue({ height: 80 } as DOMRect);

    const component = fixture.debugElement.query(By.directive(UiInputComponent)).componentInstance as UiInputComponent;
    (component as unknown as { resolveSuggestionPlacement: () => void }).resolveSuggestionPlacement();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-input').classList).not.toContain('ui-input--suggestions-top');
  });

  it('can show suggestions on focus before the user types', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.componentInstance.showSuggestionsOnFocus = true;
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('[role="option"]') as NodeListOf<HTMLButtonElement>;
    expect(options.length).toBe(8);
    expect(options[0].querySelector('.ui-input-suggestion-text')?.textContent?.trim()).toBe('At Peace');
  });

  it('filters the full suggestion set before limiting displayed matches', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'Propagandhi';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('[role="option"]') as NodeListOf<HTMLButtonElement>;
    expect(options.length).toBe(1);
    expect(options[0].querySelector('.ui-input-suggestion-text')?.textContent?.trim()).toBe('Propagandhi');
  });

  it('shows suggestion badges when provided', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'Prop';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.ui-input-suggestion-badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('1 match in Test');
  });

  it('uses the configured suggestions label', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.componentInstance.suggestionsLabel = 'Recommended recipe names';
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'Prop';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.ui-input-suggestions-label') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Recommended recipe names');
  });

  it('shows a muted keyboard hint when configured', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.componentInstance.keyboardHint = 'Enter';
    fixture.detectChanges();

    const hint = fixture.nativeElement.querySelector('.ui-input-keyboard-hint') as HTMLElement;
    expect(hint.textContent?.trim()).toBe('Enter');
    expect(hint.getAttribute('aria-hidden')).toBe('true');
  });

  it('selects a suggestion with pointer input', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'Prop';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const option = fixture.nativeElement.querySelector('[role="option"]') as HTMLButtonElement;
    option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('Propagandhi');
    expect(fixture.componentInstance.selectedSuggestion()).toBe('Propagandhi');
    expect(fixture.nativeElement.querySelector('.ui-input-suggestions')).toBeNull();
  });

  it('keeps focus on the input while selecting suggestions with the keyboard', () => {
    const fixture = TestBed.createComponent(InputHostComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    input.dispatchEvent(new FocusEvent('focus'));
    input.value = 'Bone Thugs';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('Bone Thugs-N-Harmony');
    expect(fixture.componentInstance.selectedSuggestion()).toBe('Bone Thugs-N-Harmony');
    expect(document.activeElement).toBe(input);
    expect(fixture.nativeElement.querySelector('.ui-input-suggestions')).toBeNull();
  });
});
