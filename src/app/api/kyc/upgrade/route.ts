
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getUserIdFromToken } from '@/lib/firestore-helpers';

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromToken(headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { newTier, bvn, cacNumber } = body;

        if (!newTier || (newTier === 2 && !bvn) || (newTier === 3 && !cacNumber)) {
            return NextResponse.json({ message: 'Required KYC information is missing.' }, { status: 400 });
        }

        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        const currentTier = userDoc.data().kycTier || 1;
        if (newTier <= currentTier) {
            return NextResponse.json({ message: `You are already at or above Tier ${newTier}.` }, { status: 400 });
        }
        
        // In a real app, you would verify the BVN/CAC number with a third-party service here.
        // For this simulation, we'll assume the data is valid and proceed with the upgrade.
        
        const updateData: any = {
            kycTier: newTier,
            updatedAt: new Date().toISOString(),
        };

        if (newTier === 2) {
            updateData.bvn = bvn;
        }
        if (newTier === 3) {
            updateData.cacNumber = cacNumber;
            updateData.isBusiness = true; // Assuming Tier 3 is for businesses
        }
        
        await updateDoc(userRef, updateData);

        return NextResponse.json({ message: `Successfully upgraded to Tier ${newTier}!` });

    } catch (error) {
        console.error("KYC Upgrade Error:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
