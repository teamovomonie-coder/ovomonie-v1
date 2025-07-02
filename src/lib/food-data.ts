export interface Restaurant {
  id: string;
  name: string;
  image: string;
  hint: string;
  rating: number;
  deliveryTime: number; // in minutes
  cuisine: string;
  address: string;
}

export interface FoodCategory {
  name: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name:string;
  description: string;
  price: number;
  category: 'Main Dishes' | 'Sides' | 'Drinks' | 'Swallow & Soup';
}

export const mockFoodCategories: FoodCategory[] = [
    { name: 'All' },
    { name: 'Nigerian' },
    { name: 'Pizza' },
    { name: 'Shawarma' },
    { name: 'Burgers' },
    { name: 'Chinese' },
];

export const mockRestaurants: Restaurant[] = [
    { id: 'rest-1', name: 'The Place Restaurant', image: 'https://placehold.co/600x400.png', hint: 'jollof rice', rating: 4.5, deliveryTime: 35, cuisine: 'Nigerian', address: 'Lekki Phase 1, Lagos' },
    { id: 'rest-2', name: 'Domino\'s Pizza', image: 'https://placehold.co/600x400.png', hint: 'pepperoni pizza', rating: 4.2, deliveryTime: 45, cuisine: 'Pizza', address: 'Victoria Island, Lagos' },
    { id: 'rest-3', name: 'Chicken Republic', image: 'https://placehold.co/600x400.png', hint: 'fried chicken', rating: 4.0, deliveryTime: 30, cuisine: 'Fast Food', address: 'Ikeja, Lagos' },
    { id: 'rest-4', name: 'Ofada Boy', image: 'https://placehold.co/600x400.png', hint: 'ofada rice', rating: 4.8, deliveryTime: 40, cuisine: 'Nigerian', address: 'Surulere, Lagos' },
    { id: 'rest-5', name: 'Bukka Hut', image: 'https://placehold.co/600x400.png', hint: 'amala soup', rating: 4.6, deliveryTime: 35, cuisine: 'Nigerian', address: 'Ikoyi, Lagos' },
];

export const mockMenuItems: MenuItem[] = [
  // The Place
  { id: 'm-1', restaurantId: 'rest-1', name: 'Jollof Rice with Chicken', description: 'Smoky party jollof with a piece of spicy grilled chicken.', price: 3500, category: 'Main Dishes' },
  { id: 'm-2', restaurantId: 'rest-1', name: 'Fried Rice with Beef', description: 'Classic Nigerian fried rice with succulent beef chunks.', price: 3200, category: 'Main Dishes' },
  { id: 'm-3', restaurantId: 'rest-1', name: 'Coleslaw', description: 'Creamy and crunchy side salad.', price: 800, category: 'Sides' },
  { id: 'm-4', restaurantId: 'rest-1', name: 'Coca-Cola', description: '35cl PET bottle.', price: 500, category: 'Drinks' },

  // Domino's
  { id: 'm-5', restaurantId: 'rest-2', name: 'Medium Pepperoni Pizza', description: 'Classic pepperoni on a bed of mozzarella and tomato sauce.', price: 6500, category: 'Main Dishes' },
  { id: 'm-6', restaurantId: 'rest-2', name: 'Chicken Suya Pizza', description: 'A Nigerian favorite with spicy chicken suya toppings.', price: 7200, category: 'Main Dishes' },
  { id: 'm-7', restaurantId: 'rest-2', name: 'Garlic Bread Sticks', description: 'Warm and fluffy bread sticks with garlic butter.', price: 1500, category: 'Sides' },
  { id: 'm-8', restaurantId: 'rest-2', name: 'Fanta', description: '50cl PET bottle.', price: 500, category: 'Drinks' },

  // Chicken Republic
  { id: 'm-9', restaurantId: 'rest-3', name: 'Refuel Max', description: '2 pieces of chicken, fried rice, and a drink.', price: 3800, category: 'Main Dishes' },
  { id: 'm-10', restaurantId: 'rest-3', name: 'Just Chicken (3 pieces)', description: 'Three pieces of our signature crispy fried chicken.', price: 2500, category: 'Main Dishes' },
  { id: 'm-11', restaurantId: 'rest-3', name: 'French Fries (Large)', description: 'Golden crispy potato fries.', price: 1000, category: 'Sides' },
  
  // Ofada Boy
  { id: 'm-12', restaurantId: 'rest-4', name: 'Ofada Rice & Sauce', description: 'The original masterpiece with assorted meats.', price: 4500, category: 'Main Dishes' },
  { id: 'm-13', restaurantId: 'rest-4', name: 'Ayamase Special', description: 'Designer stew with extra spice and protein.', price: 5000, category: 'Main Dishes' },
  { id: 'm-14', restaurantId: 'rest-4', name: 'Dodo (Fried Plantain)', description: 'Sweet, ripe plantain, fried to perfection.', price: 800, category: 'Sides' },

  // Bukka Hut
  { id: 'm-15', restaurantId: 'rest-5', name: 'Amala with Ewedu & Gbegiri', description: 'The classic combination with your choice of protein.', price: 3000, category: 'Swallow & Soup' },
  { id: 'm-16', restaurantId: 'rest-5', name: 'Eba with Egusi Soup', description: 'Rich melon seed soup served with eba.', price: 2800, category: 'Swallow & Soup' },
  { id: 'm-17', restaurantId: 'rest-5', name: 'Assorted Meat', description: 'A mix of beef, shaki, and cowleg.', price: 1500, category: 'Sides' },
  { id: 'm-18', restaurantId: 'rest-5', name: 'Bottled Water', description: '75cl bottled water.', price: 300, category: 'Drinks' },
];
