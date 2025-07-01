// A mock in-memory database
// In a real application, this would be replaced with a database connection.

interface Location {
    id: string;
    name: string;
    address?: string;
}

interface Supplier {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  costPrice: number;
  stockByLocation: { locationId: string; quantity: number }[];
  minStockLevel: number;
  unit: string;
  expiryDate?: string;
  batchNumber?: string;
  supplierId?: string;
}

const initialLocations: Location[] = [
    { id: 'loc_1', name: 'Main Store - Lekki', address: '1 Admiralty Way, Lekki Phase 1, Lagos' },
    { id: 'loc_2', name: 'Warehouse - Ikeja', address: '25, Industrial Avenue, Ikeja, Lagos' },
    { id: 'loc_3', name: 'Pop-up Stand - VI', address: 'Eko Hotel Convention Center, VI, Lagos' },
];

const initialSuppliers: Supplier[] = [
  { id: 'sup_1', name: 'West African Foods Inc.', phone: '08011223344', email: 'sales@wafoods.com', address: '1, Warehouse Road, Apapa, Lagos' },
  { id: 'sup_2', name: 'PharmaDist Nigeria', phone: '09099887766', email: 'orders@pharmadist.ng', address: '25, Industrial Avenue, Ikeja, Lagos' },
  { id: 'sup_3', name: 'Beverage Masters Ltd.', phone: '07055443322', email: 'contact@bevmasters.com', address: 'Plot 5, Agbara Estate, Ogun' },
];

const initialProducts: Product[] = [
  { id: 'prod_1', name: 'Indomie Noodles Chicken', sku: 'IN001', barcode: '615110002131', category: 'Groceries', price: 250, costPrice: 200, stockByLocation: [{locationId: 'loc_1', quantity: 100}, {locationId: 'loc_2', quantity: 50}], minStockLevel: 20, unit: 'pcs', supplierId: 'sup_1' },
  { id: 'prod_2', name: 'Peak Milk Evaporated', sku: 'PK001', category: 'Groceries', price: 400, costPrice: 350, stockByLocation: [{locationId: 'loc_1', quantity: 80}], minStockLevel: 10, unit: 'pcs', supplierId: 'sup_1' },
  { id: 'prod_3', name: 'Coca-Cola 50cl', sku: 'CC001', barcode: '5449000000996', category: 'Beverages', price: 200, costPrice: 150, stockByLocation: [{locationId: 'loc_1', quantity: 150}, {locationId: 'loc_2', quantity: 50}, {locationId: 'loc_3', quantity: 0}], minStockLevel: 50, unit: 'pcs', supplierId: 'sup_3' },
  { id: 'prod_4', name: 'Panadol Extra', sku: 'PN001', batchNumber: 'B12345', expiryDate: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString().split('T')[0], category: 'Pharmacy', price: 500, costPrice: 400, stockByLocation: [{locationId: 'loc_1', quantity: 5}], minStockLevel: 10, unit: 'pack', supplierId: 'sup_2' },
  { id: 'prod_5', name: 'Golden Penny Semovita 1kg', sku: 'GP001', category: 'Groceries', price: 1200, costPrice: 1000, stockByLocation: [{locationId: 'loc_2', quantity: 45}], minStockLevel: 10, unit: 'pack', supplierId: 'sup_1' },
  { id: 'prod_6', name: 'Amoxicillin Capsules', sku: 'AMX001', batchNumber: 'AX54321', expiryDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0], category: 'Pharmacy', price: 1500, costPrice: 1100, stockByLocation: [{locationId: 'loc_1', quantity: 12}], minStockLevel: 5, unit: 'pack', supplierId: 'sup_2' },
];


let products: Product[] = [...initialProducts];
let suppliers: Supplier[] = [...initialSuppliers];
let locations: Location[] = [...initialLocations];

export const db = {
    products: {
        findMany: async () => products,
        findById: async (id: string) => products.find(p => p.id === id),
        create: async (data: Omit<Product, 'id'>) => {
            const newProduct = { ...data, id: `prod_${Date.now()}` };
            products.push(newProduct);
            return newProduct;
        },
        update: async (id: string, data: Partial<Product>) => {
            const index = products.findIndex(p => p.id === id);
            if (index === -1) return null;
            products[index] = { ...products[index], ...data };
            return products[index];
        },
        delete: async (id: string) => {
            const index = products.findIndex(p => p.id === id);
            if (index === -1) return null;
            const [deleted] = products.splice(index, 1);
            return deleted;
        },
    },
    suppliers: {
        findMany: async () => suppliers,
        findById: async (id: string) => suppliers.find(s => s.id === id),
        create: async (data: Omit<Supplier, 'id'>) => {
            const newSupplier = { ...data, id: `sup_${Date.now()}` };
            suppliers.push(newSupplier);
            return newSupplier;
        },
        update: async (id: string, data: Partial<Supplier>) => {
            const index = suppliers.findIndex(s => s.id === id);
            if (index === -1) return null;
            suppliers[index] = { ...suppliers[index], ...data };
            return suppliers[index];
        },
        delete: async (id: string) => {
            const index = suppliers.findIndex(s => s.id === id);
            if (index === -1) return null;
            const [deleted] = suppliers.splice(index, 1);
            return deleted;
        },
    },
    locations: {
        findMany: async () => locations,
        findById: async (id: string) => locations.find(l => l.id === id),
        create: async (data: Omit<Location, 'id'>) => {
            const newLocation = { ...data, id: `loc_${Date.now()}` };
            locations.push(newLocation);
            return newLocation;
        },
        update: async (id: string, data: Partial<Location>) => {
            const index = locations.findIndex(l => l.id === id);
            if (index === -1) return null;
            locations[index] = { ...locations[index], ...data };
            return locations[index];
        },
        delete: async (id: string) => {
            const index = locations.findIndex(l => l.id === id);
            if (index === -1) return null;
            // Also remove from products
            products = products.map(p => ({
                ...p,
                stockByLocation: p.stockByLocation.filter(s => s.locationId !== id)
            }));
            const [deleted] = locations.splice(index, 1);
            return deleted;
        },
    }
};
