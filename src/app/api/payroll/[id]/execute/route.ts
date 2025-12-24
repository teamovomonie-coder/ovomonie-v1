
import { NextResponse, type NextRequest } from 'next/server';
// Firebase removed - using Supabase
// Firebase removed - using Supabase
import { headers } from 'next/headers';
import { nigerianBanks } from '@/lib/banks';
import { getUserIdFromToken } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ message: 'Database not available' }, { status: 500 });
        }
        const reqHeaders = request.headers as { get(name: string): string | null };
        const userId = getUserIdFromToken(reqHeaders);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id: batchId } = await params;
        let finalUserBalance = 0;

        await runTransaction(db, async (transaction) => {
            const payrollRef = supabaseAdmin.from("payrollBatches").select().eq("id", batchId);
            const userRef = supabaseAdmin.from("users").select().eq("id", userId);
            
            const [payrollDoc, userDoc] = await Promise.all([
                transaction.get(payrollRef),
                transaction.get(userRef)
            ]);

            if (!payrollDoc.exists() || payrollDoc.data().userId !== userId) {
                throw new Error("Payroll batch not found or access denied.");
            }
            if (!userDoc.exists()) {
                throw new Error("User account not found.");
            }

            const payrollData = payrollDoc.data();
            const userData = userDoc.data();

            if (payrollData.status === 'Paid') {
                throw new Error("This payroll batch has already been paid.");
            }
            
            const totalSalaryKobo = payrollData.employees.reduce((sum: number, emp: { salary: number; }) => sum + Math.round(emp.salary * 100), 0);
            
            if (userData.balance < totalSalaryKobo) {
                throw new Error("Insufficient funds in your wallet to complete this payroll.");
            }

            // 1. Debit the total amount from the user's wallet
            const newBalance = userData.balance - totalSalaryKobo;
            transaction.update(userRef, { balance: newBalance });
            finalUserBalance = newBalance;
            
            // 2. Log each individual transaction
            const financialTransactionsRef = supabaseAdmin.from("financialTransactions");
            payrollData.employees.forEach((employee: any) => {
                const bankName = nigerianBanks.find(b => b.code === employee.bankCode)?.name || 'Unknown Bank';
                const employeeSalaryKobo = Math.round(employee.salary * 100);
                const newTxRef = doc(financialTransactionsRef);
                transaction.set(newTxRef, {
                    userId: userId,
                    category: 'payroll',
                    type: 'debit',
                    amount: employeeSalaryKobo,
                    reference: `PAYROLL-${batchId}-${employee.accountNumber}`,
                    narration: `Salary for ${payrollData.period} to ${employee.fullName}`,
                    party: {
                        name: employee.fullName,
                        account: employee.accountNumber,
                        bank: bankName,
                    },
                    timestamp: new Date().toISOString(),
                    balanceAfter: newBalance, // Note: This balance is after the *total* debit, not per-employee.
                });
            });

            // 3. Update the payroll batch status
            transaction.update(payrollRef, {
                status: 'Paid',
                paymentDate: new Date().toISOString()
            });
        });
        
        return NextResponse.json({ message: "Payroll processed successfully!", newBalanceInKobo: finalUserBalance }, { status: 200 });

    } catch (error) {
        logger.error("Payroll Execution Error:", error);
        return NextResponse.json({ message: (error as Error).message }, { status: 400 });
    }
}
