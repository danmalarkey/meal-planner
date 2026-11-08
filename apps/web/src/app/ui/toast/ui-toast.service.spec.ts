import { UiToastService } from './ui-toast.service';

describe('UiToastService', () => {
  let service: UiToastService;

  beforeEach(() => {
    service = new UiToastService();
    spyOn(window, 'setTimeout').and.returnValue(0 as unknown as number);
  });

  it('keeps explicit placement when provided', () => {
    service.success('Saved item.', 'bottom');

    expect(service.toasts()[0].placement).toBe('bottom');
  });

  it('places toasts at the top for triggers in the top half of the viewport', () => {
    const trigger = document.createElement('button');
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(800);
    spyOn(trigger, 'getBoundingClientRect').and.returnValue({
      top: 96,
      height: 40
    } as DOMRect);

    service.info('Card view comes next.', { trigger });

    expect(service.toasts()[0].placement).toBe('top');
  });

  it('places toasts at the bottom for triggers in the bottom half of the viewport', () => {
    const trigger = document.createElement('button');
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(800);
    spyOn(trigger, 'getBoundingClientRect').and.returnValue({
      top: 620,
      height: 48
    } as DOMRect);

    service.info('Saved item.', { trigger });

    expect(service.toasts()[0].placement).toBe('bottom');
  });

  it('runs an optional action and dismisses its toast', () => {
    const callback = jasmine.createSpy('callback');
    service.success('Plan added.', { action: { label: 'Undo', callback } });

    service.performAction(service.toasts()[0].id);

    expect(callback).toHaveBeenCalled();
    expect(service.toasts()[0].closing).toBeTrue();
  });
});
