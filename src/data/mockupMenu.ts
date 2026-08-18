// src/data/mockupMenu.ts
import { Product } from '../store/useCartStore';

export interface Category {
  id: string;
  name: string;
}

export const CATEGORIES_DETAILED: Category[] = [
  { id: 'top', name: '★ Populares' },
  { id: 'antojitos', name: 'Antojitos' },
  { id: 'quesadillas', name: 'Quesadillas' },
  { id: 'tostadas', name: 'Tostadas' },
  { id: 'pambazos', name: 'Pambazos' },
  { id: 'especiales', name: 'Guajolotas y Guajoloyet' },
  { id: 'pozole', name: 'Pozole' },
  { id: 'tacos', name: 'Tacos' },
  { id: 'hamburguesas', name: 'Hamburguesas' },
  { id: 'alitas_papas', name: 'Alitas y Papas' },
  { id: 'bebidas', name: 'Bebidas' },
  { id: 'extras', name: 'Extras' },
];

export const CATEGORIES_GENERAL: Category[] = [
  { id: 'top', name: '★ Principales' },
  { id: 'antojitos', name: 'Antojitos' },
  { id: 'quesadillas', name: 'Quesadillas' },
  { id: 'tostadas', name: 'Tostadas' },
  { id: 'pambazos', name: 'Pambazos' },
  { id: 'especiales', name: 'Especiales' },
  { id: 'pozole', name: 'Pozole' },
  { id: 'tacos', name: 'Tacos' },
  { id: 'hamburguesas', name: 'Hamburguesas' },
  { id: 'alitas_papas', name: 'Alitas y Papas' },
  { id: 'bebidas', name: 'Bebidas' },
  { id: 'extras', name: 'Extras' },
];

export const CATEGORIES: Category[] = CATEGORIES_GENERAL;

export const MOCK_PRODUCTS_GENERAL: Product[] = [
  // --- ANTOJITOS ---
  {
    id: 'gen-chalupa',
    name: 'Chalupa (Pieza)',
    price: 6.0,
    category: 'antojitos',
    description: 'Tortillita de maíz, papa, salsa, lechuga, queso y pollo',
  },
  {
    id: 'gen-menudencias',
    name: 'Orden de Menudencias',
    price: 25.0,
    category: 'antojitos',
    description: '2 tortillas maíz, mollejas / patitas / hígados, salsa, lechuga y queso',
  },
  {
    id: 'gen-huevo',
    name: 'Huevo Preparado',
    price: 22.0,
    category: 'antojitos',
    description: '2 tortillas maíz, huevo, salsa, lechuga y queso rallado',
  },
  {
    id: 'gen-alon',
    name: 'Alón Preparado',
    price: 25.0,
    category: 'antojitos',
    description: '2 tortillas maíz, alita de pollo, salsa, lechuga y queso',
  },

  // --- QUESADILLAS (General) ---
  {
    id: 'gen-quesadilla',
    name: 'Quesadilla',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso. Guisado a elegir (tinga, bistec, huitlacoche, etc.)',
  },

  // --- TOSTADAS (General) ---
  {
    id: 'gen-tostada',
    name: 'Tostada',
    price: 37.0,
    category: 'tostadas',
    description: 'Tostada maíz, crema, guisado a elegir, lechuga y queso rallado',
  },

  // --- PAMBAZOS (General) ---
  {
    id: 'gen-pambazo-natural',
    name: 'Pambazo Natural',
    price: 38.0,
    category: 'pambazos',
    description: '1 guisado a elegir, papa, salsa, lechuga y queso rallado',
  },
  {
    id: 'gen-pambazo-adobado',
    name: 'Pambazo Adobado',
    price: 43.0,
    category: 'pambazos',
    description: '1 guisado a elegir, adobado, papa, salsa, lechuga y queso',
  },
  {
    id: 'gen-pambazo-comb',
    name: 'Pambazo Combinado (2 Guisados)',
    price: 48.0,
    category: 'pambazos',
    description: '2 guisados a elegir, natural o adobado, papa, salsa, lechuga y queso',
  },

  // --- ESPECIALES ---
  {
    id: 'gen-guajolota',
    name: 'Guajolota / Volcán',
    price: 60.0,
    category: 'especiales',
    description: 'Huarache ~25cm con guisado a elegir, salsa, lechuga, queso rallado y Oaxaca',
  },
  {
    id: 'gen-guajoloyet-natural',
    name: 'Guajoloyet Natural',
    price: 65.0,
    category: 'especiales',
    description: 'Pambazo natural con 2 chalupas, pollo, huevo, chorizo, salsa, lechuga y queso',
  },
  {
    id: 'gen-guajoloyet-adobado',
    name: 'Guajoloyet Adobado',
    price: 70.0,
    category: 'especiales',
    description: 'Pambazo adobado con 2 chalupas, pollo, huevo, chorizo, salsa, lechuga y queso',
  },

  // --- POZOLE ---
  {
    id: 'gen-pozole-chico',
    name: 'Pozole Chico',
    price: 100.0,
    category: 'pozole',
    description: 'Pollo, puerco o combinado. Incluye tostadas y guarnición',
  },
  {
    id: 'gen-pozole-grande',
    name: 'Pozole Grande',
    price: 120.0,
    category: 'pozole',
    description: 'Pollo, puerco o combinado. Incluye tostadas y guarnición',
  },

  // --- TACOS (General) ---
  {
    id: 'gen-taco',
    name: 'Taco (Harina o Maíz)',
    price: 35.0,
    category: 'tacos',
    description: 'Arrachera, costilla, carne enchilada, bistec, chorizo o campechano. Con nopales y perejil',
  },

  // --- HAMBURGUESAS ---
  {
    id: 'gen-hamburguesa-sencilla',
    name: 'Hamburguesa Americana',
    price: 60.0,
    category: 'hamburguesas',
    description: 'Carne, queso americano, aderezo de la casa, cebolla, pepinillos',
  },
  {
    id: 'gen-hamburguesa-especial',
    name: 'Hamburguesa Especial / Suiza',
    price: 90.0,
    category: 'hamburguesas',
    description: 'Carne, tocino, queso Oaxaca, americano/manchego, aderezo, lechuga, cebolla',
  },
  {
    id: 'gen-hamburguesa-texana',
    name: 'Hamburguesa Texana / Pollo BBQ',
    price: 110.0,
    category: 'hamburguesas',
    description: 'Carne o pollo crují, manchego, tocino, aros de cebolla, salsa BBQ, aderezo',
  },

  // --- ALITAS Y PAPAS ---
  {
    id: 'gen-alitas-6',
    name: 'Alitas (Orden de 6)',
    price: 80.0,
    category: 'alitas_papas',
    description: 'BBQ, BBQ Picante, Búfalo, Mango-Hab., Lemon Pepper o Ajo Parm.',
  },
  {
    id: 'gen-alitas-12',
    name: 'Alitas (Orden de 12)',
    price: 140.0,
    category: 'alitas_papas',
    description: 'BBQ, BBQ Picante, Búfalo, Mango-Hab., Lemon Pepper o Ajo Parm.',
  },
  {
    id: 'gen-papas-sencillas',
    name: 'Papas a la Francesa',
    price: 60.0,
    category: 'alitas_papas',
    description: 'Porción de papas a la francesa clásicas',
  },
  {
    id: 'gen-papas-boneless',
    name: 'Papas con Boneless',
    price: 130.0,
    category: 'alitas_papas',
    description: 'Papas francesas con boneless y 1 salsa a elegir',
  },
  {
    id: 'gen-papas-aros',
    name: 'Papas c/ Aros de Cebolla y BBQ',
    price: 110.0,
    category: 'alitas_papas',
    description: 'Papas francesas, aros de cebolla y salsa BBQ',
  },

  // --- BEBIDAS ---
  {
    id: 'gen-refresco',
    name: 'Refresco',
    price: 28.0,
    category: 'bebidas',
    description: 'Coca-Cola, Sangría, Manzanita, Squirt, 7up, Mirinda, Sprite, Boing...',
  },
  {
    id: 'gen-agua-500',
    name: 'Agua de Sabor (1/2 Litro)',
    price: 26.0,
    category: 'bebidas',
    description: 'Horchata, Nuez, Jamaica, Limón c/ chía, Mojito...',
  },
  {
    id: 'gen-agua-1000',
    name: 'Agua Natural (1 Litro)',
    price: 24.0,
    category: 'bebidas',
    description: 'Agua purificada natural 1L',
  },
  {
    id: 'gen-cafe',
    name: 'Café Americano',
    price: 24.0,
    category: 'bebidas',
    description: 'Café americano caliente',
  },

  // --- EXTRAS ---
  {
    id: 'gen-ext-papas',
    name: 'Complemento Papas (150 gr)',
    price: 30.0,
    category: 'extras',
    description: 'Para acompañar hamburguesas o alitas (+150 gr)',
  },
  {
    id: 'gen-ext-queso',
    name: 'Queso Extra',
    price: 15.0,
    category: 'extras',
    description: 'Para Pambazo, Guajolota o Guajoloyet',
  },
  {
    id: 'gen-ext-guisado',
    name: 'Guisado Extra',
    price: 15.0,
    category: 'extras',
    description: 'Porción de guisado extra',
  },
  {
    id: 'gen-ext-taco-queso',
    name: 'Con Queso (Extra Taco)',
    price: 12.0,
    category: 'extras',
    description: 'Queso adicional para orden de taco',
  },
  {
    id: 'gen-ext-crema',
    name: 'Crema Extra (Pozole)',
    price: 10.0,
    category: 'extras',
    description: 'Porción extra de crema',
  },
];

export const MOCK_PRODUCTS_DETAILED: Product[] = [
  // --- ANTOJITOS (Página 1) ---
  {
    id: 'ant-chalupa',
    name: 'Chalupa (Pieza)',
    price: 6.0,
    category: 'antojitos',
    description: 'Tortillita de maíz, papa, salsa, lechuga, queso y pollo',
  },
  {
    id: 'ant-mollejas',
    name: 'Orden de Mollejas',
    price: 25.0,
    category: 'antojitos',
    description: '2 tortillas maíz, 3 mollejas pollo, salsa, lechuga, queso',
  },
  {
    id: 'ant-patitas',
    name: 'Orden de Patitas',
    price: 25.0,
    category: 'antojitos',
    description: '2 tortillas maíz, 3 patitas pollo, salsa, lechuga, queso',
  },
  {
    id: 'ant-higados',
    name: 'Orden de Hígados',
    price: 25.0,
    category: 'antojitos',
    description: '2 tortillas maíz, 3 hígados pollo, salsa, lechuga, queso',
  },
  {
    id: 'ant-huevo',
    name: 'Huevo Preparado',
    price: 22.0,
    category: 'antojitos',
    description: '2 tortillas maíz, 1 huevo, salsa, lechuga, queso rallado',
  },
  {
    id: 'ant-alon',
    name: 'Alón Preparado',
    price: 25.0,
    category: 'antojitos',
    description: '2 tortillas maíz, 1 alita pollo, salsa, lechuga, queso rallado',
  },

  // --- QUESADILLAS (Aprox. 25 cm - Con o sin queso - $33 c/u) (Página 1) ---
  {
    id: 'ques-tinga',
    name: 'Quesadilla Tinga de Pollo',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-bistec',
    name: 'Quesadilla Bistec',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-huitlacoche',
    name: 'Quesadilla Huitlacoche',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-chicharron',
    name: 'Quesadilla Chicharrón Prensado',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-huevo',
    name: 'Quesadilla Huevo',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-molleja',
    name: 'Quesadilla Molleja',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-chorizo',
    name: 'Quesadilla Chorizo',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-picadillo',
    name: 'Quesadilla Picadillo',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-mole-verde',
    name: 'Quesadilla Mole Verde',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-panza',
    name: 'Quesadilla Panza',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-champinones',
    name: 'Quesadilla Champiñones',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-pollo',
    name: 'Quesadilla Pollo',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-bistec-nopales',
    name: 'Quesadilla Bistec c/ Nopales',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },
  {
    id: 'ques-papa-chorizo',
    name: 'Quesadilla Papa c/ Chorizo',
    price: 33.0,
    category: 'quesadillas',
    description: 'Aprox. 25 cm, con o sin queso',
  },

  // --- TOSTADAS ($37 c/u) (Página 1) ---
  {
    id: 'tost-pata',
    name: 'Tostada Pata de Res',
    price: 37.0,
    category: 'tostadas',
    description: 'Tostada maíz, crema, guisado, lechuga y queso rallado',
  },
  {
    id: 'tost-tinga',
    name: 'Tostada Tinga de Pollo',
    price: 37.0,
    category: 'tostadas',
    description: 'Tostada maíz, crema, guisado, lechuga y queso rallado',
  },
  {
    id: 'tost-picadillo',
    name: 'Tostada Picadillo',
    price: 37.0,
    category: 'tostadas',
    description: 'Tostada maíz, crema, guisado, lechuga y queso rallado',
  },
  {
    id: 'tost-mole-verde',
    name: 'Tostada Mole Verde',
    price: 37.0,
    category: 'tostadas',
    description: 'Tostada maíz, crema, guisado, lechuga y queso rallado',
  },
  {
    id: 'tost-panza',
    name: 'Tostada Panza',
    price: 37.0,
    category: 'tostadas',
    description: 'Tostada maíz, crema, guisado, lechuga y queso rallado',
  },
  {
    id: 'tost-champinones',
    name: 'Tostada Champiñones',
    price: 37.0,
    category: 'tostadas',
    description: 'Tostada maíz, crema, guisado, lechuga y queso rallado',
  },
  {
    id: 'tost-pollo',
    name: 'Tostada Pollo',
    price: 37.0,
    category: 'tostadas',
    description: 'Tostada maíz, crema, guisado, lechuga y queso rallado',
  },
  {
    id: 'tost-bistec-nopales',
    name: 'Tostada Bistec c/ Nopales',
    price: 37.0,
    category: 'tostadas',
    description: 'Tostada maíz, crema, guisado, lechuga y queso rallado',
  },
  {
    id: 'tost-papa-chorizo',
    name: 'Tostada Papa c/ Chorizo',
    price: 37.0,
    category: 'tostadas',
    description: 'Tostada maíz, crema, guisado, lechuga y queso rallado',
  },

  // --- GUAJOLOYET Y GUAJOLOTAS (Página 1 y 2) ---
  {
    id: 'esp-guajoloyet-adobado',
    name: 'Guajoloyet Adobado',
    price: 70.0,
    category: 'especiales',
    description: 'Pambazo adobado con 2 chalupas, pollo, huevo, chorizo, salsa, lechuga y queso',
  },
  {
    id: 'esp-guajoloyet-natural',
    name: 'Guajoloyet Natural',
    price: 65.0,
    category: 'especiales',
    description: 'Pambazo natural con 2 chalupas, pollo, huevo, chorizo, salsa, lechuga y queso',
  },
  {
    id: 'esp-guajolota',
    name: 'Guajolota / Volcán (1 Guisado)',
    price: 60.0,
    category: 'especiales',
    description: 'Huarache ~25cm con guisado, salsa, lechuga, queso rallado y Oaxaca',
  },

  // --- POZOLE (Página 1) ---
  {
    id: 'poz-chico',
    name: 'Pozole Chico',
    price: 100.0,
    category: 'pozole',
    description: 'Pollo, puerco o combinado. Incluye tostadas y guarnición',
  },
  {
    id: 'poz-grande',
    name: 'Pozole Grande',
    price: 120.0,
    category: 'pozole',
    description: 'Pollo, puerco o combinado. Incluye tostadas y guarnición',
  },

  // --- PAMBAZOS (Página 2) ---
  {
    id: 'pam-natural-1',
    name: 'Pambazo Natural (1 Guisado)',
    price: 38.0,
    category: 'pambazos',
    description: '1 guisado a elegir, papa, salsa, lechuga y queso rallado',
  },
  {
    id: 'pam-adobado-1',
    name: 'Pambazo Adobado (1 Guisado)',
    price: 43.0,
    category: 'pambazos',
    description: '1 guisado a elegir, adobado, papa, salsa, lechuga y queso',
  },
  {
    id: 'pam-natural-2',
    name: 'Pambazo Natural Comb. (2 Guisados)',
    price: 45.0,
    category: 'pambazos',
    description: '2 guisados a elegir, papa, salsa, lechuga y queso rallado',
  },
  {
    id: 'pam-adobado-2',
    name: 'Pambazo Adobado Comb. (2 Guisados)',
    price: 50.0,
    category: 'pambazos',
    description: '2 guisados a elegir, adobado, papa, salsa, lechuga y queso',
  },

  // --- HAMBURGUESAS (Página 3) ---
  {
    id: 'hamb-americana',
    name: 'Hamburguesa Americana',
    price: 60.0,
    category: 'hamburguesas',
    description: 'Carne, queso americano, aderezo de la casa, cebolla, pepinillos',
  },
  {
    id: 'hamb-especial',
    name: 'Hamburguesa Especial',
    price: 90.0,
    category: 'hamburguesas',
    description: 'Carne, tocino, queso Oaxaca, americano, aderezo, lechuga, cebolla, pepinillos',
  },
  {
    id: 'hamb-suiza',
    name: 'Hamburguesa Suiza',
    price: 90.0,
    category: 'hamburguesas',
    description: 'Carne, queso Oaxaca, americano, manchego, aderezo, lechuga, cebolla, pepinillos',
  },
  {
    id: 'hamb-texana',
    name: 'Hamburguesa Texana',
    price: 110.0,
    category: 'hamburguesas',
    description: 'Carne, manchego, tocino, aros de cebolla, salsa BBQ, aderezo, lechuga, pepinillos',
  },
  {
    id: 'hamb-pollo-bbq',
    name: 'Hamburguesa Pollo BBQ',
    price: 105.0,
    category: 'hamburguesas',
    description: 'Pollo crují, manchego, tocino, salsa BBQ, aderezo, lechuga, cebolla, pepinillos',
  },

  // --- TACOS ($35 c/u - Harina o Maíz) (Página 3) ---
  {
    id: 'tac-arrachera',
    name: 'Taco de Arrachera',
    price: 35.0,
    category: 'tacos',
    description: 'Tortilla harina o maíz, nopales y perejil frito',
  },
  {
    id: 'tac-costilla',
    name: 'Taco de Costilla',
    price: 35.0,
    category: 'tacos',
    description: 'Tortilla harina o maíz, nopales y perejil frito',
  },
  {
    id: 'tac-carne-enchilada',
    name: 'Taco Carne Enchilada',
    price: 35.0,
    category: 'tacos',
    description: 'Tortilla harina o maíz, nopales y perejil frito',
  },
  {
    id: 'tac-bistec',
    name: 'Taco de Bistec',
    price: 35.0,
    category: 'tacos',
    description: 'Tortilla harina o maíz, nopales y perejil frito',
  },
  {
    id: 'tac-chorizo',
    name: 'Taco de Chorizo',
    price: 35.0,
    category: 'tacos',
    description: 'Tortilla harina o maíz, nopales y perejil frito',
  },
  {
    id: 'tac-campechano',
    name: 'Taco Campechano',
    price: 35.0,
    category: 'tacos',
    description: 'Tortilla harina o maíz, nopales y perejil frito',
  },
  {
    id: 'tac-chistorra',
    name: 'Taco de Chistorra',
    price: 35.0,
    category: 'tacos',
    description: 'Tortilla harina o maíz, nopales y perejil frito',
  },
  {
    id: 'tac-chorizo-argentino',
    name: 'Taco Chorizo Argentino',
    price: 35.0,
    category: 'tacos',
    description: 'Tortilla harina o maíz, nopales y perejil frito',
  },

  // --- ALITAS Y PAPAS (Página 3) ---
  {
    id: 'ali-6',
    name: 'Alitas (Orden de 6)',
    price: 80.0,
    category: 'alitas_papas',
    description: 'BBQ, BBQ Picante, Búfalo, Mango-Hab., Lemon Pepper o Ajo Parm.',
  },
  {
    id: 'ali-12',
    name: 'Alitas (Orden de 12)',
    price: 140.0,
    category: 'alitas_papas',
    description: 'BBQ, BBQ Picante, Búfalo, Mango-Hab., Lemon Pepper o Ajo Parm.',
  },
  {
    id: 'pap-sencillas',
    name: 'Papas Sencillas',
    price: 60.0,
    category: 'alitas_papas',
    description: 'Porción de papas a la francesa clásicas',
  },
  {
    id: 'pap-boneless',
    name: 'Papas con Boneless',
    price: 130.0,
    category: 'alitas_papas',
    description: 'Papas francesas con boneless y 1 salsa a elegir',
  },
  {
    id: 'pap-aros-bbq',
    name: 'Papas c/ Aros de Cebolla y BBQ',
    price: 110.0,
    category: 'alitas_papas',
    description: 'Papas francesas, aros de cebolla y salsa BBQ',
  },

  // --- BEBIDAS (Página 2) ---
  {
    id: 'beb-refresco',
    name: 'Refresco',
    price: 28.0,
    category: 'bebidas',
    description: 'Coca-Cola, Sangría, Manzanita, Squirt, 7up, Mirinda, Sprite, Boing...',
  },
  {
    id: 'beb-agua-500',
    name: 'Agua de Sabor (1/2 Litro)',
    price: 26.0,
    category: 'bebidas',
    description: 'Horchata, Nuez, Jamaica, Limón c/ chía, Mojito, Jamaica s/ azúcar',
  },
  {
    id: 'beb-agua-1000',
    name: 'Agua Natural (1 Litro)',
    price: 24.0,
    category: 'bebidas',
    description: 'Agua purificada natural 1L',
  },
  {
    id: 'beb-cafe',
    name: 'Café Americano',
    price: 24.0,
    category: 'bebidas',
    description: 'Café americano caliente',
  },

  // --- EXTRAS / COMPLEMENTOS ---
  {
    id: 'ext-papas-150',
    name: 'Complemento Papas (150 gr)',
    price: 30.0,
    category: 'extras',
    description: 'Para acompañar hamburguesas o alitas (+150 gr)',
  },
  {
    id: 'ext-queso-general',
    name: 'Queso Extra',
    price: 15.0,
    category: 'extras',
    description: 'Para Pambazo, Guajolota o Guajoloyet',
  },
  {
    id: 'ext-guisado',
    name: 'Guisado Extra',
    price: 15.0,
    category: 'extras',
    description: 'Porción de guisado extra',
  },
  {
    id: 'ext-queso-taco',
    name: 'Con Queso (Extra Taco)',
    price: 12.0,
    category: 'extras',
    description: 'Queso adicional para orden de taco',
  },
  {
    id: 'ext-crema-pozole',
    name: 'Crema Extra (Pozole)',
    price: 10.0,
    category: 'extras',
    description: 'Porción extra de crema',
  },
];

export const MOCK_PRODUCTS: Product[] = MOCK_PRODUCTS_GENERAL;

export const getProductsByMode = (mode: 'general' | 'detailed'): Product[] => {
  return mode === 'detailed' ? MOCK_PRODUCTS_DETAILED : MOCK_PRODUCTS_GENERAL;
};

export const getCategoriesByMode = (mode: 'general' | 'detailed'): Category[] => {
  return mode === 'detailed' ? CATEGORIES_DETAILED : CATEGORIES_GENERAL;
};

