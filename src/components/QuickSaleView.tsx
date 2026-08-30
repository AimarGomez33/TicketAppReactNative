// src/components/QuickSaleView.tsx
import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import {
  useCartStore,
  Product,
} from '../store/useCartStore';
import { printTicketTCP } from '../services/printerService';
import { QuantityModal } from './QuantityModal';
import { CustomExtraModal } from './CustomExtraModal';
import { hasPaidModifiers } from '../domain/products/productModifiers';
import { buildConfiguredProductId, getBaseProductId } from '../domain/products/configuredProductId';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Edit3,
  Clock,
  Zap,
  X,
  CircleDollarSign,
  Star,
} from 'lucide-react-native';

type SubViewTab = 'editor' | 'history';

const QUICK_TABLES = ['MOSTRADOR', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const QuickSaleView: React.FC = () => {
  const [subTab, setSubTab] = useState<SubViewTab>('editor');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('MOSTRADOR');

  // Modales
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [extraModalVisible, setExtraModalVisible] = useState<boolean>(false);
  const [isCartExpanded, setIsCartExpanded] = useState<boolean>(false);
  const searchInputRef = useRef<TextInput>(null);

  const menuProducts = useCartStore((state) => state.menuProducts);
  const menuCategories = useCartStore((state) => state.menuCategories);
  const quickSaleCart = useCartStore((state) => state.quickSaleCart);
  const editingQuickSaleOrderId = useCartStore((state) => state.editingQuickSaleOrderId);
  const ordersHistory = useCartStore((state) => state.ordersHistory);
  
  const addQuickSaleItem = useCartStore((state) => state.addQuickSaleItem);
  const setQuickSaleQuantity = useCartStore((state) => state.setQuickSaleQuantity);
  const removeQuickSaleItem = useCartStore((state) => state.removeQuickSaleItem);
  const clearQuickSale = useCartStore((state) => state.clearQuickSale);
  const getQuickSaleTotal = useCartStore((state) => state.getQuickSaleTotal);
  const createQuickSaleOrder = useCartStore((state) => state.createQuickSaleOrder);
  const addCustomExtraItem = useCartStore((state) => state.addCustomExtraItem);
  const loadQuickSaleOrderForEdit = useCartStore((state) => state.loadQuickSaleOrderForEdit);
  const cancelEditQuickSaleOrder = useCartStore((state) => state.cancelEditQuickSaleOrder);
  const updateAndSaveQuickSaleOrder = useCartStore((state) => state.updateAndSaveQuickSaleOrder);
  const reprintQuickSaleOrder = useCartStore((state) => state.reprintQuickSaleOrder);
  const showCustomAlert = useCartStore((state) => state.showCustomAlert);

  const total = getQuickSaleTotal();
  const cartItems = Object.values(quickSaleCart);
  const totalItemCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  // Filtrar pedidos de mostrador / venta rápida
  const mostradorOrders = useMemo(() => {
    return ordersHistory.filter(
      (o) => o.orderType === 'quick_sale' || o.tableNumber === 'MOSTRADOR' || o.tableNumber === 'Llevar'
    );
  }, [ordersHistory]);

  // Filtrado reactivo de productos del menú
  const availableProducts = useMemo(() => {
    const products = menuProducts;

    return products.filter((p: Product) => {
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }

      if (selectedCategory === 'all') return true;
      return p.category === selectedCategory;
    });
  }, [menuProducts, searchQuery, selectedCategory]);

  const favoriteProducts = useMemo(() => (
    menuProducts
      .filter(product => product.isFavorite)
      .sort((first, second) => (first.favoriteOrder || 0) - (second.favoriteOrder || 0))
      .slice(0, 20)
  ), [menuProducts]);

  const openQuantityModal = (product: Product) => {
    setModalProduct(product);
    setModalVisible(true);
  };

  const selectQuickSaleProduct = (product: Product) => {
    if (product.isCustomPrice) {
      openQuantityModal(product);
      return;
    }
    addQuickSaleItem(product, 1);
  };

  const openPaidExtras = (product: Product) => {
    if (hasPaidModifiers(product)) {
      openQuantityModal(product);
    }
  };

  const handleQuickSearchSubmit = () => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return;

    // Sólo agrega automáticamente si el resultado es inequívoco: nunca se
    // adivina un platillo distinto durante una venta rápida.
    const exactMatch = menuProducts.find(
      product => product.name.trim().toLocaleLowerCase() === query,
    );
    const uniqueMatch = availableProducts.length === 1 ? availableProducts[0] : undefined;
    const product = exactMatch || uniqueMatch;

    if (!product) return;

    selectQuickSaleProduct(product);
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const decreaseQuickSaleItem = (product: Product, quantity: number, notes: string) => {
    if (quantity <= 1) {
      removeQuickSaleItem(product.id);
      return;
    }
    setQuickSaleQuantity(product, quantity - 1, notes);
  };

  const handleModalConfirm = (
    qty: number,
    notes: string,
    customPrice?: number,
    customName?: string,
    selectedModifierOptionIds?: string[],
  ) => {
    if (modalProduct) {
      if (modalProduct.isCustomPrice) {
        const finalPrice = customPrice !== undefined ? customPrice : modalProduct.price;
        const finalName = customName || modalProduct.name;
        addCustomExtraItem(finalPrice, finalName, notes, true);
        setModalVisible(false);
        return;
      }
      if (customName && customName !== modalProduct.name) {
        const variantProduct: Product = {
          ...modalProduct,
          id: buildConfiguredProductId({
            baseProductId: modalProduct.menuProductId || getBaseProductId(modalProduct.id),
            modifierOptionIds: selectedModifierOptionIds,
            variantIds: selectedModifierOptionIds?.length ? [] : [customName],
          }),
          menuProductId: modalProduct.menuProductId || getBaseProductId(modalProduct.id),
          name: customName,
          price: customPrice !== undefined ? customPrice : modalProduct.price,
          selectedModifierOptionIds,
          modifierTotal: (customPrice !== undefined ? customPrice : modalProduct.price)
            - (modalProduct.price - (modalProduct.modifierTotal || 0)),
        };
        setQuickSaleQuantity(variantProduct, qty, notes);
        setModalVisible(false);
        return;
      }
      const effectiveProduct = (customPrice !== undefined || customName)
        ? { ...modalProduct, price: customPrice !== undefined ? customPrice : modalProduct.price, name: customName || modalProduct.name }
        : modalProduct;
      setQuickSaleQuantity(effectiveProduct, qty, notes);
    }
    setModalVisible(false);
  };

  // Cobro Instantáneo y No Bloqueante
  const handleProcessQuickPayment = () => {
    if (cartItems.length === 0) return;
    const currentTable = selectedTable.trim() || 'MOSTRADOR';

    setIsCartExpanded(false);

    // 1. Guardar orden en local de forma inmediata (0ms)
    createQuickSaleOrder(currentTable, 'cash', total, 0);

    showCustomAlert({
      title: '¡Cobro de Mostrador Exitoso!',
      message: `Pedido de ${currentTable.toUpperCase()} cobrado por $${total.toFixed(2)}.`,
      type: 'success',
    });

    // 2. Transmisión a impresora en background sin congelar la app
    printTicketTCP(currentTable, cartItems, total, {
      showPrices: true,
      paymentMethod: 'cash',
    }).catch((err: any) => {
      console.warn('Fallo impresión en background:', err);
    });
  };

  // Guardar e Imprimir Comanda (No bloqueante)
  const handlePrintAndSaveOrder = () => {
    if (cartItems.length === 0) {
      showCustomAlert({
        title: 'Comanda Vacía',
        message: 'Agrega al menos un platillo antes de generar el ticket.',
        type: 'info',
      });
      return;
    }

    const currentTable = selectedTable.trim() || 'MOSTRADOR';
    setIsCartExpanded(false);

    if (editingQuickSaleOrderId) {
      const orderId = editingQuickSaleOrderId;
      updateAndSaveQuickSaleOrder(orderId, currentTable);

      showCustomAlert({
        title: 'Pedido Actualizado',
        message: `El pedido para ${currentTable.toUpperCase()} se actualizó con éxito ($${total.toFixed(2)}).`,
        type: 'success',
      });

      printTicketTCP(currentTable, cartItems, total, {
        showPrices: true,
        isReprint: true,
      }).catch(err => console.warn(err));
    } else {
      createQuickSaleOrder(currentTable);

      showCustomAlert({
        title: 'Ticket de Cuenta Generado',
        message: `Pedido emitido para ${currentTable.toUpperCase()} ($${total.toFixed(2)}).`,
        type: 'success',
      });

      printTicketTCP(currentTable, cartItems, total, {
        showPrices: true,
      }).catch(err => console.warn(err));
    }
  };

  const handleEditFromHistory = (orderId: string, orderTable: string) => {
    loadQuickSaleOrderForEdit(orderId);
    setSelectedTable(orderTable || 'MOSTRADOR');
    setSubTab('editor');
  };

  const handleCancelEdit = () => {
    cancelEditQuickSaleOrder();
    setSelectedTable('MOSTRADOR');
  };

  const categoriesToUse = menuCategories;

  return (
    <View style={styles.container}>
      {/* Selector Superior de Pestañas: Comanda Activa vs Historial */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'editor' && styles.subTabBtnActive]}
          onPress={() => setSubTab('editor')}
          activeOpacity={0.75}
        >
          <Zap size={14} color={subTab === 'editor' ? '#FFF' : '#5a3f49'} />
          <Text style={[styles.subTabBtnText, subTab === 'editor' && styles.subTabBtnTextActive]}>
            {editingQuickSaleOrderId ? `Editando (${selectedTable})` : 'Nueva Venta Mostrador'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'history' && styles.subTabBtnActive]}
          onPress={() => setSubTab('history')}
          activeOpacity={0.75}
        >
          <Clock size={14} color={subTab === 'history' ? '#FFF' : '#5a3f49'} />
          <Text style={[styles.subTabBtnText, subTab === 'history' && styles.subTabBtnTextActive]}>
            Historial ({mostradorOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= VISTA 1: EDITOR DE COMANDA MOSTRADOR ================= */}
      {subTab === 'editor' && (
        <View style={styles.editorContainer}>
          {/* Banner si está en modo Edición */}
          {editingQuickSaleOrderId && (
            <View style={styles.editingBanner}>
              <View style={styles.editingBannerInfo}>
                <Edit3 size={16} color="#b3006c" />
                <Text style={styles.editingBannerText}>
                  Modificando pedido de <Text style={styles.boldText}>{selectedTable.toUpperCase()}</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={handleCancelEdit}
                activeOpacity={0.7}
              >
                <X size={14} color="#ba1a1a" />
                <Text style={styles.cancelEditBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Selector de Mesa / Llevar */}
          <View style={styles.tableSelectorCard}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tableChipsRow}
            >
              {QUICK_TABLES.map((t) => {
                const isSelected = selectedTable.toLowerCase() === t.toLowerCase();
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tableChip, isSelected && styles.tableChipActive]}
                    onPress={() => setSelectedTable(t)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.tableChipText, isSelected && styles.tableChipTextActive]}
                    >
                      {t === 'MOSTRADOR' ? 'Mostrador' : `Mesa ${t}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Barra de Búsqueda y Botón Extra */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Search size={16} color="#8e6e79" />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Buscar y presiona Enter para agregar..."
                placeholderTextColor="#8e6e79"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleQuickSearchSubmit}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.extraButton}
              onPress={() => setExtraModalVisible(true)}
              activeOpacity={0.8}
            >
              <CircleDollarSign size={15} color="#FFF" />
              <Text style={styles.extraButtonText}>+ Extra $</Text>
            </TouchableOpacity>
          </View>

          {searchQuery.length === 0 && favoriteProducts.length > 0 && (
            <View style={styles.favoritesSection}>
              <View style={styles.favoritesHeader}>
                <View style={styles.favoritesTitleRow}>
                  <Star size={14} color="#b3006c" fill="#b3006c" />
                  <Text style={styles.favoritesTitle}>FAVORITOS DE MOSTRADOR</Text>
                </View>
                <Text style={styles.favoritesHint}>Un toque para agregar</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.favoritesList}
              >
                {favoriteProducts.map((product) => {
                  const qty = quickSaleCart[product.id]?.quantity || 0;
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[styles.favoriteCard, qty > 0 && styles.favoriteCardActive]}
                      onPress={() => selectQuickSaleProduct(product)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.favoriteName} numberOfLines={2}>{product.name}</Text>
                      <View style={styles.favoriteFooter}>
                        <Text style={styles.favoritePrice}>${product.price.toFixed(2)}</Text>
                        <View style={styles.favoriteActions}>
                          {hasPaidModifiers(product) && (
                            <TouchableOpacity
                              style={styles.favoriteExtraBtn}
                              onPress={(event) => {
                                event.stopPropagation();
                                openPaidExtras(product);
                              }}
                              activeOpacity={0.7}
                            >
                              <CircleDollarSign size={13} color="#b3006c" />
                            </TouchableOpacity>
                          )}
                          {qty > 0 && (
                            <TouchableOpacity
                              style={styles.favoriteQuantityBtn}
                              onPress={(event) => {
                                event.stopPropagation();
                                decreaseQuickSaleItem(product, qty, quickSaleCart[product.id]?.notes || '');
                              }}
                              activeOpacity={0.7}
                            >
                              <Minus size={12} color="#5a3f49" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.favoriteAddBtn}
                            onPress={(event) => {
                              event.stopPropagation();
                              selectQuickSaleProduct(product);
                            }}
                            activeOpacity={0.7}
                          >
                            <Plus size={13} color="#ffffff" />
                          </TouchableOpacity>
                          {qty > 0 && (
                            <View style={styles.favoriteQtyBadge}>
                              <Text style={styles.favoriteQtyText}>{qty}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Categorías (Chips Amplios) */}
          {searchQuery.length === 0 && (
            <View style={styles.categoriesWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesBar}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    selectedCategory === 'all' && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === 'all' && styles.categoryChipTextActive,
                    ]}
                  >
                    Todos
                  </Text>
                </TouchableOpacity>

                {categoriesToUse.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === cat.id && styles.categoryChipActive,
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === cat.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Grilla Amplia de Platillos (Exactamente igual de espaciosa que el menú de mesas) */}
          <ScrollView
            style={styles.productsGridScroll}
            contentContainerStyle={styles.productsGridContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cardsRow}>
              {availableProducts.map((product) => {
                const currentItem = quickSaleCart[product.id];
                const qty = currentItem ? currentItem.quantity : 0;
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.productCard, qty > 0 && styles.productCardActive]}
                    onPress={() => selectQuickSaleProduct(product)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardTop}>
                      <View style={styles.cardTitleWrap}>
                        <Text style={styles.cardProductName} numberOfLines={2}>
                          {product.name}
                        </Text>
                        {qty > 0 && (
                          <View style={styles.qtyBadge}>
                            <Text style={styles.qtyBadgeText}>{qty}</Text>
                          </View>
                        )}
                      </View>

                      {product.description ? (
                        <Text style={styles.cardProductDesc} numberOfLines={2}>
                          {product.description}
                        </Text>
                      ) : null}

                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.cardPrice}>${product.price.toFixed(2)}</Text>

                      <View style={styles.cardActions}>
                        {hasPaidModifiers(product) && (
                          <TouchableOpacity
                            style={styles.cardExtraBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              openPaidExtras(product);
                            }}
                            activeOpacity={0.7}
                          >
                            <CircleDollarSign size={13} color="#b3006c" />
                          </TouchableOpacity>
                        )}
                        {qty > 0 && (
                          <TouchableOpacity
                            style={styles.cardMinusBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              decreaseQuickSaleItem(product, qty, currentItem?.notes || '');
                            }}
                            activeOpacity={0.7}
                          >
                            <Minus size={13} color="#5a3f49" />
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.cardPlusBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            selectQuickSaleProduct(product);
                          }}
                          activeOpacity={0.7}
                        >
                          <Plus size={14} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Barra Flotante de Total y Cobro Rápido */}
          <View style={styles.bottomCartBar}>
            <TouchableOpacity
              style={styles.cartSummaryToggle}
              onPress={() => setIsCartExpanded(!isCartExpanded)}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.cartTableLabel}>
                  {selectedTable.toUpperCase()} • {totalItemCount} {totalItemCount === 1 ? 'art.' : 'arts.'}
                </Text>
                <Text style={styles.cartTotalValue}>${total.toFixed(2)}</Text>
              </View>
              <Text style={styles.cartExpandText}>
                {isCartExpanded ? '▼ Ocultar' : '▲ Ver Comanda'}
              </Text>
            </TouchableOpacity>

            <View style={styles.cartQuickActionsRow}>
              {cartItems.length > 0 && (
                <TouchableOpacity
                  style={styles.printOrderBtn}
                  onPress={handlePrintAndSaveOrder}
                  activeOpacity={0.8}
                >
                  <Printer size={16} color="#FFF" />
                  <Text style={styles.printOrderBtnText}>Ticket</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.payOrderBtn, cartItems.length === 0 && styles.payOrderBtnDisabled]}
                onPress={handleProcessQuickPayment}
                disabled={cartItems.length === 0}
                activeOpacity={0.85}
              >
                <Text style={styles.payOrderBtnText}>COBRAR EFECTIVO (${total.toFixed(2)})</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal de Desglose Desplegable */}
          <Modal
            visible={isCartExpanded}
            transparent
            animationType="slide"
            onRequestClose={() => setIsCartExpanded(false)}
          >
            <View style={styles.expandedCartOverlay}>
              <View style={styles.expandedCartCard}>
                <View style={styles.expandedCartHeader}>
                  <View>
                    <Text style={styles.expandedCartTitle}>Comanda Mostrador ({selectedTable})</Text>
                    <Text style={styles.expandedCartSub}>{totalItemCount} artículos registrados</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeExpandedBtn}
                    onPress={() => setIsCartExpanded(false)}
                  >
                    <X size={18} color="#5a3f49" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.expandedCartList}>
                  {cartItems.map((item) => (
                    <View key={item.product.id} style={styles.expandedItemRow}>
                      <TouchableOpacity
                        style={styles.expandedItemLeft}
                        onPress={() => {
                          setIsCartExpanded(false);
                          openQuantityModal(item.product);
                        }}
                      >
                        <Text style={styles.expandedItemName}>
                          {item.quantity}x {item.product.name}
                        </Text>
                        {item.notes ? (
                          <Text style={styles.expandedItemNotes}>* {item.notes}</Text>
                        ) : null}
                      </TouchableOpacity>

                      <View style={styles.expandedItemRight}>
                        <Text style={styles.expandedItemPrice}>
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </Text>
                        <View style={styles.expandedQuantityActions}>
                          <TouchableOpacity
                            style={styles.expandedQuantityBtn}
                            onPress={() => decreaseQuickSaleItem(item.product, item.quantity, item.notes || '')}
                            accessibilityLabel={`Restar ${item.product.name}`}
                          >
                            <Minus size={14} color="#5a3f49" />
                          </TouchableOpacity>
                          <Text style={styles.expandedQuantityValue}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.expandedQuantityBtn}
                            onPress={() => addQuickSaleItem(item.product, 1, item.notes)}
                            accessibilityLabel={`Agregar ${item.product.name}`}
                          >
                            <Plus size={14} color="#b3006c" />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          style={styles.removeItemBtn}
                          onPress={() => removeQuickSaleItem(item.product.id)}
                          accessibilityLabel={`Eliminar ${item.product.name}`}
                        >
                          <Trash2 size={14} color="#ba1a1a" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.expandedCartFooter}>
                  <View style={styles.expandedTotalRow}>
                    <Text style={styles.expandedTotalLabel}>Total a Pagar:</Text>
                    <Text style={styles.expandedTotalVal}>${total.toFixed(2)}</Text>
                  </View>
                  <View style={styles.expandedActionsRow}>
                    <TouchableOpacity
                      style={styles.clearAllBtn}
                      onPress={clearQuickSale}
                    >
                      <Trash2 size={15} color="#ba1a1a" />
                      <Text style={styles.clearAllBtnText}>Vaciar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.expandedPayBtn}
                      onPress={handleProcessQuickPayment}
                    >
                      <Text style={styles.expandedPayBtnText}>Pagar Ahora</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {/* ================= VISTA 2: HISTORIAL DE VENTAS ================= */}
      {subTab === 'history' && (
        <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false}>
          {mostradorOrders.length === 0 ? (
            <View style={styles.emptyHistoryBox}>
              <Clock size={40} color="#8e6e79" />
              <Text style={styles.emptyHistoryTitle}>Sin pedidos de mostrador hoy</Text>
              <Text style={styles.emptyHistoryText}>
                Los pedidos generados en esta sesión aparecerán aquí para reimpresión o consulta.
              </Text>
            </View>
          ) : (
            mostradorOrders.map((order) => (
              <View key={order.id} style={styles.historyCard}>
                <View style={styles.historyCardHeader}>
                  <View>
                    <Text style={styles.historyTableNumber}>
                      {order.tableNumber.toUpperCase()} • Folio #{order.id.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={styles.historyDate}>{order.timestamp}</Text>
                  </View>
                  <Text style={styles.historyTotal}>${order.total.toFixed(2)}</Text>
                </View>

                <View style={styles.historyItemsList}>
                  {order.items.map((it, idx) => (
                    <Text key={idx} style={styles.historyItemText} numberOfLines={1}>
                      • {it.quantity}x {it.product.name} {it.notes ? `(${it.notes})` : ''}
                    </Text>
                  ))}
                </View>

                <View style={styles.historyActionsRow}>
                  <TouchableOpacity
                    style={styles.reprintBtn}
                    onPress={() => reprintQuickSaleOrder(order.id)}
                    activeOpacity={0.8}
                  >
                    <Printer size={14} color="#b3006c" />
                    <Text style={styles.reprintBtnText}>Reimprimir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editHistoryBtn}
                    onPress={() => handleEditFromHistory(order.id, order.tableNumber)}
                    activeOpacity={0.8}
                  >
                    <Edit3 size={14} color="#FFF" />
                    <Text style={styles.editHistoryBtnText}>Modificar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal de Cantidad / Notas / Combo */}
      <QuantityModal
        visible={modalVisible}
        product={modalProduct}
        currentQuantity={modalProduct ? (quickSaleCart[modalProduct.id]?.quantity || 0) : 0}
        currentNotes={modalProduct ? (quickSaleCart[modalProduct.id]?.notes || '') : ''}
        showBaseModifiers={false}
        onClose={() => setModalVisible(false)}
        onConfirm={handleModalConfirm}
      />

      {/* Modal de Extra Personalizado */}
      <CustomExtraModal
        visible={extraModalVisible}
        onClose={() => setExtraModalVisible(false)}
        defaultDestination="quick"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f8',
  },
  subTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff0f3',
  },
  subTabBtnActive: {
    backgroundColor: '#b3006c',
  },
  subTabBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5a3f49',
  },
  subTabBtnTextActive: {
    color: '#ffffff',
  },
  editorContainer: {
    flex: 1,
  },
  editingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffe8ee',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffd9e5',
  },
  editingBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editingBannerText: {
    fontSize: 12,
    color: '#5a3f49',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#b3006c',
  },
  cancelEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cancelEditBtnText: {
    fontSize: 11,
    color: '#ba1a1a',
    fontWeight: 'bold',
  },
  tableSelectorCard: {
    height: 46,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    justifyContent: 'center',
  },
  tableChipsRow: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  tableChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableChipActive: {
    backgroundColor: '#b3006c',
    borderColor: '#b3006c',
  },
  tableChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a3f49',
  },
  tableChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#27171d',
    marginLeft: 6,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#8e6e79',
    paddingHorizontal: 6,
  },
  extraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 38,
  },
  extraButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoritesSection: {
    backgroundColor: '#ffffff',
    paddingTop: 2,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
  },
  favoritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 7,
  },
  favoritesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  favoritesTitle: {
    color: '#5a3f49',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  favoritesHint: {
    color: '#8e6e79',
    fontSize: 10,
    fontWeight: '600',
  },
  favoritesList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  favoriteCard: {
    width: 126,
    minHeight: 72,
    backgroundColor: '#fff8f8',
    borderColor: '#ffd0df',
    borderWidth: 1,
    borderRadius: 12,
    padding: 9,
    justifyContent: 'space-between',
  },
  favoriteCardActive: {
    backgroundColor: '#fff0f3',
    borderColor: '#b3006c',
    borderWidth: 1.5,
  },
  favoriteName: {
    color: '#27171d',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  favoriteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  favoritePrice: {
    color: '#b3006c',
    fontSize: 13,
    fontWeight: '900',
  },
  favoriteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  favoriteExtraBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff0f3',
    borderColor: '#e2bdc9',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteQuantityBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff0f3',
    borderColor: '#e2bdc9',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteAddBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#b3006c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteQtyBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b3006c',
  },
  favoriteQtyText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  categoriesWrapper: {
    height: 46,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    justifyContent: 'center',
  },
  categoriesBar: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  categoryChip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#fff0f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#b3006c',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a3f49',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  productsGridScroll: {
    flex: 1,
  },
  productsGridContent: {
    padding: 8,
    paddingBottom: 160,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderColor: '#ffe0ea',
    borderWidth: 1.5,
    minHeight: 125,
    justifyContent: 'space-between',
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productCardActive: {
    borderColor: '#b3006c',
    backgroundColor: '#fff8f9',
  },
  cardTop: {
    flex: 1,
  },
  cardTitleWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
  },
  cardProductName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#27171d',
    flex: 1,
  },
  qtyBadge: {
    backgroundColor: '#b3006c',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  qtyBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardProductDesc: {
    fontSize: 10,
    color: '#8e6e79',
    marginTop: 4,
    lineHeight: 13,
  },
  comboChip: {
    marginTop: 4,
    backgroundColor: '#fff0f3',
    borderColor: '#ffd9e5',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  comboChipText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#b3006c',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#fff0f3',
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#b3006c',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardExtraBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff0f3',
    borderColor: '#e2bdc9',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMinusBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff0f3',
    borderColor: '#e2bdc9',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPlusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#b3006c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  cartSummaryToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cartTableLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8e6e79',
  },
  cartTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#b3006c',
  },
  cartExpandText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b3006c',
    backgroundColor: '#fff0f3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cartQuickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  printOrderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#5a3f49',
    borderRadius: 14,
    paddingVertical: 12,
  },
  printOrderBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  payOrderBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 12,
  },
  payOrderBtnDisabled: {
    backgroundColor: '#a7f3d0',
  },
  payOrderBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  expandedCartOverlay: {
    flex: 1,
    backgroundColor: 'rgba(39, 27, 32, 0.6)',
    justifyContent: 'flex-end',
  },
  expandedCartCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  expandedCartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    paddingBottom: 10,
  },
  expandedCartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27171d',
  },
  expandedCartSub: {
    fontSize: 11,
    color: '#8e6e79',
  },
  closeExpandedBtn: {
    padding: 6,
  },
  expandedCartList: {
    maxHeight: 280,
    marginVertical: 10,
  },
  expandedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fff0f3',
  },
  expandedItemLeft: {
    flex: 1,
  },
  expandedItemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#27171d',
  },
  expandedItemNotes: {
    fontSize: 11,
    color: '#b3006c',
    marginTop: 2,
  },
  expandedItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expandedQuantityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  expandedQuantityBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff0f3',
    borderColor: '#e2bdc9',
    borderWidth: 1,
  },
  expandedQuantityValue: {
    minWidth: 16,
    color: '#5a3f49',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
  },
  expandedItemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#5a3f49',
  },
  removeItemBtn: {
    padding: 4,
  },
  expandedCartFooter: {
    borderTopWidth: 1,
    borderTopColor: '#ffe0ea',
    paddingTop: 12,
  },
  expandedTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expandedTotalLabel: {
    fontSize: 14,
    color: '#5a3f49',
    fontWeight: '600',
  },
  expandedTotalVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#b3006c',
  },
  expandedActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  clearAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ba1a1a',
  },
  clearAllBtnText: {
    color: '#ba1a1a',
    fontWeight: 'bold',
    fontSize: 13,
  },
  expandedPayBtn: {
    flex: 2,
    backgroundColor: '#059669',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  expandedPayBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyScroll: {
    flex: 1,
    padding: 12,
  },
  emptyHistoryBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5a3f49',
    marginTop: 12,
  },
  emptyHistoryText: {
    fontSize: 12,
    color: '#8e6e79',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderColor: '#ffe0ea',
    borderWidth: 1,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    paddingBottom: 8,
    marginBottom: 8,
  },
  historyTableNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#27171d',
  },
  historyDate: {
    fontSize: 11,
    color: '#8e6e79',
  },
  historyTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b3006c',
  },
  historyItemsList: {
    marginBottom: 10,
  },
  historyItemText: {
    fontSize: 12,
    color: '#5a3f49',
    marginBottom: 2,
  },
  historyActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reprintBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fff0f3',
    borderColor: '#b3006c',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
  },
  reprintBtnText: {
    color: '#b3006c',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editHistoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#b3006c',
    borderRadius: 10,
    paddingVertical: 8,
  },
  editHistoryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
