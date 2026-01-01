import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { wealthService } from '@/lib/wealth-service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createInvestmentSchema = z.object({
  productId: z.string().uuid(),
  amount: z.number().min(1000),
  duration: z.string().optional(),
  pin: z.string().length(4),
  clientReference: z.string()
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    switch (type) {
      case 'portfolios':
        const portfolios = await wealthService.getUserPortfolios(userId);
        return NextResponse.json(portfolios);

      case 'summary':
        const summary = await wealthService.getPortfolioSummary(userId);
        return NextResponse.json(summary);

      case 'products':
        const category = url.searchParams.get('category') || undefined;
        const products = await wealthService.getInvestmentProducts(category);
        return NextResponse.json(products);

      case 'risk-profile':
        const riskProfile = await wealthService.getRiskProfile(userId);
        return NextResponse.json(riskProfile);

      case 'goals':
        const goals = await wealthService.getUserWealthGoals(userId);
        return NextResponse.json(goals);

      case 'recommendations':
        const recommendations = await wealthService.generateRecommendations(userId);
        return NextResponse.json(recommendations);

      default:
        // Default to portfolios for backward compatibility
        const userPortfolios = await wealthService.getUserPortfolios(userId);
        return NextResponse.json(userPortfolios);
    }
  } catch (error) {
    logger.error('Wealth API GET error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'create-investment':
        return await handleCreateInvestment(userId, body);
      
      case 'create-risk-profile':
        return await handleCreateRiskProfile(userId, body);
      
      case 'create-goal':
        return await handleCreateGoal(userId, body);
      
      case 'generate-tax-report':
        return await handleGenerateTaxReport(userId, body);
      
      case 'withdraw':
        return await handleWithdraw(userId, body);
      
      default:
        // Default to create investment for backward compatibility
        return await handleCreateInvestment(userId, body);
    }
  } catch (error) {
    logger.error('Wealth API POST error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCreateInvestment(userId: string, body: any) {
  try {
    const validatedData = createInvestmentSchema.parse(body);
    
    // Verify PIN (simplified - in production, use proper PIN verification)
    if (!validatedData.pin || validatedData.pin.length !== 4) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 400 }
      );
    }

    // Convert amount to kobo
    const amountInKobo = validatedData.amount * 100;

    // Create investment
    const result = await wealthService.createInvestment(
      userId,
      validatedData.productId,
      amountInKobo,
      validatedData.clientReference
    );

    // Mock balance update (in production, integrate with wallet service)
    const newBalanceInKobo = 500000000; // Mock balance

    logger.info('Investment created successfully', {
      userId,
      productId: validatedData.productId,
      amount: amountInKobo,
      portfolioId: result.portfolio.id
    });

    return NextResponse.json({
      success: true,
      portfolio: result.portfolio,
      transaction: result.transaction,
      newBalanceInKobo
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to create investment', { userId, error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create investment' },
      { status: 500 }
    );
  }
}

async function handleCreateRiskProfile(userId: string, body: any) {
  try {
    const riskProfileSchema = z.object({
      risk_tolerance: z.enum(['conservative', 'moderate', 'aggressive']),
      investment_experience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
      investment_horizon: z.number().min(1).max(50),
      income_stability: z.enum(['stable', 'variable', 'irregular']),
      age_group: z.string(),
      financial_goals: z.array(z.string()),
      risk_score: z.number().min(1).max(100)
    });

    const validatedData = riskProfileSchema.parse(body);
    const riskProfile = await wealthService.createRiskProfile(userId, validatedData);

    return NextResponse.json({
      success: true,
      riskProfile
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid risk profile data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to create risk profile', { userId, error });
    return NextResponse.json(
      { error: 'Failed to create risk profile' },
      { status: 500 }
    );
  }
}

async function handleCreateGoal(userId: string, body: any) {
  try {
    const goalSchema = z.object({
      goal_name: z.string().min(1),
      goal_type: z.enum(['retirement', 'education', 'house', 'emergency', 'vacation', 'business', 'other']),
      target_amount: z.number().min(1000),
      target_date: z.string(),
      monthly_contribution: z.number().min(0),
      risk_tolerance: z.enum(['conservative', 'moderate', 'aggressive'])
    });

    const validatedData = goalSchema.parse(body);
    
    // Convert amount to kobo
    const goalData = {
      ...validatedData,
      target_amount: validatedData.target_amount * 100,
      monthly_contribution: validatedData.monthly_contribution * 100,
      current_amount: 0,
      status: 'active' as const
    };

    const goal = await wealthService.createWealthGoal(userId, goalData);

    return NextResponse.json({
      success: true,
      goal
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid goal data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to create wealth goal', { userId, error });
    return NextResponse.json(
      { error: 'Failed to create wealth goal' },
      { status: 500 }
    );
  }
}

async function handleGenerateTaxReport(userId: string, body: any) {
  try {
    const taxReportSchema = z.object({
      tax_year: z.number().min(2020).max(new Date().getFullYear())
    });

    const validatedData = taxReportSchema.parse(body);
    const taxReport = await wealthService.generateTaxReport(userId, validatedData.tax_year);

    return NextResponse.json({
      success: true,
      taxReport
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid tax report data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to generate tax report', { userId, error });
    return NextResponse.json(
      { error: 'Failed to generate tax report' },
      { status: 500 }
    );
  }
}

async function handleWithdraw(userId: string, body: any) {
  try {
    const withdrawSchema = z.object({
      portfolioId: z.string().uuid(),
      amount: z.number().min(1),
      pin: z.string().length(4),
      clientReference: z.string()
    });

    const validatedData = withdrawSchema.parse(body);
    
    if (!validatedData.pin || validatedData.pin.length !== 4) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 400 }
      );
    }

    const amountInKobo = validatedData.amount * 100;

    const result = await wealthService.processWithdrawal(
      userId,
      validatedData.portfolioId,
      amountInKobo,
      validatedData.clientReference
    );

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      newWalletBalance: result.newWalletBalance
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid withdrawal data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to process withdrawal', { userId, error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}