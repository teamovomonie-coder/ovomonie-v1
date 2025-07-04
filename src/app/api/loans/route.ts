
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
    Timestamp,
    limit,
    orderBy,
} from 'firebase/firestore';
import { mockGetAccountByNumber, MOCK_SENDER_ACCOUNT } from '@/lib/user-data';
import { add } from 'date-fns';

// Helper to get the user ID for the mock user
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
        // Get the most recent active loan
        const q = query(
            collection(db, "loans"),
            where("userId", "==", userId),
            where("status", "==", "Active"),
            orderBy("startDate", "desc"),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json(null);
        }
        
        const loanDoc = querySnapshot.docs[0];
        const data = loanDoc.data();

        // Convert Timestamps to ISO strings for JSON serialization
        const loan = {
            id: loanDoc.id,
            ...data,
            startDate: (data.startDate as Timestamp).toDate().toISOString(),
            repayments: data.repayments.map((r: any) => ({
                ...r,
                dueDate: (r.dueDate as Timestamp).toDate().toISOString(),
            })),
        };

        return NextResponse.json(loan);

    } catch (error) {
        console.error("Error fetching active loan: ", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        const userAccount = await mockGetAccountByNumber(MOCK_SENDER_ACCOUNT);
        if (!userAccount || !userAccount.id) throw new Error("User account not found");

        const { amount, duration, purpose, loanType } = await request.json();
        
        if (!amount || !duration || !purpose || !loanType) {
            return NextResponse.json({ message: 'Missing required loan application fields.' }, { status: 400 });
        }
        
        const amountInKobo = Math.round(amount * 100);
        let newBalance = 0;
        const interestRate = 0.05; // 5% monthly

        const totalInterest = amountInKobo * interestRate * duration;
        const totalRepayable = amountInKobo + totalInterest;
        const monthlyPayment = totalRepayable / duration;
        const startDate = new Date();

        const newLoanRef = doc(collection(db, "loans"));
        const userDocRef = doc(db, "users", userAccount.id);

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) throw new Error("User document does not exist.");

            const userData = userDoc.data();
            newBalance = userData.balance + amountInKobo;
            transaction.update(userDocRef, { balance: newBalance });

            const newLoan = {
                userId,
                loanType,
                purpose,
                principal: amountInKobo,
                balance: totalRepayable,
                duration,
                interestRate,
                status: 'Active',
                startDate: Timestamp.fromDate(startDate),
                repayments: Array.from({ length: duration }, (_, i) => ({
                    dueDate: Timestamp.fromDate(add(startDate, { months: i + 1 })),
                    amount: monthlyPayment,
                    status: 'Due',
                })),
            };
            transaction.set(newLoanRef, newLoan);

            // Log the credit transaction
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const creditLog = {
                userId,
                category: 'loan',
                type: 'credit',
                amount: amountInKobo,
                reference: `LOAN-${newLoanRef.id}`,
                narration: `Loan disbursement for ${purpose}`,
                party: { name: 'Ovomonie Loans' },
                timestamp: serverTimestamp(),
                balanceAfter: newBalance,
            };
            transaction.set(doc(financialTransactionsRef), creditLog);
        });

        return NextResponse.json({
            message: "Loan disbursed successfully!",
            newBalance: newBalance,
            loanId: newLoanRef.id,
        }, { status: 201 });

    } catch (error) {
        console.error("Loan Disbursement Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
