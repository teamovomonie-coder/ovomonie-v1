import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Initialize Supabase client (primary)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body to extract user ID
    const body = await request.json();
    const { fullName, email, phone, userId, avatarUrl, username } = body;

    // Validate input
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    if (!fullName && !email && !phone && !avatarUrl && !username) {
      return NextResponse.json({ message: 'At least one field must be provided' }, { status: 400 });
    }

    logger.info('Profile update authorized for user:', userId);

    // Update user document in Supabase
    const updateData: Record<string, any> = {};

    if (fullName) updateData.full_name = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (avatarUrl) updateData.avatar_url = avatarUrl;
    if (username) updateData.username = username;
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

    logger.info('Profile updated successfully for user:', userId);

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      updated: Object.keys(updateData)
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      message: 'Internal Server Error',
      error: errorMessage 
    }, { status: 500 });
  }
}