import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { randomIntBetween, randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

/**
 * Script de Load Testing para BebecioApp
 * 
 * Uso:
 * k6 run load-test-api.js --vus=50 --duration=5m
 * k6 run load-test-api.js --vus=100 --duration=10m --rps=500
 * 
 * Configuración con archivo .env:
 * export BASE_URL="https://your-api.com"
 * export AUTH_TOKEN="your-token"
 */

export const options = {
  // Ramping up to 50 users over 2 minutes, stay for 8, ramp down for 2
  stages: [
    { duration: '2m', target: 50 },
    { duration: '8m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  
  // Thresholds - límites de aceptación
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_duration{staticAsset:yes}': ['p(99)<1000'],
    'http_req_failed': ['rate<0.1'],
    'group_duration': ['p(95)<3000'],
  },
  
  // Custom metrics
  ext: {
    loadimpact: {
      name: 'BebecioApp API Load Test',
      projectID: 3356,
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8100';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// User data
const userIds = Array.from({ length: 100 }, (_, i) => `user_${i}`);
const bebeIds = Array.from({ length: 500 }, (_, i) => `bebe_${i}`);

export default function () {
  const userId = userIds[randomIntBetween(0, userIds.length - 1)];
  const token = AUTH_TOKEN || `Bearer token_${userId}`;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Grupo 1: GET a la raíz (health check)
  group('GET /', () => {
    const response = http.get(
      `${BASE_URL}/`,
      { headers, tags: { group: 'read' } }
    );

    check(response, {
      'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });

    sleep(randomIntBetween(1, 2));
  });

  // Grupo 2: Obtener actividades de un bebé
  group('GET /Simular navegación a assets (menos crítico)
  group('GET /assets', () => {
    const response = http.get(
      `${BASE_URL}/assets/icon/favicon.png`,
      { headers, tags: { group: 'read' } }
    );

    check(response, {
      'status 200/404': (r) => r.status === 200 || r.status === 404,
      'response time < 1.5s': (r) => r.timings.duration < 150

    sleep(randomIntBetween(1, 3));
  });

  // Grupo 3: Crear actividad (40% probabilidad)
  if (randomIntBetween(1, 10) <= 4) {
    group('POST /api/actividades', () => {
      const beSolicitud de chunks (simulación de carga de assets)
  if (randomIntBetween(1, 10) <= 4) {
    group('GET /chunks', () => {
      const chunks = ['chunk-23B7CO4Z.js', 'chunk-2JWSTSPG.js', 'chunk-2KSWREQA.js'];
      const chunk = chunks[randomIntBetween(0, chunks.length - 1)];
      
      const response = http.get(
        `${BASE_URL}/${chunk}`,
        { headers, tags: { group: 'read' } }
      );

      check(response, {
        'chunk loaded or not found': (r) => r.status === 200 || r.status === 404,
        'response time < 2s': (r) => r.timings.duration < 2000
    });
  }

  // Grupo 4: Obtener notificaciones
  group('GET /api/notificaciones', () => {
    const response = http.get(
      `${BASE_URL}/api/users/${userId}/notificaciones?limit=50`,
      { headers, tags: { group: 'read' } }
    );

    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 1s': (r) => r.timings.duration < 1000,
    });

    sleep(randomIntBetween(2, 4));
  });Cargar HTML principal
  group('GET /index.html', () => {
    const response = http.get(
      `${BASE_URL}/index.html`,
      { headers, tags: { group: 'read' } }
    );

    check(response, {
      'status is 200 or 404': (r) => r.status === 200 || r.status === 404

      const response = http.put(
        `${BASE_URL}/api/users/${userId}/profile`,
        JSON.stringify(profileData),
        { headCargar styles (20% probabilidad)
  if (randomIntBetween(1, 10) <= 2) {
    group('GET /styles.css', () => {
      const response = http.get(
        `${BASE_URL}/styles.css`,
        { headers, tags: { group: 'read' } }
      );

      check(response, {
        'status 200/404': (r) => r.status === 200 || r.status === 404
 * Setup - Ejecutado una sola vez antes de todo
 */
export function setup() {
  console.log('Setup: Preparando datos de prueba...');
  console.log(`Base URL: ${BASE_URL}`);
  
  // Simplemente esperar a que servidor responda
  let attempts = 0;
  while (attempts < 10) {
    try {
      const response = http.get(`${BASE_URL}`, { timeout: '5s' });
      if (response.status === 200 || response.status === 404) {
        console.log('✓ Servidor disponible');
        return { testStart: Date.now() };
      }
    } catch (e) {
      console.log(`Intento ${attempts + 1}/10 - Esperando servidor...`);
      attempts++;
    }
  }
  
  console.warn('⚠️ No se pudo conectar al servidor');
  return { testStart: Date.now() };
}

/**
 * Teardown - Ejecutado una sola vez al final
 */
export function teardown(data) {
  console.log('Teardown: Test finalizado');
  console.log(`Duración total: ${(Date.now() - data.testStart) / 1000}s`);
}

/**
 * Handles - Manejo de ciclo de vida
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

// Helper function for text summary
function textSummary(data, options) {
  const { indent = '', enableColors = false } = options;
  let summary = '\n\n=== Test Summary ===\n';
  
  summary += `Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += `Success Rate: ${((1 - data.metrics.http_req_failed?.value) * 100).toFixed(2)}%\n`;
  summary += `Requests: ${data.metrics.http_reqs?.value}\n`;
  summary += `Errors: ${data.metrics.http_req_failed?.value}\n`;
  
  return summary;
}
