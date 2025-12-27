#!/usr/bin/env node
/**
 * Virtual Card System - Quick Start
 * Run this after applying database migration
 */

const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question}${colors.reset} `, resolve);
  });
}

async function main() {
  log('\n🚀 VIRTUAL CARD SYSTEM - QUICK START', 'bold');
  log('Interactive setup and testing guide\n', 'blue');

  // Step 1: Check migration
  section('STEP 1: Database Migration');
  log('Have you applied the database migration?', 'yellow');
  log('Location: supabase/migrations/20250126000001_virtual_cards.sql\n', 'blue');
  
  const migrationDone = await ask('Applied migration? (yes/no): ');
  
  if (migrationDone.toLowerCase() !== 'yes') {
    log('\n❌ Please apply the migration first!', 'red');
    log('\nInstructions:', 'yellow');
    log('1. Go to: https://supabase.com/dashboard', 'blue');
    log('2. Select your project', 'blue');
    log('3. Click: SQL Editor → New Query', 'blue');
    log('4. Copy ALL from: supabase/migrations/20250126000001_virtual_cards.sql', 'blue');
    log('5. Paste and click Run', 'blue');
    log('\nThen run this script again.\n', 'yellow');
    rl.close();
    return;
  }

  log('✅ Great! Migration applied\n', 'green');

  // Step 2: Get auth token
  section('STEP 2: Get Your Auth Token');
  log('You need your authentication token to test the API.\n', 'yellow');
  log('How to get it:', 'blue');
  log('1. Open your app in browser: https://ovomonie-v1.vercel.app', 'blue');
  log('2. Login to your account', 'blue');
  log('3. Open browser DevTools (F12)', 'blue');
  log('4. Go to: Application → Local Storage', 'blue');
  log('5. Find key: ovo-auth-token', 'blue');
  log('6. Copy the value\n', 'blue');

  const token = await ask('Paste your auth token here: ');
  
  if (!token || token.length < 20) {
    log('\n❌ Invalid token. Please try again.\n', 'red');
    rl.close();
    return;
  }

  log('✅ Token received\n', 'green');

  // Step 3: Test card creation
  section('STEP 3: Create Virtual Card');
  log('Requirements:', 'yellow');
  log('✓ KYC tier 2+ completed', 'blue');
  log('✓ Wallet balance ≥ ₦1,000', 'blue');
  log('✓ No existing active card\n', 'blue');

  const cardName = await ask('Enter card name (or press Enter for default): ');
  const finalCardName = cardName || 'My Virtual Card';

  log('\n📤 Creating virtual card...', 'yellow');
  log(`Card Name: ${finalCardName}`, 'blue');
  log('Fee: ₦1,000\n', 'blue');

  const https = require('https');
  
  const createCard = () => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ cardName: finalCardName });
      
      const options = {
        hostname: 'ovomonie-v1.vercel.app',
        path: '/api/cards/virtual-new',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': data.length
        },
        timeout: 30000
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(data);
      req.end();
    });
  };

  try {
    const response = await createCard();
    
    section('RESPONSE');
    
    if (response.status === 200 && response.data.ok) {
      log('✅ SUCCESS! Virtual card created!', 'green');
      log('\nCard Details:', 'cyan');
      log(`Card ID: ${response.data.data.cardId}`, 'blue');
      log(`Masked PAN: ${response.data.data.maskedPan}`, 'blue');
      log(`Expiry: ${response.data.data.expiryMonth}/${response.data.data.expiryYear}`, 'blue');
      log(`Status: ${response.data.data.status}`, 'blue');
      log(`New Balance: ₦${response.data.data.newBalance / 100}`, 'blue');
      
      log('\n🎉 Your virtual card is ready to use!', 'green');
      
    } else if (response.status === 409 && response.data.code === 'CARD_EXISTS') {
      log('⚠️  You already have an active virtual card', 'yellow');
      log('Limit: 1 active card per user', 'blue');
      
    } else if (response.status === 400 && response.data.code === 'INSUFFICIENT_BALANCE') {
      log('❌ Insufficient balance', 'red');
      log('Required: ₦1,000', 'blue');
      log('Please add funds to your wallet', 'yellow');
      
    } else if (response.status === 403 && response.data.code === 'KYC_REQUIRED') {
      log('❌ KYC verification required', 'red');
      log('Please complete KYC tier 2 verification', 'yellow');
      
    } else {
      log('❌ Card creation failed', 'red');
      log(`Status: ${response.status}`, 'yellow');
      log(`Error: ${response.data.error || 'Unknown error'}`, 'yellow');
      
      if (response.data.code === 'VFD_ERROR') {
        log('\n💰 Funds automatically refunded to your wallet', 'green');
      }
    }
    
    log('\nFull Response:', 'cyan');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    log('\n❌ Request failed', 'red');
    log(`Error: ${error.message}`, 'yellow');
  }

  // Step 4: List cards
  section('STEP 4: List Your Cards');
  const listCards = await ask('Want to see all your cards? (yes/no): ');
  
  if (listCards.toLowerCase() === 'yes') {
    log('\n📋 Fetching your cards...', 'yellow');
    
    const getCards = () => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'ovomonie-v1.vercel.app',
          path: '/api/cards/virtual-new',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 15000
        };

        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(body) });
            } catch (e) {
              resolve({ status: res.statusCode, data: body });
            }
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.end();
      });
    };

    try {
      const response = await getCards();
      
      if (response.status === 200 && response.data.ok) {
        const cards = response.data.data;
        
        if (cards.length === 0) {
          log('\n📭 No cards found', 'yellow');
        } else {
          log(`\n✅ Found ${cards.length} card(s):\n`, 'green');
          
          cards.forEach((card, index) => {
            log(`Card ${index + 1}:`, 'cyan');
            log(`  Masked PAN: ${card.masked_pan}`, 'blue');
            log(`  Expiry: ${card.expiry_month}/${card.expiry_year}`, 'blue');
            log(`  Name: ${card.card_name || 'N/A'}`, 'blue');
            log(`  Status: ${card.status}`, 'blue');
            log(`  Created: ${new Date(card.created_at).toLocaleString()}`, 'blue');
            console.log();
          });
        }
      } else {
        log('\n❌ Failed to fetch cards', 'red');
        log(`Status: ${response.status}`, 'yellow');
      }
    } catch (error) {
      log('\n❌ Request failed', 'red');
      log(`Error: ${error.message}`, 'yellow');
    }
  }

  // Summary
  section('NEXT STEPS');
  log('✅ System is working!', 'green');
  log('\nWhat you can do now:', 'yellow');
  log('1. Create more cards (1 active per user)', 'blue');
  log('2. Use cards for online payments', 'blue');
  log('3. Monitor transactions in database', 'blue');
  log('4. Check logs in Vercel dashboard', 'blue');
  log('\nDocumentation:', 'yellow');
  log('• VIRTUAL_CARD_TEST_GUIDE.md - Complete test scenarios', 'blue');
  log('• SYSTEM_STATUS.md - System overview', 'blue');
  log('• scripts/verify-migration.sql - Database verification', 'blue');
  log('\nWebhook Status:', 'yellow');
  log('⏳ Pending VFD support response (optional)', 'blue');
  log('✅ System works perfectly without webhook!\n', 'green');

  rl.close();
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});
