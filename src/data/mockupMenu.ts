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


export const MOCK_PRODUCTS_GENERAL: Product[] = [
  // --- 🇲🇽 COCINA 1: ANTOJITOS ---
  {
    id: 'gen-chalupa',
    name: 'Chalupa (Pieza)',
    price: 6.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: 'Tortillita de maíz, papa, salsa, lechuga, queso rallado y pollo ($6 por pieza)',
  },
  {
    id: 'gen-mollejas',
    name: 'Orden de Mollejas',
    price: 25.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: '2 tortillitas de maíz, 3 mollejas de pollo, salsa, lechuga, queso rallado',
  },
  {
    id: 'gen-patitas',
    name: 'Orden de Patitas',
    price: 25.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: '2 tortillitas de maíz, 3 patitas de pollo, salsa, lechuga, queso rallado',
  },
  {
    id: 'gen-higados',
    name: 'Orden de Hígados',
    price: 25.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: '2 tortillitas de maíz, 3 hígados de pollo, salsa, lechuga, queso rallado',
  },
  {
    id: 'gen-huevo',
    name: 'Huevo Preparado',
    price: 22.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: '2 tortillitas de maíz, 1 huevo, salsa, lechuga, queso rallado',
  },
  {
    id: 'gen-alon',
    name: 'Alón Preparado',
    price: 25.0,
    category: 'antojitos',
    kitchenStation: 'mexican',
    description: '2 tortillitas de maíz, 1 alita de pollo, salsa, lechuga, queso rallado',
  },

  // --- 🇲🇽 COCINA 1: QUESADILLAS ($33 c/u - Con o Sin Queso, Aprox. 25 cm) ---
  {
    id: 'gen-quesadilla',
    name: 'Quesadilla (Aprox. 25 cm)',
    price: 33.0,
    category: 'quesadillas',
    kitchenStation: 'mexican',
    description: 'Con o sin queso. Elige el guisado o solo queso',
    variants: [
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
      { id: 'v-q-solo-queso', name: 'Solo Queso' },
    ],
  },

  // --- 🇲🇽 COCINA 1: TOSTADAS ($37 c/u) ---
  {
    id: 'gen-tostada',
    name: 'Tostada',
    price: 37.0,
    category: 'tostadas',
    kitchenStation: 'mexican',
    description: 'Tostada de maíz, crema, guisado a elegir, lechuga, queso rallado',
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
    description: 'Pambazo relleno con dos chalupas, pollo, huevo, chorizo, salsa, lechuga y queso rallado',
  },
  {
    id: 'gen-guajoloyet-adob',
    name: 'Guajoloyet Adobado',
    price: 70.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Pambazo relleno con dos chalupas, pollo, huevo, chorizo, salsa, lechuga y queso rallado',
  },

  // --- 🇲🇽 COCINA 1: POZOLE ---
  {
    id: 'gen-pozole-chico',
    name: 'Pozole Chico',
    price: 100.0,
    category: 'pozole',
    kitchenStation: 'mexican',
    description: 'Pollo, puerco o combinado. Guarnición: tostadas, lechuga, cebolla, rábano, limón, orégano, chile triturado',
    variants: [
      { id: 'v-poz-pollo', name: 'Pollo' },
      { id: 'v-poz-puerco', name: 'Puerco' },
      { id: 'v-poz-mixto', name: 'Combinado (Pollo y Puerco)' },
    ],
  },
  {
    id: 'gen-pozole-grande',
    name: 'Pozole Grande',
    price: 120.0,
    category: 'pozole',
    kitchenStation: 'mexican',
    description: 'Pollo, puerco o combinado. Guarnición: tostadas, lechuga, cebolla, rábano, limón, orégano, chile triturado',
    variants: [
      { id: 'v-poz-pollo', name: 'Pollo' },
      { id: 'v-poz-puerco', name: 'Puerco' },
      { id: 'v-poz-mixto', name: 'Combinado (Pollo y Puerco)' },
    ],
  },

  // --- 🇲🇽 COCINA 1: PAMBAZOS (Papa, salsa, lechuga, queso rallado. Queso extra $15) ---
  {
    id: 'gen-pambazo-nat',
    name: 'Pambazo Natural (1 Guisado)',
    price: 38.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Papa, salsa, lechuga, queso rallado y 1 guisado a elegir',
    variants: [
      { id: 'v-pam-pollo', name: 'Pollo' },
      { id: 'v-pam-papa-ch', name: 'Papa con Chorizo' },
      { id: 'v-pam-tinga', name: 'Tinga de Pollo' },
      { id: 'v-pam-bistec', name: 'Bistec' },
      { id: 'v-pam-huitla', name: 'Huitlacoche' },
      { id: 'v-pam-chich', name: 'Chicharrón' },
      { id: 'v-pam-huevo', name: 'Huevo' },
      { id: 'v-pam-molleja', name: 'Molleja' },
      { id: 'v-pam-picadillo', name: 'Picadillo' },
      { id: 'v-pam-mole-v', name: 'Mole Verde' },
      { id: 'v-pam-panza', name: 'Panza' },
      { id: 'v-pam-champ', name: 'Champiñones' },
      { id: 'v-pam-bistec-nop', name: 'Bistec con Nopales' },
    ],
  },
  {
    id: 'gen-pambazo-adob',
    name: 'Pambazo Adobado (1 Guisado)',
    price: 43.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Papa, salsa, lechuga, queso rallado y 1 guisado a elegir',
    variants: [
      { id: 'v-pam-pollo', name: 'Pollo' },
      { id: 'v-pam-papa-ch', name: 'Papa con Chorizo' },
      { id: 'v-pam-tinga', name: 'Tinga de Pollo' },
      { id: 'v-pam-bistec', name: 'Bistec' },
      { id: 'v-pam-huitla', name: 'Huitlacoche' },
      { id: 'v-pam-chich', name: 'Chicharrón' },
      { id: 'v-pam-huevo', name: 'Huevo' },
      { id: 'v-pam-molleja', name: 'Molleja' },
      { id: 'v-pam-picadillo', name: 'Picadillo' },
      { id: 'v-pam-mole-v', name: 'Mole Verde' },
      { id: 'v-pam-panza', name: 'Panza' },
      { id: 'v-pam-champ', name: 'Champiñones' },
      { id: 'v-pam-bistec-nop', name: 'Bistec con Nopales' },
    ],
  },
  {
    id: 'gen-pambazo-nat-comb',
    name: 'Pambazo Natural Combinado (2 Guisados)',
    price: 45.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Papa, salsa, lechuga, queso rallado y 2 guisados a elegir',
  },
  {
    id: 'gen-pambazo-adob-comb',
    name: 'Pambazo Adobado Combinado (2 Guisados)',
    price: 50.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Papa, salsa, lechuga, queso rallado y 2 guisados a elegir',
  },

  // --- 🇲🇽 COCINA 1: GUAJOLOTA / VOLCÁN ---
  {
    id: 'gen-guajolota',
    name: 'Guajolota (Volcán) (1 Guisado)',
    price: 60.0,
    category: 'guajolotas',
    kitchenStation: 'mexican',
    description: 'Tortilla de maíz estilo huarache de aprox 25 cm, guisado, salsa, lechuga, queso rallado y queso Oaxaca',
    variants: [
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

  // --- 🇺🇸 🌮 COCINA 2: HAMBURGUESAS (Con papas 150gr + $30) ---
  {
    id: 'gen-burg-americana',
    name: 'Hamburguesa Americana',
    price: 60.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Carne, queso americano, aderezo de la casa, cebolla, pepinillos',
  },
  {
    id: 'gen-burg-especial',
    name: 'Hamburguesa Especial',
    price: 90.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Carne, tocino, queso Oaxaca, queso americano, aderezo de la casa, lechuga, cebolla, pepinillos',
  },
  {
    id: 'gen-burg-suiza',
    name: 'Hamburguesa Suiza',
    price: 90.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Carne, queso Oaxaca, queso americano, queso manchego, aderezo de la casa, lechuga, cebolla, pepinillos',
  },
  {
    id: 'gen-burg-texana',
    name: 'Hamburguesa Texana',
    price: 110.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Carne, queso manchego, tocino, aros de cebolla, salsa BBQ, aderezo de la casa, lechuga, cebolla, pepinillos',
  },
  {
    id: 'gen-burg-pollo-bbq',
    name: 'Hamburguesa Pollo BBQ',
    price: 105.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Pollo crují, queso manchego, tocino, salsa BBQ, aderezo de la casa, lechuga, cebolla, pepinillos',
  },

  // --- 🇺🇸 🌮 COCINA 2: ALITAS (Con papas 150gr + $30) ---
  {
    id: 'gen-alitas-6',
    name: 'Alitas (Orden de 6)',
    price: 80.0,
    category: 'alitas',
    kitchenStation: 'american_tacos',
    description: 'Salsas a elegir: BBQ, BBQ Picante, Búfalo, Mango - Habanero, Lemon Pepper, Ajo Parmesano',
    variants: [
      { id: 'v-al-bbq', name: 'BBQ' },
      { id: 'v-al-bbq-pic', name: 'BBQ Picante' },
      { id: 'v-al-bufalo', name: 'Búfalo' },
      { id: 'v-al-mango', name: 'Mango - Habanero' },
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
    description: 'Salsas a elegir: BBQ, BBQ Picante, Búfalo, Mango - Habanero, Lemon Pepper, Ajo Parmesano',
    variants: [
      { id: 'v-al-bbq', name: 'BBQ' },
      { id: 'v-al-bbq-pic', name: 'BBQ Picante' },
      { id: 'v-al-bufalo', name: 'Búfalo' },
      { id: 'v-al-mango', name: 'Mango - Habanero' },
      { id: 'v-al-lemon', name: 'Lemon Pepper' },
      { id: 'v-al-parm', name: 'Ajo Parmesano' },
    ],
  },

  // --- 🇺🇸 🌮 COCINA 2: TACOS ($35 c/u - Con queso + $12) ---
  {
    id: 'gen-taco',
    name: 'Taco (Pieza)',
    price: 35.0,
    category: 'tacos',
    kitchenStation: 'american_tacos',
    description: 'Tortilla de harina o de maíz, nopales y perejil frito',
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
    description: 'Papas con trozos de boneless (una salsa a elegir)',
    variants: [
      { id: 'v-bon-bbq', name: 'BBQ' },
      { id: 'v-bon-bbq-pic', name: 'BBQ Picante' },
      { id: 'v-bon-bufalo', name: 'Búfalo' },
      { id: 'v-bon-mango', name: 'Mango - Habanero' },
      { id: 'v-bon-lemon', name: 'Lemon Pepper' },
      { id: 'v-bon-parm', name: 'Ajo Parmesano' },
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
    name: 'Refresco',
    price: 28.0,
    category: 'bebidas',
    kitchenStation: 'mexican',
    description: 'Coca-Cola, Sangría casera, Manzanita sol, Squirt, 7up, Mirinda, Sprite, Sidral Mundet, Delaware Punch, Fanta, Boing',
    variants: [
      { id: 'v-ref-coca', name: 'Coca-Cola' },
      { id: 'v-ref-sangria', name: 'Sangría Casera' },
      { id: 'v-ref-manzanita', name: 'Manzanita Sol' },
      { id: 'v-ref-squirt', name: 'Squirt' },
      { id: 'v-ref-7up', name: '7up' },
      { id: 'v-ref-mirinda', name: 'Mirinda' },
      { id: 'v-ref-sprite', name: 'Sprite' },
      { id: 'v-ref-sidral', name: 'Sidral Mundet' },
      { id: 'v-ref-delaware', name: 'Delaware Punch' },
      { id: 'v-ref-fanta', name: 'Fanta' },
      { id: 'v-ref-boing', name: 'Boing' },
    ],
  },
  {
    id: 'gen-agua-500',
    name: 'Agua de Sabor (Medio Litro)',
    price: 26.0,
    category: 'bebidas',
    kitchenStation: 'mexican',
    description: 'Horchata, Nuez, Jamaica, Limón con chía, Mojito, Jamaica sin azúcar',
    variants: [
      { id: 'v-ag-horchata', name: 'Horchata' },
      { id: 'v-ag-nuez', name: 'Nuez' },
      { id: 'v-ag-jamaica', name: 'Jamaica' },
      { id: 'v-ag-limon-chia', name: 'Limón con Chía' },
      { id: 'v-ag-mojito', name: 'Mojito' },
      { id: 'v-ag-jamaica-sin', name: 'Jamaica sin Azúcar' },
    ],
  },
  {
    id: 'gen-cafe',
    name: 'Café Americano',
    price: 24.0,
    category: 'bebidas',
    kitchenStation: 'mexican',
    description: 'Café americano recién hecho',
  },
  {
    id: 'gen-agua-nat',
    name: 'Agua Natural (1 Litro)',
    price: 24.0,
    category: 'bebidas',
    kitchenStation: 'mexican',
    description: 'Agua natural (Un litro)',
  },

  // --- EXTRAS Y ADICIONALES DEL MENÚ OFICIAL ---
  {
    id: 'ext-papas-combo',
    name: 'Extra: Con Papas (150 gr)',
    price: 30.0,
    category: 'extras',
    kitchenStation: 'american_tacos',
    description: 'Complemento de papas para hamburguesas o alitas (+ $30)',
  },
  {
    id: 'ext-queso-taco',
    name: 'Extra: Con Queso (Taco)',
    price: 12.0,
    category: 'extras',
    kitchenStation: 'american_tacos',
    description: 'Queso extra para taco (+ $12)',
  },
  {
    id: 'ext-queso-general',
    name: 'Extra: Queso (Pambazo / Guajolota / Guajoloyet)',
    price: 15.0,
    category: 'extras',
    kitchenStation: 'mexican',
    description: 'Queso extra (+ $15)',
  },
  {
    id: 'ext-guisado-guajoloyet',
    name: 'Extra: Guisado (Guajoloyet)',
    price: 15.0,
    category: 'extras',
    kitchenStation: 'mexican',
    description: 'Guisado extra (+ $15)',
  },
  {
    id: 'ext-crema-pozole',
    name: 'Extra: Crema (Pozole)',
    price: 10.0,
    category: 'extras',
    kitchenStation: 'mexican',
    description: 'Crema extra para pozole (+ $10)',
  },
  {
    id: 'ext-personalizado',
    name: 'Extra Personalizado',
    price: 0.0,
    category: 'extras',
    kitchenStation: 'mexican',
    isCustomPrice: true,
    description: 'Monto y descripción libre definido al momento por el operador',
  },
];

// ==========================================
// MENÚ DETALLADO
// ==========================================
export const MOCK_PRODUCTS_DETAILED: Product[] = MOCK_PRODUCTS_GENERAL;

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
