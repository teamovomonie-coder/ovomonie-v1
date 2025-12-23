'use client';

import { useState, useEffect } from 'react';
import { SavingsGoal } from '@/types/features';

export default function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    category: 'emergency'
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/savings-goals');
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          target_amount: parseFloat(formData.target_amount)
        })
      });
      
      if (response.ok) {
        fetchGoals();
        setShowForm(false);
        setFormData({ name: '', target_amount: '', target_date: '', category: 'emergency' });
      }
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Savings Goals</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
        >
          Add Goal
        </button>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-white/20">
            <h3 className="font-semibold text-slate-800 text-base sm:text-lg mb-2 sm:mb-0">{goal.name}</h3>
            <div className="mt-3 sm:mt-4">
              <div className="flex justify-between text-xs sm:text-sm text-slate-600 mb-2">
                <span>₦{goal.current_amount.toLocaleString()}</span>
                <span>₦{goal.target_amount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 sm:h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 sm:mt-3">Target: {goal.target_date}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl border border-white/20">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Create Savings Goal</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Goal name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl mb-3 sm:mb-4 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              />
              <input
                type="number"
                placeholder="Target amount"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl mb-3 sm:mb-4 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              />
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl mb-3 sm:mb-4 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 sm:p-4 border border-slate-200 rounded-xl mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="emergency">Emergency Fund</option>
                <option value="vacation">Vacation</option>
                <option value="house">House</option>
                <option value="car">Car</option>
              </select>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 text-sm sm:text-base">
                  Create Goal
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-200 text-slate-700 p-3 sm:p-4 rounded-xl font-semibold hover:bg-slate-300 transition-all duration-200 text-sm sm:text-base"
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