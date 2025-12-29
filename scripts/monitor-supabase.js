const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (url, options = {}) => {
      const start = Date.now();
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000)
      }).then(res => {
        const duration = Date.now() - start;
        console.log(`   ⏱️  Request took ${duration}ms`);
        return res;
      }).catch(err => {
        const duration = Date.now() - start;
        console.log(`   ❌ Request failed after ${duration}ms: ${err.message}`);
        throw err;
      });
    }
  }
});

async function testConnection() {
  console.log('🔍 Testing Supabase Connection\n');
  console.log(`📍 URL: ${supabaseUrl}\n`);

  const tests = [
    {
      name: 'Health Check',
      fn: async () => {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) throw error;
        return 'OK';
      }
    },
    {
      name: 'Query Performance',
      fn: async () => {
        const start = Date.now();
        const { data, error } = await supabase.from('users').select('id').limit(10);
        const duration = Date.now() - start;
        if (error) throw error;
        return `${duration}ms`;
      }
    },
    {
      name: 'Connection Pooling',
      fn: async () => {
        const promises = Array(5).fill(null).map(() => 
          supabase.from('users').select('count').limit(1)
        );
        const start = Date.now();
        await Promise.all(promises);
        const duration = Date.now() - start;
        return `5 concurrent queries in ${duration}ms`;
      }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🧪 ${test.name}...`);
      const result = await test.fn();
      console.log(`   ✅ ${result}\n`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
    }
  }

  console.log('✨ Connection test complete!');
}

async function monitorConnections(intervalSeconds = 30) {
  console.log(`📊 Monitoring Supabase connections every ${intervalSeconds}s`);
  console.log('Press Ctrl+C to stop\n');

  let successCount = 0;
  let failureCount = 0;
  let totalLatency = 0;

  setInterval(async () => {
    const start = Date.now();
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      const latency = Date.now() - start;
      
      if (error) throw error;
      
      successCount++;
      totalLatency += latency;
      const avgLatency = Math.round(totalLatency / successCount);
      
      console.log(`✅ [${new Date().toISOString()}] Success (${latency}ms) | Avg: ${avgLatency}ms | Success: ${successCount} | Failures: ${failureCount}`);
    } catch (error) {
      failureCount++;
      const latency = Date.now() - start;
      console.log(`❌ [${new Date().toISOString()}] Failed (${latency}ms) | ${error.message} | Success: ${successCount} | Failures: ${failureCount}`);
    }
  }, intervalSeconds * 1000);
}

const command = process.argv[2];

if (command === 'monitor') {
  const interval = parseInt(process.argv[3]) || 30;
  monitorConnections(interval);
} else {
  testConnection();
}
