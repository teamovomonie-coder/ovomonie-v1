'use client';

import { useState, useEffect } from 'react';
import { Insurance } from '@/types/features';

export default function InsuranceProducts() {
  const [policies, setPolicies] = useState<Insurance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'life' as 'life' | 'health' | 'auto' | 'home',
    provider: '',
    premium: '',
    coverage_amount: ''
  });

  const providers = ['AXA Mansard', 'AIICO Insurance', 'Leadway Assurance', 'Cornerstone Insurance'];

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/insurance');
      const data = await response.json();
      setPolicies(data.policies || []);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          premium: parseFloat(formData.premium),
          coverage_amount: parseFloat(formData.coverage_amount)
        })
      });
      
      if (response.ok) {
        fetchPolicies();
        setShowForm(false);
        setFormData({ type: 'life', provider: '', premium: '', coverage_amount: '' });
      }
    } catch (error) {
      console.error('Failed to create policy:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">Insurance Products</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Get Quote
        </button>
      </div>

      <div className="grid gap-6">
        {policies.map((policy) => (
          <div key={policy.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg capitalize">{policy.type} Insurance</h3>
                <p className="text-sm text-slate-500">{policy.provider}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(policy.status)}`}>
                {policy.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-slate-500 mb-1">Monthly Premium</p>
                <p className="font-semibold text-slate-800 text-lg">₦{policy.premium.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-slate-500 mb-1">Coverage Amount</p>
                <p className="font-semibold text-slate-800 text-lg">₦{policy.coverage_amount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Get Insurance Quote</h2>
            <form onSubmit={handleSubmit}>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full p-2 border rounded mb-3"
                required
              >
                <option value="life">Life Insurance</option>
                <option value="health">Health Insurance</option>
                <option value="auto">Auto Insurance</option>
                <option value="home">Home Insurance</option>
              </select>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full p-2 border rounded mb-3"
                required
              >
                <option value="">Select provider</option>
                {providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Monthly premium"
                value={formData.premium}
                onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
                className="w-full p-2 border rounded mb-3"
                required
              />
              <input
                type="number"
                placeholder="Coverage amount"
                value={formData.coverage_amount}
                onChange={(e) => setFormData({ ...formData, coverage_amount: e.target.value })}
                className="w-full p-2 border rounded mb-4"
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-purple-600 text-white p-2 rounded">
                  Get Quote
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