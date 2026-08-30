import { OrderSyncDebouncer } from '../src/services/orderSyncDebouncer';

describe('OrderSyncDebouncer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not let one order cancel another order', () => {
    const debouncer = new OrderSyncDebouncer();
    const tableOne = jest.fn();
    const tableTwo = jest.fn();

    debouncer.schedule('1', tableOne, 350);
    debouncer.schedule('2', tableTwo, 350);
    jest.advanceTimersByTime(350);

    expect(tableOne).toHaveBeenCalledTimes(1);
    expect(tableTwo).toHaveBeenCalledTimes(1);
    expect(debouncer.pendingCount).toBe(0);
  });

  it('groups rapid changes only for the same order reference', () => {
    const debouncer = new OrderSyncDebouncer();
    const staleTask = jest.fn();
    const latestTask = jest.fn();
    const takeawayTask = jest.fn();

    debouncer.schedule('L-ABC123', staleTask, 350);
    debouncer.schedule('L-ABC123', latestTask, 350);
    debouncer.schedule('L-OTHER1', takeawayTask, 350);
    jest.advanceTimersByTime(350);

    expect(staleTask).not.toHaveBeenCalled();
    expect(latestTask).toHaveBeenCalledTimes(1);
    expect(takeawayTask).toHaveBeenCalledTimes(1);
    expect(debouncer.pendingCount).toBe(0);
  });

  it('releases a pending timer when it is cancelled', () => {
    const debouncer = new OrderSyncDebouncer();
    const task = jest.fn();

    debouncer.schedule('1', task, 350);
    debouncer.cancel('1');
    jest.advanceTimersByTime(350);

    expect(task).not.toHaveBeenCalled();
    expect(debouncer.pendingCount).toBe(0);
  });
});
