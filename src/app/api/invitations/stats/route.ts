
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { mockGetAccountByNumber, MOCK_SENDER_ACCOUNT } from '@/lib/user-data';

export async function GET() {
    try {
        const user = await mockGetAccountByNumber(MOCK_SENDER_ACCOUNT);

        if (!user || !user.referralCode) {
            return NextResponse.json({ message: 'User or referral code not found.' }, { status: 404 });
        }

        // In a production app, you would query your database for actual stats.
        // For this demo, we'll return mock stats but with the user's real referral code.
        const mockStats = {
            invites: 23,
            signups: 15,
            earnings: 7500,
        };

        return NextResponse.json({
            referralCode: user.referralCode,
            stats: mockStats,
        });

    } catch (error) {
        console.error("Error fetching invitation stats:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
