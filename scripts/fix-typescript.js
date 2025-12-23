#!/usr/bin/env node

/**
 * Production TypeScript Fix Script
 * Fixes critical TypeScript errors for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting TypeScript fixes for production...');

// Fix 1: Update DbTransaction and DbNotification interfaces
const userTypesPath = 'src/types/user.ts';
const userTypesContent = fs.readFileSync(userTypesPath, 'utf8');

const updatedUserTypes = userTypesContent.replace(
  'export interface DbTransaction {',
  `export interface DbTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  reference: string;
  party_name?: string;
  party_account?: string;
  created_at: string;
  updated_at: string;
}

export interface DbTransactionLegacy {`
).replace(
  'export interface DbNotification {',
  `export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  category?: string;
  read: boolean;
  sender_phone?: string;
  created_at: string;
}

export interface DbNotificationLegacy {`
);

fs.writeFileSync(userTypesPath, updatedUserTypes);
console.log('✅ Updated user types');

// Fix 2: Create missing imports fix
const missingImportsFiles = [
  'src/app/api/kyc/aml/route.ts',
  'src/app/api/kyc/imagematch/route.ts',
  'src/app/api/kyc/liveness/route.ts',
  'src/app/api/kyc/nin/route.ts',
  'src/app/api/wallet/sync-balance/route.ts'
];

missingImportsFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\.accountNumber/g, '.account_number');
    fs.writeFileSync(filePath, content);
  }
});

console.log('✅ Fixed property name mismatches');

// Fix 3: Add null checks for critical files
const nullCheckFiles = [
  'src/lib/auth.ts',
  'src/lib/card-utils.ts',
  'src/lib/middleware/auth-middleware.ts'
];

nullCheckFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add basic null checks
    content = content.replace(
      /const \[, payloadB64, signature\] = parts;/g,
      'const [, payloadB64, signature] = parts;\n    if (!payloadB64 || !signature) return null;'
    );
    
    fs.writeFileSync(filePath, content);
  }
});

console.log('✅ Added null safety checks');

console.log('🎉 TypeScript fixes completed!');
console.log('📝 Next steps:');
console.log('   1. Run: npm run typecheck');
console.log('   2. Fix remaining API route imports');
console.log('   3. Run: npm run build');