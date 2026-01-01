"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Eye, EyeOff, Plus, ArrowRight, 
  PiggyBank, Target, Shield, Zap, Bell, X
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useWealthNotifications } from "@/context/wealth-notification-context";

interface OvomonieWealthDashboardProps {
  onInvestClick: () => void;
  onWithdrawClick?: () => void;
}

interface PortfolioSummary {
  totalInvestment: number;
  currentValue: number;
  totalReturns: number;
  returnPercentage: number;
  portfolioCount: number;
}

export function OvomonieWealthDashboard({ onInvestClick, onWithdrawClick }: OvomonieWealthDashboardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { balance } = useAuth();
  const { notifications, markAsRead, unreadCount } = useWealthNotifications();

  const investmentProducts = [
    {
      id: 'ovo-save',
      name: 'Ovo Save',
      description: 'Flexible savings with daily returns',
      rate: '10% p.a.',
      icon: PiggyBank,
      color: 'bg-white border border-blue-200',
      minAmount: 1000
    },
    {
      id: 'ovo-target',
      name: 'Ovo Target',
      description: 'Goal-based savings plan',
      rate: '12% p.a.',
      icon: Target,
      color: 'bg-blue-50 border border-blue-300',
      minAmount: 5000
    },
    {
      id: 'ovo-lock',
      name: 'Ovo Lock',
      description: 'Fixed deposit with guaranteed returns',
      rate: '15% p.a.',
      icon: Shield,
      color: 'bg-white border border-blue-200',
      minAmount: 10000
    },
    {
      id: 'ovo-boost',
      name: 'Ovo Boost',
      description: 'High-yield investment plan',
      rate: '18% p.a.',
      icon: Zap,
      color: 'bg-blue-50 border border-blue-300',
      minAmount: 25000
    }
  ];

  useEffect(() => {
    fetchPortfolioSummary();
  }, []);

  const fetchPortfolioSummary = async () => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/wealth/investments?type=summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#13284d] to-[#1a3a5c] text-white pt-0 pb-24 relative overflow-hidden rounded-t-3xl rounded-b-3xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-blue-300 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-md mx-auto relative z-10 px-6 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 shadow-lg">
                <span className="text-[#13284d] font-bold text-lg">O</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Ovo Wealth</h1>
                <p className="text-blue-100 text-sm">Grow your money smartly</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2 rounded-full relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
          
          {/* Balance Card */}
          <Card className="bg-white/15 backdrop-blur-md border-0 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-blue-100 font-medium">Total Investment Value</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white hover:bg-white/20 p-2 rounded-full"
                >
                  {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-3xl font-bold mb-2">
                {showBalance ? `₦${portfolioSummary ? (portfolioSummary.currentValue / 100).toLocaleString() : '0'}` : '****'}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-green-300">
                    {portfolioSummary && portfolioSummary.totalReturns > 0 
                      ? `+₦${(portfolioSummary.totalReturns / 100).toLocaleString()} returns`
                      : 'Start investing today'
                    }
                  </span>
                </div>
                {portfolioSummary && portfolioSummary.returnPercentage > 0 && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                    +{portfolioSummary.returnPercentage.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowNotifications(false)}>
          <div className="absolute top-0 right-0 w-full max-w-md h-full bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b bg-[#13284d] text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Wealth Notifications</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                  className="text-white hover:bg-white/20 p-1"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-3 max-h-[calc(100vh-80px)] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No wealth notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
                          {notification.amount && (
                            <p className="text-sm font-medium text-green-600">
                              ₦{notification.amount.toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            notification.type === 'investment' ? 'bg-blue-100 text-blue-700' :
                            notification.type === 'return' ? 'bg-green-100 text-green-700' :
                            notification.type === 'withdrawal' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {notification.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-md mx-auto -mt-16 px-4 pb-6 relative z-10">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button 
            onClick={onInvestClick}
            className="h-14 bg-[#13284d] text-white hover:bg-[#0f1f3a] shadow-lg rounded-xl font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Invest Now
          </Button>
          <Button variant="outline" className="h-14 bg-white hover:bg-gray-50 shadow-lg border-gray-200 rounded-xl font-medium" onClick={onWithdrawClick}>
            Withdraw
          </Button>
        </div>

        {/* Investment Products */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Investment Plans</h2>
          <div className="space-y-3">
            {investmentProducts.map((product) => (
              <Card key={product.id} className="border-0 shadow-md hover:shadow-lg transition-shadow rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${product.color} rounded-xl flex items-center justify-center mr-4 shadow-sm`}>
                      <product.icon className="h-6 w-6 text-[#13284d]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <Badge variant="secondary" className="text-xs font-medium bg-blue-50 text-blue-700">
                          {product.rate}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 mb-2">{product.description}</p>
                      <p className="text-xs text-gray-500">
                        Min: ₦{product.minAmount.toLocaleString()}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 ml-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* My Investments */}
        {false && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">My Investments</h2>
            <div className="space-y-3">
              {portfolios.slice(0, 3).map((portfolio) => (
                <Card key={portfolio.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{portfolio.product_name}</h3>
                        <p className="text-sm text-gray-600">
                          ₦{(portfolio.principal_amount / 100).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          +₦{((portfolio.current_value - portfolio.principal_amount) / 100).toLocaleString()}
                        </p>
                        <Badge 
                          variant={portfolio.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {portfolio.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {portfolios.length > 3 && (
              <Button variant="ghost" className="w-full mt-3 text-blue-600">
                View All Investments
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!portfolioSummary || portfolioSummary.portfolioCount === 0 ? (
          <Card className="border-0 shadow-md text-center py-12 rounded-xl">
            <CardContent>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <PiggyBank className="h-10 w-10 text-[#13284d]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Start Your Investment Journey</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                Choose from our range of investment plans and start earning returns today.
              </p>
              <Button className="bg-[#13284d] hover:bg-[#0f1f3a] px-8 py-3 rounded-xl font-medium" onClick={onInvestClick}>
                Get Started
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-md rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Investment Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Invested</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₦{(portfolioSummary.totalInvestment / 100).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Returns</p>
                  <p className="text-lg font-semibold text-green-600">
                    +₦{(portfolioSummary.totalReturns / 100).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}