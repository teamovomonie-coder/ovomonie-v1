#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n=== OVOMONIE DIAGNOSTIC REPORT ===\n');

const issues = [];
const warnings = [];

// Check environment variables
console.log('1. Checking Environment Variables...');
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  issues.push('❌ .env.local file not found');
} else {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'AUTH_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VFD_API_BASE',
    'VFD_WALLET_API_BASE',
    'VFD_BILLS_API_BASE'
  ];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      issues.push(`❌ Missing env var: ${varName}`);
    }
  });
  
  if (envContent.includes('AUTH_SECRET=change-me')) {
    warnings.push('⚠️  AUTH_SECRET still has default value');
  }
}

// Check critical files
console.log('2. Checking Critical Files...');
const criticalFiles = [
  'src/lib/supabase.ts',
  'src/lib/auth.ts',
  'src/lib/balance-sync.ts',
  'src/lib/vfd-wallet-service.ts',
  'src/context/auth-context.tsx',
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/register/route.ts'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    issues.push(`❌ Missing file: ${file}`);
  }
});

// Check for common code issues
console.log('3. Checking for Common Issues...');

// Check supabase.ts
const supabasePath = path.join(__dirname, '..', 'src/lib/supabase.ts');
if (fs.existsSync(supabasePath)) {
  const content = fs.readFileSync(supabasePath, 'utf8');
  if (!content.includes('createClient')) {
    issues.push('❌ supabase.ts missing createClient import');
  }
}

// Check auth-context
const authContextPath = path.join(__dirname, '..', 'src/context/auth-context.tsx');
if (fs.existsSync(authContextPath)) {
  const content = fs.readFileSync(authContextPath, 'utf8');
  if (!content.includes('sync-balance')) {
    warnings.push('⚠️  auth-context missing balance sync');
  }
  if (!content.includes('displayAccountNumber')) {
    warnings.push('⚠️  auth-context missing displayAccountNumber');
  }
}

// Check package.json
console.log('4. Checking Dependencies...');
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = [
    '@supabase/supabase-js',
    'next',
    'react',
    'framer-motion'
  ];
  
  requiredDeps.forEach(dep => {
    if (!pkg.dependencies[dep]) {
      issues.push(`❌ Missing dependency: ${dep}`);
    }
  });
}

// Check node_modules
console.log('5. Checking Installation...');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  issues.push('❌ node_modules not found - run npm install');
}

// Report
console.log('\n=== RESULTS ===\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ No issues found! App should work correctly.\n');
} else {
  if (issues.length > 0) {
    console.log('CRITICAL ISSUES:');
    issues.forEach(issue => console.log(issue));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('WARNINGS:');
    warnings.forEach(warning => console.log(warning));
    console.log('');
  }
}

console.log('=== RECOMMENDATIONS ===\n');
console.log('1. Run: npm install');
console.log('2. Run: npm run typecheck');
console.log('3. Run: npm run lint');
console.log('4. Clear cache: rm -rf .next');
console.log('5. Start dev: npm run dev\n');

process.exit(issues.length > 0 ? 1 : 0);
