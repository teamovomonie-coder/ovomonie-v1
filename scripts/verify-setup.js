#!/usr/bin/env node

/**
 * Ovomonie Setup Verification Script
 * Checks if all required components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Ovomonie Setup Verification\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
console.log(`📦 Node.js version: ${nodeVersion}`);
if (majorVersion < 20) {
  console.log('❌ Node.js 20+ required');
  process.exit(1);
} else {
  console.log('✅ Node.js version OK');
}

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.log('❌ package.json not found');
  process.exit(1);
}
console.log('✅ package.json found');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('❌ node_modules not found. Run: npm install');
  process.exit(1);
}
console.log('✅ Dependencies installed');

// Check environment file
if (!fs.existsSync('.env.local')) {
  console.log('❌ .env.local not found. Copy from .env.example');
  process.exit(1);
}
console.log('✅ Environment file found');

// Load and check environment variables
require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'AUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = [];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}
console.log('✅ Required environment variables set');

// Check Supabase URL format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.log('❌ Invalid Supabase URL format');
  process.exit(1);
}
console.log('✅ Supabase URL format valid');

// Check AUTH_SECRET strength
const authSecret = process.env.AUTH_SECRET;
if (authSecret.length < 32) {
  console.log('⚠️  AUTH_SECRET should be at least 32 characters long');
} else {
  console.log('✅ AUTH_SECRET length OK');
}

// Check key directories exist
const keyDirs = [
  'src/app',
  'src/components',
  'src/lib',
  'src/context'
];

keyDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`❌ Directory missing: ${dir}`);
    process.exit(1);
  }
});
console.log('✅ Key directories present');

// Check key files exist
const keyFiles = [
  'src/lib/supabase.ts',
  'src/lib/auth.ts',
  'src/lib/db.ts',
  'src/context/auth-context.tsx',
  'src/app/layout.tsx'
];

keyFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`❌ Key file missing: ${file}`);
    process.exit(1);
  }
});
console.log('✅ Key files present');

// Check if TypeScript config is valid
if (!fs.existsSync('tsconfig.json')) {
  console.log('❌ tsconfig.json not found');
  process.exit(1);
}
console.log('✅ TypeScript configuration found');

// Check if Tailwind config exists
if (!fs.existsSync('tailwind.config.ts')) {
  console.log('❌ tailwind.config.ts not found');
  process.exit(1);
}
console.log('✅ Tailwind configuration found');

// Optional checks
console.log('\n🔧 Optional Features:');

const optionalEnvVars = [
  'VFD_ACCESS_TOKEN',
  'VFD_CONSUMER_KEY',
  'VFD_CONSUMER_SECRET',
  'GEMINI_API_KEY'
];

optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName} configured`);
  } else {
    console.log(`⚪ ${varName} not configured (optional)`);
  }
});

console.log('\n🎉 Setup verification complete!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm run dev');
console.log('2. Open: http://localhost:3000');
console.log('3. Test user registration and login');
console.log('4. Verify database operations in Supabase dashboard');
console.log('\n📚 See SUPABASE_SETUP_GUIDE.md for detailed instructions');