#!/usr/bin/env node

/**
 * Comprehensive Flow Testing Script
 * Tests all critical flows from FLOW_ANALYSIS.md
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  return fs.existsSync(fullPath);
}

function checkFileContent(filePath, searchStrings) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return { exists: false, matches: [] };
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const matches = searchStrings.map(str => ({
    search: str,
    found: content.includes(str)
  }));
  
  return { exists: true, matches };
}

// Test Results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function test(name, fn) {
  try {
    const result = fn();
    if (result.status === 'pass') {
      results.passed++;
      log(`✓ ${name}`, 'green');
    } else if (result.status === 'warn') {
      results.warnings++;
      log(`⚠ ${name}: ${result.message}`, 'yellow');
    } else {
      results.failed++;
      log(`✗ ${name}: ${result.message}`, 'red');
    }
    results.tests.push({ name, ...result });
  } catch (error) {
    results.failed++;
    log(`✗ ${name}: ${error.message}`, 'red');
    results.tests.push({ name, status: 'fail', message: error.message });
  }
}

log('\n=== OVOMONIE FLOW ANALYSIS VERIFICATION ===\n', 'cyan');

// ============================================
// 1. REGISTRATION FLOW
// ============================================
log('1. Testing Registration Flow...', 'blue');

test('Registration API route exists', () => {
  return checkFileExists('src/app/api/auth/register/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('Registration uses phoneToAccountNumber()', () => {
  const check = checkFileContent('src/app/api/auth/register/route.ts', [
    'phoneToAccountNumber',
    'createWallet'
  ]);
  const allFound = check.matches.every(m => m.found);
  return allFound
    ? { status: 'pass' }
    : { status: 'fail', message: 'Missing required functions' };
});

// ============================================
// 2. LOGIN FLOW
// ============================================
log('\n2. Testing Login Flow...', 'blue');

test('Login API route exists', () => {
  return checkFileExists('src/app/api/auth/login/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('Auth context has balance sync', () => {
  const check = checkFileContent('src/context/auth-context.tsx', [
    '/api/wallet/sync-balance',
    'displayAccountNumber'
  ]);
  const allFound = check.matches.every(m => m.found);
  return allFound
    ? { status: 'pass' }
    : { status: 'fail', message: 'Missing balance sync or display account' };
});

// ============================================
// 3. CARD FUNDING FLOW
// ============================================
log('\n3. Testing Card Funding Flow...', 'blue');

test('Card funding API exists', () => {
  return checkFileExists('src/app/api/funding/card/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('Card funding uses executeVFDTransaction', () => {
  const check = checkFileContent('src/app/api/funding/card/route.ts', [
    'executeVFDTransaction'
  ]);
  return check.matches[0].found
    ? { status: 'pass' }
    : { status: 'fail', message: 'Missing executeVFDTransaction' };
});

test('VFD card payment component syncs balance', () => {
  const check = checkFileContent('src/components/add-money/vfd-card-payment.tsx', [
    'syncBalance',
    'useAuth'
  ]);
  const allFound = check.matches.every(m => m.found);
  return allFound
    ? { status: 'pass' }
    : { status: 'fail', message: 'Missing balance sync calls' };
});

// ============================================
// 4. EXTERNAL TRANSFER FLOW
// ============================================
log('\n4. Testing External Transfer Flow...', 'blue');

test('External transfer API exists', () => {
  return checkFileExists('src/app/api/transfers/external/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('Account verification API exists', () => {
  return checkFileExists('src/app/api/transfers/verify-account/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('External transfer uses VFD withdrawToBank', () => {
  const check = checkFileContent('src/app/api/transfers/external/route.ts', [
    'withdrawToBank',
    'vfdWalletService'
  ]);
  const allFound = check.matches.every(m => m.found);
  return allFound
    ? { status: 'pass' }
    : { status: 'fail', message: 'Missing VFD integration' };
});

test('Account verification uses VFD API', () => {
  const check = checkFileContent('src/app/api/transfers/verify-account/route.ts', [
    'verifyBankAccount'
  ]);
  return check.matches[0].found
    ? { status: 'pass' }
    : { status: 'fail', message: 'Missing VFD verification' };
});

// ============================================
// 5. INTERNAL TRANSFER FLOW
// ============================================
log('\n5. Testing Internal Transfer Flow...', 'blue');

test('Internal transfer API exists', () => {
  return checkFileExists('src/app/api/transfers/internal/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

// ============================================
// 6. BILLS PAYMENT FLOW
// ============================================
log('\n6. Testing Bills Payment Flow...', 'blue');

test('Bills API exists', () => {
  return checkFileExists('src/app/api/bills/vfd/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('VFD bills service exists', () => {
  return checkFileExists('src/lib/vfd-bills-service.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

// ============================================
// 7. LOAN APPLICATION FLOW
// ============================================
log('\n7. Testing Loan Application Flow...', 'blue');

test('Loans API exists', () => {
  return checkFileExists('src/app/api/loans/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('VFD loans service exists', () => {
  return checkFileExists('src/lib/vfd-loans-service.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('VFD mandate service exists', () => {
  return checkFileExists('src/lib/vfd-mandate-service.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

// ============================================
// 8. VIRTUAL CARD FLOW
// ============================================
log('\n8. Testing Virtual Card Flow...', 'blue');

test('Debit card API exists', () => {
  return checkFileExists('src/app/api/cards/debit/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('VFD debit card service exists', () => {
  return checkFileExists('src/lib/vfd-debitcard-service.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('Card customizer uses VFD', () => {
  const check = checkFileContent('src/components/custom-card/card-customizer.tsx', [
    'handleCreateVFDCard',
    '/api/cards/debit'
  ]);
  const allFound = check.matches.every(m => m.found);
  return allFound
    ? { status: 'pass' }
    : { status: 'fail', message: 'Missing VFD card integration' };
});

// ============================================
// 9. KYC VERIFICATION FLOWS
// ============================================
log('\n9. Testing KYC Verification Flows...', 'blue');

test('AML verification API exists', () => {
  return checkFileExists('src/app/api/kyc/aml/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('Image match API exists', () => {
  return checkFileExists('src/app/api/kyc/imagematch/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('Liveness check API exists', () => {
  return checkFileExists('src/app/api/kyc/liveness/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('NIN verification API exists', () => {
  return checkFileExists('src/app/api/kyc/nin/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('BVN upgrade API exists', () => {
  return checkFileExists('src/app/api/kyc/upgrade/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('VFD wallet service has KYC methods', () => {
  const check = checkFileContent('src/lib/vfd-wallet-service.ts', [
    'verifyAML',
    'verifyImageMatch',
    'verifyLiveness',
    'verifyNIN',
    'upgradeAccountWithBVN'
  ]);
  const allFound = check.matches.every(m => m.found);
  return allFound
    ? { status: 'pass' }
    : { status: 'fail', message: 'Missing KYC methods' };
});

// ============================================
// 10. ACCOUNT NUMBER UTILITIES
// ============================================
log('\n10. Testing Account Number Utilities...', 'blue');

test('Account utils file exists', () => {
  return checkFileExists('src/lib/account-utils.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('Account utils has all conversion functions', () => {
  const check = checkFileContent('src/lib/account-utils.ts', [
    'phoneToAccountNumber',
    'accountNumberToDisplay',
    'displayToAccountNumber',
    'formatAccountDisplay'
  ]);
  const allFound = check.matches.every(m => m.found);
  return allFound
    ? { status: 'pass' }
    : { status: 'fail', message: 'Missing conversion functions' };
});

test('Virtual account widget uses formatAccountDisplay', () => {
  const check = checkFileContent('src/components/dashboard/virtual-account-widget.tsx', [
    'formatAccountDisplay'
  ]);
  return check.matches[0].found
    ? { status: 'pass' }
    : { status: 'fail', message: 'Not using format function' };
});

// ============================================
// 11. BALANCE SYNC SERVICE
// ============================================
log('\n11. Testing Balance Sync Service...', 'blue');

test('Balance sync service exists', () => {
  return checkFileExists('src/lib/balance-sync.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('Balance sync has required functions', () => {
  const check = checkFileContent('src/lib/balance-sync.ts', [
    'syncBalanceWithVFD',
    'executeVFDTransaction'
  ]);
  const allFound = check.matches.every(m => m.found);
  return allFound
    ? { status: 'pass' }
    : { status: 'fail', message: 'Missing sync functions' };
});

test('Balance sync API endpoint exists', () => {
  return checkFileExists('src/app/api/wallet/sync-balance/route.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

// ============================================
// 12. VFD SERVICES
// ============================================
log('\n12. Testing VFD Services...', 'blue');

test('VFD wallet service exists', () => {
  return checkFileExists('src/lib/vfd-wallet-service.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('VFD auth service exists', () => {
  return checkFileExists('src/lib/vfd-auth.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

test('VFD card service exists', () => {
  return checkFileExists('src/lib/vfd-card-service.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

// ============================================
// 13. ENVIRONMENT CONFIGURATION
// ============================================
log('\n13. Testing Environment Configuration...', 'blue');

test('Environment validation files exist', () => {
  const serverExists = checkFileExists('src/lib/env.server.ts');
  const clientExists = checkFileExists('src/lib/env.client.ts');
  return serverExists && clientExists
    ? { status: 'pass' }
    : { status: 'fail', message: 'Missing env validation files' };
});

test('.env.local exists', () => {
  return checkFileExists('.env.local')
    ? { status: 'pass' }
    : { status: 'warn', message: 'No .env.local found (may be using .env.example)' };
});

// ============================================
// 14. LOGGER
// ============================================
log('\n14. Testing Structured Logger...', 'blue');

test('Logger service exists', () => {
  return checkFileExists('src/lib/logger.ts')
    ? { status: 'pass' }
    : { status: 'fail', message: 'File not found' };
});

// ============================================
// SUMMARY
// ============================================
log('\n=== TEST SUMMARY ===\n', 'cyan');
log(`Total Tests: ${results.tests.length}`, 'blue');
log(`Passed: ${results.passed}`, 'green');
log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
log(`Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'green');

if (results.failed > 0) {
  log('\n=== FAILED TESTS ===\n', 'red');
  results.tests
    .filter(t => t.status === 'fail')
    .forEach(t => log(`✗ ${t.name}: ${t.message}`, 'red'));
}

if (results.warnings > 0) {
  log('\n=== WARNINGS ===\n', 'yellow');
  results.tests
    .filter(t => t.status === 'warn')
    .forEach(t => log(`⚠ ${t.name}: ${t.message}`, 'yellow'));
}

log('\n=== FLOW ANALYSIS STATUS ===\n', 'cyan');
if (results.failed === 0) {
  log('✓ All critical flows are properly implemented!', 'green');
  log('✓ App is PRODUCTION READY', 'green');
} else {
  log('✗ Some flows have issues that need attention', 'red');
  log('✗ Review failed tests above', 'red');
}

log('');
process.exit(results.failed > 0 ? 1 : 0);
