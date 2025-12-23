import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuthToken } from '@/lib/auth';

// GET - List user's saved cards
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ ok: false, message: 'Invalid token' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('saved_cards')
      .select('id, card_brand, last_four, expiry_display, card_token, nickname, is_default, created_at')
      .eq('user_id', payload.sub)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Saved Cards] Error fetching cards:', error);
      return NextResponse.json({ ok: false, message: 'Failed to fetch saved cards' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: data || [],
    });
  } catch (error) {
    console.error('[Saved Cards] GET Error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save a new card
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ ok: false, message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { cardToken, lastFour, cardBrand, expiryDisplay, nickname, setAsDefault } = body;

    if (!cardToken || !lastFour || !cardBrand) {
      return NextResponse.json({ ok: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    // Check if card already exists for this user
    const { data: existing } = await supabaseAdmin
      .from('saved_cards')
      .select('id')
      .eq('user_id', payload.sub)
      .eq('last_four', lastFour)
      .eq('card_brand', cardBrand)
      .single();

    if (existing) {
      return NextResponse.json({ ok: false, message: 'Card already saved' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (setAsDefault) {
      await supabaseAdmin
        .from('saved_cards')
        .update({ is_default: false })
        .eq('user_id', payload.sub);
    }

    // Check if this is the first card (auto-set as default)
    const { count } = await supabaseAdmin
      .from('saved_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', payload.sub);

    const isFirstCard = (count || 0) === 0;

    const { data, error } = await supabaseAdmin
      .from('saved_cards')
      .insert({
        user_id: payload.sub,
        card_token: cardToken,
        last_four: lastFour,
        card_brand: cardBrand,
        expiry_display: expiryDisplay || '',
        nickname: nickname || `${cardBrand} •••• ${lastFour}`,
        is_default: setAsDefault || isFirstCard,
      })
      .select()
      .single();

    if (error) {
      console.error('[Saved Cards] Error saving card:', error);
      return NextResponse.json({ ok: false, message: 'Failed to save card' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Card saved successfully',
      data: {
        id: data.id,
        cardBrand: data.card_brand,
        lastFour: data.last_four,
        expiryDisplay: data.expiry_display,
        nickname: data.nickname,
        isDefault: data.is_default,
      },
    });
  } catch (error) {
    console.error('[Saved Cards] POST Error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a saved card
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ ok: false, message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('id');

    if (!cardId) {
      return NextResponse.json({ ok: false, message: 'Card ID is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    // Verify the card belongs to the user
    const { data: card } = await supabaseAdmin
      .from('saved_cards')
      .select('id, is_default')
      .eq('id', cardId)
      .eq('user_id', payload.sub)
      .single();

    if (!card) {
      return NextResponse.json({ ok: false, message: 'Card not found' }, { status: 404 });
    }

    const wasDefault = card.is_default;

    const { error } = await supabaseAdmin
      .from('saved_cards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', payload.sub);

    if (error) {
      console.error('[Saved Cards] Error deleting card:', error);
      return NextResponse.json({ ok: false, message: 'Failed to delete card' }, { status: 500 });
    }

    // If deleted card was default, set another card as default
    if (wasDefault) {
      const { data: remainingCards } = await supabaseAdmin
        .from('saved_cards')
        .select('id')
        .eq('user_id', payload.sub)
        .limit(1);

      if (remainingCards && remainingCards.length > 0 && remainingCards[0]) {
        await supabaseAdmin
          .from('saved_cards')
          .update({ is_default: true })
          .eq('id', remainingCards[0].id);
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Card deleted successfully',
    });
  } catch (error) {
    console.error('[Saved Cards] DELETE Error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update card (set as default, update nickname)
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ ok: false, message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { cardId, nickname, setAsDefault } = body;

    if (!cardId) {
      return NextResponse.json({ ok: false, message: 'Card ID is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    // Verify the card belongs to the user
    const { data: card } = await supabaseAdmin
      .from('saved_cards')
      .select('id')
      .eq('id', cardId)
      .eq('user_id', payload.sub)
      .single();

    if (!card) {
      return NextResponse.json({ ok: false, message: 'Card not found' }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (setAsDefault) {
      await supabaseAdmin
        .from('saved_cards')
        .update({ is_default: false })
        .eq('user_id', payload.sub);
    }

    const updates: { nickname?: string; is_default?: boolean } = {};
    if (nickname !== undefined) updates.nickname = nickname;
    if (setAsDefault !== undefined) updates.is_default = setAsDefault;

    const { error } = await supabaseAdmin
      .from('saved_cards')
      .update(updates)
      .eq('id', cardId)
      .eq('user_id', payload.sub);

    if (error) {
      console.error('[Saved Cards] Error updating card:', error);
      return NextResponse.json({ ok: false, message: 'Failed to update card' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Card updated successfully',
    });
  } catch (error) {
    console.error('[Saved Cards] PATCH Error:', error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
