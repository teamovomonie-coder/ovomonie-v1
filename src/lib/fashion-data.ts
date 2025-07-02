
export interface Product {
    id: string;
    name: string;
    description: string;
    originalPrice: number;
    discountedPrice: number;
    discount?: number;
    images: string[];
    hint: string;
    category: string;
    rating: number;
    reviews: number;
    colors: string[];
    sizes: string[];
}

export interface FashionCategory {
    name: string;
}

export interface Order {
    id: string;
    date: string;
    status: 'Processing' | 'Shipped' | 'Delivered';
    total: number;
}

export const mockCategories: FashionCategory[] = [
    { name: 'All' },
    { name: 'Men' },
    { name: 'Women' },
    { name: 'Kids' },
    { name: 'Accessories' },
    { name: 'Shoes' },
];

export const mockProducts: Product[] = [
    {
        id: 'fas-1',
        name: 'Classic Men\'s Ankara Shirt',
        description: 'A stylish and vibrant Ankara print shirt, perfect for any occasion. Made from 100% cotton.',
        originalPrice: 18000,
        discountedPrice: 15000,
        discount: 17,
        images: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
        hint: 'ankara shirt',
        category: 'Men',
        rating: 5,
        reviews: 120,
        colors: ['Blue', 'Red', 'Green'],
        sizes: ['S', 'M', 'L', 'XL'],
    },
    {
        id: 'fas-2',
        name: 'Elegant Women\'s Gown',
        description: 'A beautiful floor-length gown for special events. Features intricate lace details.',
        originalPrice: 45000,
        discountedPrice: 45000,
        images: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
        hint: 'evening gown',
        category: 'Women',
        rating: 4,
        reviews: 88,
        colors: ['Black', 'Royal Blue', 'Wine'],
        sizes: ['8', '10', '12', '14'],
    },
    {
        id: 'fas-3',
        name: 'Kids Playtime T-shirt',
        description: 'A comfortable and durable t-shirt for active kids. Features a fun cartoon print.',
        originalPrice: 5000,
        discountedPrice: 4000,
        discount: 20,
        images: ['https://placehold.co/600x400.png'],
        hint: 'kids t-shirt',
        category: 'Kids',
        rating: 5,
        reviews: 250,
        colors: ['Yellow', 'Pink', 'Blue'],
        sizes: ['2-4Y', '4-6Y', '6-8Y'],
    },
    {
        id: 'fas-4',
        name: 'Leather Crossbody Bag',
        description: 'A versatile and stylish leather bag, perfect for everyday use. Features multiple compartments.',
        originalPrice: 22000,
        discountedPrice: 22000,
        images: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
        hint: 'leather bag',
        category: 'Accessories',
        rating: 4,
        reviews: 180,
        colors: ['Brown', 'Black'],
        sizes: ['One Size'],
    },
    {
        id: 'fas-5',
        name: 'Men\'s Leather Loafers',
        description: 'Comfortable and classy loafers for a smart-casual look. Made from genuine leather.',
        originalPrice: 28000,
        discountedPrice: 25000,
        discount: 11,
        images: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
        hint: 'men loafers',
        category: 'Shoes',
        rating: 5,
        reviews: 95,
        colors: ['Black', 'Tan'],
        sizes: ['42', '43', '44', '45'],
    },
    {
        id: 'fas-6',
        name: 'Women\'s Heeled Sandals',
        description: 'Elegant heeled sandals that add a touch of sophistication to any outfit.',
        originalPrice: 20000,
        discountedPrice: 20000,
        images: ['https://placehold.co/600x400.png'],
        hint: 'heeled sandals',
        category: 'Shoes',
        rating: 4,
        reviews: 130,
        colors: ['Nude', 'Black', 'Silver'],
        sizes: ['38', '39', '40', '41'],
    },
];


export const mockOrders: Order[] = [
    { id: 'OVO-FASH-12345', date: '2024-07-28', status: 'Delivered', total: 19000 },
    { id: 'OVO-FASH-12346', date: '2024-07-29', status: 'Shipped', total: 45000 },
    { id: 'OVO-FASH-12347', date: '2024-07-30', status: 'Processing', total: 4000 },
];
