import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  useCartStore,
  Product,
} from '../store/useCartStore';
import {
  CATEGORIES_GENERAL,
  getProductsByMode,
} from '../data/mockupMenu';
import { printTicketTCP } from '../services/printerService';
import { QuantityModal } from './QuantityModal';
import { CustomExtraModal } from './CustomExtraModal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Edit3,
  Clock,
  RotateCcw,
  FileText,
  Layers,
  Zap,
  X,
  ShoppingBag,
  Hash,
  CircleDollarSign,
  CreditCard,
  Banknote,
  Check,
} from 'lucide-react-native';

type SubViewTab = 'editor' | 'history';

const QUICK_TABLES = ['Llevar', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const QuickSaleView: React.FC = () => {
  const [subTab, setSubTab] = useState<SubViewTab>('editor');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('Llevar');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Estado para el modal de cantidad y notas detalladas (+10, exactas, etc.)
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [extraModalVisible, setExtraModalVisible] = useState<boolean>(false);
  const [payModalVisible, setPayModalVisible] = useState<boolean>(false);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [payCashStr, setPayCashStr] = useState<string>('');

  const appMode = useCartStore((state) => state.appMode);
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

  // Filtrar pedidos de mostrador / venta rápida
  const mostradorOrders = useMemo(() => {
    return ordersHistory.filter(
      (o) => o.orderType === 'quick_sale' || o.tableNumber === 'MOSTRADOR' || o.tableNumber === 'Llevar'
    );
  }, [ordersHistory]);

  // Filtrado reactivo de productos del menú
  const availableProducts = useMemo(() => {
    const products = appMode === 'detailed'
      ? getProductsByMode('detailed')
      : (menuProducts && menuProducts.length > 0 ? menuProducts : getProductsByMode('general'));
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
  }, [appMode, menuProducts, searchQuery, selectedCategory]);

  const openQuantityModal = (product: Product) => {
    setModalProduct(product);
    setModalVisible(true);
  };

  const handleModalConfirm = (qty: number, notes: string, customPrice?: number, customName?: string) => {
    if (modalProduct) {
      if (modalProduct.isCustomPrice) {
        const finalPrice = customPrice !== undefined ? customPrice : modalProduct.price;
        const finalName = customName || modalProduct.name;
        addCustomExtraItem(finalPrice, finalName, notes, true);
        setModalVisible(false);
        return;
      }
      if (customName && customName !== modalProduct.name) {
        const variantSlug = customName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const variantProduct: Product = {
          ...modalProduct,
          id: `${modalProduct.id}-${variantSlug}`,
          name: customName,
          price: customPrice !== undefined ? customPrice : modalProduct.price,
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

  const openPayModal = () => {
    setPayMethod('cash');
    setPayCashStr('');
    setPayModalVisible(true);
  };

  const handleProcessQuickPayment = async (method?: 'cash' | 'card' | 'transfer') => {
    if (cartItems.length === 0) return;
    const currentTable = selectedTable.trim() || 'Llevar';
    const effectiveMethod = method || payMethod;

    setIsProcessing(true);
    try {
      await printTicketTCP(currentTable, cartItems, total, {
        showPrices: true,
        paymentMethod: effectiveMethod,
      });

      await createQuickSaleOrder(currentTable, effectiveMethod, total, 0);

      showCustomAlert({
        title: '¡Cobro de Mostrador Exitoso!',
        message: `Pedido de ${currentTable.toUpperCase()} cobrado por $${total.toFixed(2)}. Ticket impreso.`,
        type: 'success',
      });
      setPayModalVisible(false);
    } catch (err: any) {
      await createQuickSaleOrder(currentTable, effectiveMethod, total, 0);
      showCustomAlert({
        title: 'Cobro Registrado (Aviso Impresión)',
        message: `El cobro se registró en el sistema, pero la impresora no respondió (${err.message || '192.168.100.200'}).`,
        type: 'printer',
      });
      setPayModalVisible(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Procesar impresión y guardado de comanda manual (Nueva o Editada)
  const handlePrintAndSaveOrder = async () => {
    if (cartItems.length === 0) {
      showCustomAlert({
        title: 'Comanda Vacía',
        message: 'Agrega al menos un platillo a la comanda antes de generar el ticket.',
        type: 'info',
      });
      return;
    }

    const currentTable = selectedTable.trim() || 'Llevar';
    setIsProcessing(true);
    try {
      if (editingQuickSaleOrderId) {
        // Modo Edición: Actualizar pedido existente y reimprimir
        const orderId = editingQuickSaleOrderId;
        await printTicketTCP(currentTable, cartItems, total, {
          showPrices: true,
          isReprint: true,
        });

        await updateAndSaveQuickSaleOrder(orderId, currentTable);

        showCustomAlert({
          title: 'Pedido Actualizado e Impreso',
          message: `El pedido para ${currentTable.toUpperCase()} se actualizó con éxito ($${total.toFixed(2)}). Ticket reimpreso.`,
          type: 'success',
        });
      } else {
        // Modo Nuevo: Generar nuevo pedido e imprimir
        const newOrder = await createQuickSaleOrder(currentTable);
        if (newOrder) {
          await printTicketTCP(currentTable, cartItems, total, {
            showPrices: true,
          });

          showCustomAlert({
            title: 'Ticket de Cuenta Generado',
            message: `Pedido emitido para ${currentTable.toUpperCase()} por un total de $${total.toFixed(2)}. Ticket impreso.`,
            type: 'success',
          });
        }
      }
    } catch (err: any) {
      // Fallback: guardar pedido aun si la impresora no responde
      if (editingQuickSaleOrderId) {
        await updateAndSaveQuickSaleOrder(editingQuickSaleOrderId, currentTable);
      } else {
        await createQuickSaleOrder(currentTable);
      }
      showCustomAlert({
        title: 'Pedido Guardado (Aviso Impresión)',
        message: `El pedido se registró en el sistema, pero la impresora no respondió (${err.message || '192.168.100.200'}).`,
        type: 'printer',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Acción de Reimpresión desde el Historial
  const handleReprintFromHistory = async (orderId: string, tableLabel: string) => {
    setIsProcessing(true);
    try {
      await reprintQuickSaleOrder(orderId);
      showCustomAlert({
        title: 'Ticket Reimpreso',
        message: `Se ha enviado la copia del ticket para ${tableLabel.toUpperCase()} a la impresora.`,
        type: 'success',
      });
    } catch (err: any) {
      showCustomAlert({
        title: 'Error de Impresión',
        message: `No se pudo conectar con la impresora térmica (${err.message || '192.168.100.200'}).`,
        type: 'printer',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Acción de Cargar para Editar desde el Historial
  const handleEditFromHistory = (orderId: string, orderTable: string) => {
    loadQuickSaleOrderForEdit(orderId);
    setSelectedTable(orderTable || 'Llevar');
    setSubTab('editor');
  };

  const handleCancelEdit = () => {
    cancelEditQuickSaleOrder();
    setSelectedTable('Llevar');
  };

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
            {editingQuickSaleOrderId ? `Editando (${selectedTable})` : 'Nueva Comanda'}
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

      {/* ================= VISTA 1: EDITOR DE COMANDA MANUAL ================= */}
      {subTab === 'editor' && (
        <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
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
                <Text style={styles.cancelEditBtnText}>Cancelar Edición</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Selector de Mesa / Llevar */}
          <View style={styles.tableSelectorCard}>
            <View style={styles.tableSelectorHeader}>
              <View style={styles.tableSelectorTitleRow}>
                {selectedTable.toLowerCase() === 'llevar' ? (
                  <ShoppingBag size={15} color="#b3006c" />
                ) : (
                  <Hash size={15} color="#b3006c" />
                )}
                <Text style={styles.tableSelectorTitle}>
                  Destino / Mesa: <Text style={styles.currentTableHighlight}>{selectedTable.toUpperCase()}</Text>
                </Text>
              </View>
            </View>

            {/* Chips de Selección Rápida */}
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
                      {t === 'Llevar' ? 'Para Llevar' : `Mesa ${t}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Input para Mesa o Nombre Personalizado */}
            <View style={styles.customTableInputRow}>
              <Text style={styles.customTableLabel}>Otro número o nombre:</Text>
              <TextInput
                style={styles.customTableInput}
                placeholder="Ej. 14, Barra, Terraza..."
                placeholderTextColor="#8e6e79"
                value={selectedTable}
                onChangeText={setSelectedTable}
              />
            </View>
          </View>

          {/* Barra de Búsqueda, Botón Extra y Limpieza de Menú */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Search size={16} color="#8e6e79" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar platillo en menú..."
                placeholderTextColor="#8e6e79"
                value={searchQuery}
                onChangeText={setSearchQuery}
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

            {cartItems.length > 0 && !editingQuickSaleOrderId && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={clearQuickSale}
                activeOpacity={0.7}
              >
                <Trash2 size={15} color="#ba1a1a" />
              </TouchableOpacity>
            )}
          </View>

          {/* Categorías Rápidas (Chips) */}
          {searchQuery.length === 0 && (
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
              {(menuCategories && menuCategories.length > 0 ? menuCategories : CATEGORIES_GENERAL).filter((c) => c.id !== 'top').map((cat) => (
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
          )}

          {/* Grilla de Platillos con Selector Dinámico (1x1, +10 o N) */}
          <View style={styles.productsGrid}>
            {availableProducts.slice(0, 24).map((product) => {
              const currentItem = quickSaleCart[product.id];
              const qty = currentItem ? currentItem.quantity : 0;
              return (
                <View
                  key={product.id}
                  style={[styles.productPill, qty > 0 && styles.productPillActive]}
                >
                  {/* Nombre y Precio (Al tocar abre el selector N con notas) */}
                  <TouchableOpacity
                    style={styles.productPillInfo}
                    onPress={() => openQuantityModal(product)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.productPillName, qty > 0 && styles.productPillNameActive]}
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                    <Text style={styles.productPillPrice}>${product.price.toFixed(2)}</Text>
                  </TouchableOpacity>

                  {/* Acciones de Adición Rápida */}
                  <View style={styles.pillActions}>
                    {/* Botón Rápido +10 */}
                    <TouchableOpacity
                      style={styles.pillQuick10Btn}
                      onPress={() => {
                        if (product.variants && product.variants.length > 0) {
                          openQuantityModal(product);
                        } else {
                          addQuickSaleItem(product, 10);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pillQuick10Text}>+10</Text>
                    </TouchableOpacity>

                    {/* Botón +1 o Badge con cantidad actual */}
                    <TouchableOpacity
                      style={[styles.qtyBadge, qty > 0 && styles.qtyBadgeActive]}
                      onPress={() => {
                        if (product.variants && product.variants.length > 0) {
                          openQuantityModal(product);
                        } else {
                          addQuickSaleItem(product, 1);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      {qty > 0 ? (
                        <Text style={styles.qtyBadgeTextActive}>{qty}</Text>
                      ) : (
                        <Plus size={13} color="#b3006c" />
                      )}
                    </TouchableOpacity>

                    {/* Botón Modal Cantidad N / Notas */}
                    <TouchableOpacity
                      style={styles.pillModalBtn}
                      onPress={() => openQuantityModal(product)}
                      activeOpacity={0.7}
                    >
                      <Layers size={12} color={qty > 0 ? '#b3006c' : '#8e6e79'} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Tarjeta de Desglose de la Comanda y Total a Pagar */}
          <View style={styles.orderCard}>
            <View style={styles.orderCardHeader}>
              <View style={styles.orderTitleRow}>
                <FileText size={16} color="#b3006c" />
                <Text style={styles.orderCardTitle}>
                  {editingQuickSaleOrderId
                    ? `Artículos de ${selectedTable.toUpperCase()}`
                    : `Desglose de Comanda (${cartItems.reduce((s, i) => s + i.quantity, 0)} arts.)`}
                </Text>
              </View>
            </View>

            {cartItems.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Text style={styles.emptyCartHint}>
                  Toca los platillos arriba para agregarlos individualmente, por +10 o por cantidad personalizada.
                </Text>
              </View>
            ) : (
              <View style={styles.cartItemsList}>
                {cartItems.map((item) => (
                  <View key={item.product.id} style={styles.cartItemRow}>
                    {/* Tocar el detalle abre el selector N / notas */}
                    <TouchableOpacity
                      style={styles.cartItemDetails}
                      onPress={() => openQuantityModal(item.product)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cartItemName}>{item.product.name}</Text>
                      <Text style={styles.cartItemSub}>
                        ${item.product.price.toFixed(2)} c/u {item.notes ? `• Nota: ${item.notes}` : ''}
                      </Text>
                    </TouchableOpacity>

                    {/* Controles de Cantidad ( -10, -1, Cantidad, +1, +10 ) */}
                    <View style={styles.qtyControls}>
                      {item.quantity >= 10 && (
                        <TouchableOpacity
                          style={styles.qtyStep10Btn}
                          onPress={() => addQuickSaleItem(item.product, -10)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.qtyStep10Text}>-10</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => addQuickSaleItem(item.product, -1)}
                        activeOpacity={0.7}
                      >
                        <Minus size={12} color="#b3006c" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => openQuantityModal(item.product)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.qtyCount}>{item.quantity}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => addQuickSaleItem(item.product, 1)}
                        activeOpacity={0.7}
                      >
                        <Plus size={12} color="#b3006c" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.qtyStep10Btn}
                        onPress={() => addQuickSaleItem(item.product, 10)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.qtyStep10Text}>+10</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.itemTotalText}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </Text>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => removeQuickSaleItem(item.product.id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color="#ba1a1a" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Línea Separadora */}
                <View style={styles.divider} />

                {/* Total a Pagar Destacado */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TOTAL A PAGAR ({selectedTable.toUpperCase()}):</Text>
                  <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                </View>
              </View>
            )}

            {/* Botones de Acción de Comanda (Pre-cuenta y Cobro Directo) */}
            {cartItems.length > 0 && (
              <View style={styles.cartActionButtonsRow}>
                {/* Botón 1: Imprimir Pre-cuenta / Actualizar */}
                <TouchableOpacity
                  style={styles.preTicketBtn}
                  onPress={handlePrintAndSaveOrder}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#5a3f49" />
                  ) : (
                    <>
                      <Printer size={16} color="#5a3f49" />
                      <Text style={styles.preTicketBtnText}>
                        {editingQuickSaleOrderId ? 'ACTUALIZAR' : 'PRE-CUENTA'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Botón 2: Cobrar Inmediatamente en Caja */}
                <TouchableOpacity
                  style={styles.directPayBtn}
                  onPress={openPayModal}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  <Banknote size={18} color="#ffffff" />
                  <Text style={styles.directPayBtnText}>
                    COBRAR (${total.toFixed(2)})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ================= VISTA 2: HISTORIAL DE PEDIDOS DE MOSTRADOR ================= */}
      {subTab === 'history' && (
        <ScrollView style={styles.historyScroll} contentContainerStyle={styles.historyContent}>
          {mostradorOrders.length === 0 ? (
            <View style={styles.emptyHistoryCard}>
              <Clock size={40} color="#b3006c" />
              <Text style={styles.emptyHistoryTitle}>Sin Pedidos Registrados</Text>
              <Text style={styles.emptyHistoryText}>
                Las comandas generadas en Mostrador aparecerán aquí identificadas por su Mesa o Para Llevar, con opciones directas de reimpresión y edición.
              </Text>
              <TouchableOpacity
                style={styles.goToEditorBtn}
                onPress={() => setSubTab('editor')}
                activeOpacity={0.8}
              >
                <Plus size={14} color="#FFF" />
                <Text style={styles.goToEditorBtnText}>CREAR NUEVA COMANDA</Text>
              </TouchableOpacity>
            </View>
          ) : (
            mostradorOrders.map((order) => {
              const isTakeout =
                !order.tableNumber ||
                order.tableNumber.toLowerCase() === 'llevar' ||
                order.tableNumber.toLowerCase() === 'para llevar' ||
                order.tableNumber.toLowerCase() === 'mostrador';

              const tableDisplayName = isTakeout ? 'PARA LLEVAR' : `MESA ${order.tableNumber.toUpperCase()}`;

              return (
                <View key={order.id} style={styles.historyCard}>
                  {/* Cabecera del Pedido */}
                  <View style={styles.historyCardHeader}>
                    <View style={[styles.tableBadge, isTakeout ? styles.tableBadgeTakeout : styles.tableBadgeTable]}>
                      {isTakeout ? (
                        <ShoppingBag size={13} color="#b3006c" />
                      ) : (
                        <Hash size={13} color="#1d4ed8" />
                      )}
                      <Text
                        style={[
                          styles.tableBadgeText,
                          isTakeout ? styles.tableBadgeTextTakeout : styles.tableBadgeTextTable,
                        ]}
                      >
                        {tableDisplayName}
                      </Text>
                    </View>

                    <View style={styles.historyMetaRow}>
                      <Text style={styles.historyTime}>{order.timestamp}</Text>
                      {order.lastModified && (
                        <View style={styles.modifiedBadge}>
                          <Text style={styles.modifiedBadgeText}>Editado {order.lastModified}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Lista de Platillos del Pedido */}
                  <View style={styles.historyItemsList}>
                    {order.items.map((it) => (
                      <View key={it.product.id} style={styles.historyItemRow}>
                        <Text style={styles.historyItemQty}>{it.quantity}x</Text>
                        <Text style={styles.historyItemName} numberOfLines={1}>
                          {it.product.name}
                        </Text>
                        <Text style={styles.historyItemPrice}>
                          ${(it.product.price * it.quantity).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.historyDivider} />

                  {/* Total y Botones de Acción */}
                  <View style={styles.historyFooter}>
                    <View style={styles.historyTotalContainer}>
                      <Text style={styles.historyTotalLabel}>Total:</Text>
                      <Text style={styles.historyTotalValue}>${order.total.toFixed(2)}</Text>
                    </View>

                    <View style={styles.historyActionsRow}>
                      {/* Botón Reimprimir */}
                      <TouchableOpacity
                        style={styles.reprintBtn}
                        onPress={() => handleReprintFromHistory(order.id, order.tableNumber)}
                        disabled={isProcessing}
                        activeOpacity={0.75}
                      >
                        <Printer size={14} color="#b3006c" />
                        <Text style={styles.reprintBtnText}>Reimprimir</Text>
                      </TouchableOpacity>

                      {/* Botón Editar */}
                      <TouchableOpacity
                        style={styles.editOrderBtn}
                        onPress={() => handleEditFromHistory(order.id, order.tableNumber)}
                        disabled={isProcessing}
                        activeOpacity={0.75}
                      >
                        <Edit3 size={14} color="#ffffff" />
                        <Text style={styles.editOrderBtnText}>Editar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal de Cantidad Exacta (N), Sumar +10/+20, y Notas de Cocina */}
      <QuantityModal
        visible={modalVisible}
        product={modalProduct}
        currentQuantity={modalProduct ? (quickSaleCart[modalProduct.id]?.quantity || 0) : 0}
        currentNotes={modalProduct ? (quickSaleCart[modalProduct.id]?.notes || '') : ''}
        onClose={() => setModalVisible(false)}
        onConfirm={handleModalConfirm}
      />

      {/* Modal de Cobro Extra Personalizado */}
      <CustomExtraModal
        visible={extraModalVisible}
        onClose={() => setExtraModalVisible(false)}
        defaultDestination="quick"
      />

      {/* Modal de Cobro Directo para Mostrador */}
      <Modal visible={payModalVisible} transparent animationType="fade" onRequestClose={() => setPayModalVisible(false)}>
        <View style={styles.payModalOverlay}>
          <View style={styles.payModalContainer}>
            <View style={styles.payModalHeader}>
              <View style={styles.payModalTitleRow}>
                <Banknote size={20} color="#b3006c" />
                <Text style={styles.payModalTitle}>Cobro - {selectedTable.toUpperCase()}</Text>
              </View>
              <TouchableOpacity style={styles.payModalCloseBtn} onPress={() => setPayModalVisible(false)}>
                <X size={18} color="#5a3f49" />
              </TouchableOpacity>
            </View>

            {/* Total Destacado */}
            <View style={styles.payTotalBox}>
              <Text style={styles.payTotalLabel}>TOTAL A PAGAR</Text>
              <Text style={styles.payTotalAmount}>${total.toFixed(2)}</Text>
            </View>

            {/* Selector de Método de Pago */}
            <View style={styles.payMethodRow}>
              <TouchableOpacity
                style={[styles.payMethodBtn, payMethod === 'cash' && styles.payMethodBtnActive]}
                onPress={() => setPayMethod('cash')}
                activeOpacity={0.8}
              >
                <Banknote size={16} color={payMethod === 'cash' ? '#FFF' : '#5a3f49'} />
                <Text style={[styles.payMethodBtnText, payMethod === 'cash' && styles.payMethodBtnTextActive]}>
                  Efectivo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payMethodBtn, payMethod === 'card' && styles.payMethodBtnActive]}
                onPress={() => setPayMethod('card')}
                activeOpacity={0.8}
              >
                <CreditCard size={16} color={payMethod === 'card' ? '#FFF' : '#5a3f49'} />
                <Text style={[styles.payMethodBtnText, payMethod === 'card' && styles.payMethodBtnTextActive]}>
                  Tarjeta
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payMethodBtn, payMethod === 'transfer' && styles.payMethodBtnActive]}
                onPress={() => setPayMethod('transfer')}
                activeOpacity={0.8}
              >
                <Zap size={16} color={payMethod === 'transfer' ? '#FFF' : '#5a3f49'} />
                <Text style={[styles.payMethodBtnText, payMethod === 'transfer' && styles.payMethodBtnTextActive]}>
                  Transferencia
                </Text>
              </TouchableOpacity>
            </View>

            {/* Botón Finalizar Cobro e Imprimir */}
            <TouchableOpacity
              style={styles.confirmPayBtn}
              onPress={() => handleProcessQuickPayment()}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Printer size={18} color="#ffffff" />
                  <Text style={styles.confirmPayBtnText}>
                    FINALIZAR COBRO E IMPRIMIR (${total.toFixed(2)})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    gap: 8,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    gap: 6,
  },
  subTabBtnActive: {
    backgroundColor: '#b3006c',
    borderColor: '#b3006c',
  },
  subTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5a3f49',
  },
  subTabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  mainScroll: {
    flex: 1,
    padding: 12,
  },
  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff0f5',
    borderColor: '#b3006c',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  editingBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editingBannerText: {
    fontSize: 12,
    color: '#27171d',
  },
  boldText: {
    fontWeight: '800',
    color: '#b3006c',
  },
  cancelEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffe8ee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cancelEditBtnText: {
    fontSize: 11,
    color: '#ba1a1a',
    fontWeight: '700',
  },
  tableSelectorCard: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  tableSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableSelectorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableSelectorTitle: {
    fontSize: 12,
    color: '#5a3f49',
    fontWeight: '600',
  },
  currentTableHighlight: {
    fontSize: 13,
    fontWeight: '900',
    color: '#b3006c',
  },
  tableChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 8,
  },
  tableChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
  },
  tableChipActive: {
    backgroundColor: '#b3006c',
    borderColor: '#b3006c',
  },
  tableChipText: {
    fontSize: 11,
    color: '#5a3f49',
    fontWeight: '700',
  },
  tableChipTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  customTableInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#fcf0f4',
    paddingTop: 6,
  },
  customTableLabel: {
    fontSize: 11,
    color: '#8e6e79',
    fontWeight: '600',
  },
  customTableInput: {
    flex: 1,
    fontSize: 12,
    color: '#27171d',
    backgroundColor: '#fff8f8',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    height: 32,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#27171d',
    paddingVertical: 0,
  },
  clearSearchText: {
    color: '#8e6e79',
    fontSize: 13,
    paddingHorizontal: 4,
  },
  clearBtn: {
    backgroundColor: '#ffe8ee',
    borderColor: '#ffccd8',
    borderWidth: 1,
    borderRadius: 10,
    height: 38,
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesBar: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: '#b3006c',
    borderColor: '#b3006c',
  },
  categoryChipText: {
    fontSize: 11,
    color: '#5a3f49',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  productPill: {
    width: '49%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  productPillActive: {
    backgroundColor: '#fff0f5',
    borderColor: '#b3006c',
  },
  productPillInfo: {
    flex: 1,
    marginRight: 4,
  },
  productPillName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#27171d',
  },
  productPillNameActive: {
    color: '#b3006c',
  },
  productPillPrice: {
    fontSize: 10.5,
    color: '#8e6e79',
    marginTop: 1,
  },
  pillActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pillQuick10Btn: {
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  pillQuick10Text: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b3006c',
  },
  qtyBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff0f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBadgeActive: {
    backgroundColor: '#b3006c',
  },
  qtyBadgeTextActive: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  pillModalBtn: {
    padding: 3,
    backgroundColor: '#fff0f3',
    borderRadius: 6,
    borderColor: '#ffe0ea',
    borderWidth: 1,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 30,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    paddingBottom: 8,
    marginBottom: 8,
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#27171d',
  },
  emptyCartBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyCartHint: {
    fontSize: 11.5,
    color: '#8e6e79',
    textAlign: 'center',
  },
  cartItemsList: {
    gap: 8,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f5f0f2',
  },
  cartItemDetails: {
    flex: 1.2,
  },
  cartItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#27171d',
  },
  cartItemSub: {
    fontSize: 10.5,
    color: '#8e6e79',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fff0f3',
    borderRadius: 6,
    padding: 2,
    marginHorizontal: 4,
  },
  qtyStep10Btn: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyStep10Text: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#b3006c',
  },
  qtyBtn: {
    padding: 3,
  },
  qtyCount: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#b3006c',
    minWidth: 16,
    textAlign: 'center',
  },
  itemTotalText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#27171d',
    minWidth: 50,
    textAlign: 'right',
  },
  deleteBtn: {
    padding: 5,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#ffe0ea',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#27171d',
    letterSpacing: 0.3,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#b3006c',
  },
  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b3006c',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  mainActionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  historyScroll: {
    flex: 1,
  },
  historyContent: {
    padding: 12,
    gap: 10,
    paddingBottom: 30,
  },
  emptyHistoryCard: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#27171d',
    marginTop: 12,
  },
  emptyHistoryText: {
    fontSize: 12,
    color: '#8e6e79',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  goToEditorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#b3006c',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  goToEditorBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
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
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  tableBadgeTakeout: {
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
  },
  tableBadgeTable: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  tableBadgeText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  tableBadgeTextTakeout: {
    color: '#b3006c',
  },
  tableBadgeTextTable: {
    color: '#1d4ed8',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTime: {
    fontSize: 11,
    color: '#8e6e79',
    fontWeight: '600',
  },
  modifiedBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  modifiedBadgeText: {
    fontSize: 9.5,
    color: '#92400e',
    fontWeight: '700',
  },
  historyItemsList: {
    gap: 4,
    paddingVertical: 4,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemQty: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#b3006c',
    width: 24,
  },
  historyItemName: {
    flex: 1,
    fontSize: 11.5,
    color: '#27171d',
  },
  historyItemPrice: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#5a3f49',
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#ffe0ea',
    marginVertical: 8,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTotalContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  historyTotalLabel: {
    fontSize: 11,
    color: '#8e6e79',
    fontWeight: '600',
  },
  historyTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#b3006c',
  },
  historyActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  reprintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff0f3',
    borderColor: '#ffe0ea',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reprintBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b3006c',
  },
  editOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#b3006c',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editOrderBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  extraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#b3006c',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  extraButtonText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  cartActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  preTicketBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff0f3',
    borderColor: '#e2bdc9',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
  },
  preTicketBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5a3f49',
  },
  directPayBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#b3006c',
    borderRadius: 14,
    paddingVertical: 12,
    shadowColor: '#b3006c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  directPayBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  payModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(39, 23, 29, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  payModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  payModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
    paddingBottom: 10,
    marginBottom: 14,
  },
  payModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27171d',
  },
  payModalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#ffe8ee',
  },
  payTotalBox: {
    backgroundColor: '#fff0f3',
    borderColor: '#b3006c',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  payTotalLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#5a3f49',
    letterSpacing: 0.8,
  },
  payTotalAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#b3006c',
    marginTop: 2,
  },
  payMethodRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  payMethodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fff8f8',
    borderColor: '#e2bdc9',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
  },
  payMethodBtnActive: {
    backgroundColor: '#b3006c',
    borderColor: '#b3006c',
  },
  payMethodBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5a3f49',
  },
  payMethodBtnTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  cashSection: {
    marginBottom: 14,
  },
  cashSectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#5a3f49',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  cashInput: {
    backgroundColor: '#fff8f8',
    borderColor: '#b3006c',
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#b3006c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    textAlign: 'center',
  },
  cashPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  cashPresetChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#ffd9e5',
  },
  cashPresetChipActive: {
    backgroundColor: '#b3006c',
  },
  cashPresetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b3006c',
  },
  cashPresetChipTextActive: {
    color: '#ffffff',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#166534',
  },
  confirmPayBtn: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  confirmPayBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
