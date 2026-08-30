export interface PricedProduct {
  price: number;
}

export interface CartLine<TProduct extends PricedProduct = PricedProduct> {
  product: TProduct;
  quantity: number;
}

export type CartRecord<TProduct extends PricedProduct = PricedProduct> = Record<string, CartLine<TProduct>>;

export const getCartLines = <TProduct extends PricedProduct>(cart: CartRecord<TProduct>): CartLine<TProduct>[] =>
  Object.values(cart);

export const calculateCartTotal = <TProduct extends PricedProduct>(cart: CartRecord<TProduct>): number =>
  getCartLines(cart).reduce((total, item) => total + item.product.price * item.quantity, 0);

export const calculateCartItemCount = <TProduct extends PricedProduct>(cart: CartRecord<TProduct>): number =>
  getCartLines(cart).reduce((count, item) => count + item.quantity, 0);

export interface CatalogProduct extends PricedProduct {
  id: string;
}

export interface ConfiguredCartProduct extends CatalogProduct {
  menuProductId?: string;
  modifierTotal?: number;
  name?: string;
}

/**
 * Refresca precio y metadatos desde catálogo conservando la identidad y el
 * nombre de una línea ya configurada (por ejemplo, con queso extra).
 */
export const refreshCartProductsFromCatalog = <TProduct extends ConfiguredCartProduct>(
  cart: CartRecord<TProduct>,
  products: readonly TProduct[],
): CartRecord<TProduct> => {
  const productById = new Map(products.map(product => [product.id, product]));

  return Object.fromEntries(
    Object.entries(cart).map(([id, item]) => {
      const menuProductId = item.product.menuProductId || item.product.id;
      const remoteProduct = productById.get(menuProductId);
      if (!remoteProduct) return [id, item];

      const modifierTotal = item.product.modifierTotal || 0;
      const product = {
        ...item.product,
        ...remoteProduct,
        id: item.product.id,
        name: item.product.name,
        price: remoteProduct.price + modifierTotal,
        menuProductId,
        modifierTotal,
      } as TProduct;

      return [id, { ...item, product }];
    }),
  );
};
