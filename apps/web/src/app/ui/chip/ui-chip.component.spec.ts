import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiChipComponent } from './ui-chip.component';

describe('UiChipComponent', () => {
  let fixture: ComponentFixture<UiChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiChipComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UiChipComponent);
    fixture.componentRef.setInput('label', 'Blue');
  });

  it('renders an accessible color choice without relying on the swatch alone', () => {
    fixture.componentRef.setInput('swatchColor', '#4a78a8');
    fixture.componentRef.setInput('ariaPressed', true);
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.ui-chip') as HTMLButtonElement;
    const swatch = fixture.nativeElement.querySelector('.ui-chip-swatch') as HTMLElement;

    expect(chip.textContent).toContain('Blue');
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(swatch.getAttribute('aria-hidden')).toBe('true');
    expect(swatch.style.backgroundColor).toBe('rgb(74, 120, 168)');
  });

  it('uses the shared ghost treatment for lightweight peer actions', () => {
    fixture.componentRef.setInput('variant', 'ghost');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-chip--ghost')).not.toBeNull();
  });

  it('keeps removable chips static so their remove action is never nested inside another button', () => {
    fixture.componentRef.setInput('removable', true);
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.ui-chip') as HTMLElement;

    expect(chip.tagName).toBe('SPAN');
    expect(chip.classList.contains('ui-chip--interactive')).toBeFalse();
    expect(chip.querySelectorAll('button').length).toBe(1);
    expect(chip.querySelector('.ui-chip-remove')).not.toBeNull();
  });

  it('keeps every corner of a static chip visually consistent', () => {
    fixture.componentRef.setInput('interactive', false);
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.ui-chip') as HTMLElement;
    const styles = getComputedStyle(chip);

    expect(styles.borderTopRightRadius).toBe(styles.borderTopLeftRadius);
    expect(styles.borderBottomRightRadius).toBe(styles.borderTopLeftRadius);
    expect(styles.borderBottomLeftRadius).toBe(styles.borderTopLeftRadius);
    expect(styles.backgroundClip).toBe('padding-box');
    expect(styles.overflow).toBe('hidden');
  });
});
