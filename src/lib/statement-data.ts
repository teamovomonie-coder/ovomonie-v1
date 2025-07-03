
export interface Transaction {
  id: string;
  userId: string;
  type: 'transfer' | 'bill' | 'airtime' | 'pos' | 'deposit' | 'withdrawal';
  subType: string;
  amount: number;
  fee: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  beneficiary: {
    name: string;
    account?: string;
    bank?: string;
  };
  sender: {
    name: string;
    account: string;
  };
  memo?: string;
  status: 'success' | 'pending' | 'failed';
  createdAt: string;
}

export const mockTransactions: Transaction[] = [
  {
    id: 'txn_1',
    userId: 'user_123',
    type: 'bill',
    subType: 'electricity',
    amount: -10000,
    fee: 50,
    balanceBefore: 1300395,
    balanceAfter: 1290345,
    reference: 'OVOBILL-IKEDC-1',
    beneficiary: { name: 'IKEDC Postpaid' },
    sender: { name: 'Paago David', account: '8012345678' },
    status: 'success',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'txn_2',
    userId: 'user_123',
    type: 'airtime',
    subType: 'data',
    amount: -3500,
    fee: 0,
    balanceBefore: 1290345,
    balanceAfter: 1286845,
    reference: 'OVOAIRTIME-MTN-2',
    beneficiary: { name: 'MTN Data', account: '08030000001' },
    sender: { name: 'Paago David', account: '8012345678' },
    status: 'success',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  },
  {
    id: 'txn_3',
    userId: 'user_123',
    type: 'transfer',
    subType: 'bank-transfer',
    amount: -50000,
    fee: 25,
    balanceBefore: 1286845,
    balanceAfter: 1236820,
    reference: 'OVOTRANSFER-GTB-3',
    beneficiary: { name: 'John Doe', account: '0123456789', bank: 'GTBank' },
    sender: { name: 'Paago David', account: '8012345678' },
    memo: 'For project supplies',
    status: 'success',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
  },
  {
    id: 'txn_4',
    userId: 'user_123',
    type: 'deposit',
    subType: 'bank-deposit',
    amount: 100000,
    fee: 0,
    balanceBefore: 1136820,
    balanceAfter: 1236820,
    reference: 'OVODEPOSIT-4',
    beneficiary: { name: 'Paago David', account: '8012345678' },
    sender: { name: 'Company ABC', account: '9876543210' },
    status: 'success',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
  },
  {
    id: 'txn_5',
    userId: 'user_123',
    type: 'withdrawal',
    subType: 'pos-withdrawal',
    amount: -20000,
    fee: 100,
    balanceBefore: 1250445,
    balanceAfter: 1230345,
    reference: 'OVOWITHDRAW-POS-5',
    beneficiary: { name: 'POS Agent 007' },
    sender: { name: 'Paago David', account: '8012345678' },
    status: 'success',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
  },
  {
    id: 'txn_6',
    userId: 'user_123',
    type: 'transfer',
    subType: 'memo-transfer',
    amount: -5000,
    fee: 0,
    balanceBefore: 1230345,
    balanceAfter: 1225345,
    reference: 'OVOMEMO-6',
    beneficiary: { name: 'Jane Smith', account: '8011112222' },
    sender: { name: 'Paago David', account: '8012345678' },
    memo: 'Happy Birthday!',
    status: 'failed',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString(),
  },
   {
    id: 'txn_7',
    userId: 'user_123',
    type: 'bill',
    subType: 'cable-tv',
    amount: -12500,
    fee: 50,
    balanceBefore: 100000,
    balanceAfter: 87450,
    reference: 'OVOBILL-DSTV-7',
    beneficiary: { name: 'DSTV Subscription' },
    sender: { name: 'Paago David', account: '8012345678' },
    status: 'success',
    createdAt: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
  },
];
