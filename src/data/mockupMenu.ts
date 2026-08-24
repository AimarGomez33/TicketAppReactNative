// src/data/mockupMenu.ts
import { Product, Category } from '../store/useCartStore';
export type { Category };

export const CATEGORIES_DETAILED: Category[] = [
  { id: 'top', name: 'Populares', station: 'all' },
  { id: 'antojitos', name: 'Antojitos', station: 'mexican' },
  { id: 'quesadillas', name: 'Quesadillas', station: 'mexican' },
  { id: 'tostadas', name: 'Tostadas', station: 'mexican' },
  { id: 'pambazos', name: 'Pambazos', station: 'mexican' },
  { id: 'guajolotas', name: 'Guajolotas y Volcanes', station: 'mexican' },
  { id: 'pozole', name: 'Pozole', station: 'mexican' },
  { id: 'hamburguesas', name: 'Hamburguesas', station: 'american_tacos' },
  { id: 'alitas', name: 'Alitas', station: 'american_tacos' },
  { id: 'tacos', name: 'Tacos', station: 'american_tacos' },
  { id: 'papas', name: 'Papas & Boneless', station: 'american_tacos' },
  { id: 'bebidas', name: 'Bebidas', station: 'mexican' },
  { id: 'extras', name: 'Extras', station: 'all' },
];

export const CATEGORIES_GENERAL: Category[] = [
  { id: 'top', name: 'Principales', station: 'all' },
  { id: 'antojitos', name: 'Antojitos', station: 'mexican' },
  { id: 'quesadillas', name: 'Quesadillas', station: 'mexican' },
  { id: 'tostadas', name: 'Tostadas', station: 'mexican' },
  { id: 'pambazos', name: 'Pambazos', station: 'mexican' },
  { id: 'guajolotas', name: 'Guajolotas', station: 'mexican' },
  { id: 'pozole', name: 'Pozole', station: 'mexican' },
  { id: 'hamburguesas', name: 'Hamburguesas', station: 'american_tacos' },
  { id: 'alitas', name: 'Alitas', station: 'american_tacos' },
  { id: 'tacos', name: 'Tacos', station: 'american_tacos' },
  { id: 'papas', name: 'Papas', station: 'american_tacos' },
  { id: 'bebidas', name: 'Bebidas', station: 'mexican' },
  { id: 'extras', name: 'Extras', station: 'all' },
];

export const CATEGORIES: Category[] = CATEGORIES_GENERAL;

// ==========================================
// MENÚ GENERAL (Para captura rápida en punto de venta)
// ==========================================
export const MOCK_PRODUCTS_GENERAL: Product[] = [
  // --- 🇲🇽 COCINA 1: ANTOJITOS ---
  {
    id: 'gen-chalupa',
    name: 'Chalupa (Pieza)',
    price: 6.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: 'Tortillita de maíz, papa, salsa, lechuga, queso rallado y pollo',
  },
  {
    id: 'gen-mollejas',
    name: 'Orden de Mollejas',
    price: 25.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: '2 tortillas maíz, 3 mollejas de pollo, salsa, lechuga, queso rallado',
  },
  {
    id: 'gen-patitas',
    name: 'Orden de Patitas',
    price: 25.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: '2 tortillas maíz, 3 patitas de pollo, salsa, lechuga, queso rallado',
  },
  {
    id: 'gen-higados',
    name: 'Orden de Hígados',
    price: 25.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: '2 tortillas maíz, 3 hígados de pollo, salsa, lechuga, queso rallado',
  },
  {
    id: 'gen-huevo',
    name: 'Huevo Preparado',
    price: 22.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: '2 tortillas maíz, 1 huevo, salsa, lechuga, queso rallado',
  },
  {
    id: 'gen-alon',
    name: 'Alón Preparado',
    price: 25.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: '2 tortillas maíz, 1 alita de pollo, salsa, lechuga, queso rallado',
  },

  // --- 🇲🇽 COCINA 1: QUESADILLAS ($33 c/u) ---
  {
    id: 'gen-quesadilla',
    name: 'Quesadilla',
    price: 33.0,
    category: 'quesadillas',
    kitchenStation: 'mexican',
    description: 'Elige el guisado o queso fundido',
    variants: [
      { id: 'v-q-queso', name: 'Queso' },
      { id: 'v-q-tinga', name: 'Tinga de Pollo' },
      { id: 'v-q-bistec', name: 'Bistec' },
      { id: 'v-q-huitla', name: 'Huitlacoche' },
      { id: 'v-q-chich', name: 'Chicharrón Prensado' },
      { id: 'v-q-huevo', name: 'Huevo' },
      { id: 'v-q-molleja', name: 'Molleja' },
      { id: 'v-q-chorizo', name: 'Chorizo' },
      { id: 'v-q-picadillo', name: 'Picadillo' },
      { id: 'v-q-mole-verde', name: 'Mole Verde' },
      { id: 'v-q-panza', name: 'Panza' },
      { id: 'v-q-champ', name: 'Champiñones' },
      { id: 'v-q-pollo', name: 'Pollo' },
      { id: 'v-q-bistec-nopales', name: 'Bistec con Nopales' },
      { id: 'v-q-papa-chorizo', name: 'Papa con Chorizo' },
    ],
  },
  {
    id: 'gen-quesadilla-queso',
    name: 'Quesadilla de Queso',
    price: 33.0,
    category: 'quesadillas',
    kitchenStation: 'mexican',
    description: 'Tortilla de maíz rellena de abundante queso Oaxaca fundido',
  },

  // --- 🇲🇽 COCINA 1: TOSTADAS ($37 c/u) ---
  {
    id: 'gen-tostada',
    name: 'Tostada',
    price: 37.0,
    category: 'tostadas',
    kitchenStation: 'mexican',
    description: 'Tostada de maíz con crema, lechuga, queso rallado y guisado',
    variants: [
      { id: 'v-tost-pata', name: 'Pata de Res' },
      { id: 'v-tost-tinga', name: 'Tinga de Pollo' },
      { id: 'v-tost-picadillo', name: 'Picadillo' },
      { id: 'v-tost-mole-verde', name: 'Mole Verde' },
      { id: 'v-tost-panza', name: 'Panza' },
      { id: 'v-tost-champ', name: 'Champiñones' },
      { id: 'v-tost-pollo', name: 'Pollo' },
      { id: 'v-tost-bistec-nopales', name: 'Bistec con Nopales' },
      { id: 'v-tost-papa-chorizo', name: 'Papa con Chorizo' },
    ],
  },

  // --- 🇲🇽 COCINA 1: GUAJOLOYET ---
  {
    id: 'gen-guajoloyet-nat',
    name: 'Guajoloyet Natural',
    price: 65.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Pambazo con 2 chalupas, pollo, huevo, chorizo, salsa, lechuga y queso',
  },
  {
    id: 'gen-guajoloyet-adob',
    name: 'Guajoloyet Adobado',
    price: 70.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Pambazo adobado con 2 chalupas, pollo, huevo, chorizo, salsa, lechuga y queso',
  },

  // --- 🇲🇽 COCINA 1: POZOLE ---
  {
    id: 'gen-pozole-chico',
    name: 'Pozole Chico',
    price: 100.0,
    category: 'pozole',
    kitchenStation: 'mexican',
    description: 'Pollo, puerco o combinado. Incluye tostadas y guarnición',
    variants: [
      { id: 'v-poz-pollo', name: 'Pollo' },
      { id: 'v-poz-puerco', name: 'Puerco' },
      { id: 'v-poz-mixto', name: 'Mixto / Combinado' },
    ],
  },
  {
    id: 'gen-pozole-grande',
    name: 'Pozole Grande',
    price: 120.0,
    category: 'pozole',
    kitchenStation: 'mexican',
    description: 'Pollo, puerco o combinado. Incluye tostadas y guarnición',
    variants: [
      { id: 'v-poz-pollo', name: 'Pollo' },
      { id: 'v-poz-puerco', name: 'Puerco' },
      { id: 'v-poz-mixto', name: 'Mixto / Combinado' },
    ],
  },

  // --- 🇲🇽 COCINA 1: PAMBAZOS ---
  {
    id: 'gen-pambazo-nat',
    name: 'Pambazo Natural',
    price: 38.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Papa, salsa, lechuga, queso rallado y 1 guisado',
    variants: [
      { id: 'v-pam-papa-ch', name: 'Papa con Chorizo' },
      { id: 'v-pam-tinga', name: 'Tinga de Pollo' },
      { id: 'v-pam-bistec', name: 'Bistec' },
      { id: 'v-pam-picadillo', name: 'Picadillo' },
      { id: 'v-pam-pollo', name: 'Pollo' },
    ],
  },
  {
    id: 'gen-pambazo-nat-queso',
    name: 'Pambazo Natural con Queso',
    price: 53.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Pambazo natural + Queso Oaxaca fundido ($38 + $15)',
    variants: [
      { id: 'v-pam-papa-ch', name: 'Papa con Chorizo' },
      { id: 'v-pam-tinga', name: 'Tinga de Pollo' },
      { id: 'v-pam-bistec', name: 'Bistec' },
      { id: 'v-pam-picadillo', name: 'Picadillo' },
      { id: 'v-pam-pollo', name: 'Pollo' },
    ],
  },
  {
    id: 'gen-pambazo-adob',
    name: 'Pambazo Adobado',
    price: 43.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Papa, salsa, lechuga, queso rallado y 1 guisado',
    variants: [
      { id: 'v-pam-papa-ch', name: 'Papa con Chorizo' },
      { id: 'v-pam-tinga', name: 'Tinga de Pollo' },
      { id: 'v-pam-bistec', name: 'Bistec' },
      { id: 'v-pam-picadillo', name: 'Picadillo' },
      { id: 'v-pam-pollo', name: 'Pollo' },
    ],
  },
  {
    id: 'gen-pambazo-adob-queso',
    name: 'Pambazo Adobado con Queso',
    price: 58.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Pambazo adobado + Queso Oaxaca fundido ($43 + $15)',
    variants: [
      { id: 'v-pam-papa-ch', name: 'Papa con Chorizo' },
      { id: 'v-pam-tinga', name: 'Tinga de Pollo' },
      { id: 'v-pam-bistec', name: 'Bistec' },
      { id: 'v-pam-picadillo', name: 'Picadillo' },
      { id: 'v-pam-pollo', name: 'Pollo' },
    ],
  },
  {
    id: 'gen-pambazo-nat-comb',
    name: 'Pambazo Natural Combinado',
    price: 45.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Papa, salsa, lechuga, queso rallado y 2 guisados',
  },
  {
    id: 'gen-pambazo-adob-comb',
    name: 'Pambazo Adobado Combinado',
    price: 50.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Papa, salsa, lechuga, queso rallado y 2 guisados',
  },

  // --- 🇲🇽 COCINA 1: GUAJOLOTA / VOLCÁN ---
  {
    id: 'gen-guajolota',
    name: 'Guajolota / Volcán',
    price: 60.0,
    category: 'guajolotas',
    kitchenStation: 'mexican',
    description: 'Guisado, salsa, lechuga, queso rallado y queso Oaxaca',
    variants: [
      { id: 'v-gj-queso', name: 'Queso' },
      { id: 'v-gj-pollo', name: 'Pollo' },
      { id: 'v-gj-papa-ch', name: 'Papa con Chorizo' },
      { id: 'v-gj-tinga', name: 'Tinga de Pollo' },
      { id: 'v-gj-bistec', name: 'Bistec' },
      { id: 'v-gj-huitla', name: 'Huitlacoche' },
      { id: 'v-gj-chich', name: 'Chicharrón' },
      { id: 'v-gj-huevo', name: 'Huevo' },
      { id: 'v-gj-molleja', name: 'Molleja' },
      { id: 'v-gj-picadillo', name: 'Picadillo' },
      { id: 'v-gj-mole-v', name: 'Mole Verde' },
      { id: 'v-gj-panza', name: 'Panza' },
      { id: 'v-gj-champ', name: 'Champiñones' },
      { id: 'v-gj-bistec-nop', name: 'Bistec con Nopales' },
      { id: 'v-gj-chorizo', name: 'Chorizo' },
    ],
  },

  // --- 🇺🇸 🌮 COCINA 2: HAMBURGUESAS ---
  {
    id: 'gen-burg-americana',
    name: 'Hamburguesa Americana',
    price: 80.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Carne de res, queso americano, jitomate, cebolla, lechuga, pepinillos, cátsup, mayonesa',
  },
  {
    id: 'gen-burg-hawaiana',
    name: 'Hamburguesa Hawaiana',
    price: 90.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Carne de res, queso americano, jamón, piña, jitomate, cebolla, lechuga, pepinillos',
  },
  {
    id: 'gen-burg-doble',
    name: 'Hamburguesa Doble Carne',
    price: 100.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Doble carne de res, doble queso americano, jitomate, cebolla, lechuga, pepinillos',
  },
  {
    id: 'gen-burg-especial',
    name: 'Hamburguesa Especial de la Casa',
    price: 110.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Carne de res, queso americano, queso manchego, tocino, jamón, piña, jitomate, cebolla, lechuga',
  },
  {
    id: 'gen-burg-tocino-bbq',
    name: 'Hamburguesa Tocino BBQ',
    price: 105.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Carne, queso manchego, tocino, aros de cebolla, salsa BBQ, aderezo, lechuga',
  },
  {
    id: 'gen-burg-pollo-bbq',
    name: 'Hamburguesa Pollo BBQ',
    price: 105.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Pollo crují, queso manchego, tocino, salsa BBQ, aderezo, lechuga, cebolla, pepinillos',
  },

  // --- 🇺🇸 🌮 COCINA 2: ALITAS ---
  {
    id: 'gen-alitas-6',
    name: 'Alitas (Orden de 6)',
    price: 80.0,
    category: 'alitas',
    kitchenStation: 'american_tacos',
    description: 'Salsas: BBQ, BBQ Picante, Búfalo, Mango-Habanero, Lemon Pepper, Ajo Parmesano',
    variants: [
      { id: 'v-al-bbq', name: 'BBQ' },
      { id: 'v-al-bbq-pic', name: 'BBQ Picante' },
      { id: 'v-al-bufalo', name: 'Búfalo' },
      { id: 'v-al-mango', name: 'Mango-Habanero' },
      { id: 'v-al-lemon', name: 'Lemon Pepper' },
      { id: 'v-al-parm', name: 'Ajo Parmesano' },
    ],
  },
  {
    id: 'gen-alitas-12',
    name: 'Alitas (Orden de 12)',
    price: 140.0,
    category: 'alitas',
    kitchenStation: 'american_tacos',
    description: 'Salsas: BBQ, BBQ Picante, Búfalo, Mango-Habanero, Lemon Pepper, Ajo Parmesano',
    variants: [
      { id: 'v-al-bbq', name: 'BBQ' },
      { id: 'v-al-bbq-pic', name: 'BBQ Picante' },
      { id: 'v-al-bufalo', name: 'Búfalo' },
      { id: 'v-al-mango', name: 'Mango-Habanero' },
      { id: 'v-al-lemon', name: 'Lemon Pepper' },
      { id: 'v-al-parm', name: 'Ajo Parmesano' },
    ],
  },

  // --- 🇺🇸 🌮 COCINA 2: TACOS ($35 c/u) ---
  {
    id: 'gen-taco',
    name: 'Taco (Pieza)',
    price: 35.0,
    category: 'tacos',
    kitchenStation: 'american_tacos',
    description: 'Harina o maíz, nopales y perejil frito',
    variants: [
      { id: 'v-tac-arrachera', name: 'Arrachera' },
      { id: 'v-tac-costilla', name: 'Costilla' },
      { id: 'v-tac-enchilada', name: 'Carne Enchilada' },
      { id: 'v-tac-bistec', name: 'Bistec' },
      { id: 'v-tac-chorizo', name: 'Chorizo' },
      { id: 'v-tac-campechano', name: 'Campechano' },
      { id: 'v-tac-chistorra', name: 'Chistorra' },
      { id: 'v-tac-argentino', name: 'Chorizo Argentino' },
    ],
  },

  // --- 🇺🇸 🌮 COCINA 2: PAPAS ---
  {
    id: 'gen-papas-sencillas',
    name: 'Papas Sencillas',
    price: 60.0,
    category: 'papas',
    kitchenStation: 'american_tacos',
    description: 'Papas a la francesa sazonadas',
  },
  {
    id: 'gen-papas-boneless',
    name: 'Papas con Boneless',
    price: 130.0,
    category: 'papas',
    kitchenStation: 'american_tacos',
    description: 'Papas con trozos de boneless (1 salsa a elegir)',
    variants: [
      { id: 'v-bon-bbq', name: 'Salsa BBQ' },
      { id: 'v-bon-bufalo', name: 'Salsa Búfalo' },
      { id: 'v-bon-mango', name: 'Salsa Mango-Habanero' },
      { id: 'v-bon-lemon', name: 'Lemon Pepper' },
    ],
  },
  {
    id: 'gen-papas-aros-bbq',
    name: 'Papas con Aros de Cebolla y BBQ',
    price: 110.0,
    category: 'papas',
    kitchenStation: 'american_tacos',
    description: 'Papas a la francesa con aros de cebolla y salsa BBQ',
  },

  // --- 🇲🇽 BEBIDAS ---
  {
    id: 'gen-refresco',
    name: 'Refresco (Lata / Botella)',
    price: 28.0,
    category: 'bebidas',
    kitchenStation: 'mexican',
    description: 'Elige tu sabor o agrega uno personalizado',
    variants: [
      { id: 'v-ref-coca', name: 'Coca-Cola' },
      { id: 'v-ref-sprite', name: 'Sprite' },
      { id: 'v-ref-manzanita', name: 'Manzanita' },
      { id: 'v-ref-squirt', name: 'Squirt' },
      { id: 'v-ref-sangria', name: 'Sangría' },
      { id: 'v-ref-fanta', name: 'Fanta' },
      { id: 'v-ref-7up', name: '7up' },
      { id: 'v-ref-sidral', name: 'Sidral' },
      { id: 'v-ref-coca-zero', name: 'Coca Zero' },
      { id: 'v-ref-boing-mango', name: 'Boing Mango' },
      { id: 'v-ref-boing-guayaba', name: 'Boing Guayaba' },
    ],
  },
  {
    id: 'gen-agua-500',
    name: 'Agua de Sabor (Medio Litro)',
    price: 26.0,
    category: 'bebidas',
    kitchenStation: 'mexican',
    description: 'Aguas frescas naturales del día',
    variants: [
      { id: 'v-ag-limon', name: 'Agua de Limón' },
      { id: 'v-ag-horchata', name: 'Horchata' },
      { id: 'v-ag-jamaica', name: 'Jamaica' },
      { id: 'v-ag-nuez', name: 'Nuez' },
      { id: 'v-ag-limon-chia', name: 'Limón con Chía' },
      { id: 'v-ag-tamarindo', name: 'Tamarindo' },
      { id: 'v-ag-mojito', name: 'Mojito' },
      { id: 'v-ag-maracuya', name: 'Maracuyá' },
      { id: 'v-ag-jamaica-sin', name: 'Jamaica sin Azúcar' },
    ],
  },
  {
    id: 'gen-agua-1000',
    name: 'Agua de Sabor (1 Litro)',
    price: 45.0,
    category: 'bebidas',
    kitchenStation: 'mexican',
    description: 'Jarra / Litro de agua fresca del día',
    variants: [
      { id: 'v-ag1-limon', name: 'Agua de Limón' },
      { id: 'v-ag1-horchata', name: 'Horchata' },
      { id: 'v-ag1-jamaica', name: 'Jamaica' },
      { id: 'v-ag1-nuez', name: 'Nuez' },
      { id: 'v-ag1-limon-chia', name: 'Limón con Chía' },
      { id: 'v-ag1-tamarindo', name: 'Tamarindo' },
      { id: 'v-ag1-mojito', name: 'Mojito' },
      { id: 'v-ag1-maracuya', name: 'Maracuyá' },
      { id: 'v-ag1-jamaica-sin', name: 'Jamaica sin Azúcar' },
    ],
  },
  {
    id: 'gen-agua-nat',
    name: 'Agua Natural (Embotellada)',
    price: 24.0,
    category: 'bebidas',
    kitchenStation: 'mexican',
    description: 'Agua natural purificada 1L',
  },
  {
    id: 'gen-cafe',
    name: 'Café Americano',
    price: 24.0,
    category: 'bebidas',
    kitchenStation: 'mexican',
    description: 'Café americano recién hecho',
  },

  // --- EXTRAS ---
  {
    id: 'ext-personalizado',
    name: 'Extra Personalizado',
    price: 0.0,
    category: 'extras',
    kitchenStation: 'mexican',
    isCustomPrice: true,
    description: 'Monto y descripción libre definido al momento por el operador',
  },
  {
    id: 'ext-papas-combo',
    name: 'Extra: Con Papas',
    price: 30.0,
    category: 'extras',
    kitchenStation: 'american_tacos',
    description: 'Complemento de papas para hamburguesas o alitas',
  },
  {
    id: 'ext-queso-taco',
    name: 'Extra: Con Queso (Taco)',
    price: 12.0,
    category: 'extras',
    kitchenStation: 'american_tacos',
    description: 'Queso fundido extra para tacos',
  },
  {
    id: 'ext-queso-guajoloyet',
    name: 'Extra: Queso o Guisado (Guajoloyet / Volcán / Pambazo)',
    price: 15.0,
    category: 'extras',
    kitchenStation: 'mexican',
    description: 'Porción extra de queso Oaxaca o guisado',
  },
  {
    id: 'ext-crema-pozole',
    name: 'Extra: Crema (Pozole)',
    price: 10.0,
    category: 'extras',
    kitchenStation: 'mexican',
    description: 'Porción extra de crema',
  },
];

// ==========================================
// MENÚ DETALLADO (Desglose individual de cada guisado y variedad)
// ==========================================
export const MOCK_PRODUCTS_DETAILED: Product[] = [
  // --- ANTOJITOS ---
  ...MOCK_PRODUCTS_GENERAL.filter(p => p.category === 'antojitos'),

  // --- QUESADILLAS ($33 c/u) ---
  { id: 'q-queso', name: 'Quesadilla de Queso', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican', description: 'Tortilla de maíz con abundante queso Oaxaca fundido' },
  { id: 'q-tinga', name: 'Quesadilla Tinga de Pollo', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-bistec', name: 'Quesadilla Bistec', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-huitla', name: 'Quesadilla Huitlacoche', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-chich', name: 'Quesadilla Chicharrón Prensado', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-huevo', name: 'Quesadilla Huevo', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-molleja', name: 'Quesadilla Molleja', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-chorizo', name: 'Quesadilla Chorizo', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-picadillo', name: 'Quesadilla Picadillo', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-mole-verde', name: 'Quesadilla Mole Verde', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-panza', name: 'Quesadilla Panza', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-champ', name: 'Quesadilla Champiñones', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-pollo', name: 'Quesadilla Pollo', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-bistec-nopales', name: 'Quesadilla Bistec con Nopales', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },
  { id: 'q-papa-chorizo', name: 'Quesadilla Papa con Chorizo', price: 33.0, category: 'quesadillas', kitchenStation: 'mexican' },

  // --- TOSTADAS ($37 c/u) ---
  { id: 'tost-pata', name: 'Tostada Pata de Res', price: 37.0, category: 'tostadas', kitchenStation: 'mexican' },
  { id: 'tost-tinga', name: 'Tostada Tinga de Pollo', price: 37.0, category: 'tostadas', kitchenStation: 'mexican' },
  { id: 'tost-picadillo', name: 'Tostada Picadillo', price: 37.0, category: 'tostadas', kitchenStation: 'mexican' },
  { id: 'tost-mole-verde', name: 'Tostada Mole Verde', price: 37.0, category: 'tostadas', kitchenStation: 'mexican' },
  { id: 'tost-panza', name: 'Tostada Panza', price: 37.0, category: 'tostadas', kitchenStation: 'mexican' },
  { id: 'tost-champ', name: 'Tostada Champiñones', price: 37.0, category: 'tostadas', kitchenStation: 'mexican' },
  { id: 'tost-pollo', name: 'Tostada Pollo', price: 37.0, category: 'tostadas', kitchenStation: 'mexican' },
  { id: 'tost-bistec-nopales', name: 'Tostada Bistec con Nopales', price: 37.0, category: 'tostadas', kitchenStation: 'mexican' },
  { id: 'tost-papa-chorizo', name: 'Tostada Papa con Chorizo', price: 37.0, category: 'tostadas', kitchenStation: 'mexican' },

  // --- GUAJOLOYET & POZOLE ---
  ...MOCK_PRODUCTS_GENERAL.filter(p => p.category === 'pambazos' || p.category === 'pozole'),

  // --- GUAJOLOTAS / VOLCANES ($60 c/u) ---
  { id: 'gj-queso', name: 'Guajolota Queso', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-pollo', name: 'Guajolota Pollo', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-papa-chorizo', name: 'Guajolota Papa con Chorizo', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-tinga', name: 'Guajolota Tinga de Pollo', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-bistec', name: 'Guajolota Bistec', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-huitla', name: 'Guajolota Huitlacoche', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-chich', name: 'Guajolota Chicharrón', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-huevo', name: 'Guajolota Huevo', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-molleja', name: 'Guajolota Molleja', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-picadillo', name: 'Guajolota Picadillo', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-mole-verde', name: 'Guajolota Mole Verde', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-panza', name: 'Guajolota Panza', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-champ', name: 'Guajolota Champiñones', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-bistec-nopales', name: 'Guajolota Bistec con Nopales', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },
  { id: 'gj-chorizo', name: 'Guajolota Chorizo', price: 60.0, category: 'guajolotas', kitchenStation: 'mexican' },

  // --- HAMBURGUESAS ---
  ...MOCK_PRODUCTS_GENERAL.filter(p => p.category === 'hamburguesas'),

  // --- ALITAS ---
  ...MOCK_PRODUCTS_GENERAL.filter(p => p.category === 'alitas'),

  // --- TACOS ($35 c/u) ---
  { id: 'tac-arrachera', name: 'Taco de Arrachera', price: 35.0, category: 'tacos', kitchenStation: 'american_tacos', description: 'Harina o maíz, nopales y perejil frito' },
  { id: 'tac-costilla', name: 'Taco de Costilla', price: 35.0, category: 'tacos', kitchenStation: 'american_tacos', description: 'Harina o maíz, nopales y perejil frito' },
  { id: 'tac-enchilada', name: 'Taco de Carne Enchilada', price: 35.0, category: 'tacos', kitchenStation: 'american_tacos', description: 'Harina o maíz, nopales y perejil frito' },
  { id: 'tac-bistec', name: 'Taco de Bistec', price: 35.0, category: 'tacos', kitchenStation: 'american_tacos', description: 'Harina o maíz, nopales y perejil frito' },
  { id: 'tac-chorizo', name: 'Taco de Chorizo', price: 35.0, category: 'tacos', kitchenStation: 'american_tacos', description: 'Harina o maíz, nopales y perejil frito' },
  { id: 'tac-campechano', name: 'Taco Campechano', price: 35.0, category: 'tacos', kitchenStation: 'american_tacos', description: 'Harina o maíz, nopales y perejil frito' },
  { id: 'tac-chistorra', name: 'Taco de Chistorra', price: 35.0, category: 'tacos', kitchenStation: 'american_tacos', description: 'Harina o maíz, nopales y perejil frito' },
  { id: 'tac-argentino', name: 'Taco de Chorizo Argentino', price: 35.0, category: 'tacos', kitchenStation: 'american_tacos', description: 'Harina o maíz, nopales y perejil frito' },

  // --- PAPAS & BEBIDAS & EXTRAS ---
  ...MOCK_PRODUCTS_GENERAL.filter(p => p.category === 'papas' || p.category === 'bebidas' || p.category === 'extras'),
];

export const MOCK_PRODUCTS: Product[] = MOCK_PRODUCTS_GENERAL;

export const getProductsByMode = (mode: 'general' | 'detailed'): Product[] => {
  return mode === 'general' ? MOCK_PRODUCTS_GENERAL : MOCK_PRODUCTS_DETAILED;
};

export const getCategoriesByMode = (mode: 'general' | 'detailed'): Category[] => {
  return mode === 'general' ? CATEGORIES_GENERAL : CATEGORIES_DETAILED;
};

export const getProductById = (id: string): Product | undefined => {
  return MOCK_PRODUCTS_DETAILED.find(p => p.id === id) || MOCK_PRODUCTS_GENERAL.find(p => p.id === id);
};
