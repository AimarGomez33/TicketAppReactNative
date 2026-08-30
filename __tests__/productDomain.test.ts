import {
  buildConfiguredProductId,
  getBaseProductId,
} from '../src/domain/products/configuredProductId';
import {
  areModifierSelectionsValid,
  buildConfiguredProductName,
  calculateEffectiveProductPrice,
  getDefaultModifierOptionIds,
  getSelectedModifierOptions,
  getVisibleModifierGroups,
  hasPaidModifiers,
  toggleModifierOptionSelection,
} from '../src/domain/products/productModifiers';

const groups = [
  {
    id: 'salsa',
    label: 'Salsa',
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: 'verde', name: 'Verde' },
      { id: 'roja', name: 'Roja' },
    ],
  },
  {
    id: 'extra',
    label: 'Extra',
    minSelections: 0,
    maxSelections: 1,
    options: [{ id: 'queso', name: 'Queso', priceDelta: 15 }],
  },
];

describe('configured product identity', () => {
  it('is deterministic regardless of modifier selection order', () => {
    const first = buildConfiguredProductId({
      baseProductId: 'pambazo',
      modifierOptionIds: ['queso', 'roja'],
    });
    const second = buildConfiguredProductId({
      baseProductId: 'pambazo',
      modifierOptionIds: ['roja', 'queso'],
    });

    expect(first).toBe(second);
    expect(first).not.toBe(buildConfiguredProductId({ baseProductId: 'pambazo', modifierOptionIds: ['verde'] }));
    expect(getBaseProductId(first)).toBe('pambazo');
  });
});

describe('product modifiers', () => {
  it('keeps only paid modifier groups in counter mode', () => {
    expect(hasPaidModifiers({ modifierGroups: groups })).toBe(true);
    expect(getVisibleModifierGroups({ modifierGroups: groups }, false)).toEqual([
      { ...groups[1], minSelections: 0, maxSelections: 1 },
    ]);
  });

  it('applies defaults, limits choices and calculates configured price/name', () => {
    expect(getDefaultModifierOptionIds(groups)).toEqual(['verde']);
    expect(toggleModifierOptionSelection(['verde'], groups[0], groups[0].options[0])).toEqual(['verde']);
    expect(toggleModifierOptionSelection(['verde'], groups[0], groups[0].options[1])).toEqual(['roja']);

    const selected = getSelectedModifierOptions(groups, ['roja', 'queso']);
    expect(calculateEffectiveProductPrice(38, selected)).toBe(53);
    expect(buildConfiguredProductName('Pambazo', [], selected, false, '')).toBe('Pambazo (Roja / Queso)');
    expect(areModifierSelectionsValid(groups, ['roja', 'queso'])).toBe(true);
    expect(areModifierSelectionsValid(groups, ['queso'])).toBe(false);
  });
});
