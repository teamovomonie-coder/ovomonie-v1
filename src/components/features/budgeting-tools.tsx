'use client';

import { useState, useEffect } from 'react';
import { Budget } from '@/types/features';

export default function BudgetingTools() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    limit_amount: '',
    period: 'monthly' as 'monthly' | 'weekly' | 'yearly'
  });

  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education'];

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budgets');
      const data = await response.json();
      setBudgets(data.budgets || []);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          limit_amount: parseFloat(formData.limit_amount)
        })
      });
      
      if (response.ok) {
        fetchBudgets();
        setShowForm(false);
        setFormData({ category: '', limit_amount: '', period: 'monthly' });
      }
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Budget Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Add Budget
        </button>
      </div>

      <div className="grid gap-6">
        {budgets.map((budget) => {
          const percentage = (budget.spent_amount / budget.limit_amount) * 100;
          const isOverBudget = percentage > 100;
          
          return (
            <div key={budget.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800 text-lg">{budget.category}</h3>
                <span className="text-sm text-slate-500 capitalize bg-slate-100 px-3 py-1 rounded-full">{budget.period}</span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                    ₦{budget.spent_amount.toLocaleString()}
                  </span>
                  <span className="text-slate-600">₦{budget.limit_amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isOverBudget 
                        ? 'bg-gradient-to-r from-red-500 to-red-600' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
              <p className={`text-sm ${
                isOverBudget ? 'text-red-600 font-semibold' : 'text-slate-500'
              }`}>
                {isOverBudget ? 'Over budget' : `${(100 - percentage).toFixed(1)}% remaining`}
              </p>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create Budget</h2>
            <form onSubmit={handleSubmit}>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 border rounded mb-3"
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Budget limit"
                value={formData.limit_amount}
                onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
                className="w-full p-2 border rounded mb-3"
                required
              />
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                className="w-full p-2 border rounded mb-4"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 text-white p-2 rounded">
                  Create Budget
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