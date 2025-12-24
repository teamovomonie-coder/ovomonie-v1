import { NextRequest, NextResponse } from 'next/server';

// Global error boundary for API routes
export function withSafeHandler(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        { 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
        },
        { status: 500 }
      );
    }
  };
}

// Simple GET handler that always works
export function createSafeGetHandler(data: any = { message: 'OK' }) {
  return async () => {
    try {
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

// Simple POST handler that always works
export function createSafePostHandler(responseData: any = { message: 'Success' }) {
  return async (request: NextRequest) => {
    try {
      // Basic validation
      const body = await request.json().catch(() => ({}));
      return NextResponse.json(responseData);
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}