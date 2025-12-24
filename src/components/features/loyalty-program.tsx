'use client';

import { useState, useEffect } from 'react';
import { LoyaltyPoints } from '@/types/features';

export default function LoyaltyProgram() {
  const [loyalty, setLoyalty] = useState<LoyaltyPoints | null>(null);
  const [showRewards, setShowRewards] = useState(false);

  const rewards = [
    { points: 1000, reward: 'Free Transfer (5x)', description: '5 free transfers' },
    { points: 2500, reward: 'Cashback Boost', description: '2% cashback for 1 month' },
    { points: 5000, reward: 'Premium Support', description: 'Priority customer support' },
    { points: 10000, reward: 'VIP Status', description: 'Exclusive VIP benefits' }
  ];

  const tierBenefits = {
    bronze: ['Basic rewards', 'Standard support'],
    silver: ['2x points on transfers', 'Priority support', 'Monthly cashback'],
    gold: ['3x points on transfers', 'Premium support', 'Weekly cashback', 'Free ATM withdrawals'],
    platinum: ['5x points on transfers', 'VIP support', 'Daily cashback', 'Free everything', 'Exclusive events']
  };

  useEffect(() => {
    fetchLoyalty();
  }, []);

  const fetchLoyalty = async () => {
    try {
      const response = await fetch('/api/loyalty');
      const data = await response.json();
      setLoyalty(data.loyalty);
    } catch (error) {
      console.error('Failed to fetch loyalty:', error);
    }
  };

  const redeemReward = async (pointsCost: number) => {
    if (!loyalty || loyalty.points < pointsCost) return;
    
    try {
      const response = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: loyalty.points - pointsCost })
      });
      
      if (response.ok) {
        fetchLoyalty();
        alert('Reward redeemed successfully!');
      }
    } catch (error) {
      console.error('Failed to redeem reward:', error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600 bg-orange-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'platinum': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getNextTierPoints = (currentTier: string) => {
    switch (currentTier) {
      case 'bronze': return 1000;
      case 'silver': return 5000;
      case 'gold': return 10000;
      default: return 0;
    }
  };

  if (!loyalty) return <div className="p-6">Loading...</div>;

  const nextTierPoints = getNextTierPoints(loyalty.tier);
  const progressToNext = nextTierPoints > 0 ? (loyalty.lifetime_points / nextTierPoints) * 100 : 100;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Loyalty Program</h1>
        <button
          onClick={() => setShowRewards(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          View Rewards
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Status</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getTierColor(loyalty.tier)}`}>
              {loyalty.tier}
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-indigo-600">{loyalty.points.toLocaleString()}</p>
              <p className="text-gray-500">Available Points</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{loyalty.lifetime_points.toLocaleString()}</p>
              <p className="text-gray-500">Lifetime Points</p>
            </div>
            {nextTierPoints > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to next tier</span>
                  <span>{Math.min(progressToNext, 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${Math.min(progressToNext, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {nextTierPoints - loyalty.lifetime_points} points to next tier
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Tier Benefits</h2>
          <ul className="space-y-2">
            {tierBenefits[loyalty.tier as keyof typeof tierBenefits].map((benefit, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">How to Earn Points</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
              10
            </span>
            <span>Points per ₦1,000 transferred</span>
          </div>
          <div className="flex items-center">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
              5
            </span>
            <span>Points per bill payment</span>
          </div>
          <div className="flex items-center">
            <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
              50
            </span>
            <span>Points per referral</span>
          </div>
          <div className="flex items-center">
            <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
              100
            </span>
            <span>Points per loan repayment</span>
          </div>
        </div>
      </div>

      {showRewards && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Available Rewards</h2>
            <div className="space-y-3">
              {rewards.map((reward, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{reward.reward}</h3>
                      <p className="text-sm text-gray-500">{reward.description}</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">
                      {reward.points} pts
                    </span>
                  </div>
                  <button
                    onClick={() => redeemReward(reward.points)}
                    disabled={loyalty.points < reward.points}
                    className={`w-full py-2 px-3 rounded text-sm ${
                      loyalty.points >= reward.points
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loyalty.points >= reward.points ? 'Redeem' : 'Insufficient Points'}
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowRewards(false)}
              className="w-full mt-4 bg-gray-300 p-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}