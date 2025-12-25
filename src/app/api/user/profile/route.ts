import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, username, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Supabase error fetching profile:', error);
      return NextResponse.json({ message: 'Failed to fetch profile' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        fullName: '',
        email: '',
        phoneNumber: '',
        username: '',
        avatarUrl: ''
      });
    }

    return NextResponse.json({
      fullName: data.full_name || '',
      email: data.email || '',
      phoneNumber: data.phone || '',
      username: data.username || '',
      avatarUrl: data.avatar_url || ''
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    logger.error('Error fetching profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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

    const { data, error } = await supabase
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
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}