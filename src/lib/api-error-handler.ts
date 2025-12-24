import { NextRequest, NextResponse } from 'next/server';

export function createErrorHandler() {
  return (error: any, request?: NextRequest) => {
    console.error('API Error:', error);
    
    // Return a safe error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  };
}

export const handleApiError = createErrorHandler();