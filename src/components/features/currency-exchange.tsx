'use client';

import { useState, useEffect } from 'react';
import { CurrencyRate } from '@/types/features';

export default function CurrencyExchange() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const currencies = [
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
    { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭' },
    { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪' }
  ];

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch('/api/currency');
      const data = await response.json();
      if (data.rate) {
        setRates([data.rate]);
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
    }
  };

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_currency: fromCurrency,
          to_currency: toCurrency,
          amount: parseFloat(amount)
        })
      });
      
      const data = await response.json();
      setConvertedAmount(data.converted_amount);
    } catch (error) {
      console.error('Failed to convert currency:', error);
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setConvertedAmount(null);
  };

  const getCurrencyInfo = (code: string) => {
    return currencies.find(c => c.code === code) || { code, name: code, flag: '💱' };
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Currency Exchange</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Convert Currency</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.flag} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.flag} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-center mb-4">
          <button
            onClick={swapCurrencies}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            ⇄
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full p-3 border rounded-lg"
          />
        </div>

        <button
          onClick={handleConvert}
          disabled={loading || !amount}
          className="w-full bg-teal-600 text-white p-3 rounded-lg disabled:bg-gray-300"
        >
          {loading ? 'Converting...' : 'Convert'}
        </button>

        {convertedAmount !== null && (
          <div className="mt-6 p-4 bg-teal-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {parseFloat(amount).toLocaleString()} {getCurrencyInfo(fromCurrency).flag} {fromCurrency}
              </p>
              <p className="text-2xl font-bold text-teal-600 my-2">
                {convertedAmount.toLocaleString()} {getCurrencyInfo(toCurrency).flag} {toCurrency}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Popular Exchange Rates</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { from: 'USD', to: 'NGN', rate: 1650 },
              { from: 'EUR', to: 'NGN', rate: 1800 },
              { from: 'GBP', to: 'NGN', rate: 2100 },
              { from: 'USD', to: 'GHS', rate: 15.5 },
              { from: 'USD', to: 'KES', rate: 129 },
              { from: 'EUR', to: 'USD', rate: 1.09 }
            ].map((rate, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {getCurrencyInfo(rate.from).flag} {rate.from} → {getCurrencyInfo(rate.to).flag} {rate.to}
                  </span>
                  <span className="font-bold text-teal-600">
                    {rate.rate.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}