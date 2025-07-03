// A mock in-memory database
// In a real application, this would be replaced with a database connection.

interface Location {
    id: string;
    name: string;
    address?: string;
    businessId?: string;
    createdAt: string;
    updatedAt: string;
}

interface Supplier {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    businessId?: string;
    createdAt: string;
    updatedAt: string;
}

interface Category {
    id: string;
    name: string;
    description?: string;
    businessId?: string;
    createdAt: string;
    updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stockByLocation: { locationId: string; quantity: number }[];
  minStockLevel: number;
  unit: string;
  expiryDate?: string;
  batchNumber?: string;
  supplierId?: string;
  businessId?: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryTransaction {
    id: string;
    productId: string;
    locationId?: string;
    type: 'purchase' | 'sale' | 'return' | 'adjustment';
    quantity: number; // The change in quantity (can be negative for sales/deductions)
    previousStock: number;
    newStock: number;
    date: string;
    referenceId?: string; // e.g., invoice number, PO number
    notes?: string;
    recordedBy?: string;
    businessId?: string;
}

interface FinancialTransaction {
    id: string;
    userId: string;
    category: 'transfer' | 'bill' | 'airtime' | 'pos' | 'deposit' | 'withdrawal';
    type: 'debit' | 'credit';
    amount: number; // in kobo, always positive
    reference: string;
    narration?: string;
    party: {
        name: string;
        account?: string;
        bank?: string;
    };
    timestamp: string;
    balanceAfter: number;
}


const initialLocations: Location[] = [
    { id: 'loc_1', name: 'Main Store - Lekki', address: '1 Admiralty Way, Lekki Phase 1, Lagos', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'loc_2', name: 'Warehouse - Ikeja', address: '25, Industrial Avenue, Ikeja, Lagos', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'loc_3', name: 'Pop-up Stand - VI', address: 'Eko Hotel Convention Center, VI, Lagos', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const initialSuppliers: Supplier[] = [
  { id: 'sup_1', name: 'West African Foods Inc.', phone: '08011223344', email: 'sales@wafoods.com', address: '1, Warehouse Road, Apapa, Lagos', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sup_2', name: 'PharmaDist Nigeria', phone: '09099887766', email: 'orders@pharmadist.ng', address: '25, Industrial Avenue, Ikeja, Lagos', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sup_3', name: 'Beverage Masters Ltd.', phone: '07055443322', email: 'contact@bevmasters.com', address: 'Plot 5, Agbara Estate, Ogun', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const initialCategories: Category[] = [
    { id: 'cat_1', name: 'Groceries', description: 'Everyday food items and staples.', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat_2', name: 'Beverages', description: 'Drinks and related products.', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat_3', name: 'Pharmacy', description: 'Medical and pharmaceutical products.', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cat_4', name: 'Electronics', description: 'Gadgets and electronic devices.', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const initialProducts: Product[] = [
  { id: 'prod_1', name: 'Indomie Noodles Chicken', sku: 'IN001', barcode: '615110002131', categoryId: 'cat_1', price: 250, costPrice: 200, stockByLocation: [{locationId: 'loc_1', quantity: 100}, {locationId: 'loc_2', quantity: 50}], minStockLevel: 20, unit: 'pcs', supplierId: 'sup_1', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prod_2', name: 'Peak Milk Evaporated', sku: 'PK001', categoryId: 'cat_1', price: 400, costPrice: 350, stockByLocation: [{locationId: 'loc_1', quantity: 80}], minStockLevel: 10, unit: 'pcs', supplierId: 'sup_1', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prod_3', name: 'Coca-Cola 50cl', sku: 'CC001', barcode: '5449000000996', categoryId: 'cat_2', price: 200, costPrice: 150, stockByLocation: [{locationId: 'loc_1', quantity: 150}, {locationId: 'loc_2', quantity: 50}, {locationId: 'loc_3', quantity: 0}], minStockLevel: 50, unit: 'pcs', supplierId: 'sup_3', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prod_4', name: 'Panadol Extra', sku: 'PN001', batchNumber: 'B12345', expiryDate: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString().split('T')[0], categoryId: 'cat_3', price: 500, costPrice: 400, stockByLocation: [{locationId: 'loc_1', quantity: 5}], minStockLevel: 10, unit: 'pack', supplierId: 'sup_2', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prod_5', name: 'Golden Penny Semovita 1kg', sku: 'GP001', categoryId: 'cat_1', price: 1200, costPrice: 1000, stockByLocation: [{locationId: 'loc_2', quantity: 45}], minStockLevel: 10, unit: 'pack', supplierId: 'sup_1', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prod_6', name: 'Amoxicillin Capsules', sku: 'AMX001', batchNumber: 'AX54321', expiryDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0], categoryId: 'cat_3', price: 1500, costPrice: 1100, stockByLocation: [{locationId: 'loc_1', quantity: 12}], minStockLevel: 5, unit: 'pack', supplierId: 'sup_2', businessId: 'biz_123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const initialInventoryTransactions: InventoryTransaction[] = [];
const initialFinancialTransactions: FinancialTransaction[] = [
    {
        id: 'fin_txn_1',
        userId: 'user_paago',
        category: 'deposit',
        type: 'credit',
        amount: 5000000, // 50,000 NGN
        reference: 'DEPOSIT-SALARY-JULY',
        narration: 'July Salary',
        party: { name: 'OVO THRIVE INC' },
        timestamp: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
        balanceAfter: 130034500,
    },
    {
        id: 'fin_txn_2',
        userId: 'user_paago',
        category: 'bill',
        type: 'debit',
        amount: 1500000, // 15,000 NGN
        reference: 'DSTV-SUB-JULY',
        narration: 'DSTV Subscription',
        party: { name: 'MultiChoice Nigeria' },
        timestamp: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
        balanceAfter: 128534500,
    }
];


let products: Product[] = [...initialProducts];
let suppliers: Supplier[] = [...initialSuppliers];
let locations: Location[] = [...initialLocations];
let categories: Category[] = [...initialCategories];
let inventoryTransactions: InventoryTransaction[] = [...initialInventoryTransactions];
let financialTransactions: FinancialTransaction[] = [...initialFinancialTransactions];

export const db = {
    products: {
        findMany: async () => products,
        findById: async (id: string) => products.find(p => p.id === id),
        create: async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
            const now = new Date().toISOString();
            const newProduct = { ...data, id: `prod_${Date.now()}`, businessId: 'biz_123', createdAt: now, updatedAt: now };
            products.push(newProduct);
            return newProduct;
        },
        update: async (id: string, data: Partial<Product>) => {
            const index = products.findIndex(p => p.id === id);
            if (index === -1) return null;
            products[index] = { ...products[index], ...data, updatedAt: new Date().toISOString() };
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
        create: async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
            const now = new Date().toISOString();
            const newSupplier = { ...data, id: `sup_${Date.now()}`, businessId: 'biz_123', createdAt: now, updatedAt: now };
            suppliers.push(newSupplier);
            return newSupplier;
        },
        update: async (id: string, data: Partial<Supplier>) => {
            const index = suppliers.findIndex(s => s.id === id);
            if (index === -1) return null;
            suppliers[index] = { ...suppliers[index], ...data, updatedAt: new Date().toISOString() };
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
        create: async (data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => {
            const now = new Date().toISOString();
            const newLocation = { ...data, id: `loc_${Date.now()}`, businessId: 'biz_123', createdAt: now, updatedAt: now };
            locations.push(newLocation);
            return newLocation;
        },
        update: async (id: string, data: Partial<Location>) => {
            const index = locations.findIndex(l => l.id === id);
            if (index === -1) return null;
            locations[index] = { ...locations[index], ...data, updatedAt: new Date().toISOString() };
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
    },
    categories: {
        findMany: async () => categories,
        findById: async (id: string) => categories.find(c => c.id === id),
        create: async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
            const now = new Date().toISOString();
            const newCategory = { ...data, id: `cat_${Date.now()}`, businessId: 'biz_123', createdAt: now, updatedAt: now };
            categories.push(newCategory);
            return newCategory;
        },
        update: async (id: string, data: Partial<Category>) => {
            const index = categories.findIndex(c => c.id === id);
            if (index === -1) return null;
            categories[index] = { ...categories[index], ...data, updatedAt: new Date().toISOString() };
            return categories[index];
        },
        delete: async (id: string) => {
            const index = categories.findIndex(c => c.id === id);
            if (index === -1) return null;
            const [deleted] = categories.splice(index, 1);
            return deleted;
        },
    },
    inventoryTransactions: {
        findMany: async () => inventoryTransactions,
        findManyByProductId: async (productId: string) => inventoryTransactions.filter(t => t.productId === productId),
        create: async (data: Omit<InventoryTransaction, 'id' | 'date'>) => {
            const newTransaction = { ...data, id: `txn_${Date.now()}`, date: new Date().toISOString(), businessId: 'biz_123', recordedBy: 'user_placeholder' };
            inventoryTransactions.push(newTransaction);
            return newTransaction;
        },
    },
    financialTransactions: {
        findMany: async () => financialTransactions,
        create: async (data: Omit<FinancialTransaction, 'id'>) => {
            const newTransaction = { ...data, id: `fin_txn_${Date.now()}` };
            financialTransactions.push(newTransaction);
            return newTransaction;
        },
    }
};
