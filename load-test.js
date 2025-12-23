import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'], // Error rate under 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'https://ovomonie-v1.vercel.app/api';

// Test data
const testUser = {
  phone: '+2349034151086',
  pin: '123456'
};

export default function () {
  // Login test
  const loginResponse = http.post(`${BASE_URL}/auth/login`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'login returns token': (r) => JSON.parse(r.body).token !== undefined,
  });

  errorRate.add(!loginSuccess);

  if (loginSuccess) {
    const token = JSON.parse(loginResponse.body).token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Test dashboard data loading
    const dashboardResponse = http.get(`${BASE_URL}/user/dashboard`, { headers });
    check(dashboardResponse, {
      'dashboard status is 200': (r) => r.status === 200,
      'dashboard response time < 300ms': (r) => r.timings.duration < 300,
    });

    // Test transfer endpoint
    const transferData = {
      recipientAccountNumber: '1234567891',
      amount: 1000,
      narration: 'Load test transfer',
      clientReference: `LOAD_TEST_${Date.now()}_${Math.random()}`
    };

    const transferResponse = http.post(`${BASE_URL}/transfers/internal`, 
      JSON.stringify(transferData), { headers });
    
    check(transferResponse, {
      'transfer response time < 1000ms': (r) => r.timings.duration < 1000,
      'transfer handles load': (r) => r.status === 200 || r.status === 400, // 400 for insufficient funds is OK
    });

    // Test bills endpoint
    const billsResponse = http.get(`${BASE_URL}/bills/categories`, { headers });
    check(billsResponse, {
      'bills status is 200': (r) => r.status === 200,
      'bills response time < 200ms': (r) => r.timings.duration < 200,
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
    Load Test Summary:
    ==================
    Total Requests: ${data.metrics.http_reqs.count}
    Failed Requests: ${data.metrics.http_req_failed.count}
    Average Response Time: ${data.metrics.http_req_duration.avg.toFixed(2)}ms
    95th Percentile: ${data.metrics['http_req_duration{p(95)}'].toFixed(2)}ms
    Error Rate: ${(data.metrics.errors.rate * 100).toFixed(2)}%
    `,
  };
}