"use client";

import { useEffect, useState } from 'react';

export default function DebugReceiptPage() {
  const [receiptData, setReceiptData] = useState<string | null>(null);
  const [allLocalStorage, setAllLocalStorage] = useState<Record<string, string>>({});

  useEffect(() => {
    const receipt = localStorage.getItem('ovo-pending-receipt');
    setReceiptData(receipt);

    const allItems: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        allItems[key] = localStorage.getItem(key) || '';
      }
    }
    setAllLocalStorage(allItems);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Receipt Data</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">ovo-pending-receipt:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {receiptData || 'No receipt data found'}
        </pre>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">All localStorage items:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(allLocalStorage, null, 2)}
        </pre>
      </div>
    </div>
  );
}