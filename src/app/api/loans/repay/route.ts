
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
    collection,
    runTransaction,
    doc,
    serverTimestamp,
    query,
    where,
    getDoc,
} from 'firebase/firestore';
import { headers } from 'next/headers';
import { getUserIdFromToken } from '@/lib/firestore-helpers';


export async function POST(request: Request) {
    try {
        const userId = getUserIdFromToken(headers());
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        const { loanId, amount, clientReference } = await request.json();

        if (!loanId || !amount || amount <= 0) {
            return NextResponse.json({ message: 'Loan ID and a positive amount are required.' }, { status: 400 });
        }
        if (!clientReference) {
            return NextResponse.json({ message: 'Client reference ID is required for this transaction.' }, { status: 400 });
        }
        
        const amountInKobo = Math.round(amount * 100);
        let newLoanBalance = 0;
        let newUserBalance = 0;

        await runTransaction(db, async (transaction) => {
            const financialTransactionsRef = collection(db, 'financialTransactions');
            const idempotencyQuery = query(financialTransactionsRef, where("reference", "==", clientReference));
            const existingTxnSnapshot = await transaction.get(idempotencyQuery);

            if (!existingTxnSnapshot.empty) {
                console.log(`Idempotent request for loan repayment: ${clientReference} already processed.`);
                const userRef = doc(db, "users", userId);
                const loanRef = doc(db, "loans", loanId);

                const [userDoc, loanDoc] = await Promise.all([
                    transaction.get(userRef),
                    transaction.get(loanRef)
                ]);

                if (userDoc.exists()) newUserBalance = userDoc.data().balance;
                if (loanDoc.exists()) newLoanBalance = loanDoc.data().balance;
                return;
            }

            const loanRef = doc(db, "loans", loanId);
            const userRef = doc(db, "users", userId);

            const [loanDoc, userDoc] = await Promise.all([
                transaction.get(loanRef),
                transaction.get(userRef),
            ]);

            if (!loanDoc.exists()) throw new Error("Loan not found.");
            if (loanDoc.data().userId !== userId) throw new Error("Loan does not belong to this user.");
            if (!userDoc.exists()) throw new Error("User not found.");

            const loanData = loanDoc.data();
            const userData = userDoc.data();

            if (userData.balance < amountInKobo) throw new Error("Insufficient funds for repayment.");

            newLoanBalance = loanData.balance - amountInKobo;
            newUserBalance = userData.balance - amountInKobo;

            const newStatus = newLoanBalance <= 0 ? 'Paid' : 'Active';

            // Naive repayment update logic for demo. A real app would be more complex.
            const updatedRepayments = loanData.repayments.map((r: any) => ({
                 ...r,
                 // This is a simplified logic. A real app would allocate payments properly.
            }));

            transaction.update(userRef, { balance: newUserBalance });
            transaction.update(loanRef, {
                balance: newLoanBalance,
                status: newStatus,
                repayments: updatedRepayments, 
                lastRepaymentDate: serverTimestamp(),
            });

            const debitLog = {
                userId: userId,
                category: 'loan',
                type: 'debit',
                amount: amountInKobo,
                reference: clientReference,
                narration: 'Loan repayment',
                party: { name: 'Ovomonie Loans' },
                timestamp: serverTimestamp(),
                balanceAfter: newUserBalance,
            };
            transaction.set(doc(financialTransactionsRef), debitLog);
        });

        return NextResponse.json({
            message: 'Repayment successful!',
            newUserBalance,
            newLoanBalance,
        }, { status: 200 });

    } catch (error) {
        console.error("Loan Repayment Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
