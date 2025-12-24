'use client';

import { useState, useEffect } from 'react';
import { CryptoAsset } from '@/types/features';

export default function CryptoTrading() {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    amount: '',
    purchase_price: ''
  });

  const cryptos = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'BNB', name: 'Binance Coin' },
    { symbol: 'ADA', name: 'Cardano' },
    { symbol: 'SOL', name: 'Solana' }
  ];

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/crypto');
      const data = await response.json();
      setAssets(data.assets || []);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          purchase_price: parseFloat(formData.purchase_price)
        })
      });
      
      if (response.ok) {
        fetchAssets();
        setShowForm(false);
        setFormData({ symbol: '', name: '', amount: '', purchase_price: '' });
      }
    } catch (error) {
      console.error('Failed to buy crypto:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Crypto Trading</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Buy Crypto
        </button>
      </div>

      <div className="grid gap-6">
        {assets.map((asset) => {
          const pnl = (asset.current_price - asset.purchase_price) * asset.amount;
          const pnlPercentage = ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100;
          const isProfit = pnl > 0;
          
          return (
            <div key={asset.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">{asset.symbol}</h3>
                  <p className="text-sm text-slate-500">{asset.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">${asset.current_price.toFixed(2)}</p>
                  <p className={`text-sm font-semibold ${
                    isProfit ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isProfit ? '+' : ''}${pnl.toFixed(2)} ({pnlPercentage.toFixed(2)}%)
                  </p>
                </div>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <p>Amount: <span className="font-semibold">{asset.amount} {asset.symbol}</span></p>
                <p>Purchase Price: <span className="font-semibold">${asset.purchase_price.toFixed(2)}</span></p>
                <p>Total Value: <span className="font-semibold">${(asset.current_price * asset.amount).toFixed(2)}</span></p>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Buy Cryptocurrency</h2>
            <form onSubmit={handleSubmit}>
              <select
                value={formData.symbol}
                onChange={(e) => {
                  const crypto = cryptos.find(c => c.symbol === e.target.value);
                  setFormData({ 
                    ...formData, 
                    symbol: e.target.value,
                    name: crypto?.name || ''
                  });
                }}
                className="w-full p-2 border rounded mb-3"
                required
              >
                <option value="">Select cryptocurrency</option>
                {cryptos.map(crypto => (
                  <option key={crypto.symbol} value={crypto.symbol}>
                    {crypto.symbol} - {crypto.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.00000001"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full p-2 border rounded mb-3"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Purchase price (USD)"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                className="w-full p-2 border rounded mb-4"
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-orange-600 text-white p-2 rounded">
                  Buy Crypto
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 p-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}