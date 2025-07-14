
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromToken(headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists() || !userDoc.data()?.referralCode) {
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
            referralCode: userDoc.data()?.referralCode,
            stats: mockStats,
        });

    } catch (error) {
        console.error("Error fetching invitation stats:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
