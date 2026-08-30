import {
  calculateCartItemCount,
  calculateCartTotal,
  refreshCartProductsFromCatalog,
} from '../src/domain/orders/cartCalculations';
import {
  createTakeawayReference,
  getOrderDisplayLabel,
  getOrderReferenceType,
  isTableReference,
  isTakeawayReference,
} from '../src/domain/orders/orderReferences';

describe('order references', () => {
  it('centralizes table and takeaway semantics, including legacy references', () => {
    expect(isTakeawayReference('L-ABC12')).toBe(true);
    expect(isTakeawayReference('Llevar')).toBe(true);
    expect(isTableReference('2')).toBe(true);
    expect(getOrderReferenceType('L-ABC12')).toBe('takeaway');
    expect(getOrderDisplayLabel('2')).toBe('MESA 2');
    expect(getOrderDisplayLabel('L-ABC12')).toBe('PARA LLEVAR L-ABC12');
  });

  it('generates a short deterministic takeaway reference', () => {
    expect(createTakeawayReference(123456789, 0.1234)).toBe('L-1I3V94FX');
    expect(createTakeawayReference(123456789, 0.1234)).toHaveLength(10);
  });
});

describe('cart calculations', () => {
  const cart = {
    base: { product: { id: 'base', name: 'Base', price: 20 }, quantity: 2 },
    configured: {
      product: { id: 'base--cheese', menuProductId: 'base', name: 'Base (Queso)', price: 35, modifierTotal: 15 },
      quantity: 1,
    },
  };

  it('calculates totals and article counts without store state', () => {
    expect(calculateCartTotal(cart)).toBe(75);
    expect(calculateCartItemCount(cart)).toBe(3);
  });

  it('refreshes configured product prices while preserving line identity and label', () => {
    const refreshed = refreshCartProductsFromCatalog(cart, [
      { id: 'base', name: 'Base remoto', price: 25 },
    ]);

    expect(refreshed.base.product.price).toBe(25);
    expect(refreshed.configured.product.id).toBe('base--cheese');
    expect(refreshed.configured.product.name).toBe('Base (Queso)');
    expect(refreshed.configured.product.price).toBe(40);
  });
});
