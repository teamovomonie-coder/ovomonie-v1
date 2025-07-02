export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    hint: string;
    category: string;
    rating: number;
    reviews: number;
}

export interface Category {
    name: string;
}

export interface Order {
    id: string;
    date: string;
    status: 'Processing' | 'Shipped' | 'Delivered';
    total: number;
}

export const mockCategories: Category[] = [
    { name: 'Electronics' },
    { name: 'Phones & Tablets' },
    { name: 'Fashion' },
    { name: 'Beauty' },
    { name: 'Home Appliances' },
    { name: 'Groceries' },
];

export const mockProducts: Product[] = [
    {
        id: 'prod-1',
        name: 'Anker Power Bank 20,000mAh',
        description: 'High-speed charging for your devices. Compact and portable design. Charge two devices at once.',
        price: 25000,
        images: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
        hint: 'power bank',
        category: 'Electronics',
        rating: 5,
        reviews: 150
    },
    {
        id: 'prod-2',
        name: 'Samsung Galaxy S24 Ultra',
        description: 'The latest flagship from Samsung with AI features, a stunning display, and a pro-grade camera system.',
        price: 1200000,
        images: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
        hint: 'smartphone galaxy',
        category: 'Phones & Tablets',
        rating: 5,
        reviews: 89
    },
    {
        id: 'prod-3',
        name: 'Men\'s Classic Ankara Shirt',
        description: 'High-quality, 100% cotton Ankara shirt for a stylish and modern look. Available in various sizes.',
        price: 15000,
        images: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
        hint: 'ankara shirt',
        category: 'Fashion',
        rating: 4,
        reviews: 210
    },
    {
        id: 'prod-4',
        name: 'Nivea Body Lotion 400ml',
        description: 'Deeply moisturizing lotion for all skin types. Keeps your skin smooth and hydrated all day long.',
        price: 3500,
        images: ['https://placehold.co/600x400.png'],
        hint: 'lotion bottle',
        category: 'Beauty',
        rating: 4,
        reviews: 500
    },
    {
        id: 'prod-5',
        name: 'Binatone Blender & Grinder',
        description: 'Powerful blender with a 1.5L jar and a separate grinder attachment. Perfect for smoothies and spices.',
        price: 18000,
        images: ['https://placehold.co/600x400.png'],
        hint: 'kitchen blender',
        category: 'Home Appliances',
        rating: 4,
        reviews: 120
    },
    {
        id: 'prod-6',
        name: 'Kellogg\'s Corn Flakes 500g',
        description: 'Classic and delicious corn flakes to start your day right. Fortified with vitamins and minerals.',
        price: 4500,
        images: ['https://placehold.co/600x400.png'],
        hint: 'cereal box',
        category: 'Groceries',
        rating: 5,
        reviews: 300
    },
     {
        id: 'prod-7',
        name: 'iPhone 15 Pro Max',
        description: 'Experience the power of the A17 Pro chip, a customizable Action button, and a more versatile Pro camera system.',
        price: 1500000,
        images: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
        hint: 'iphone pro',
        category: 'Phones & Tablets',
        rating: 5,
        reviews: 180
    },
    {
        id: 'prod-8',
        name: 'Sony WH-1000XM5 Headphones',
        description: 'Industry-leading noise canceling with two processors controlling eight microphones for unprecedented noise-canceling.',
        price: 350000,
        images: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'],
        hint: 'wireless headphones',
        category: 'Electronics',
        rating: 5,
        reviews: 250
    }
];


export const mockOrders: Order[] = [
    { id: 'OVO-12345', date: '2024-07-28', status: 'Delivered', total: 28500 },
    { id: 'OVO-12346', date: '2024-07-29', status: 'Shipped', total: 1201500 },
    { id: 'OVO-12347', date: '2024-07-30', status: 'Processing', total: 4500 },
];
