const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/api/bills/vfd/route.ts',
  'src/app/api/debug/balance/route.ts',
  'src/app/api/debug/test-update/route.ts',
  'src/app/api/funding/deposit/route.ts',
  'src/app/api/inventory/categories/[id]/route.ts',
  'src/app/api/inventory/locations/[id]/route.ts',
  'src/app/api/inventory/products/[id]/route.ts',
  'src/app/api/inventory/stock/adjust/route.ts',
  'src/app/api/inventory/stock/sale/route.ts',
  'src/app/api/inventory/suppliers/[id]/route.ts',
  'src/app/api/inventory/transactions/route.ts',
  'src/app/api/kyc/upgrade/route.ts',
  'src/app/api/loans/route.ts',
  'src/app/api/mandates/route.ts',
  'src/app/api/payments/card/route.ts',
  'src/app/api/payments/charge/route.ts',
  'src/app/api/payments/route.ts',
  'src/app/api/payments/vfd/route.ts',
  'src/app/api/test-auth/route.ts',
  'src/app/api/transactions/details/route.ts',
  'src/app/api/transactions/pending/route.ts',
  'src/app/api/transactions/share/route.ts',
  'src/app/api/transfers/internal/route.ts',
  'src/app/api/virtual-accounts/create/route.ts',
  'src/app/api/wallet/transfer/route.ts'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/const userId = getUserIdFromToken\(request\.headers\);/g, 'const userId = await getUserIdFromToken(request.headers);');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done!');
