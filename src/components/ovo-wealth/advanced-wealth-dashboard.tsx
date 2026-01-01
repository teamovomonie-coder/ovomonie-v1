"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/context/notification-context";
import { 
  TrendingUp, TrendingDown, DollarSign, Target, Shield, 
  PieChart, BarChart3, AlertTriangle, CheckCircle, 
  Brain, Lightbulb, Calendar, Calculator, Settings,
  Download, Share2, RefreshCw, Plus, Minus
} from "lucide-react";
import { 
  LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Cell, Pie,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { format, addDays, subDays } from 'date-fns';

interface MarketData {
  symbol: string;
  name: string;
  current_price: number;
  change_24h: number;
  change_percentage: string;
  volume_24h: number;
  market_cap?: number;
}

interface Portfolio {
  id: string;
  product_id: string;
  principal_amount: number;
  current_value: number;
  units: number;
  status: string;
  investment_date: string;
  maturity_date?: string;
  total_dividends: number;
  investment_products: {
    name: string;
    type: string;
    category: string;
    expected_return_rate: number;
    risk_level: number;
  };
}

interface WealthGoal {
  id: string;
  goal_name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution: number;
  status: string;
}

interface RoboRecommendation {
  id: string;
  recommendation_type: string;
  reasoning: string;
  expected_improvement: number;
  priority: string;
  status: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AdvancedWealthDashboard() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [wealthGoals, setWealthGoals] = useState<WealthGoal[]>([]);
  const [recommendations, setRecommendations] = useState<RoboRecommendation[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { toast } = useToast();
  const { balance } = useAuth();
  const { addNotification } = useNotifications();

  const fetchWealthData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication required');

      const [portfoliosRes, marketRes, goalsRes, summaryRes, recommendationsRes] = await Promise.all([
        fetch('/api/wealth/investments?type=portfolios', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/wealth/market-data', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/wealth/investments?type=goals', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/wealth/investments?type=summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/wealth/investments?type=recommendations', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [portfoliosData, marketDataRes, goalsData, summaryData, recommendationsData] = await Promise.all([
        portfoliosRes.json(),
        marketRes.json(),
        goalsRes.json(),
        summaryRes.json(),
        recommendationsRes.json()
      ]);

      setPortfolios(portfoliosData);
      setMarketData(marketDataRes);
      setWealthGoals(goalsData);
      setPortfolioSummary(summaryData);
      setRecommendations(recommendationsData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load wealth data',
        description: 'Please try again later'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWealthData();
  }, [fetchWealthData]);

  const generatePerformanceData = () => {
    const days = 30;
    const data = [];
    const baseValue = portfolioSummary?.currentValue || 1000000;
    
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const volatility = Math.random() * 0.02 - 0.01; // ±1% daily volatility
      const value = baseValue * (1 + volatility * i / days);
      
      data.push({
        date: format(date, 'MMM dd'),
        value: Math.round(value),
        returns: ((value - baseValue) / baseValue * 100).toFixed(2)
      });
    }
    
    return data;
  };

  const getAssetAllocation = () => {
    if (!portfolios.length) return [];
    
    const allocation = portfolios.reduce((acc: any, portfolio) => {
      const type = portfolio.investment_products.type;
      acc[type] = (acc[type] || 0) + portfolio.current_value;
      return acc;
    }, {});

    return Object.entries(allocation).map(([name, value]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value: value as number,
      percentage: ((value as number) / portfolioSummary?.currentValue * 100).toFixed(1)
    }));
  };

  const getRiskDistribution = () => {
    if (!portfolios.length) return [];
    
    const riskLevels = { Low: 0, Medium: 0, High: 0 };
    
    portfolios.forEach(portfolio => {
      const risk = portfolio.investment_products.risk_level;
      if (risk <= 3) riskLevels.Low += portfolio.current_value;
      else if (risk <= 6) riskLevels.Medium += portfolio.current_value;
      else riskLevels.High += portfolio.current_value;
    });

    return Object.entries(riskLevels).map(([name, value]) => ({
      name,
      value,
      percentage: (value / portfolioSummary?.currentValue * 100).toFixed(1)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const performanceData = generatePerformanceData();
  const assetAllocation = getAssetAllocation();
  const riskDistribution = getRiskDistribution();

  return (
    <div className="flex-1 space-y-2 sm:space-y-4 p-2 sm:p-4 lg:p-8 pt-2 sm:pt-4 lg:pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 gap-2 sm:gap-4">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Wealth Management</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={fetchWealthData} className="text-xs sm:text-sm">
            <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Refresh
          </Button>
          <Button size="sm" className="text-xs sm:text-sm">
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            New Investment
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              ₦{((portfolioSummary?.currentValue || 0) / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioSummary?.returnPercentage >= 0 ? '+' : ''}
              {portfolioSummary?.returnPercentage?.toFixed(2)}% from investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Returns</CardTitle>
            {(portfolioSummary?.totalReturns || 0) >= 0 ? 
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : 
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${(portfolioSummary?.totalReturns || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(portfolioSummary?.totalReturns || 0) >= 0 ? '+' : ''}₦{((portfolioSummary?.totalReturns || 0) / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {portfolioSummary?.portfolioCount || 0} investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{wealthGoals.filter(g => g.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              ₦{(wealthGoals.reduce((sum, g) => sum + g.target_amount, 0) / 100).toLocaleString()} target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">Moderate</div>
            <p className="text-xs text-muted-foreground">
              Balanced risk profile
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 sm:space-y-4">
        <TabsList className="grid w-full grid-cols-5 text-xs sm:text-sm">
          <TabsTrigger value="overview" className="px-2 sm:px-4">Overview</TabsTrigger>
          <TabsTrigger value="portfolio" className="px-2 sm:px-4">Portfolio</TabsTrigger>
          <TabsTrigger value="goals" className="px-2 sm:px-4">Goals</TabsTrigger>
          <TabsTrigger value="advisor" className="px-2 sm:px-4">Advisor</TabsTrigger>
          <TabsTrigger value="market" className="px-2 sm:px-4">Market</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-2 sm:space-y-4">
          <div className="grid gap-2 sm:gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base lg:text-lg">Portfolio Performance</CardTitle>
                <CardDescription className="text-xs sm:text-sm">30-day performance trend</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis tickFormatter={(value) => `₦${(value/1000000).toFixed(1)}M`} fontSize={10} />
                    <Tooltip 
                      formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Portfolio Value']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base lg:text-lg">Asset Allocation</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Current portfolio distribution</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={assetAllocation}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      fontSize={10}
                    >
                      {assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `₦${Number(value).toLocaleString()}`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base lg:text-lg">Risk Distribution</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Portfolio risk breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-4 p-2 sm:p-4">
                {riskDistribution.map((risk, index) => (
                  <div key={risk.name} className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium">{risk.name} Risk</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">{risk.percentage}%</span>
                    </div>
                    <Progress value={parseFloat(risk.percentage)} className="h-1 sm:h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-base lg:text-lg">Recent Activity</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Latest portfolio changes</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <div className="space-y-2 sm:space-y-4">
                  {portfolios.slice(0, 3).map((portfolio) => (
                    <div key={portfolio.id} className="flex items-center space-x-2 sm:space-x-4">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
                      <div className="flex-1 space-y-0.5 sm:space-y-1">
                        <p className="text-xs sm:text-sm font-medium">{portfolio.investment_products.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Invested ₦{(portfolio.principal_amount / 100).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-xs sm:text-sm text-green-600">
                        +₦{((portfolio.current_value - portfolio.principal_amount) / 100).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-2 sm:space-y-4">
          <div className="grid gap-2 sm:gap-4">
            {portfolios.map((portfolio) => (
              <Card key={portfolio.id}>
                <CardHeader className="pb-2 sm:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div>
                      <CardTitle className="text-sm sm:text-base lg:text-lg">{portfolio.investment_products.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {portfolio.investment_products.type.replace('_', ' ')} • 
                        Risk Level: {portfolio.investment_products.risk_level}/10
                      </CardDescription>
                    </div>
                    <Badge variant={portfolio.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {portfolio.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Principal</p>
                      <p className="text-sm sm:text-base lg:text-lg font-semibold">₦{(portfolio.principal_amount / 100).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Current Value</p>
                      <p className="text-sm sm:text-base lg:text-lg font-semibold">₦{(portfolio.current_value / 100).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Returns</p>
                      <p className={`text-sm sm:text-base lg:text-lg font-semibold ${(portfolio.current_value - portfolio.principal_amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(portfolio.current_value - portfolio.principal_amount) >= 0 ? '+' : ''}₦{((portfolio.current_value - portfolio.principal_amount) / 100).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Return %</p>
                      <p className={`text-sm sm:text-base lg:text-lg font-semibold ${(portfolio.current_value - portfolio.principal_amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {((portfolio.current_value - portfolio.principal_amount) / portfolio.principal_amount * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  {portfolio.maturity_date && (
                    <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-muted rounded-lg">
                      <p className="text-xs sm:text-sm">
                        <Calendar className="inline mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Matures on {format(new Date(portfolio.maturity_date), 'PPP')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4">
            {wealthGoals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const daysLeft = Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              
              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{goal.goal_name}</CardTitle>
                        <CardDescription>{goal.goal_type.replace('_', ' ')}</CardDescription>
                      </div>
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
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
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Target Amount</p>
                        <p className="text-lg font-semibold">₦{(goal.target_amount / 100).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Amount</p>
                        <p className="text-lg font-semibold">₦{(goal.current_amount / 100).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Days Left</p>
                        <p className="text-lg font-semibold">{daysLeft > 0 ? daysLeft : 'Overdue'}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        Monthly contribution: ₦{(goal.monthly_contribution / 100).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Target date: {format(new Date(goal.target_date), 'PPP')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="advisor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>
                Personalized investment advice based on your portfolio and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <div key={rec.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                        <span className="font-medium capitalize">
                          {rec.recommendation_type.replace('_', ' ')}
                        </span>
                      </div>
                      <Badge variant={
                        rec.priority === 'high' ? 'destructive' :
                        rec.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{rec.reasoning}</p>
                    {rec.expected_improvement > 0 && (
                      <p className="text-sm text-green-600 mb-3">
                        Expected improvement: +{(rec.expected_improvement * 100).toFixed(1)}%
                      </p>
                    )}
                    <div className="flex space-x-2">
                      <Button size="sm" variant="default">Accept</Button>
                      <Button size="sm" variant="outline">Dismiss</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Portfolio Optimized</h3>
                  <p className="text-muted-foreground">
                    Your portfolio is well-balanced. Check back later for new recommendations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-2 sm:space-y-4">
          <div className="grid gap-2 sm:gap-4">
            {marketData.map((market) => (
              <Card key={market.symbol}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-semibold">{market.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{market.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base sm:text-lg lg:text-xl font-semibold">
                        ₦{market.current_price.toLocaleString()}
                      </p>
                      <p className={`text-xs sm:text-sm ${market.change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {market.change_24h >= 0 ? '+' : ''}{market.change_percentage}
                      </p>
                    </div>
                  </div>
                  {market.volume_24h && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        24h Volume: ₦{market.volume_24h.toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}