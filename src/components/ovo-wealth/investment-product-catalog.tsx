"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, TrendingUp, Clock, DollarSign, Info, 
  Calculator, Star, Filter, Search
} from "lucide-react";

interface InvestmentProduct {
  id: string;
  name: string;
  type: string;
  category: string;
  min_investment: number;
  max_investment?: number;
  expected_return_rate: number;
  risk_level: number;
  liquidity_period: number;
  management_fee: number;
  performance_fee: number;
  description?: string;
  terms_conditions?: string;
}

interface ProductCatalogProps {
  onInvest: (productId: string, amount: number) => void;
}

const riskColors = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-green-100 text-green-800',
  3: 'bg-green-100 text-green-800',
  4: 'bg-yellow-100 text-yellow-800',
  5: 'bg-yellow-100 text-yellow-800',
  6: 'bg-yellow-100 text-yellow-800',
  7: 'bg-orange-100 text-orange-800',
  8: 'bg-red-100 text-red-800',
  9: 'bg-red-100 text-red-800',
  10: 'bg-red-100 text-red-800'
};

const getRiskLabel = (level: number) => {
  if (level <= 3) return 'Low Risk';
  if (level <= 6) return 'Medium Risk';
  return 'High Risk';
};

export function InvestmentProductCatalog({ onInvest }: ProductCatalogProps) {
  const [products, setProducts] = useState<InvestmentProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InvestmentProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskRange, setRiskRange] = useState([1, 10]);
  const [minInvestment, setMinInvestment] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchTerm, riskRange, minInvestment]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('ovo-auth-token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/wealth/investments?type=products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load products',
        description: 'Please try again later'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Risk range filter
    filtered = filtered.filter(p => 
      p.risk_level >= riskRange[0] && p.risk_level <= riskRange[1]
    );

    // Minimum investment filter
    if (minInvestment > 0) {
      filtered = filtered.filter(p => p.min_investment <= minInvestment * 100);
    }

    setFilteredProducts(filtered);
  };

  const calculateReturns = (principal: number, rate: number, days: number) => {
    const dailyRate = rate / 365;
    return principal * dailyRate * days;
  };

  const toggleCompare = (productId: string) => {
    setCompareList(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else if (prev.length < 3) {
        return [...prev, productId];
      } else {
        toast({
          title: 'Comparison Limit',
          description: 'You can compare up to 3 products at a time'
        });
        return prev;
      }
    });
  };

  const categories = ['all', 'conservative', 'moderate', 'aggressive', 'balanced'];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
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
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Risk Level: {riskRange[0]} - {riskRange[1]}</Label>
              <Slider
                value={riskRange}
                onValueChange={setRiskRange}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Investment (₦)</Label>
              <Input
                type="number"
                placeholder="e.g., 100000"
                value={minInvestment || ''}
                onChange={(e) => setMinInvestment(Number(e.target.value))}
              />
            </div>
          </div>

          {compareList.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm">
                {compareList.length} product{compareList.length > 1 ? 's' : ''} selected for comparison
              </span>
              <div className="space-x-2">
                <Button size="sm" onClick={() => setShowComparison(true)}>
                  Compare Now
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCompareList([])}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription className="capitalize">
                    {product.type.replace('_', ' ')} • {product.category}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant={compareList.includes(product.id) ? "default" : "outline"}
                  onClick={() => toggleCompare(product.id)}
                >
                  ⚖️
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className={riskColors[product.risk_level as keyof typeof riskColors]}>
                  {getRiskLabel(product.risk_level)}
                </Badge>
                <Badge variant="outline">
                  {(product.expected_return_rate * 100).toFixed(1)}% p.a.
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {product.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    <DollarSign className="mr-1 h-3 w-3" />
                    Min Investment
                  </div>
                  <div className="font-semibold">
                    ₦{(product.min_investment / 100).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    <Clock className="mr-1 h-3 w-3" />
                    Liquidity
                  </div>
                  <div className="font-semibold">
                    {product.liquidity_period === 0 ? 'Instant' : `${product.liquidity_period} days`}
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Expected Return
                  </div>
                  <div className="font-semibold text-green-600">
                    {(product.expected_return_rate * 100).toFixed(1)}%
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    <Shield className="mr-1 h-3 w-3" />
                    Risk Level
                  </div>
                  <div className="font-semibold">
                    {product.risk_level}/10
                  </div>
                </div>
              </div>

              {(product.management_fee > 0 || product.performance_fee > 0) && (
                <div className="p-3 bg-muted rounded-lg text-xs">
                  <div className="font-medium mb-1">Fees:</div>
                  {product.management_fee > 0 && (
                    <div>Management: {(product.management_fee * 100).toFixed(2)}% p.a.</div>
                  )}
                  {product.performance_fee > 0 && (
                    <div>Performance: {(product.performance_fee * 100).toFixed(2)}%</div>
                  )}
                </div>
              )}

              {/* Return Calculator */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs font-medium mb-2">Quick Calculator</div>
                <div className="text-xs">
                  ₦100,000 for 30 days = ~₦{calculateReturns(100000, product.expected_return_rate, 30).toLocaleString()} returns
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => onInvest(product.id, product.min_investment / 100)}
              >
                Invest Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more investment options.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comparison Modal */}
      {showComparison && compareList.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle>Product Comparison</CardTitle>
              <Button
                className="absolute top-4 right-4"
                variant="ghost"
                size="sm"
                onClick={() => setShowComparison(false)}
              >
                ×
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Feature</th>
                      {compareList.map(id => {
                        const product = products.find(p => p.id === id);
                        return (
                          <th key={id} className="text-left p-2 min-w-[200px]">
                            {product?.name}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Expected Return</td>
                      {compareList.map(id => {
                        const product = products.find(p => p.id === id);
                        return (
                          <td key={id} className="p-2 text-green-600 font-semibold">
                            {(product!.expected_return_rate * 100).toFixed(1)}% p.a.
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Risk Level</td>
                      {compareList.map(id => {
                        const product = products.find(p => p.id === id);
                        return (
                          <td key={id} className="p-2">
                            <Badge className={riskColors[product!.risk_level as keyof typeof riskColors]}>
                              {getRiskLabel(product!.risk_level)}
                            </Badge>
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Min Investment</td>
                      {compareList.map(id => {
                        const product = products.find(p => p.id === id);
                        return (
                          <td key={id} className="p-2">
                            ₦{(product!.min_investment / 100).toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Liquidity Period</td>
                      {compareList.map(id => {
                        const product = products.find(p => p.id === id);
                        return (
                          <td key={id} className="p-2">
                            {product!.liquidity_period === 0 ? 'Instant' : `${product!.liquidity_period} days`}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Actions</td>
                      {compareList.map(id => {
                        const product = products.find(p => p.id === id);
                        return (
                          <td key={id} className="p-2">
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setShowComparison(false);
                                onInvest(id, product!.min_investment / 100);
                              }}
                            >
                              Invest Now
                            </Button>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}