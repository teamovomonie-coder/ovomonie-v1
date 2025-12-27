import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/supabase-helpers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Update user avatar in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: dataUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    return NextResponse.json({ avatarUrl: dataUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { message: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
