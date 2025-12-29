import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Database not available' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, phone, username, avatar_url, address')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Supabase error fetching profile:', error);
      return NextResponse.json({ message: 'Failed to fetch profile' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        full_name: '',
        email: '',
        phone: '',
        username: '',
        avatar_url: '',
        address: ''
      });
    }

    return NextResponse.json({
      full_name: data.full_name || '',
      name: data.full_name || '',
      email: data.email || '',
      phone: data.phone || '',
      username: data.username || '',
      avatar_url: data.avatar_url || '',
      address: data.address || ''
    });
  } catch (error) {
    logger.error('Error fetching profile:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const reqHeaders = request.headers as { get(name: string): string | null };
    const userId = getUserIdFromToken(reqHeaders);
    
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const { username, avatarUrl } = body;

    const updateData: any = {};
    if (username) updateData.username = username;
    if (avatarUrl) updateData.avatar_url = avatarUrl;
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Supabase error updating profile:', error);
      return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    logger.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}