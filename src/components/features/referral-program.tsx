'use client';

import { useState, useEffect } from 'react';
import { Referral } from '@/types/features';

export default function ReferralProgram() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    referee_id: ''
  });

  useEffect(() => {
    fetchReferrals();
    generateReferralCode();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/referrals');
      const data = await response.json();
      setReferrals(data.referrals || []);
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    }
  };

  const generateReferralCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setReferralCode(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        fetchReferrals();
        setShowForm(false);
        setFormData({ referee_id: '' });
      }
    } catch (error) {
      console.error('Failed to create referral:', error);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    alert('Referral code copied!');
  };

  const totalEarnings = referrals
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.reward_amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Referral Program</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Refer Friend
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Your Referral Code</h3>
          <div className="flex items-center gap-3">
            <code className="bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-3 rounded-xl font-mono text-lg font-bold text-slate-800 flex-1 text-center">
              {referralCode}
            </code>
            <button
              onClick={copyReferralCode}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200"
            >
              Copy
            </button>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Total Referrals</h3>
          <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{referrals.length}</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Total Earnings</h3>
          <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">₦{totalEarnings.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Referral History</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {referrals.map((referral) => (
            <div key={referral.id} className="p-6 flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-800">Referral Code: {referral.code}</p>
                <p className="text-sm text-slate-500">
                  {new Date(referral.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  referral.status === 'completed' 
                    ? 'text-green-700 bg-green-100' 
                    : 'text-yellow-700 bg-yellow-100'
                }`}>
                  {referral.status}
                </span>
                <p className="text-sm text-slate-600 mt-2">
                  ₦{referral.reward_amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {referrals.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-lg font-semibold mb-2">No referrals yet</p>
              <p>Start referring friends to earn rewards!</p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Refer a Friend</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Friend's user ID or email"
                value={formData.referee_id}
                onChange={(e) => setFormData({ ...formData, referee_id: e.target.value })}
                className="w-full p-2 border rounded mb-4"
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-pink-600 text-white p-2 rounded">
                  Send Referral
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