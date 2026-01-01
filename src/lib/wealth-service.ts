import { createClient } from '@supabase/supabase-js';
import { serverEnv } from './env.server';
import { logger } from './logger';

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
  is_active: boolean;
  description?: string;
  terms_conditions?: string;
}

interface Portfolio {
  id: string;
  user_id: string;
  product_id: string;
  principal_amount: number;
  current_value: number;
  units: number;
  purchase_price: number;
  current_price: number;
  status: 'active' | 'matured' | 'liquidated' | 'suspended';
  investment_date: string;
  maturity_date?: string;
  total_dividends: number;
  auto_reinvest: boolean;
}

interface RiskProfile {
  user_id: string;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  investment_experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  investment_horizon: number;
  income_stability: 'stable' | 'variable' | 'irregular';
  age_group: string;
  financial_goals: string[];
  risk_score: number;
}

interface WealthGoal {
  id: string;
  user_id: string;
  goal_name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution: number;
  risk_tolerance: string;
  status: 'active' | 'achieved' | 'paused' | 'cancelled';
}

interface RoboRecommendation {
  id: string;
  user_id: string;
  recommendation_type: string;
  current_allocation: any;
  recommended_allocation: any;
  reasoning: string;
  expected_improvement: number;
  implementation_cost: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
}

export class WealthManagementService {
  private supabase;

  constructor() {
    if (!serverEnv.NEXT_PUBLIC_SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }
    
    this.supabase = createClient(
      serverEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Investment Products Management
  async getInvestmentProducts(category?: string): Promise<InvestmentProduct[]> {
    try {
      let query = this.supabase
        .from('investment_products')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('risk_level', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch investment products', { error });
      throw new Error('Failed to fetch investment products');
    }
  }

  async getProductById(productId: string): Promise<InvestmentProduct | null> {
    try {
      const { data, error } = await this.supabase
        .from('investment_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        // If product not found, try to seed default products
        if (error.code === 'PGRST116') {
          await this.seedDefaultProducts();
          // Try again after seeding
          const { data: retryData, error: retryError } = await this.supabase
            .from('investment_products')
            .select('*')
            .eq('id', productId)
            .single();
          
          if (retryError) throw retryError;
          return retryData;
        }
        throw error;
      }
      return data;
    } catch (error) {
      logger.error('Failed to fetch product', { productId, error });
      return null;
    }
  }

  // Portfolio Management
  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    try {
      const { data, error } = await this.supabase
        .from('investment_portfolios')
        .select(`
          *,
          investment_products (
            name,
            type,
            category,
            expected_return_rate,
            risk_level
          )
        `)
        .eq('user_id', userId)
        .order('investment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch user portfolios', { userId, error });
      throw new Error('Failed to fetch portfolios');
    }
  }

  async createInvestment(
    userId: string,
    productId: string,
    amount: number,
    reference: string
  ): Promise<{ portfolio: Portfolio; transaction: any }> {
    try {
      // Get product details
      const product = await this.getProductById(productId);
      if (!product) throw new Error('Investment product not found');

      if (amount < product.min_investment) {
        throw new Error(`Minimum investment is ₦${(product.min_investment / 100).toLocaleString()}`);
      }

      if (product.max_investment && amount > product.max_investment) {
        throw new Error(`Maximum investment is ₦${(product.max_investment / 100).toLocaleString()}`);
      }

      // Calculate units and maturity date
      const units = amount / 100; // Simple unit calculation
      const maturityDate = product.liquidity_period > 0 
        ? new Date(Date.now() + product.liquidity_period * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Create portfolio entry
      const { data: portfolio, error: portfolioError } = await this.supabase
        .from('investment_portfolios')
        .insert({
          user_id: userId,
          product_id: productId,
          principal_amount: amount,
          current_value: amount,
          units,
          purchase_price: 100, // Price per unit in kobo
          current_price: 100,
          maturity_date: maturityDate,
          status: 'active'
        })
        .select()
        .single();

      if (portfolioError) throw portfolioError;

      // Create transaction record
      const { data: transaction, error: transactionError } = await this.supabase
        .from('investment_transactions')
        .insert({
          user_id: userId,
          portfolio_id: portfolio.id,
          product_id: productId,
          transaction_type: 'buy',
          amount,
          units,
          price_per_unit: 100,
          reference,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      logger.info('Investment created successfully', {
        userId,
        productId,
        amount,
        portfolioId: portfolio.id
      });

      return { portfolio, transaction };
    } catch (error) {
      logger.error('Failed to create investment', { userId, productId, amount, error });
      throw error;
    }
  }

  // Risk Assessment
  async createRiskProfile(userId: string, assessment: Omit<RiskProfile, 'user_id'>): Promise<RiskProfile> {
    try {
      const { data, error } = await this.supabase
        .from('risk_profiles')
        .upsert({
          user_id: userId,
          ...assessment,
          assessment_date: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Risk profile created/updated', { userId, riskScore: assessment.risk_score });
      return data;
    } catch (error) {
      logger.error('Failed to create risk profile', { userId, error });
      throw new Error('Failed to create risk profile');
    }
  }

  async getRiskProfile(userId: string): Promise<RiskProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('risk_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch risk profile', { userId, error });
      return null;
    }
  }

  // Wealth Goals Management
  async createWealthGoal(userId: string, goal: Omit<WealthGoal, 'id' | 'user_id'>): Promise<WealthGoal> {
    try {
      const { data, error } = await this.supabase
        .from('wealth_goals')
        .insert({
          user_id: userId,
          ...goal
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Wealth goal created', { userId, goalName: goal.goal_name });
      return data;
    } catch (error) {
      logger.error('Failed to create wealth goal', { userId, error });
      throw new Error('Failed to create wealth goal');
    }
  }

  async getUserWealthGoals(userId: string): Promise<WealthGoal[]> {
    try {
      const { data, error } = await this.supabase
        .from('wealth_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch wealth goals', { userId, error });
      throw new Error('Failed to fetch wealth goals');
    }
  }

  // Portfolio Analytics
  async getPortfolioSummary(userId: string): Promise<{
    totalInvestment: number;
    currentValue: number;
    totalReturns: number;
    returnPercentage: number;
    portfolioCount: number;
  }> {
    try {
      const portfolios = await this.getUserPortfolios(userId);
      
      const summary = portfolios.reduce((acc, portfolio) => {
        acc.totalInvestment += portfolio.principal_amount;
        acc.currentValue += portfolio.current_value;
        acc.portfolioCount += 1;
        return acc;
      }, {
        totalInvestment: 0,
        currentValue: 0,
        totalReturns: 0,
        returnPercentage: 0,
        portfolioCount: 0
      });

      summary.totalReturns = summary.currentValue - summary.totalInvestment;
      summary.returnPercentage = summary.totalInvestment > 0 
        ? (summary.totalReturns / summary.totalInvestment) * 100 
        : 0;

      return summary;
    } catch (error) {
      logger.error('Failed to calculate portfolio summary', { userId, error });
      throw new Error('Failed to calculate portfolio summary');
    }
  }

  // Robo-Advisor Recommendations
  async generateRecommendations(userId: string): Promise<RoboRecommendation[]> {
    try {
      const [riskProfile, portfolios, goals] = await Promise.all([
        this.getRiskProfile(userId),
        this.getUserPortfolios(userId),
        this.getUserWealthGoals(userId)
      ]);

      const recommendations: Omit<RoboRecommendation, 'id'>[] = [];

      // Portfolio rebalancing recommendation
      if (portfolios.length > 0 && riskProfile) {
        const currentAllocation = this.calculateCurrentAllocation(portfolios);
        const recommendedAllocation = this.getRecommendedAllocation(riskProfile);
        
        if (this.needsRebalancing(currentAllocation, recommendedAllocation)) {
          recommendations.push({
            user_id: userId,
            recommendation_type: 'rebalancing',
            current_allocation: currentAllocation,
            recommended_allocation: recommendedAllocation,
            reasoning: 'Your portfolio allocation has drifted from your risk profile. Rebalancing will optimize your risk-return profile.',
            expected_improvement: 0.02, // 2% expected improvement
            implementation_cost: 0,
            priority: 'medium',
            status: 'pending'
          });
        }
      }

      // Goal-based recommendations
      for (const goal of goals) {
        if (goal.status === 'active') {
          const monthsToGoal = Math.ceil(
            (new Date(goal.target_date).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)
          );
          
          const requiredMonthlyContribution = Math.ceil(
            (goal.target_amount - goal.current_amount) / monthsToGoal
          );

          if (requiredMonthlyContribution > goal.monthly_contribution * 1.1) {
            recommendations.push({
              user_id: userId,
              recommendation_type: 'goal_adjustment',
              current_allocation: { monthly_contribution: goal.monthly_contribution },
              recommended_allocation: { monthly_contribution: requiredMonthlyContribution },
              reasoning: `To achieve your ${goal.goal_name} goal, consider increasing your monthly contribution.`,
              expected_improvement: 0,
              implementation_cost: 0,
              priority: 'high',
              status: 'pending'
            });
          }
        }
      }

      // Save recommendations to database
      if (recommendations.length > 0) {
        const { data, error } = await this.supabase
          .from('robo_recommendations')
          .insert(recommendations)
          .select();

        if (error) throw error;
        return data || [];
      }

      return [];
    } catch (error) {
      logger.error('Failed to generate recommendations', { userId, error });
      throw new Error('Failed to generate recommendations');
    }
  }

  // Market Data Integration
  async updateMarketData(): Promise<void> {
    try {
      // This would integrate with real market data APIs
      const mockMarketData = [
        { symbol: 'NGN-BONDS', name: 'Nigerian Government Bonds', current_price: 100.50, change_24h: 0.005 },
        { symbol: 'NGX-INDEX', name: 'Nigerian Stock Exchange Index', current_price: 52000, change_24h: 0.012 },
        { symbol: 'BTC-NGN', name: 'Bitcoin to Naira', current_price: 45000000, change_24h: -0.025 },
        { symbol: 'USD-NGN', name: 'US Dollar to Naira', current_price: 82500, change_24h: 0.001 }
      ];

      const { error } = await this.supabase
        .from('market_data')
        .upsert(mockMarketData.map(data => ({
          ...data,
          last_updated: new Date().toISOString()
        })));

      if (error) throw error;

      logger.info('Market data updated successfully');
    } catch (error) {
      logger.error('Failed to update market data', { error });
    }
  }

  // Tax Optimization
  async generateTaxReport(userId: string, taxYear: number): Promise<any> {
    try {
      const { data: transactions, error } = await this.supabase
        .from('investment_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', `${taxYear}-01-01`)
        .lt('created_at', `${taxYear + 1}-01-01`)
        .eq('status', 'completed');

      if (error) throw error;

      const taxSummary = transactions.reduce((acc: any, transaction: any) => {
        if (transaction.transaction_type === 'sell') {
          // Calculate capital gains/losses
          const gain = transaction.amount - (transaction.units * transaction.price_per_unit);
          if (gain > 0) {
            acc.total_gains += gain;
          } else {
            acc.total_losses += Math.abs(gain);
          }
        } else if (transaction.transaction_type === 'dividend') {
          acc.dividend_income += transaction.amount;
        }
        return acc;
      }, {
        total_gains: 0,
        total_losses: 0,
        dividend_income: 0,
        tax_withheld: 0,
        tax_optimization_savings: 0
      });

      // Upsert tax record
      const { data, error: taxError } = await this.supabase
        .from('tax_records')
        .upsert({
          user_id: userId,
          tax_year: taxYear,
          ...taxSummary,
          status: 'draft'
        })
        .select()
        .single();

      if (taxError) throw taxError;

      logger.info('Tax report generated', { userId, taxYear });
      return data;
    } catch (error) {
      logger.error('Failed to generate tax report', { userId, taxYear, error });
      throw new Error('Failed to generate tax report');
    }
  }

  // Helper methods
  private calculateCurrentAllocation(portfolios: Portfolio[]): any {
    const totalValue = portfolios.reduce((sum, p) => sum + p.current_value, 0);
    const allocation: any = {};

    portfolios.forEach(portfolio => {
      const productType = (portfolio as any).investment_products?.type || 'unknown';
      allocation[productType] = (allocation[productType] || 0) + (portfolio.current_value / totalValue);
    });

    return allocation;
  }

  private getRecommendedAllocation(riskProfile: RiskProfile): any {
    const allocations = {
      conservative: { bonds: 0.6, fixed_deposit: 0.3, stocks: 0.1 },
      moderate: { bonds: 0.4, stocks: 0.4, real_estate: 0.2 },
      aggressive: { stocks: 0.6, crypto: 0.2, real_estate: 0.2 }
    };

    return allocations[riskProfile.risk_tolerance] || allocations.moderate;
  }

  private needsRebalancing(current: any, recommended: any): boolean {
    const threshold = 0.05; // 5% threshold
    
    for (const [asset, targetWeight] of Object.entries(recommended)) {
      const currentWeight = current[asset] || 0;
      if (Math.abs(currentWeight - (targetWeight as number)) > threshold) {
        return true;
      }
    }
    
    return false;
  }

  // Seed default investment products
  private async seedDefaultProducts(): Promise<void> {
    try {
      const defaultProducts = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Ovo Save',
          type: 'fixed_deposit',
          category: 'conservative',
          min_investment: 100000,
          expected_return_rate: 0.10,
          risk_level: 3,
          liquidity_period: 0,
          management_fee: 0.005,
          performance_fee: 0,
          is_active: true,
          description: 'Flexible savings with daily interest'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Ovo Target',
          type: 'fixed_deposit',
          category: 'moderate',
          min_investment: 500000,
          expected_return_rate: 0.12,
          risk_level: 4,
          liquidity_period: 90,
          management_fee: 0.005,
          performance_fee: 0,
          is_active: true,
          description: 'Goal-based savings plan'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Ovo Lock',
          type: 'fixed_deposit',
          category: 'moderate',
          min_investment: 1000000,
          expected_return_rate: 0.15,
          risk_level: 5,
          liquidity_period: 180,
          management_fee: 0.005,
          performance_fee: 0,
          is_active: true,
          description: 'Fixed deposit with guaranteed returns'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Ovo Boost',
          type: 'mutual_fund',
          category: 'aggressive',
          min_investment: 2500000,
          max_investment: 100000000,
          expected_return_rate: 0.18,
          risk_level: 7,
          liquidity_period: 365,
          management_fee: 0.01,
          performance_fee: 0.05,
          is_active: true,
          description: 'High-yield investment plan'
        }
      ];

      const { error } = await this.supabase
        .from('investment_products')
        .upsert(defaultProducts);

      if (error) throw error;
      logger.info('Default investment products seeded successfully');
    } catch (error) {
      logger.error('Failed to seed default products', { error });
    }
  }

  // Process withdrawal from portfolio
  async processWithdrawal(
    userId: string,
    portfolioId: string,
    amount: number,
    reference: string
  ): Promise<{ transaction: any; newWalletBalance: number }> {
    try {
      // Get portfolio details
      const { data: portfolio, error: portfolioError } = await this.supabase
        .from('investment_portfolios')
        .select('*')
        .eq('id', portfolioId)
        .eq('user_id', userId)
        .single();

      if (portfolioError || !portfolio) {
        throw new Error('Portfolio not found');
      }

      if (portfolio.status !== 'active') {
        throw new Error('Portfolio is not active');
      }

      if (amount > portfolio.current_value) {
        throw new Error('Insufficient portfolio balance');
      }

      // Update portfolio value
      const newPortfolioValue = portfolio.current_value - amount;
      const { error: updateError } = await this.supabase
        .from('investment_portfolios')
        .update({
          current_value: newPortfolioValue,
          status: newPortfolioValue === 0 ? 'liquidated' : 'active'
        })
        .eq('id', portfolioId);

      if (updateError) throw updateError;

      // Create withdrawal transaction
      const { data: transaction, error: transactionError } = await this.supabase
        .from('investment_transactions')
        .insert({
          user_id: userId,
          portfolio_id: portfolioId,
          product_id: portfolio.product_id,
          transaction_type: 'sell',
          amount: -amount,
          units: 0,
          price_per_unit: 0,
          reference,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      const newWalletBalance = 500000000 + amount;

      return { transaction, newWalletBalance };
    } catch (error) {
      logger.error('Failed to process withdrawal', { userId, portfolioId, amount, error });
      throw error;
    }
  }
}

export const wealthService = new WealthManagementService();