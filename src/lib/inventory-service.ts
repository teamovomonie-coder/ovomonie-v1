import { supabaseAdmin } from './supabase';

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventorySupplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  address?: string;
  manager?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category_id?: string;
  supplier_id?: string;
  unit_price?: number;
  cost_price?: number;
  reorder_level?: number;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryStock {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  reserved_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  location_id: string;
  transaction_type: 'sale' | 'purchase' | 'adjustment' | 'transfer';
  quantity: number;
  unit_price?: number;
  total_amount?: number;
  reference?: string;
  notes?: string;
  user_id?: string;
  created_at?: string;
}

export const inventoryService = {
  // Categories
  async getCategories(): Promise<InventoryCategory[]> {
    if (!supabaseAdmin) return [];
    const { data, error } = await supabaseAdmin.from('inventory_categories').select('*').order('name');
    return error ? [] : data || [];
  },

  async createCategory(category: Omit<InventoryCategory, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryCategory | null> {
    if (!supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin.from('inventory_categories').insert(category).select().single();
    return error ? null : data;
  },

  async updateCategory(id: string, updates: Partial<InventoryCategory>): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { error } = await supabaseAdmin.from('inventory_categories').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { error } = await supabaseAdmin.from('inventory_categories').delete().eq('id', id);
    return !error;
  },

  // Suppliers
  async getSuppliers(): Promise<InventorySupplier[]> {
    if (!supabaseAdmin) return [];
    const { data, error } = await supabaseAdmin.from('inventory_suppliers').select('*').order('name');
    return error ? [] : data || [];
  },

  async createSupplier(supplier: Omit<InventorySupplier, 'id' | 'created_at' | 'updated_at'>): Promise<InventorySupplier | null> {
    if (!supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin.from('inventory_suppliers').insert(supplier).select().single();
    return error ? null : data;
  },

  async updateSupplier(id: string, updates: Partial<InventorySupplier>): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { error } = await supabaseAdmin.from('inventory_suppliers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  },

  async deleteSupplier(id: string): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { error } = await supabaseAdmin.from('inventory_suppliers').delete().eq('id', id);
    return !error;
  },

  // Locations
  async getLocations(): Promise<InventoryLocation[]> {
    if (!supabaseAdmin) return [];
    const { data, error } = await supabaseAdmin.from('inventory_locations').select('*').order('name');
    return error ? [] : data || [];
  },

  async createLocation(location: Omit<InventoryLocation, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryLocation | null> {
    if (!supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin.from('inventory_locations').insert(location).select().single();
    return error ? null : data;
  },

  async updateLocation(id: string, updates: Partial<InventoryLocation>): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { error } = await supabaseAdmin.from('inventory_locations').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  },

  async deleteLocation(id: string): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { error } = await supabaseAdmin.from('inventory_locations').delete().eq('id', id);
    return !error;
  },

  // Products
  async getProducts(): Promise<InventoryProduct[]> {
    if (!supabaseAdmin) return [];
    const { data, error } = await supabaseAdmin.from('inventory_products').select('*').order('name');
    return error ? [] : data || [];
  },

  async createProduct(product: Omit<InventoryProduct, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryProduct | null> {
    if (!supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin.from('inventory_products').insert(product).select().single();
    return error ? null : data;
  },

  async updateProduct(id: string, updates: Partial<InventoryProduct>): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { error } = await supabaseAdmin.from('inventory_products').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { error } = await supabaseAdmin.from('inventory_products').delete().eq('id', id);
    return !error;
  },

  // Stock
  async getStock(productId?: string, locationId?: string): Promise<InventoryStock[]> {
    if (!supabaseAdmin) return [];
    let query = supabaseAdmin.from('inventory_stock').select('*');
    if (productId) query = query.eq('product_id', productId);
    if (locationId) query = query.eq('location_id', locationId);
    const { data, error } = await query;
    return error ? [] : data || [];
  },

  async updateStock(productId: string, locationId: string, quantity: number): Promise<boolean> {
    if (!supabaseAdmin) return false;
    const { error } = await supabaseAdmin.from('inventory_stock')
      .upsert({ product_id: productId, location_id: locationId, quantity, updated_at: new Date().toISOString() });
    return !error;
  },

  // Transactions
  async getTransactions(limit = 50): Promise<InventoryTransaction[]> {
    if (!supabaseAdmin) return [];
    const { data, error } = await supabaseAdmin.from('inventory_transactions')
      .select('*').order('created_at', { ascending: false }).limit(limit);
    return error ? [] : data || [];
  },

  async createTransaction(transaction: Omit<InventoryTransaction, 'id' | 'created_at'>): Promise<InventoryTransaction | null> {
    if (!supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin.from('inventory_transactions').insert(transaction).select().single();
    return error ? null : data;
  },

  async adjustStock(productId: string, locationId: string, adjustment: number, userId: string, notes?: string): Promise<boolean> {
    if (!supabaseAdmin) return false;
    
    // Get current stock
    const { data: currentStock } = await supabaseAdmin.from('inventory_stock')
      .select('quantity').eq('product_id', productId).eq('location_id', locationId).single();
    
    const currentQty = currentStock?.quantity || 0;
    const newQty = Math.max(0, currentQty + adjustment);
    
    // Update stock
    await supabaseAdmin.from('inventory_stock')
      .upsert({ product_id: productId, location_id: locationId, quantity: newQty, updated_at: new Date().toISOString() });
    
    // Record transaction
    await supabaseAdmin.from('inventory_transactions').insert({
      product_id: productId,
      location_id: locationId,
      transaction_type: 'adjustment',
      quantity: adjustment,
      user_id: userId,
      notes: notes || `Stock adjustment: ${adjustment > 0 ? '+' : ''}${adjustment}`
    });
    
    return true;
  },

  async recordSale(productId: string, locationId: string, quantity: number, unitPrice: number, userId: string, reference?: string): Promise<boolean> {
    if (!supabaseAdmin) return false;
    
    // Update stock (decrease)
    const { data: currentStock } = await supabaseAdmin.from('inventory_stock')
      .select('quantity').eq('product_id', productId).eq('location_id', locationId).single();
    
    const currentQty = currentStock?.quantity || 0;
    const newQty = Math.max(0, currentQty - quantity);
    
    await supabaseAdmin.from('inventory_stock')
      .upsert({ product_id: productId, location_id: locationId, quantity: newQty, updated_at: new Date().toISOString() });
    
    // Record transaction
    await supabaseAdmin.from('inventory_transactions').insert({
      product_id: productId,
      location_id: locationId,
      transaction_type: 'sale',
      quantity: -quantity,
      unit_price: unitPrice,
      total_amount: quantity * unitPrice,
      user_id: userId,
      reference
    });
    
    return true;
  }
};