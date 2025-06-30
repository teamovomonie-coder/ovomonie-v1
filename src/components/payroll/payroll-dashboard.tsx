
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { nigerianBanks } from '@/lib/banks';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from "@/components/ui/separator";

import { PlusCircle, Users, ChevronsUpDown, Check, Trash2, Loader2, Calendar, Repeat, FileDown, ArrowLeft, Info, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

type View = 'dashboard' | 'editor' | 'summary' | 'receipt';

const employeeSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(3, 'Full name is required.'),
  bankCode: z.string().min(1, 'Please select a bank.'),
  accountNumber: z.string().length(10, 'Account number must be 10 digits.'),
  salary: z.coerce.number().min(1, 'Salary must be greater than 0.'),
  isVerified: z.boolean().default(false),
});

const payrollSchema = z.object({
  id: z.string().optional(),
  groupName: z.string().min(3, 'Payroll group name is required.'),
  period: z.string().min(1, 'Please select a payment period.'),
  employees: z.array(employeeSchema).min(1, 'At least one employee is required.'),
  status: z.enum(['Draft', 'Paid', 'Pending', 'Failed']).default('Draft'),
  paymentDate: z.date().optional(),
});

type Employee = z.infer<typeof employeeSchema>;
type PayrollBatch = z.infer<typeof payrollSchema>;

const mockPayrollBatches: PayrollBatch[] = [
    {
        id: 'PAY-2024-JUL',
        groupName: 'Marketing Team',
        period: 'July 2024',
        status: 'Paid',
        paymentDate: new Date('2024-07-25'),
        employees: [
            { id: 'emp-1', fullName: 'Jane Doe', bankCode: '058', accountNumber: '0123456789', salary: 250000, isVerified: true },
            { id: 'emp-2', fullName: 'John Smith', bankCode: '044', accountNumber: '0987654321', salary: 220000, isVerified: true },
        ]
    },
    {
        id: 'PAY-2024-JUN',
        groupName: 'Engineering Team',
        period: 'June 2024',
        status: 'Paid',
        paymentDate: new Date('2024-06-25'),
        employees: [
            { id: 'emp-3', fullName: 'Adamu Ciroma', bankCode: '033', accountNumber: '1122334455', salary: 350000, isVerified: true },
        ]
    },
];

const getTotalSalary = (employees: Employee[]) => employees.reduce((acc, emp) => acc + (emp.salary || 0), 0);

function PayrollEditor({ onSave, onBack, initialData }: { onSave: (data: PayrollBatch) => void; onBack: () => void; initialData: PayrollBatch }) {
    const { toast } = useToast();
    const form = useForm<PayrollBatch>({
        resolver: zodResolver(payrollSchema),
        defaultValues: initialData,
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "employees"
    });

    const watchedEmployees = form.watch('employees');
    const totalSalary = useMemo(() => getTotalSalary(watchedEmployees), [watchedEmployees]);

    const handleVerifyAccount = async (index: number) => {
        const employee = form.getValues(`employees.${index}`);
        if (employee.accountNumber.length !== 10 || !employee.bankCode) return;
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock verification logic
        const mockAccounts: {[key: string]: {[key: string]: string}} = {
            '058': { '0123456789': 'JANE DOE' }, '044': { '0987654321': 'JOHN SMITH' }, '033': { '1122334455': 'ADAMU CIROMA' }
        };

        if (mockAccounts[employee.bankCode] && mockAccounts[employee.bankCode][employee.accountNumber]) {
            update(index, { ...employee, isVerified: true });
            toast({ title: "Account Verified", description: `${employee.fullName}'s account has been verified.` });
        } else {
            form.setError(`employees.${index}.accountNumber`, { type: 'manual', message: 'Verification failed.' });
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft/></Button>
                    <CardTitle>
                        {initialData.id?.startsWith('DRAFT') ? 'Create New Payroll' : 'Edit Payroll'}
                    </CardTitle>
                </div>
                <CardDescription>Add your employees and their salary details. You can import from a CSV file for bulk uploads.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSave)}>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="groupName" render={({ field }) => (<FormItem><FormLabel>Payroll Group Name</FormLabel><FormControl><Input placeholder="e.g., Marketing Team" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="period" render={({ field }) => (<FormItem><FormLabel>Payment Period</FormLabel><FormControl><Input placeholder="e.g., August 2024" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>

                        <Separator />

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">Employee List</h3>
                                <Button type="button" variant="outline" size="sm" onClick={() => toast({ title: "Coming Soon!", description: "CSV Import will be available in a future update." })}>Import from CSV</Button>
                            </div>
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <EmployeeFormRow key={field.id} index={index} control={form.control} onRemove={remove} onVerify={handleVerifyAccount} />
                                ))}
                            </div>
                             <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => append({ fullName: '', bankCode: '', accountNumber: '', salary: 0, isVerified: false })}><PlusCircle className="mr-2 h-4 w-4" /> Add Employee</Button>
                        </div>
                        
                        <Separator />

                        <div className="flex justify-end">
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between font-semibold">
                                    <span>Total Payroll:</span>
                                    <span>₦{totalSalary.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-muted-foreground text-right">This amount will be debited from your wallet.</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                         <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
                         <Button type="submit">Proceed to Summary</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}

function EmployeeFormRow({ index, control, onRemove, onVerify }: { index: number, control: any, onRemove: (index: number) => void, onVerify: (index: number) => void }) {
    const [isBankPopoverOpen, setIsBankPopoverOpen] = useState(false);
    const employee = useForm().watch(`employees.${index}`);
    const isVerified = control.getValues(`employees.${index}.isVerified`);
    
    return (
        <div className="p-4 border rounded-lg space-y-4 relative bg-background">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField control={control} name={`employees.${index}.fullName`} render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name={`employees.${index}.bankCode`} render={({ field }) => (
                    <FormItem><FormLabel>Bank</FormLabel>
                        <Popover open={isBankPopoverOpen} onOpenChange={setIsBankPopoverOpen}>
                            <PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>{field.value ? nigerianBanks.find(b => b.code === field.value)?.name : "Select Bank"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search bank..." /><CommandList><CommandEmpty>No bank found.</CommandEmpty><CommandGroup>{nigerianBanks.map(bank => (<CommandItem key={bank.code} value={bank.name} onSelect={() => { field.onChange(bank.code); setIsBankPopoverOpen(false); }}><Check className={cn("mr-2 h-4 w-4", field.value === bank.code ? "opacity-100" : "opacity-0")} />{bank.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>
                )}/>
                <FormField control={control} name={`employees.${index}.accountNumber`} render={({ field }) => (<FormItem><FormLabel>Account Number</FormLabel>
                    <div className="flex items-center gap-1">
                        <FormControl><Input placeholder="10 digits" {...field} /></FormControl>
                        <Button type="button" size="sm" variant={isVerified ? "ghost" : "secondary"} onClick={() => onVerify(index)} disabled={isVerified}>{isVerified ? <CheckCircle className="text-green-500" /> : 'Verify'}</Button>
                    </div>
                    <FormMessage />
                </FormItem>)} />
                <FormField control={control} name={`employees.${index}.salary`} render={({ field }) => (<FormItem><FormLabel>Salary (₦)</FormLabel><FormControl><Input type="number" placeholder="Amount" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => onRemove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
    )
}

export function PayrollDashboard() {
  const [view, setView] = useState<View>('dashboard');
  const [batches, setBatches] = useState<PayrollBatch[]>(mockPayrollBatches);
  const [activeBatch, setActiveBatch] = useState<PayrollBatch | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleCreateNew = () => {
    setActiveBatch({
        id: `DRAFT-${Date.now()}`,
        groupName: '',
        period: '',
        employees: [],
        status: 'Draft',
    });
    setView('editor');
  };

  const handleEdit = (batchId: string) => {
      const batch = batches.find(b => b.id === batchId);
      if (batch) {
          setActiveBatch(batch);
          setView('editor');
      }
  };
  
  const handleSave = (data: PayrollBatch) => {
      setActiveBatch(data);
      setView('summary');
  };

  const handleConfirmPayment = () => {
      if (!activeBatch) return;
      setIsProcessing(true);
      setTimeout(() => {
          const finalBatch = { ...activeBatch, status: 'Paid' as const, id: activeBatch.id?.startsWith('DRAFT') ? `PAY-${Date.now()}` : activeBatch.id, paymentDate: new Date() };
          setBatches(prev => {
              const existing = prev.find(b => b.id === finalBatch.id);
              if (existing) {
                  return prev.map(b => b.id === finalBatch.id ? finalBatch : b);
              }
              return [...prev, finalBatch];
          });
          setActiveBatch(finalBatch);
          setIsProcessing(false);
          setView('receipt');
      }, 2000);
  }

  const reset = () => {
      setView('dashboard');
      setActiveBatch(null);
  }

  const renderContent = () => {
    switch (view) {
      case 'editor':
        return <PayrollEditor onSave={handleSave} onBack={reset} initialData={activeBatch!} />;
      case 'summary':
        return (
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setView('editor')}><ArrowLeft/></Button>
                        <CardTitle>Payroll Summary</CardTitle>
                    </div>
                    <CardDescription>Please review the details below before confirming payment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg bg-muted grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><p className="text-sm text-muted-foreground">Group Name</p><p className="font-semibold">{activeBatch?.groupName}</p></div>
                        <div><p className="text-sm text-muted-foreground">Period</p><p className="font-semibold">{activeBatch?.period}</p></div>
                        <div><p className="text-sm text-muted-foreground">Employees</p><p className="font-semibold">{activeBatch?.employees.length}</p></div>
                        <div className="text-right"><p className="text-sm text-muted-foreground">Total Amount</p><p className="font-bold text-lg text-primary">₦{getTotalSalary(activeBatch?.employees || []).toLocaleString()}</p></div>
                    </div>
                     <Table>
                        <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Bank</TableHead><TableHead>Account Number</TableHead><TableHead className="text-right">Salary (₦)</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {activeBatch?.employees.map(emp => (
                                <TableRow key={emp.id}><TableCell>{emp.fullName}</TableCell><TableCell>{nigerianBanks.find(b => b.code === emp.bankCode)?.name}</TableCell><TableCell>{emp.accountNumber}</TableCell><TableCell className="text-right font-medium">{emp.salary.toLocaleString()}</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setView('editor')} disabled={isProcessing}>Back to Edit</Button>
                    <Button onClick={handleConfirmPayment} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="animate-spin" /> : 'Confirm & Pay'}
                    </Button>
                </CardFooter>
            </Card>
        )
      case 'receipt':
        return (
            <Card className="max-w-md mx-auto text-center">
                <CardHeader className="items-center">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <CardTitle>Payroll Paid Successfully!</CardTitle>
                    <CardDescription>You have successfully paid ₦{getTotalSalary(activeBatch?.employees || []).toLocaleString()} to {activeBatch?.employees.length} employees.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-muted rounded-lg text-left space-y-2">
                        <div className="flex justify-between"><span className="text-muted-foreground">Group</span><span className="font-semibold">{activeBatch?.groupName}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span className="font-semibold">{activeBatch?.period}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Date Paid</span><span className="font-semibold">{format(activeBatch?.paymentDate || new Date(), 'PPP')}</span></div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button className="w-full" onClick={() => toast({ title: "Report downloaded." })}><FileDown className="mr-2"/> Download Report</Button>
                    <Button variant="outline" className="w-full" onClick={reset}>Back to Dashboard</Button>
                </CardFooter>
            </Card>
        )
      default:
        const totalEmployees = batches.reduce((sum, batch) => sum + batch.employees.length, 0);
        const totalPaid = batches.filter(b => b.status === 'Paid').reduce((sum, batch) => sum + getTotalSalary(batch.employees), 0);
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Payroll</h2>
              <Button onClick={handleCreateNew}><PlusCircle className="mr-2 h-4 w-4" /> Create Payroll</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Employees</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{totalEmployees}</div><p className="text-xs text-muted-foreground">Across all payrolls</p></CardContent></Card>
                <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Paid (All Time)</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">₦{totalPaid.toLocaleString()}</div><p className="text-xs text-muted-foreground">Successful disbursements</p></CardContent></Card>
                <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Next Payroll Date</CardTitle><Calendar className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">Aug 25, 2024</div><p className="text-xs text-muted-foreground">For August 2024 period</p></CardContent></Card>
                 <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending Payments</CardTitle><Loader2 className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">₦0.00</div><p className="text-xs text-muted-foreground">No pending payrolls</p></CardContent></Card>
            </div>
            <Card>
                <CardHeader><CardTitle>Payroll History</CardTitle><CardDescription>Manage your past and draft payrolls.</CardDescription></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Group Name</TableHead><TableHead>Status</TableHead><TableHead>Employees</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {batches.map(batch => (
                                <TableRow key={batch.id}>
                                    <TableCell><div className="font-medium">{batch.period}</div><div className="text-sm text-muted-foreground hidden md:block">{batch.paymentDate ? format(batch.paymentDate, 'PPP') : 'N/A'}</div></TableCell>
                                    <TableCell>{batch.groupName}</TableCell>
                                    <TableCell><Badge variant={batch.status === 'Paid' ? 'default' : 'secondary'} className={batch.status === 'Paid' ? 'bg-green-100 text-green-800' : ''}>{batch.status}</Badge></TableCell>
                                    <TableCell>{batch.employees.length}</TableCell>
                                    <TableCell className="text-right font-medium">₦{getTotalSalary(batch.employees).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(batch.id!)}>View</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </div>
        )
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      {renderContent()}
    </div>
  );
}
