import { TestBed } from '@angular/core/testing';
import { UiTableComponent } from './ui-table.component';

describe('UiTableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiTableComponent]
    }).compileComponents();
  });

  it('emits rowClicked when a clickable row is activated with the keyboard', () => {
    const fixture = TestBed.createComponent(UiTableComponent<{ id: string; name: string }>);
    fixture.componentRef.setInput('columns', [{ id: 'name', label: 'Name' }]);
    fixture.componentRef.setInput('rows', [{ id: '1', name: 'Leica M6' }]);
    fixture.componentRef.setInput('rowKey', (row: { id: string }) => row.id);
    fixture.componentRef.setInput('rowClickable', true);
    fixture.detectChanges();

    let emittedRow: { id: string; name: string } | undefined;
    fixture.componentInstance.rowClicked.subscribe((row) => {
      emittedRow = row;
    });

    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(emittedRow).toEqual({ id: '1', name: 'Leica M6' });
  });

  it('marks the row currently open in a contextual inspector', () => {
    const fixture = TestBed.createComponent(UiTableComponent<{ id: string; name: string }>);
    fixture.componentRef.setInput('columns', [{ id: 'name', label: 'Name' }]);
    fixture.componentRef.setInput('rows', [
      { id: '1', name: 'Leica M6' },
      { id: '2', name: 'Nikon F3' }
    ]);
    fixture.componentRef.setInput('rowKey', (row: { id: string }) => row.id);
    fixture.componentRef.setInput('activeKey', '2');
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>;
    expect(rows[0].classList).not.toContain('ui-table-row--active');
    expect(rows[1].classList).toContain('ui-table-row--active');
    expect(rows[1].getAttribute('aria-current')).toBe('true');
  });

  it('does not render thumbnail chrome when a media row has no image', () => {
    const fixture = TestBed.createComponent(UiTableComponent<{ id: string; name: string; imageUrl: string | null }>);
    fixture.componentRef.setInput('columns', [
      {
        id: 'name',
        label: 'Item',
        cellType: 'media',
        value: (row: { name: string }) => row.name,
        imageUrl: (row: { imageUrl: string | null }) => row.imageUrl
      }
    ]);
    fixture.componentRef.setInput('rows', [{ id: '1', name: 'DMC 310 Black', imageUrl: null }]);
    fixture.componentRef.setInput('rowKey', (row: { id: string }) => row.id);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-table-media-thumb')).toBeNull();
    expect(fixture.nativeElement.querySelector('.ui-table-media-title')?.textContent).toContain('DMC 310 Black');
  });

  it('renders a thumbnail when a media row has an image', () => {
    const fixture = TestBed.createComponent(UiTableComponent<{ id: string; name: string; imageUrl: string | null }>);
    fixture.componentRef.setInput('columns', [
      {
        id: 'name',
        label: 'Item',
        cellType: 'media',
        value: (row: { name: string }) => row.name,
        imageUrl: (row: { imageUrl: string | null }) => row.imageUrl
      }
    ]);
    fixture.componentRef.setInput('rows', [{ id: '1', name: 'Blink', imageUrl: 'https://example.com/blink.jpg' }]);
    fixture.componentRef.setInput('rowKey', (row: { id: string }) => row.id);
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('.ui-table-media-thumb img') as HTMLImageElement | null;
    expect(image?.src).toContain('https://example.com/blink.jpg');
  });

  it('renders a direct color swatch without thumbnail chrome', () => {
    const fixture = TestBed.createComponent(UiTableComponent<{ id: string; name: string; hex: string }>);
    fixture.componentRef.setInput('columns', [
      {
        id: 'name',
        label: 'Item',
        cellType: 'media',
        value: (row: { name: string }) => row.name,
        swatchColor: (row: { hex: string }) => row.hex
      }
    ]);
    fixture.componentRef.setInput('rows', [{ id: '1', name: 'DMC 310', hex: '#000000' }]);
    fixture.componentRef.setInput('rowKey', (row: { id: string }) => row.id);
    fixture.detectChanges();

    const swatch = fixture.nativeElement.querySelector('.ui-swatch') as HTMLElement | null;
    expect(swatch?.style.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(fixture.nativeElement.querySelector('.ui-table-media-thumb')).toBeNull();
  });

  it('renders unavailable row actions as plain text', () => {
    type SourceRow = { id: string; source: string; sourceUrl: string | null };
    const fixture = TestBed.createComponent(UiTableComponent<SourceRow>);
    fixture.componentRef.setInput('columns', [
      {
        id: 'source',
        label: 'Source',
        cellType: 'action',
        action: () => undefined,
        actionAvailable: (row: SourceRow) => Boolean(row.sourceUrl)
      }
    ]);
    fixture.componentRef.setInput('rows', [
      { id: '1', source: 'Manual entry', sourceUrl: null },
      { id: '2', source: 'Source link', sourceUrl: 'https://example.com/recipe/2' }
    ]);
    fixture.componentRef.setInput('rowKey', (row: SourceRow) => row.id);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>;

    expect(rows[0].textContent).toContain('Manual entry');
    expect(rows[0].querySelector('.ui-button--link')).toBeNull();
    expect(rows[1].querySelector('.ui-button--link')).not.toBeNull();
  });

  it('renders safe external document links supplied by a column', () => {
    type DocumentRow = { id: string; receiptUrl: string; invoiceUrl: string };
    const fixture = TestBed.createComponent(UiTableComponent<DocumentRow>);
    fixture.componentRef.setInput('columns', [{
      id: 'documents',
      label: 'Documents',
      cellType: 'links',
      links: (row: DocumentRow) => [
        { label: 'View receipt', url: row.receiptUrl, appearance: 'button' },
        { label: 'Download invoice', url: row.invoiceUrl }
      ]
    }]);
    fixture.componentRef.setInput('rows', [{
      id: '1',
      receiptUrl: 'https://invoice.stripe.com/i/test',
      invoiceUrl: 'https://pay.stripe.com/invoice/test/pdf'
    }]);
    fixture.componentRef.setInput('rowKey', (row: DocumentRow) => row.id);
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('.ui-table-links a') as NodeListOf<HTMLAnchorElement>;
    expect(Array.from(links).map((link) => link.textContent?.trim())).toEqual(['View receipt', 'Download invoice']);
    expect(Array.from(links).every((link) => link.target === '_blank')).toBeTrue();
    expect(links[0].classList).toContain('ui-button--secondary');
    expect(links[1].classList).toContain('ui-text-link');
  });

  it('removes outer table chrome when embedded in another surface', () => {
    const fixture = TestBed.createComponent(UiTableComponent<{ id: string; name: string }>);
    fixture.componentRef.setInput('columns', [{ id: 'name', label: 'Name' }]);
    fixture.componentRef.setInput('rows', [{ id: '1', name: 'Household plan' }]);
    fixture.componentRef.setInput('rowKey', (row: { id: string }) => row.id);
    fixture.componentRef.setInput('variant', 'embedded');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-table-wrap--embedded')).not.toBeNull();
  });

  it('emits the configured recovery action from its empty state', () => {
    const fixture = TestBed.createComponent(UiTableComponent<{ id: string; name: string }>);
    fixture.componentRef.setInput('columns', [{ id: 'name', label: 'Name' }]);
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('rowKey', (row: { id: string }) => row.id);
    fixture.componentRef.setInput('emptyState', {
      title: 'No recipes match',
      ctaLabel: 'Add item'
    });
    const emptyAction = jasmine.createSpy('emptyAction');
    fixture.componentInstance.emptyAction.subscribe(emptyAction);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.ui-empty-state-actions .ui-button') as HTMLButtonElement).click();

    expect(emptyAction).toHaveBeenCalled();
  });
});
