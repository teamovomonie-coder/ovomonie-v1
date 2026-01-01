"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, Calendar, DollarSign, TrendingUp, 
  Plus, Edit, Trash2, CheckCircle, AlertCircle 
} from "lucide-react";
import { format, differenceInDays, addMonths } from 'date-fns';

interface WealthGoal {
  id: string;
  goal_name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution: number;
  risk_tolerance: string;
  status: 'active' | 'achieved' | 'paused' | 'cancelled';
  created_at: string;
}

interface GoalFormData {
  goal_name: string;
  goal_type: string;
  target_amount: number;
  target_date: string;
  monthly_contribution: number;
  risk_tolerance: string;
}

const goalTypes = [
  { value: 'retirement', label: 'Retirement Planning', icon: '🏖️' },
  { value: 'education', label: 'Education Fund', icon: '🎓' },
  { value: 'house', label: 'Home Purchase', icon: '🏠' },
  { value: 'emergency', label: 'Emergency Fund', icon: '🚨' },
  { value: 'vacation', label: 'Vacation/Travel', icon: '✈️' },
  { value: 'business', label: 'Business Investment', icon: '💼' },
  { value: 'other', label: 'Other Goals', icon: '🎯' }
];

export function WealthGoalManager() {
  const [goals, setGoals] = useState<WealthGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WealthGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    goal_name: '',
    goal_type: '',
    target_amount: 0,
    target_date: '',
    monthly_contribution: 0,
    risk_tolerance: 'moderate'
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/wealth/investments?type=goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch goals');
      
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load goals',
        description: 'Please try again later'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/wealth/investments?action=create-goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create goal');
      }

      toast({
        title: 'Goal Created',
        description: `Your ${formData.goal_name} goal has been created successfully.`
      });

      setShowForm(false);
      setFormData({
        goal_name: '',
        goal_type: '',
        target_amount: 0,
        target_date: '',
        monthly_contribution: 0,
        risk_tolerance: 'moderate'
      });
      
      await fetchGoals();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create goal',
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  };

  const calculateProgress = (goal: WealthGoal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const calculateTimeToGoal = (goal: WealthGoal) => {
    const daysLeft = differenceInDays(new Date(goal.target_date), new Date());
    return Math.max(daysLeft, 0);
  };

  const calculateRequiredMonthlyContribution = (goal: WealthGoal) => {
    const monthsLeft = Math.ceil(calculateTimeToGoal(goal) / 30);
    const remainingAmount = goal.target_amount - goal.current_amount;
    return monthsLeft > 0 ? Math.ceil(remainingAmount / monthsLeft / 100) : 0;
  };

  const getGoalTypeInfo = (type: string) => {
    return goalTypes.find(gt => gt.value === type) || goalTypes[goalTypes.length - 1];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'achieved': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Wealth Goals</h2>
          <p className="text-muted-foreground">Track and manage your financial objectives</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Goal Creation Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Goal</CardTitle>
            <CardDescription>Set up a new financial goal to track your progress</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="goal_name">Goal Name</Label>
                  <Input
                    id="goal_name"
                    value={formData.goal_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, goal_name: e.target.value }))}
                    placeholder="e.g., Dream House"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal_type">Goal Type</Label>
                  <Select
                    value={formData.goal_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, goal_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {goalTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_amount">Target Amount (₦)</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    value={formData.target_amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_amount: Number(e.target.value) }))}
                    placeholder="e.g., 5000000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_date">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_contribution">Monthly Contribution (₦)</Label>
                  <Input
                    id="monthly_contribution"
                    type="number"
                    value={formData.monthly_contribution || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_contribution: Number(e.target.value) }))}
                    placeholder="e.g., 50000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk_tolerance">Risk Tolerance</Label>
                  <Select
                    value={formData.risk_tolerance}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, risk_tolerance: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Goal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const progress = calculateProgress(goal);
          const daysLeft = calculateTimeToGoal(goal);
          const requiredMonthly = calculateRequiredMonthlyContribution(goal);
          const goalTypeInfo = getGoalTypeInfo(goal.goal_type);
          const isOnTrack = goal.monthly_contribution >= requiredMonthly;

          return (
            <Card key={goal.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{goalTypeInfo.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{goal.goal_name}</CardTitle>
                      <CardDescription>{goalTypeInfo.label}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(goal.status)}>
                    {goal.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <DollarSign className="mr-1 h-3 w-3" />
                      Target
                    </div>
                    <div className="font-semibold">
                      ₦{(goal.target_amount / 100).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Current
                    </div>
                    <div className="font-semibold">
                      ₦{(goal.current_amount / 100).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Calendar className="mr-1 h-3 w-3" />
                      Days Left
                    </div>
                    <div className="font-semibold">
                      {daysLeft > 0 ? daysLeft : 'Overdue'}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Target className="mr-1 h-3 w-3" />
                      Monthly
                    </div>
                    <div className="font-semibold">
                      ₦{(goal.monthly_contribution / 100).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Goal Analysis */}
                <div className={`p-3 rounded-lg ${isOnTrack ? 'bg-green-50' : 'bg-orange-50'}`}>
                  <div className="flex items-center mb-2">
                    {isOnTrack ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                    )}
                    <span className="text-sm font-medium">
                      {isOnTrack ? 'On Track' : 'Needs Adjustment'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isOnTrack 
                      ? 'Your current contribution is sufficient to reach your goal.'
                      : `Consider increasing to ₦${requiredMonthly.toLocaleString()}/month to stay on track.`
                    }
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Target Date: {format(new Date(goal.target_date), 'PPP')}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button size="sm" variant="outline">
                  <Edit className="mr-2 h-3 w-3" />
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  Add Funds
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && !showForm && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Goals Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first financial goal to track your progress.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}