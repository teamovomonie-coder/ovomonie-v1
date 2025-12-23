import { NextResponse } from 'next/server';
// Firebase removed - using Supabase
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    query, 
    where, 
    getDocs,
    runTransaction,
    doc,
    Timestamp,
    getDoc
} from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Removed orderBy to prevent index error in development environments.
        // For production, a composite index on (userId, startDate) would be ideal.
        const q = query(supabaseAdmin.from("investments"), where("userId", "==", userId));
        const querySnapshot = await supabaseAdmin.select("*").then(({data}) => data || []).then(items => q);
        
        const investments = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: (data.startDate as Timestamp)?.toDate().toISOString(),
                maturityDate: (data.maturityDate as Timestamp)?.toDate().toISOString(),
            };
        });

        return NextResponse.json(investments);
    } catch (error) {
        logger.error("Error fetching investments: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        const { productId, amount, duration, estimatedReturn, clientReference } = await request.json();

        if (!productId || !amount || !duration || amount <= 0) {
            return NextResponse.json({ message: 'Missing required investment fields.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }

        const amountInKobo = Math.round(amount * 100);
        let newBalance = 0;

        const investmentRef = doc(supabaseAdmin.from("investments"));
        const userDocRef = supabaseAdmin.from("users").select().eq("id", userId);

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = supabaseAdmin.from("financialTransactions");
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await (transaction.get as any)(idempotencyQuery as any);

            if (!(existingTxnSnapshot as any).empty) {
                logger.info(`Idempotent request for investment: ${clientReference} already processed.`);
                const userDoc = await transaction.get(userDocRef);
                if (userDoc.exists()) newBalance = userDoc.data().balance;
                return;
            }

            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error("User document does not exist.");
            }

            const userData = userDoc.data();
            if (userData.balance < amountInKobo) {
                throw new Error("Insufficient funds for this investment.");
            }
            
            newBalance = userData.balance - amountInKobo;
            transaction.update(userDocRef, { balance: newBalance });

            const maturityDate = new Date();
            maturityDate.setDate(maturityDate.getDate() + parseInt(duration));

            const newInvestment = {
                userId,
                plan: productId,
                principal: amountInKobo,
                returns: Math.round(estimatedReturn * 100), // Store in kobo
                status: 'Active',
                startDate: Timestamp.fromDate(new Date()),
                maturityDate: Timestamp.fromDate(maturityDate),
            };
            transaction.set(investmentRef, newInvestment);

            const debitLog = {
                userId,
                category: 'investment',
                type: 'debit',
                amount: amountInKobo,
                reference: clientReference,
                narration: `Investment in ${productId}`,
                party: { name: 'Ovo-Wealth' },
                timestamp: new Date().toISOString(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });
        
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            newBalance = userDoc.data().balance;
        }

        return NextResponse.json({
            message: "Investment successful!",
            newBalanceInKobo: newBalance,
            investmentId: investmentRef.id,
        }, { status: 201 });

    } catch (error) {
        logger.error("Investment Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
