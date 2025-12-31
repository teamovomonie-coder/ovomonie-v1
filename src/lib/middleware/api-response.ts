import { NextResponse } from 'next/server';

export function apiSuccess(data: any, status: number = 200) {
  return NextResponse.json({ 
    ok: true, 
    ...data 
  }, { status });
}

export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ 
    ok: false, 
    error: message 
  }, { status });
}

export function apiUnauthorized(message: string = 'Unauthorized') {
  return NextResponse.json({ 
    ok: false, 
    error: message 
  }, { status: 401 });
}