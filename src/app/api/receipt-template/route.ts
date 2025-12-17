import { NextResponse, type NextRequest } from 'next/server';
import { receiptTemplateService } from '@/lib/receipt-templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'generic';

    const template = await receiptTemplateService.getTemplate(category);
    return NextResponse.json(template);
  } catch (error) {
    console.error('[Receipt Template API] Error:', error);
    return NextResponse.json({
      id: 'generic-default',
      category: 'generic',
      template_name: 'Bill Payment Receipt',
      fields: [],
      color_scheme: { primary: '#6366f1', secondary: '#818cf8', accent: '#e0e7ff' },
      icon: 'receipt',
    });
  }
}
