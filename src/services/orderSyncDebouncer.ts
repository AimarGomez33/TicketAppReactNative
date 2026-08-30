import { OrderReference } from '../domain/orders/orderReferences';

type SyncTask = () => void;

/** Agrupa cambios rápidos de una misma orden sin cancelar sincronizaciones ajenas. */
export class OrderSyncDebouncer {
  private readonly pending = new Map<OrderReference, ReturnType<typeof setTimeout>>();

  schedule(reference: OrderReference, task: SyncTask, delayMs: number): void {
    this.cancel(reference);

    const timeout = setTimeout(() => {
      this.pending.delete(reference);
      task();
    }, delayMs);

    this.pending.set(reference, timeout);
  }

  cancel(reference: OrderReference): void {
    const timeout = this.pending.get(reference);
    if (timeout) clearTimeout(timeout);
    this.pending.delete(reference);
  }

  get pendingCount(): number {
    return this.pending.size;
  }
}
