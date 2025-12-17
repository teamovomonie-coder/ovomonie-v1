import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request.headers);
  
  return NextResponse.json({
    userId,
    hasAuth: !!userId,
    headers: {
      authorization: request.headers.get('authorization'),
      cookie: request.headers.get('cookie')
    }
  });
}