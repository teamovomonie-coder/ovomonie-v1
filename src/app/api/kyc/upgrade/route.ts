import { NextResponse, type NextRequest } from 'next/server';
import { getUserIdFromToken } from '@/lib/firestore-helpers';
import { logger } from '@/lib/logger';
import { vfdWalletService } from '@/lib/vfd-wallet-service';
import { db, userService, notificationService } from '@/lib/db';


export async function POST(request: NextRequest) {
    try {
        const userId = getUserIdFromToken(request.headers);
        if (!userId) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { tier, bvn } = body;

        if (!tier || !bvn) {
            return NextResponse.json({ ok: false, message: 'Tier and BVN required' }, { status: 400 });
        }

        const user = await userService.getById(userId);
        if (!user) {
            return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
        }

        if (tier <= (user.kyc_tier || 1)) {
            return NextResponse.json({ ok: false, message: `Already at Tier ${tier}` }, { status: 400 });
        }

        // Upgrade account with VFD using BVN
        await vfdWalletService.upgradeAccountWithBVN(user.account_number || user.accountNumber || '', bvn);

        // Update user tier in Supabase
        await db
            .from('users')
            .update({ 
                kyc_tier: tier,
                bvn_hash: bvn, // Store hashed in production
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        // Create notification
        await notificationService.create({
            user_id: userId,
            title: 'Account Upgraded',
            body: `Your account has been upgraded to Tier ${tier}. You now have higher transaction limits.`,
            category: 'kyc',
        });

        logger.info('KYC upgrade successful', { userId, tier });

        return NextResponse.json({ 
            ok: true, 
            message: `Successfully upgraded to Tier ${tier}!`,
            data: { tier },
        });

    } catch (error) {
        logger.error('KYC upgrade error:', error);
        const message = error instanceof Error ? error.message : 'Upgrade failed';
        return NextResponse.json({ ok: false, message }, { status: 500 });
    }
}
