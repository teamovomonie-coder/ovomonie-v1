/**
 * Pending Transaction Service
 * 
 * A utility service for managing pending transactions in the database.
 * Replaces localStorage-based receipt storage with database persistence.
 */

export interface ReceiptData {
  type: 'transfer' | 'card_funding' | 'bank_funding' | 'agent_funding' | 'virtual_card' | 'bill_payment' | 'airtime' | 'memo-transfer' | 'internal-transfer' | 'external-transfer' | 'withdrawal' | 'betting' | string;
  reference: string;
  amount?: number;
  recipientName?: string;
  recipientAccountNumber?: string;
  bankName?: string;
  message?: string;
  fee?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  errorMessage?: string;
  completedAt?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

class PendingTransactionService {
  private baseUrl = '/api/transactions/pending';

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('ovo-auth-token');
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  }

  /**
   * Save a pending receipt (unified method - saves to both localStorage and DB)
   * This is the primary method components should use instead of direct localStorage.setItem
   */
  async savePendingReceipt(receipt: ReceiptData): Promise<void> {
    // Generate reference if not provided
    if (!receipt.reference) {
      receipt.reference = `ovo-${receipt.type}-${Date.now()}`;
    }

    // Save to localStorage for immediate access (backward compatibility)
    this.setLocalStorage(receipt);

    // Dispatch event to notify listeners
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new Event('ovo-pending-receipt-updated'));
      } catch (e) {}
    }

    // Save to database and wait so the server record is the latest entry.
    try {
      const res = await this.createPending(receipt);
      if (!res.ok) {
        console.debug('[PendingTransactionService] DB save reported failure, localStorage fallback active:', res.message);
      }
    } catch (err) {
      console.debug('[PendingTransactionService] DB save failed, localStorage fallback active:', err);
    }
  }

  /**
   * Create a new pending transaction (replaces localStorage.setItem)
   */
  async createPending(data: ReceiptData): Promise<{ ok: boolean; data?: unknown; message?: string }> {
    try {
      const response = await this.fetchWithAuth(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          type: data.type,
          reference: data.reference,
          amount: data.amount,
          data: data,
          recipientName: data.recipientName,
          bankName: data.bankName,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('[PendingTransactionService] Create error:', error);
      // Fallback to localStorage if API fails
      this.setLocalStorage(data);
      return { ok: false, message: 'Failed to save to database, using local storage' };
    }
  }

  /**
   * Get the latest pending/completed transaction (replaces localStorage.getItem)
   */
  async getLatest(): Promise<ReceiptData | null> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}?latest=true`);
      const result = await response.json();
      
      if (result.ok && result.data && result.data.data) {
        // Return the data field which contains the full receipt
        return result.data.data as ReceiptData;
      }

      // Fallback to localStorage if no database data
      return this.getFromLocalStorage();
    } catch (error) {
      console.debug('[PendingTransactionService] Database unavailable, using localStorage:', error);
      return this.getFromLocalStorage();
    }
  }

  /**
   * Get a specific transaction by reference
   */
  async getByReference(reference: string): Promise<ReceiptData | null> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}?reference=${encodeURIComponent(reference)}`);
      const result = await response.json();
      
      if (result.ok && result.data && result.data.length > 0) {
        return result.data[0].data as ReceiptData;
      }

      return null;
    } catch (error) {
      console.error('[PendingTransactionService] Get by reference error:', error);
      return null;
    }
  }

  /**
   * Update a pending transaction status
   */
  async updateStatus(
    reference: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    additionalData?: Partial<ReceiptData>
  ): Promise<{ ok: boolean; message?: string }> {
    try {
      const response = await this.fetchWithAuth(this.baseUrl, {
        method: 'PATCH',
        body: JSON.stringify({
          reference,
          status,
          data: additionalData,
          completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('[PendingTransactionService] Update status error:', error);
      return { ok: false, message: 'Failed to update status' };
    }
  }

  /**
   * Mark transaction as completed
   */
  async markCompleted(reference: string, transactionId?: string): Promise<{ ok: boolean; message?: string }> {
    return this.updateStatus(reference, 'completed', transactionId ? { transactionId } : undefined);
  }

  /**
   * Mark transaction as failed
   */
  async markFailed(reference: string, errorMessage?: string): Promise<{ ok: boolean; message?: string }> {
    return this.updateStatus(reference, 'failed', errorMessage ? { errorMessage } : undefined);
  }

  /**
   * Delete a pending transaction (cleanup)
   */
  async deletePending(reference: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}?reference=${encodeURIComponent(reference)}`, {
        method: 'DELETE',
      });

      return await response.json();
    } catch (error) {
      console.error('[PendingTransactionService] Delete error:', error);
      return { ok: false, message: 'Failed to delete' };
    }
  }

  /**
   * Clear all pending state (replaces localStorage.removeItem)
   */
  async clearPending(): Promise<void> {
    // Also clear localStorage for compatibility
    this.clearLocalStorage();
  }

  /**
   * Clear previous receipts to prevent showing old data during new transactions
   */
  async clearPendingReceipts(): Promise<void> {
    this.clearLocalStorage();
    // Dispatch event to notify listeners that receipts were cleared
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new Event('ovo-pending-receipt-cleared'));
      } catch (e) {}
    }
  }

  // LocalStorage fallback methods for compatibility and offline support
  
  private setLocalStorage(data: ReceiptData): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('ovo-pending-receipt', JSON.stringify(data));
  }

  private getFromLocalStorage(): ReceiptData | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('ovo-pending-receipt');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }

  private clearLocalStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('ovo-pending-receipt');
  }

  /**
   * Migrate any existing localStorage data to the database
   */
  async migrateFromLocalStorage(): Promise<void> {
    const localData = this.getFromLocalStorage();
    if (localData && localData.reference) {
      await this.createPending(localData);
      this.clearLocalStorage();
    }
  }
}

// Export a singleton instance
export const pendingTransactionService = new PendingTransactionService();

// For backward compatibility, export a hook-like interface
export function usePendingTransaction() {
  return {
    createPending: pendingTransactionService.createPending.bind(pendingTransactionService),
    getLatest: pendingTransactionService.getLatest.bind(pendingTransactionService),
    getByReference: pendingTransactionService.getByReference.bind(pendingTransactionService),
    updateStatus: pendingTransactionService.updateStatus.bind(pendingTransactionService),
    markCompleted: pendingTransactionService.markCompleted.bind(pendingTransactionService),
    markFailed: pendingTransactionService.markFailed.bind(pendingTransactionService),
    deletePending: pendingTransactionService.deletePending.bind(pendingTransactionService),
    clearPending: pendingTransactionService.clearPending.bind(pendingTransactionService),
  };
}
