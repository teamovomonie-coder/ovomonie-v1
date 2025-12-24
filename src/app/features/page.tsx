'use client';

import React, { useState, useEffect } from 'react';
import SavingsGoals from '@/components/features/savings-goals';
import BudgetingTools from '@/components/features/budgeting-tools';
import CryptoTrading from '@/components/features/crypto-trading';
import InsuranceProducts from '@/components/features/insurance-products';
import ReferralProgram from '@/components/features/referral-program';
import LoyaltyProgram from '@/components/features/loyalty-program';
import CurrencyExchange from '@/components/features/currency-exchange';

const features = [
  { id: 'savings', name: 'Savings Goals', icon: '🎯', component: SavingsGoals },
  { id: 'budgets', name: 'Budgeting Tools', icon: '📊', component: BudgetingTools },
  { id: 'crypto', name: 'Crypto Trading', icon: '₿', component: CryptoTrading },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', component: InsuranceProducts },
  { id: 'referrals', name: 'Referral Program', icon: '👥', component: ReferralProgram },
  { id: 'loyalty', name: 'Loyalty Points', icon: '⭐', component: LoyaltyProgram },
  { id: 'currency', name: 'Currency Exchange', icon: '💱', component: CurrencyExchange }
];

export default function FeaturesPage() {
  const [activeFeature, setActiveFeature] = useState('savings');
  
  // Get tab from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const tabFromUrl = searchParams.get('tab');
  
  React.useEffect(() => {
    if (tabFromUrl && features.find(f => f.id === tabFromUrl)) {
      setActiveFeature(tabFromUrl);
    }
  }, [tabFromUrl]);

  const ActiveComponent = features.find(f => f.id === activeFeature)?.component || SavingsGoals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white/80 backdrop-blur-sm shadow-xl border-r border-slate-200">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <h1 className="text-2xl font-bold">Features</h1>
            <p className="text-blue-100 text-sm mt-1">Financial Tools</p>
          </div>
          <nav className="mt-6">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`w-full flex items-center px-6 py-4 text-left hover:bg-blue-50 transition-all duration-200 ${
                  activeFeature === feature.id 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-600 text-blue-700' 
                    : 'text-slate-700 hover:text-blue-600'
                }`}
              >
                <span className="text-2xl mr-4">{feature.icon}</span>
                <span className={`font-medium ${
                  activeFeature === feature.id ? 'font-semibold' : ''
                }`}>
                  {feature.name}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gradient-to-br from-white to-slate-50">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}