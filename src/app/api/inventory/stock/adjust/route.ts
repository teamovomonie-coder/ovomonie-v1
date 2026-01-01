import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { inventoryService } from '@/lib/inventory-service';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers) || 'dev-user-fallback';

    const body = await request.json();
    const { product_id, location_id, adjustment, notes, productId, locationId, newStock, reason } = body;

    // Handle both old and new parameter formats
    const finalProductId = product_id || productId;
    const finalLocationId = location_id || locationId;
    const finalAdjustment = adjustment !== undefined ? adjustment : (newStock !== undefined ? newStock : 0);

    if (!finalProductId || !finalLocationId || finalAdjustment === undefined) {
      return NextResponse.json({ error: 'Product ID, location ID, and adjustment are required' }, { status: 400 });
    }

    // Get current stock to calculate the difference
    const currentStock = await inventoryService.getProductStock(finalProductId, finalLocationId);
    const stockDifference = finalAdjustment - (currentStock || 0);

    const success = await inventoryService.adjustStock(
      finalProductId,
      finalLocationId,
      finalAdjustment,
      userId,
      notes || reason
    );

    if (!success) {
      return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
    }

    // Update product total stock count
    await inventoryService.updateProductTotalStock(finalProductId);

    // If stock is being added, update supplier stock count
    if (stockDifference > 0) {
      await inventoryService.updateSupplierStockCount(finalProductId, stockDifference);
    }

    return NextResponse.json({ success: true, message: 'Stock adjusted successfully' });
  } catch (error) {
    console.error('Stock adjust error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}