import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { wealthService } from '@/lib/wealth-service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const taxReportSchema = z.object({
  tax_year: z.number().min(2020).max(new Date().getFullYear()),
  include_projections: z.boolean().optional().default(false)
});

const taxOptimizationSchema = z.object({
  strategy: z.enum(['harvest_losses', 'defer_gains', 'rebalance_accounts', 'charitable_giving']),
  amount: z.number().min(0).optional(),
  target_date: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request.headers);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const taxYear = url.searchParams.get('tax_year');

    switch (action) {
      case 'current-year-summary':
        const currentYear = new Date().getFullYear();
        const summary = await generateTaxSummary(userId, currentYear);
        return NextResponse.json(summary);

      case 'tax-report':
        if (!taxYear) {
          return NextResponse.json({ error: 'Tax year required' }, { status: 400 });
        }
        const report = await wealthService.generateTaxReport(userId, parseInt(taxYear));
        return NextResponse.json(report);

      case 'optimization-opportunities':
        const opportunities = await generateOptimizationOpportunities(userId);
        return NextResponse.json(opportunities);

      case 'tax-documents':
        const documents = await getTaxDocuments(userId, taxYear ? parseInt(taxYear) : new Date().getFullYear());
        return NextResponse.json(documents);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Tax optimization API error', { error });
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
      case 'generate-report':
        return await handleGenerateReport(userId, body);
      
      case 'apply-optimization':
        return await handleApplyOptimization(userId, body);
      
      case 'schedule-tax-strategy':
        return await handleScheduleTaxStrategy(userId, body);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Tax optimization POST error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGenerateReport(userId: string, body: any) {
  try {
    const validatedData = taxReportSchema.parse(body);
    const report = await wealthService.generateTaxReport(userId, validatedData.tax_year);
    
    // Generate additional insights if projections requested
    if (validatedData.include_projections) {
      const projections = await generateTaxProjections(userId, validatedData.tax_year);
      report.projections = projections;
    }

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}

async function handleApplyOptimization(userId: string, body: any) {
  try {
    const validatedData = taxOptimizationSchema.parse(body);
    
    // Apply the optimization strategy
    const result = await applyTaxOptimization(userId, validatedData);
    
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid optimization data', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}

async function handleScheduleTaxStrategy(userId: string, body: any) {
  try {
    const { strategy, execution_date, parameters } = body;
    
    // Schedule the tax strategy for future execution
    const scheduledStrategy = await scheduleTaxStrategy(userId, {
      strategy,
      execution_date,
      parameters
    });
    
    return NextResponse.json({
      success: true,
      scheduled_strategy: scheduledStrategy
    });
  } catch (error) {
    throw error;
  }
}

// Helper functions
async function generateTaxSummary(userId: string, taxYear: number) {
  // Mock implementation - in production, integrate with actual tax calculation service
  return {
    tax_year: taxYear,
    total_investment_income: 2500000, // in kobo
    capital_gains: 1800000,
    capital_losses: 200000,
    dividend_income: 900000,
    interest_income: 0,
    tax_withheld: 375000, // 15% withholding tax
    estimated_tax_liability: 375000,
    potential_savings: 125000,
    optimization_opportunities: [
      {
        strategy: 'harvest_losses',
        potential_savings: 75000,
        description: 'Realize capital losses to offset gains'
      },
      {
        strategy: 'defer_gains',
        potential_savings: 50000,
        description: 'Defer capital gains to next tax year'
      }
    ]
  };
}

async function generateOptimizationOpportunities(userId: string) {
  // Mock implementation - in production, analyze user's portfolio for optimization opportunities
  return [
    {
      id: 'loss-harvesting',
      title: 'Tax-Loss Harvesting',
      description: 'Sell underperforming investments to offset capital gains',
      potential_savings: 125000, // in kobo
      risk_level: 'low',
      implementation_complexity: 'medium',
      deadline: '2024-12-31',
      requirements: [
        'Have capital gains to offset',
        'Hold investments for more than 30 days',
        'Maintain portfolio allocation'
      ]
    },
    {
      id: 'retirement-contribution',
      title: 'Maximize Retirement Contributions',
      description: 'Increase contributions to tax-advantaged retirement accounts',
      potential_savings: 200000,
      risk_level: 'low',
      implementation_complexity: 'low',
      deadline: '2024-12-31',
      requirements: [
        'Have earned income',
        'Below contribution limits',
        'Sufficient cash flow'
      ]
    },
    {
      id: 'asset-location',
      title: 'Optimize Asset Location',
      description: 'Place tax-inefficient investments in tax-advantaged accounts',
      potential_savings: 150000,
      risk_level: 'low',
      implementation_complexity: 'high',
      deadline: null,
      requirements: [
        'Multiple account types',
        'Diversified portfolio',
        'Long-term investment horizon'
      ]
    }
  ];
}

async function getTaxDocuments(userId: string, taxYear: number) {
  // Mock implementation - in production, generate actual tax documents
  return [
    {
      document_type: 'investment_summary',
      title: `${taxYear} Investment Summary`,
      description: 'Summary of all investment activities for the tax year',
      file_url: `/api/tax/documents/${userId}/investment-summary-${taxYear}.pdf`,
      generated_at: new Date().toISOString()
    },
    {
      document_type: 'capital_gains_report',
      title: `${taxYear} Capital Gains Report`,
      description: 'Detailed report of all capital gains and losses',
      file_url: `/api/tax/documents/${userId}/capital-gains-${taxYear}.pdf`,
      generated_at: new Date().toISOString()
    },
    {
      document_type: 'dividend_statement',
      title: `${taxYear} Dividend Statement`,
      description: 'Statement of all dividend income received',
      file_url: `/api/tax/documents/${userId}/dividends-${taxYear}.pdf`,
      generated_at: new Date().toISOString()
    }
  ];
}

async function generateTaxProjections(userId: string, taxYear: number) {
  // Mock implementation - in production, use sophisticated tax modeling
  return {
    projected_tax_liability: 450000, // in kobo
    confidence_level: 0.85,
    assumptions: [
      'Current tax rates remain unchanged',
      'No major changes in investment strategy',
      'Estimated income based on current trends'
    ],
    scenarios: [
      {
        name: 'Conservative',
        tax_liability: 400000,
        probability: 0.3
      },
      {
        name: 'Most Likely',
        tax_liability: 450000,
        probability: 0.5
      },
      {
        name: 'Aggressive',
        tax_liability: 500000,
        probability: 0.2
      }
    ]
  };
}

async function applyTaxOptimization(userId: string, optimization: any) {
  // Mock implementation - in production, execute actual optimization strategies
  const { strategy, amount, target_date } = optimization;
  
  switch (strategy) {
    case 'harvest_losses':
      return {
        strategy: 'harvest_losses',
        executed_at: new Date().toISOString(),
        amount_realized: amount || 500000,
        tax_savings: (amount || 500000) * 0.15, // 15% tax rate
        affected_positions: [
          { symbol: 'STOCK-A', amount: 200000, loss: 50000 },
          { symbol: 'STOCK-B', amount: 300000, loss: 75000 }
        ]
      };
      
    case 'defer_gains':
      return {
        strategy: 'defer_gains',
        executed_at: new Date().toISOString(),
        deferred_amount: amount || 1000000,
        tax_deferred: (amount || 1000000) * 0.15,
        new_realization_date: target_date || '2025-01-15'
      };
      
    default:
      throw new Error('Unsupported optimization strategy');
  }
}

async function scheduleTaxStrategy(userId: string, strategy: any) {
  // Mock implementation - in production, integrate with job scheduler
  return {
    id: `strategy-${crypto.randomUUID()}`,
    user_id: userId,
    strategy: strategy.strategy,
    execution_date: strategy.execution_date,
    parameters: strategy.parameters,
    status: 'scheduled',
    created_at: new Date().toISOString()
  };
}