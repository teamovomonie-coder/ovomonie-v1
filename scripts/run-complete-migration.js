#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

function runScript(scriptPath, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 ${description}`);
    console.log('='.repeat(50));
    
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${description} completed successfully`);
        resolve();
      } else {
        console.log(`\n❌ ${description} failed with exit code ${code}`);
        reject(new Error(`Script failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`\n❌ Failed to start ${description}:`, error.message);
      reject(error);
    });
  });
}

async function main() {
  console.log('🎯 Ovomonie Database Migration & Verification Pipeline');
  console.log('====================================================');
  
  const scriptsDir = __dirname;
  
  try {
    // Step 1: Apply migration
    await runScript(
      path.join(scriptsDir, 'apply-migration-0004.js'),
      'Applying Migration 0004 & Foreign Key Constraints'
    );
    
    // Step 2: Verify results
    await runScript(
      path.join(scriptsDir, 'verify-migration-0004.js'),
      'Verifying Database Schema & Constraints'
    );
    
    console.log('\n🎉 Migration Pipeline Completed Successfully!');
    console.log('\n📝 Summary:');
    console.log('✅ Migration 0004 applied');
    console.log('✅ Foreign key constraints added');
    console.log('✅ Database schema verified');
    console.log('\n🚀 Your database is now ready for production!');
    
  } catch (error) {
    console.error('\n❌ Migration pipeline failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env.local file has correct Supabase credentials');
    console.log('2. Ensure your Supabase project is accessible');
    console.log('3. Verify you have the necessary permissions');
    console.log('4. Run individual scripts manually if needed');
    process.exit(1);
  }
}

main();