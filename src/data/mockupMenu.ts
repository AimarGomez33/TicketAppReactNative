
import {Product} from '../store/useCartStore'

export interface Category{
    id: string;
    name: string;

}

export const CATEGORIES: Category[] = [
{ id: 'top', name: '★ Top Selling' },
  { id: 'antojitos', name: 'Antojitos' },
  { id: 'platillos', name: 'Platillos Principales' },
  { id: 'hamburguesas', name: 'Hamburguesas' },
  { id: 'tacos', name: 'Tacos' },
  { id: 'bebidas', name: 'Bebidas' },
  { id: 'extras', name: 'Postres y Extras' },
]

export const MOCK_PRODUCTS: Product[] = [
  // Top Selling / Antojitos
  { id: '1', name: 'Quesadillas', price: 40.0, category: 'antojitos' },
  { id: '2', name: 'Tostadas', price: 37.0, category: 'antojitos' },
  { id: '3', name: 'Chalupas (Orden)', price: 6.0, category: 'antojitos' },
  { id: '4', name: 'Volcanes', price: 60.0, category: 'antojitos' },
  { id: '5', name: 'Pozole Grande', price: 120.0, category: 'platillos' },
  { id: '6', name: 'Pozole Chico', price: 100.0, category: 'platillos' },
  
  // Hamburguesas
  { id: '7', name: 'Hamburguesa Americana', price: 60.0, category: 'hamburguesas' },
  { id: '8', name: 'Hamburguesa Especial', price: 90.0, category: 'hamburguesas' },
  { id: '9', name: 'Hamburguesa Texana', price: 110.0, category: 'hamburguesas' },
  { id: '10', name: 'Hamburguesa Suiza', price: 90.0, category: 'hamburguesas' },

  // Tacos y Extras
  { id: '11', name: 'Taco al Pastor', price: 35.0, category: 'tacos' },
  { id: '12', name: 'Papas Sencillas', price: 45.0, category: 'extras' },
  { id: '13', name: 'Papas Boneless', price: 130.0, category: 'extras' },

  // Bebidas
  { id: '14', name: 'Refresco 600ml', price: 35.0, category: 'bebidas' },
  { id: '15', name: 'Agua Fresca Grande', price: 40.0, category: 'bebidas' },
];
