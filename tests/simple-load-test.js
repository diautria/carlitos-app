#!/usr/bin/env node

/**
 * Simple Load Testing Script for BebecioApp
 * 
 * Usage:
 * node tests/simple-load-test.js --vus=10 --duration=60
 * 
 * No external dependencies required, uses native Node.js http module
 */

const http = require('http');
const url = require('url');

// Parse command line arguments
const args = process.argv.slice(2);
let VUS = 10;
let DURATION = 60; // segundos
let BASE_URL = 'http://localhost:8100';

for (let arg of args) {
  if (arg.startsWith('--vus=')) VUS = parseInt(arg.split('=')[1]);
  if (arg.startsWith('--duration=')) DURATION = parseInt(arg.split('=')[1]);
  if (arg.startsWith('--url=')) BASE_URL = arg.split('=')[1];
}

// Metrics
const metrics = {
  requests: 0,
  responses: 0,
  errors: 0,
  totalTime: 0,
  latencies: [],
  statusCodes: {},
};

const startTime = Date.now();
let activeRequests = 0;
let testRunning = true;

// Helper to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve) => {
    const urlObj = new URL(path, BASE_URL);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent': 'BebecioApp-LoadTest/1.0',
      },
    };

    const requestStart = Date.now();
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const latency = Date.now() - requestStart;
        metrics.responses++;
        metrics.latencies.push(latency);
        metrics.statusCodes[res.statusCode] = (metrics.statusCodes[res.statusCode] || 0) + 1;
        resolve();
      });
    });

    req.on('error', (err) => {
      metrics.errors++;
      resolve();
    });

    req.on('timeout', () => {
      metrics.errors++;
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// Virtual User function
async function virtualUser(userId) {
  const endpoints = [
    '/',
    '/index.html',
    '/assets/icon/favicon.png',
  ];

  while (testRunning) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    activeRequests++;
    metrics.requests++;

    try {
      await makeRequest(endpoint);
    } catch (err) {
      metrics.errors++;
    }

    activeRequests--;
    
    // Random think time between 0.5-2 seconds
    await new Promise(r => setTimeout(r, Math.random() * 1500 + 500));
  }
}

// Main test execution
async function runTest() {
  console.log(`
╔════════════════════════════════════╗
║  BebecioApp - Load Test            ║
╚════════════════════════════════════╝

📊 Configuration:
   Virtual Users: ${VUS}
   Duration: ${DURATION}s
   Target URL: ${BASE_URL}
   Start Time: ${new Date().toLocaleTimeString()}

Starting test...
`);

  // Start all VUs
  const vuPromises = [];
  for (let i = 0; i < VUS; i++) {
    vuPromises.push(virtualUser(i));
  }

  // Print real-time stats every 5 seconds
  const statInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const throughput = (metrics.responses / elapsed).toFixed(2);
    const avgLatency = metrics.latencies.length > 0
      ? (metrics.latencies.reduce((a, b) => a + b) / metrics.latencies.length).toFixed(0)
      : 0;

    process.stdout.write(`\r  ⏱️  ${elapsed.toFixed(1)}s | Requests: ${metrics.responses} | Throughput: ${throughput} req/s | Avg Latency: ${avgLatency}ms`);
  }, 5000);

  // Wait for test duration
  await new Promise(r => setTimeout(r, DURATION * 1000));

  // Stop test
  testRunning = false;
  clearInterval(statInterval);

  // Wait for pending requests
  console.log('\n\n⏸️  Stopping test...');
  while (activeRequests > 0) {
    await new Promise(r => setTimeout(r, 100));
  }

  // Calculate metrics
  const totalTime = Date.now() - startTime;
  const latenciesSorted = metrics.latencies.sort((a, b) => a - b);
  const p50 = latenciesSorted[Math.floor(latenciesSorted.length * 0.50)];
  const p95 = latenciesSorted[Math.floor(latenciesSorted.length * 0.95)];
  const p99 = latenciesSorted[Math.floor(latenciesSorted.length * 0.99)];
  const avgLatency = latenciesSorted.reduce((a, b) => a + b, 0) / latenciesSorted.length;
  const throughput = (metrics.responses / (totalTime / 1000)).toFixed(2);
  const errorRate = ((metrics.errors / metrics.requests) * 100).toFixed(2);
  const successRate = ((metrics.responses / metrics.requests) * 100).toFixed(2);

  // Display results
  console.log(`
╔════════════════════════════════════╗
║  Test Results                      ║
╚════════════════════════════════════╝

📈 Request Metrics:
   Total Requests: ${metrics.requests}
   Successful: ${metrics.responses} (${successRate}%)
   Failed: ${metrics.errors} (${errorRate}%)
   Throughput: ${throughput} req/s

⏱️  Latency (ms):
   Avg: ${avgLatency.toFixed(0)}ms
   P50: ${p50}ms
   P95: ${p95}ms ⚠️  (Threshold: < 2000ms)
   P99: ${p99}ms
   Max: ${latenciesSorted[latenciesSorted.length - 1]}ms

📊 Status Codes:
${Object.entries(metrics.statusCodes)
  .sort((a, b) => b[1] - a[1])
  .map(([code, count]) => `   ${code}: ${count}`)
  .join('\n')}

⏰ Duration: ${(totalTime / 1000).toFixed(2)}s

${errorRate > 5 ? '🔴 FAIL - Error rate > 5%' : (p95 > 2000 ? '⚠️  ALERT - P95 > 2000ms' : '✅ PASS')}
`);

  process.exit(metrics.errors > 0 ? 1 : 0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Interrupted by user');
  testRunning = false;
});

// Run test
runTest().catch(console.error);
