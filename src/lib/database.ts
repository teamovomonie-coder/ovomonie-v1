import { supabaseAdmin } from './supabase';
import { logger } from './logger';
import { DbUser, DbTransaction, DbNotification } from './db';
import { withCache, cache, cacheKeys } from './cache';

// Generic database operations
export class DatabaseService {
  private client = supabaseAdmin;

  async create<T extends Record<string, any>>(
    table: string, 
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string | null> {
    if (!this.client) {
      logger.error('Database client not available');
      return null;
    }

    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert([{ ...data, created_at: new Date().toISOString() }])
        .select('id')
        .single();

      if (error) {
        logger.error(`Error creating record in ${table}`, { error, data });
        return null;
      }

      // Invalidate related cache entries
      this.invalidateCache(table, result?.id);

      return result?.id ?? null;
    } catch (error) {
      logger.error(`Exception creating record in ${table}`, { error, data });
      return null;
    }
  }

  async findById<T>(table: string, id: string): Promise<T | null> {
    if (!this.client) {
      logger.error('Database client not available');
      return null;
    }

    const cacheKey = `${table}:${id}`;
    const cached = cache.get<T>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error(`Error finding record in ${table}`, { error, id });
        return null;
      }

      // Cache for 5 minutes
      cache.set(cacheKey, data as T, 5 * 60 * 1000);
      return data as T;
    } catch (error) {
      logger.error(`Exception finding record in ${table}`, { error, id });
      return null;
    }
  }

  async update<T>(
    table: string, 
    id: string, 
    data: Partial<T>
  ): Promise<boolean> {
    if (!this.client) {
      logger.error('Database client not available');
      return false;
    }

    try {
      const { error } = await this.client
        .from(table)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        logger.error(`Error updating record in ${table}`, { error, id, data });
        return false;
      }

      // Invalidate cache
      this.invalidateCache(table, id);
      return true;
    } catch (error) {
      logger.error(`Exception updating record in ${table}`, { error, id, data });
      return false;
    }
  }

  private invalidateCache(table: string, id?: string): void {
    if (table === 'users' && id) {
      cache.delete(cacheKeys.user(id));
      // Also clear phone-based cache (we don't know the phone, so clear all user caches)
      cache.clear(); // Simple approach - in production, use more targeted invalidation
    }
  }

  async findMany<T>(
    table: string, 
    filters: Record<string, any> = {},
    options: { limit?: number; orderBy?: string; ascending?: boolean } = {}
  ): Promise<T[]> {
    if (!this.client) {
      logger.error('Database client not available');
      return [];
    }

    try {
      let query = this.client.from(table).select('*');

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error(`Error finding records in ${table}`, { error, filters });
        return [];
      }

      return (data as T[]) ?? [];
    } catch (error) {
      logger.error(`Exception finding records in ${table}`, { error, filters });
      return [];
    }
  }

  async count(table: string, filters: Record<string, any> = {}): Promise<number> {
    if (!this.client) {
      logger.error('Database client not available');
      return 0;
    }

    try {
      let query = this.client.from(table).select('*', { count: 'exact', head: true });

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { count, error } = await query;

      if (error) {
        logger.error(`Error counting records in ${table}`, { error, filters });
        return 0;
      }

      return count ?? 0;
    } catch (error) {
      logger.error(`Exception counting records in ${table}`, { error, filters });
      return 0;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();
export { supabaseAdmin as supabase };

// Convenience methods for common operations
export const dbOperations = {
  // Users
  async createUser(userData: Omit<DbUser, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    return db.create<DbUser>('users', userData);
  },

  async getUserById(id: string): Promise<DbUser | null> {
    return db.findById<DbUser>('users', id);
  },

  async getUserByPhone(phone: string): Promise<DbUser | null> {
    const users = await db.findMany<DbUser>('users', { phone }, { limit: 1 });
    return users[0] || null;
  },

  // Transactions
  async createTransaction(txData: Omit<DbTransaction, 'id' | 'created_at'>): Promise<string | null> {
    return db.create<DbTransaction>('financial_transactions', txData);
  },

  async getTransactionsByUserId(userId: string, limit = 50): Promise<DbTransaction[]> {
    return db.findMany<DbTransaction>('financial_transactions', 
      { user_id: userId }, 
      { limit, orderBy: 'timestamp', ascending: false }
    );
  },

  // Notifications
  async createNotification(notifData: Omit<DbNotification, 'id' | 'created_at'>): Promise<string | null> {
    return db.create<DbNotification>('notifications', notifData);
  },

  async getNotificationsByUserId(userId: string, limit = 50): Promise<DbNotification[]> {
    return db.findMany<DbNotification>('notifications', 
      { user_id: userId }, 
      { limit, orderBy: 'created_at', ascending: false }
    );
  },
};