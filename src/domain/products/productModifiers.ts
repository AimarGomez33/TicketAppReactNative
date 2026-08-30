export interface ModifierOption {
  id: string;
  name: string;
  priceDelta?: number;
}

export interface ModifierGroup {
  id: string;
  label: string;
  minSelections?: number;
  maxSelections?: number;
  options: ModifierOption[];
}

export interface ModifierProduct {
  modifierGroups?: ModifierGroup[];
  selectedModifierOptionIds?: string[];
  modifierTotal?: number;
}

export const hasPaidModifiers = (product: ModifierProduct): boolean => Boolean(
  product.modifierGroups?.some(group =>
    group.options.some(option => (option.priceDelta || 0) !== 0),
  ),
);

/** Mostrador oculta elecciones gratuitas y mantiene sólo extras cobrables. */
export const getVisibleModifierGroups = (
  product: ModifierProduct,
  showBaseModifiers: boolean,
): ModifierGroup[] => {
  if (showBaseModifiers) return product.modifierGroups || [];

  return (product.modifierGroups || []).flatMap(group => {
    const paidOptions = group.options.filter(option => (option.priceDelta || 0) !== 0);
    return paidOptions.length > 0
      ? [{ ...group, minSelections: 0, maxSelections: 1, options: paidOptions }]
      : [];
  });
};

export const getDefaultModifierOptionIds = (groups: readonly ModifierGroup[]): string[] =>
  groups.flatMap(group => group.options.slice(0, group.minSelections || 0).map(option => option.id));

export const getAvailableModifierOptionIds = (groups: readonly ModifierGroup[]): Set<string> =>
  new Set(groups.flatMap(group => group.options.map(option => option.id)));

export const getSelectedModifierOptions = (
  groups: readonly ModifierGroup[],
  selectedIds: readonly string[],
): ModifierOption[] => groups.flatMap(group =>
  group.options.filter(option => selectedIds.includes(option.id)),
);

export const calculateModifierTotal = (options: readonly ModifierOption[]): number =>
  options.reduce((total, option) => total + (option.priceDelta || 0), 0);

export const getBaseProductPrice = (productPrice: number, storedModifierTotal = 0): number =>
  productPrice - storedModifierTotal;

export const calculateEffectiveProductPrice = (
  basePrice: number,
  options: readonly ModifierOption[],
): number => basePrice + calculateModifierTotal(options);

export const buildConfiguredProductName = (
  baseName: string,
  variantNames: readonly string[],
  modifierOptions: readonly ModifierOption[],
  customPriceMode: boolean,
  customName: string,
): string => {
  const configuration = [
    ...variantNames,
    ...modifierOptions.map(option => option.name),
  ].join(' / ');

  if (configuration) return `${baseName} (${configuration})`;
  return customPriceMode ? (customName || 'Extra Personalizado') : baseName;
};

export const toggleModifierOptionSelection = (
  selectedIds: readonly string[],
  group: ModifierGroup,
  option: ModifierOption,
): string[] => {
  const selectedInGroup = group.options
    .filter(candidate => selectedIds.includes(candidate.id))
    .map(candidate => candidate.id);
  const isSelected = selectedInGroup.includes(option.id);
  const minSelections = group.minSelections || 0;
  const maxSelections = Math.max(1, group.maxSelections || 1);

  if (isSelected) {
    return selectedInGroup.length <= minSelections
      ? [...selectedIds]
      : selectedIds.filter(optionId => optionId !== option.id);
  }

  const withoutGroup = selectedIds.filter(optionId => !group.options.some(candidate => candidate.id === optionId));
  const nextForGroup = maxSelections === 1
    ? [option.id]
    : [...selectedInGroup.slice(-(maxSelections - 1)), option.id];
  return [...withoutGroup, ...nextForGroup];
};

export const areModifierSelectionsValid = (
  groups: readonly ModifierGroup[],
  selectedIds: readonly string[],
): boolean => groups.every(group => {
  const selectedCount = group.options.filter(option => selectedIds.includes(option.id)).length;
  const minSelections = group.minSelections || 0;
  const maxSelections = Math.max(1, group.maxSelections || 1);
  return selectedCount >= minSelections && selectedCount <= maxSelections;
});
