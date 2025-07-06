
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    query, 
    where, 
    getDocs,
    runTransaction,
    doc,
    Timestamp
} from 'firebase/firestore';
import { mockGetAccountByNumber, MOCK_SENDER_ACCOUNT } from '@/lib/user-data';

// This function assumes we are operating for a single, mocked user.
// In a real app, you would get the user ID from a verified session/token.
async function getUserId() {
    const user = await mockGetAccountByNumber(MOCK_SENDER_ACCOUNT);
    if (!user || !user.id) {
        throw new Error("User not found or user ID is missing.");
    }
    return user.id;
}


export async function GET() {
    try {
        const userId = await getUserId();
        const q = query(collection(db, "investments"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        const investments = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore Timestamps to ISO strings for JSON serialization
            return {
                id: doc.id,
                ...data,
                startDate: (data.startDate as Timestamp).toDate().toISOString(),
                maturityDate: (data.maturityDate as Timestamp).toDate().toISOString(),
            };
        });

        return NextResponse.json(investments);
    } catch (error) {
        console.error("Error fetching investments: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        const userAccount = await mockGetAccountByNumber(MOCK_SENDER_ACCOUNT);
        if (!userAccount || !userAccount.id) throw new Error("User account not found");

        const { productId, amount, duration, estimatedReturn, clientReference } = await request.json();

        if (!productId || !amount || !duration || amount <= 0) {
            return NextResponse.json({ message: 'Missing required investment fields.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }

        const amountInKobo = Math.round(amount * 100);
        let newBalance = 0;

        const investmentRef = doc(collection(db, "investments"));
        const userDocRef = doc(db, "users", userAccount.id);

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                console.log(`Idempotent request for investment: ${clientReference} already processed.`);
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
                startDate: serverTimestamp(),
                maturityDate: Timestamp.fromDate(maturityDate),
            };
            transaction.set(investmentRef, newInvestment);

            // Log the debit transaction
            const debitLog = {
                userId,
                category: 'investment',
                type: 'debit',
                amount: amountInKobo,
                reference: clientReference,
                narration: `Investment in ${productId}`,
                party: { name: 'Ovo-Wealth' },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });
        
        // Re-fetch balance to ensure latest state is returned
        const finalUserAccount = await mockGetAccountByNumber(MOCK_SENDER_ACCOUNT);
        newBalance = finalUserAccount!.balance;

        return NextResponse.json({
            message: "Investment successful!",
            newBalance: newBalance,
            investmentId: investmentRef.id,
        }, { status: 201 });

    } catch (error) {
        console.error("Investment Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
