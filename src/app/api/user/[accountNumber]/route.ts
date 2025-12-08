import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { logger } from '@/lib/logger';


interface UserAccount {
    id?: string;
    userId: string;
    accountNumber: string;
    fullName: string;
    balance: number; // in kobo
    referralCode?: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ accountNumber: string }> }
) {
  try {
    const { accountNumber } = await params;
    if (!accountNumber) {
        return NextResponse.json({ message: 'Account number is required.' }, { status: 400 });
    }

    const q = query(collection(db, "users"), where("accountNumber", "==", accountNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = { id: userDoc.id, ...userDoc.data() } as UserAccount;
    
    return NextResponse.json(userData);

  } catch (error) {
    logger.error("Error fetching user data:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
