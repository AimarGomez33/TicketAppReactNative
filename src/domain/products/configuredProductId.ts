export interface ConfiguredProductIdentityInput {
  baseProductId: string;
  modifierOptionIds?: readonly string[];
  variantIds?: readonly string[];
}

const normalizeToken = (value: string): string =>
  value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const sortedUnique = (values: readonly string[] = []): string[] =>
  [...new Set(values.map(normalizeToken).filter(Boolean))].sort();

/** Identidad estable para una línea configurada, independiente del orden de selección. */
export const buildConfiguredProductId = ({
  baseProductId,
  modifierOptionIds,
  variantIds,
}: ConfiguredProductIdentityInput): string => {
  const modifiers = sortedUnique(modifierOptionIds);
  const variants = sortedUnique(variantIds);
  const configuration = [...modifiers, ...variants.map(variant => `variant-${variant}`)];

  return configuration.length > 0
    ? `${baseProductId}--${configuration.join('--')}`
    : baseProductId;
};

export const getBaseProductId = (configuredProductId: string): string =>
  configuredProductId.split('--', 1)[0];
