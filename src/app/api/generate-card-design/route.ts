import { NextRequest, NextResponse } from 'next/server';
import { generateCardDesign } from '@/ai/flows/generate-card-design-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt provided' },
        { status: 400 }
      );
    }

    const result = await generateCardDesign({ prompt });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Card design generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate card design' },
      { status: 500 }
    );
  }
}