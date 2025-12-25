import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/lib/inventory-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    const transactions = await inventoryService.getTransactions(1000);
    const salesTransactions = transactions.filter(t => t.transaction_type === 'sale');
    
    // Calculate daily sales for the last N days
    const dailySales = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySales = salesTransactions
        .filter(t => t.created_at?.startsWith(dateStr))
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);
      
      dailySales.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: daySales
      });
    }
    
    // Calculate today's total
    const todayStr = today.toISOString().split('T')[0];
    const todayTotal = salesTransactions
      .filter(t => t.created_at?.startsWith(todayStr))
      .reduce((sum, t) => sum + (t.total_amount || 0), 0);
    
    return NextResponse.json({
      success: true,
      data: {
        dailySales,
        todayTotal
      }
    });
  } catch (error) {
    console.error('Sales GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}