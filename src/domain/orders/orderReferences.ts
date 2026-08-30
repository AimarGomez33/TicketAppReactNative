/** Referencia técnica de una orden: mesa física o pedido para llevar. */
export type OrderReference = string;
export type OrderReferenceType = 'table' | 'takeaway';

const LEGACY_TAKEAWAY_REFERENCE = 'Llevar';

export const isTakeawayReference = (reference: OrderReference): boolean =>
  reference === LEGACY_TAKEAWAY_REFERENCE || reference.startsWith('L-');

export const isTableReference = (reference: OrderReference): boolean =>
  Boolean(reference) && !isTakeawayReference(reference);

export const getOrderReferenceType = (reference: OrderReference): OrderReferenceType =>
  isTakeawayReference(reference) ? 'takeaway' : 'table';

export const getOrderDisplayLabel = (reference: OrderReference): string =>
  isTakeawayReference(reference) ? `PARA LLEVAR ${reference}` : `MESA ${reference}`;

/** Genera una referencia corta compatible con tables_state.table_number VARCHAR(10). */
export const createTakeawayReference = (
  timestamp = Date.now(),
  random = Math.random(),
): OrderReference => {
  const timePart = timestamp.toString(36).slice(-5).toUpperCase();
  const randomPart = random.toString(36).slice(2, 5).padEnd(3, '0').toUpperCase();
  return `L-${timePart}${randomPart}`;
};
