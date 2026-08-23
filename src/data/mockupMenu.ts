// src/data/mockupMenu.ts
import { Product } from '../store/useCartStore';

export interface Category {
  id: string;
  name: string;
  station: 'mexican' | 'american_tacos' | 'all';
}

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
    description: 'Con o sin queso. Especificar guisado en notas',
  },

  // --- 🇲🇽 COCINA 1: TOSTADAS ($37 c/u) ---
  {
    id: 'gen-tostada',
    name: 'Tostada',
    price: 37.0,
    category: 'tostadas',
    kitchenStation: 'mexican',
    description: 'Tostada de maíz, crema, guisado a elegir, lechuga, queso rallado',
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
  },
  {
    id: 'gen-pozole-grande',
    name: 'Pozole Grande',
    price: 120.0,
    category: 'pozole',
    kitchenStation: 'mexican',
    description: 'Pollo, puerco o combinado. Incluye tostadas y guarnición',
  },

  // --- 🇲🇽 COCINA 1: PAMBAZOS ---
  {
    id: 'gen-pambazo-nat',
    name: 'Pambazo Natural',
    price: 38.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Papa, salsa, lechuga, queso rallado y 1 guisado',
  },
  {
    id: 'gen-pambazo-adob',
    name: 'Pambazo Adobado',
    price: 43.0,
    category: 'pambazos',
    kitchenStation: 'mexican',
    description: 'Papa, salsa, lechuga, queso rallado y 1 guisado',
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
  },

  // --- 🇺🇸 🌮 COCINA 2: HAMBURGUESAS ---
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
    description: 'Carne, tocino, queso Oaxaca, queso americano, aderezo, lechuga, cebolla, pepinillos',
  },
  {
    id: 'gen-burg-suiza',
    name: 'Hamburguesa Suiza',
    price: 90.0,
    category: 'hamburguesas',
    kitchenStation: 'american_tacos',
    description: 'Carne, queso Oaxaca, americano, manchego, aderezo, lechuga, cebolla, pepinillos',
  },
  {
    id: 'gen-burg-texana',
    name: 'Hamburguesa Texana',
    price: 110.0,
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
  },
  {
    id: 'gen-alitas-12',
    name: 'Alitas (Orden de 12)',
    price: 140.0,
    category: 'alitas',
    kitchenStation: 'american_tacos',
    description: 'Salsas: BBQ, BBQ Picante, Búfalo, Mango-Habanero, Lemon Pepper, Ajo Parmesano',
  },

  // --- 🇺🇸 🌮 COCINA 2: TACOS ($35 c/u) ---
  {
    id: 'gen-taco',
    name: 'Taco (Pieza)',
    price: 35.0,
    category: 'tacos',
    kitchenStation: 'american_tacos',
    description: 'Harina o maíz, nopales y perejil frito. Especificar carne en notas',
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
    description: 'Coca-Cola, Sangría, Manzanita, Squirt, 7up, Mirinda, Sprite, Boing, etc.',
  },
  {
    id: 'gen-agua-500',
    name: 'Agua de Sabor (Medio Litro)',
    price: 26.0,
    category: 'bebidas',
    kitchenStation: 'mexican',
    description: 'Horchata, Nuez, Jamaica, Limón con chía, Mojito, Jamaica sin azúcar',
  },
  {
    id: 'gen-agua-1000',
    name: 'Agua Natural (1 Litro)',
    price: 24.0,
    category: 'bebidas',
    kitchenStation: 'mexican',
    description: 'Agua natural embotellada 1L',
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
