import { supabase, supabaseAdmin } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Firebase-compatible wrapper for Supabase
 * Provides methods that mimic Firestore API while using PostgreSQL backend
 * 
 * This adapter bridges the gap between Firebase SDK calls and Supabase operations,
 * allowing gradual migration without rewriting all business logic.
 */

interface DocumentData {
  [key: string]: any;
}

interface DocumentSnapshot {
  id: string;
  exists: () => boolean;
  data: () => DocumentData | undefined;
  [key: string]: any;
}

interface QuerySnapshot {
  docs: DocumentSnapshot[];
  empty: boolean;
  size: number;
}

interface CollectionReference {
  doc: (id?: string) => DocumentReference;
  add: (data: DocumentData) => Promise<{ id: string }>;
  where: (field: string, operator: string, value: any) => QueryBuilder;
}

interface DocumentReference {
  get: () => Promise<DocumentSnapshot>;
  set: (data: DocumentData) => Promise<void>;
  update: (data: Partial<DocumentData>) => Promise<void>;
  delete: () => Promise<void>;
  collection: (path: string) => CollectionReference;
}

interface QueryBuilder {
  get: () => Promise<QuerySnapshot>;
  where: (field: string, operator: string, value: any) => QueryBuilder;
  orderBy: (field: string, direction?: 'asc' | 'desc') => QueryBuilder;
  limit: (n: number) => QueryBuilder;
}

/**
 * Get Supabase client (browser-safe)
 */
export function getSupabaseClient(): SupabaseClient {
  return supabase;
}

/**
 * Get Supabase admin client (server-side only)
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  return supabaseAdmin;
}

/**
 * Collection reference that mimics Firestore's db.collection(path)
 */
export function collection(client: SupabaseClient, tableName: string): CollectionReference {
  return {
    doc(id?: string) {
      return documentReference(client, tableName, id);
    },
    async add(data: DocumentData) {
      const { data: inserted, error } = await client
        .from(tableName)
        .insert([{ ...data, created_at: new Date().toISOString() }])
        .select('id')
        .single();

      if (error) throw error;
      return { id: inserted?.id || '' };
    },
    where(field: string, operator: string, value: any) {
      return queryBuilder(client, tableName, [[field, operator, value]]);
    },
  };
}

/**
 * Document reference that mimics Firestore's doc()
 */
export function documentReference(client: SupabaseClient, tableName: string, id?: string): DocumentReference {
  return {
    async get() {
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return {
          id: id || '',
          exists: () => false,
          data: () => undefined,
        };
      }

      return {
        id: id || data?.id || '',
        exists: () => !!data,
        data: () => data || undefined,
      };
    },
    async set(data: DocumentData) {
      const { error } = await client
        .from(tableName)
        .upsert({ id, ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    async update(data: Partial<DocumentData>) {
      const { error } = await client
        .from(tableName)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    async delete() {
      const { error } = await client.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
    collection(path: string) {
      // Implement subcollections using table naming convention: tableName_path
      return {
        doc(subId?: string) {
          return documentReference(client, `${tableName}_${path}`, subId);
        },
        add: async (data: DocumentData) => {
          const { data: inserted } = await client
            .from(`${tableName}_${path}`)
            .insert([{ ...data, created_at: new Date().toISOString() }])
            .select('id')
            .single();
          return { id: inserted?.id || '' };
        },
        where: (field: string, operator: string, value: any) =>
          queryBuilder(client, `${tableName}_${path}`, [[field, operator, value]]),
      };
    },
  };
}

/**
 * Query builder that mimics Firestore's query chaining
 */
function queryBuilder(client: SupabaseClient, tableName: string, conditions: Array<[string, string, any]>): QueryBuilder {
  let query = client.from(tableName).select('*');
  let orderByField: string | null = null;
  let orderByDir: 'asc' | 'desc' = 'asc';
  let limitCount: number | null = null;

  return {
    async get() {
      let finalQuery = client.from(tableName).select('*');

      // Apply conditions
      for (const [field, operator, value] of conditions) {
        if (operator === '==') {
          finalQuery = finalQuery.eq(field, value);
        } else if (operator === '<') {
          finalQuery = finalQuery.lt(field, value);
        } else if (operator === '>') {
          finalQuery = finalQuery.gt(field, value);
        } else if (operator === '<=') {
          finalQuery = finalQuery.lte(field, value);
        } else if (operator === '>=') {
          finalQuery = finalQuery.gte(field, value);
        } else if (operator === '!=') {
          finalQuery = finalQuery.neq(field, value);
        } else if (operator === 'in') {
          finalQuery = finalQuery.in(field, value);
        }
      }

      // Apply ordering
      if (orderByField) {
        finalQuery = finalQuery.order(orderByField, { ascending: orderByDir === 'asc' });
      }

      // Apply limit
      if (limitCount) {
        finalQuery = finalQuery.limit(limitCount);
      }

      const { data, error } = await finalQuery;

      if (error) {
        return { docs: [], empty: true, size: 0 };
      }

      const docs = (data || []).map((doc: any) => ({
        id: doc.id,
        exists: () => true,
        data: () => doc,
      }));

      return {
        docs,
        empty: docs.length === 0,
        size: docs.length,
      };
    },

    where(field: string, operator: string, value: any) {
      conditions.push([field, operator, value]);
      return this;
    },

    orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
      orderByField = field;
      orderByDir = direction;
      return this;
    },

    limit(n: number) {
      limitCount = n;
      return this;
    },
  };
}

/**
 * Supabase health check endpoint
 * Verifies database connectivity
 */
export async function checkSupabaseHealth(client: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await client.from('users').select('count(*)', { count: 'exact' }).limit(1);
    return !error;
  } catch {
    return false;
  }
}
