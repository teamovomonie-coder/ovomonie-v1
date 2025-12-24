const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace firestore-helpers imports
    content = content.replace(
      /      "import { getUserIdFromToken } from '@/lib/auth-helpers';"
    );
    
    content = content.replace(
      /      "import { getUserIdFromToken, createNotification } from '@/lib/auth-helpers';"
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Files to update
const files = [
  'src/app/api/auth/me/route.ts',
  'src/app/api/auth/verify-pin/route.ts',
  'src/app/api/bills/vfd/route.ts',
  'src/app/api/cards/debit/route.ts',
  'src/app/api/cards/order/route.ts',
  'src/app/api/funding/agent/route.ts',
  'src/app/api/funding/card/route.ts',
  'src/app/api/funding/deposit/route.ts',
  'src/app/api/funding/paystack/route.ts',
  'src/app/api/funding/withdraw/route.ts',
  'src/app/api/invoicing/route.ts',
  'src/app/api/invoicing/[id]/route.ts',
  'src/app/api/kyc/aml/route.ts',
  'src/app/api/kyc/imagematch/route.ts',
  'src/app/api/kyc/liveness/route.ts',
  'src/app/api/kyc/nin/route.ts',
  'src/app/api/kyc/upgrade/route.ts',
  'src/app/api/loans/repay/route.ts',
  'src/app/api/loans/route.ts',
  'src/app/api/mandates/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/payments/card/route.ts',
  'src/app/api/payments/charge/route.ts',
  'src/app/api/payments/route.ts',
  'src/app/api/payments/vfd/route.ts',
  'src/app/api/payroll/route.ts',
  'src/app/api/payroll/[id]/execute/route.ts',
  'src/app/api/payroll/[id]/route.ts',
  'src/app/api/stocks/market-data/route.ts',
  'src/app/api/stocks/portfolio/route.ts',
  'src/app/api/stocks/trade/route.ts',
  'src/app/api/support/tickets/route.ts',
  'src/app/api/test-auth/route.ts',
  'src/app/api/transactions/details/route.ts',
  'src/app/api/transactions/pending/route.ts',
  'src/app/api/transactions/route.ts',
  'src/app/api/transactions/share/route.ts',
  'src/app/api/transactions/[id]/route.ts',
  'src/app/api/transactions/[transactionId]/route.ts',
  'src/app/api/transfers/external/route.ts',
  'src/app/api/transfers/internal/route.ts',
  'src/app/api/transfers/verify-account/route.ts',
  'src/app/api/user/notifications/route.ts',
  'src/app/api/virtual-accounts/create/route.ts',
  'src/app/api/wallet/balance/route.ts',
  'src/app/api/wallet/sync-balance/route.ts',
  'src/app/api/wallet/transfer/route.ts',
  'src/app/api/wealth/investments/route.ts'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    replaceInFile(fullPath);
  }
});

console.log('Replacement complete!');