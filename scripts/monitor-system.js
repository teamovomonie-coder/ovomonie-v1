#!/usr/bin/env node
/**
 * Virtual Card System - Real-Time Monitor
 * Monitors API health, response times, and system status
 */

const https = require('https');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(msg, color = 'reset') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors.gray}[${timestamp}]${colors.reset} ${colors[color]}${msg}${colors.reset}`);
}

const BASE_URL = 'ovomonie-v1.vercel.app';
const INTERVAL = 30000; // 30 seconds

let stats = {
  checks: 0,
  successes: 0,
  failures: 0,
  avgResponseTime: 0,
  responseTimes: [],
};

// Check API health
async function checkAPIHealth() {
  const start = Date.now();
  
  return new Promise((resolve) => {
    const req = https.request({
      hostname: BASE_URL,
      path: '/api/cards/virtual-new',
      method: 'GET',
      timeout: 15000,
    }, (res) => {
      const responseTime = Date.now() - start;
      stats.responseTimes.push(responseTime);
      if (stats.responseTimes.length > 10) stats.responseTimes.shift();
      
      stats.checks++;
      
      if (res.statusCode === 401) {
        stats.successes++;
        log(`✅ API Health: OK (${responseTime}ms) - Status: ${res.statusCode}`, 'green');
      } else {
        stats.failures++;
        log(`⚠️  API Health: Unexpected status ${res.statusCode} (${responseTime}ms)`, 'yellow');
      }
      
      resolve({ success: true, responseTime });
    });

    req.on('error', (err) => {
      stats.checks++;
      stats.failures++;
      log(`❌ API Health: ERROR - ${err.message}`, 'red');
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      stats.checks++;
      stats.failures++;
      log('❌ API Health: TIMEOUT (>15s)', 'red');
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
}

// Check webhook endpoint
async function checkWebhookHealth() {
  const start = Date.now();
  
  return new Promise((resolve) => {
    const req = https.request({
      hostname: BASE_URL,
      path: '/api/webhooks/vfd-cards',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    }, (res) => {
      const responseTime = Date.now() - start;
      
      if (res.statusCode === 403) {
        log(`✅ Webhook: OK (${responseTime}ms) - Signature validation active`, 'green');
      } else {
        log(`⚠️  Webhook: Status ${res.statusCode} (${responseTime}ms)`, 'yellow');
      }
      
      resolve({ success: true, responseTime });
    });

    req.on('error', (err) => {
      log(`❌ Webhook: ERROR - ${err.message}`, 'red');
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      log('❌ Webhook: TIMEOUT', 'red');
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.write(JSON.stringify({ type: 'health_check' }));
    req.end();
  });
}

// Display statistics
function displayStats() {
  const avgTime = stats.responseTimes.length > 0
    ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
    : 0;
  
  const uptime = stats.checks > 0 ? ((stats.successes / stats.checks) * 100).toFixed(1) : 0;
  
  console.log('\n' + '─'.repeat(60));
  log('📊 STATISTICS', 'cyan');
  console.log('─'.repeat(60));
  log(`Total Checks: ${stats.checks}`, 'cyan');
  log(`Successes: ${stats.successes}`, 'green');
  log(`Failures: ${stats.failures}`, stats.failures > 0 ? 'red' : 'green');
  log(`Uptime: ${uptime}%`, uptime >= 95 ? 'green' : 'yellow');
  log(`Avg Response Time: ${avgTime}ms`, avgTime < 1000 ? 'green' : 'yellow');
  console.log('─'.repeat(60) + '\n');
}

// Monitor loop
async function monitor() {
  log('🚀 Starting Virtual Card System Monitor...', 'cyan');
  log(`Checking every ${INTERVAL / 1000} seconds`, 'cyan');
  log('Press Ctrl+C to stop\n', 'gray');

  // Initial check
  await checkAPIHealth();
  await checkWebhookHealth();
  displayStats();

  // Periodic checks
  setInterval(async () => {
    await checkAPIHealth();
    await checkWebhookHealth();
    
    // Display stats every 5 checks
    if (stats.checks % 5 === 0) {
      displayStats();
    }
  }, INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n\n🛑 Stopping monitor...', 'yellow');
  displayStats();
  log('Monitor stopped.\n', 'cyan');
  process.exit(0);
});

// Start monitoring
monitor().catch((err) => {
  log(`Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
