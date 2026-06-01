# 📖 Ejemplo Paso a Paso: Ejecutar Tu Primer Load Test

## Escenario: Detectar Cuello de Botella en AuthService

### 🎯 Objetivo
Determinar cuántos logins simultáneos puede procesar tu app antes de degradación.

---

## Paso 1: Preparación (5 minutos)

### 1.1 Abrir 3 terminales

```bash
# Terminal 1: Monitorear servidor
cd e:\bebecitoApp
npm start
# Esperar: ✓ Angular Live Development Server is listening on localhost:4200
```

```bash
# Terminal 2: Abrir otro prompt para tests
cd e:\bebecitoApp
# (sin ejecutar nada aún)
```

```bash
# Terminal 3: Monitoreo del sistema
# Windows:
tasklist /FI "node.exe" /V  # Refresh cada 5 seg
# O usar Task Manager (Ctrl+Shift+Esc)
```

### 1.2 Verificar conectividad

```bash
# Terminal 2 - Verificar que el servidor responde
curl http://localhost:4200/api/health
# Esperado: {"status":"ok"}
```

---

## Paso 2: Crear Test Específico para AuthService (10 minutos)

### 2.1 Crear archivo de test

Crear archivo: `tests/auth-load-test.js`

```javascript
/**
 * AuthService Load Test
 * Objetivo: Encontrar límite de logins simultáneos
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Métricas personalizadas
const failureRate = new Rate('login_failures');
const latencies = [];

export const options = {
  // Ramp-up: 0→50 usuarios en 2 min
  // Soak: 50 usuarios por 8 min
  // Ramp-down: 50→0 en 2 min
  stages: [
    { duration: '2m', target: 50 },  // Ramp-up
    { duration: '8m', target: 50 },  // Soak
    { duration: '2m', target: 0 },   // Ramp-down
  ],

  // Límites de aceptación
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'],
    'login_failures': ['rate<0.05'], // Menos del 5% fallos
    'http_req_failed': ['rate<0.1'],
  },

  vus: 50,
  duration: '12m',
};

const BASE_URL = 'http://localhost:4200';

export default function () {
  group('Login Flow', () => {
    // Generar usuario único
    const userId = `testuser_${__VU}_${__ITER}`;
    const email = `${userId}@test.local`;
    const password = 'TestPass123!';

    // Payload
    const loginPayload = JSON.stringify({
      email: email,
      password: password,
      rememberMe: true,
    });

    // 1. POST /api/auth/login
    const loginStart = Date.now();
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      loginPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        tags: { endpoint: 'login' },
      }
    );
    const loginDuration = Date.now() - loginStart;
    latencies.push(loginDuration);

    // Verificaciones
    const loginSuccess = check(loginRes, {
      'login returned 200': (r) => r.status === 200,
      'login returned token': (r) => r.json('data.token') !== null,
      'login time < 2s': (r) => loginDuration < 2000,
    });

    if (!loginSuccess) {
      failureRate.add(true);
      console.error(`Login failed for ${email}: ${loginRes.status} - ${loginRes.body}`);
      return; // Saltar resto de test
    }

    const token = loginRes.json('data.token');

    // 2. GET /api/me (usar token)
    sleep(0.5); // Pequeña pausa realista

    const meRes = http.get(
      `${BASE_URL}/api/me`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    check(meRes, {
      'GET /me returned 200': (r) => r.status === 200,
      'user data available': (r) => r.json('data.id') !== null,
    });

    // 3. POST /api/logout
    sleep(1);

    const logoutRes = http.post(
      `${BASE_URL}/api/logout`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    check(logoutRes, {
      'logout returned 200': (r) => r.status === 200,
    });
  });

  // Pausa entre iteraciones
  sleep(1);
}

// Resumen personalizado
export function handleSummary(data) {
  return {
    'stdout': textSummary(data),
  };
}

function textSummary(data) {
  const metrics = data.metrics;
  const latencySorted = latencies.sort((a, b) => a - b);

  let summary = '\n\n╔════════════════════════════════════╗\n';
  summary += '║  AUTH LOAD TEST SUMMARY             ║\n';
  summary += '╚════════════════════════════════════╝\n\n';

  summary += `📊 LATENCIES\n`;
  summary += `   Average:  ${(latencySorted.reduce((a, b) => a + b) / latencySorted.length).toFixed(2)}ms\n`;
  summary += `   P50:      ${latencySorted[Math.floor(latencySorted.length * 0.5)].toFixed(2)}ms\n`;
  summary += `   P95:      ${latencySorted[Math.floor(latencySorted.length * 0.95)].toFixed(2)}ms ⚠️  (Umbral: 2000ms)\n`;
  summary += `   P99:      ${latencySorted[Math.floor(latencySorted.length * 0.99)].toFixed(2)}ms\n`;
  summary += `   Max:      ${latencySorted[latencySorted.length - 1].toFixed(2)}ms\n\n`;

  const httpDuration = metrics.http_req_duration.values;
  summary += `🔗 HTTP REQUESTS\n`;
  summary += `   Total:    ${metrics.http_reqs.value}\n`;
  summary += `   Failed:   ${metrics.http_req_failed.value * 100}% ⚠️  (Umbral: < 10%)\n`;
  summary += `   Success:  ${((1 - metrics.http_req_failed.value) * 100).toFixed(2)}%\n\n`;

  summary += `⏱️  DURATION\n`;
  summary += `   Total test time: ${(data.state.testRunDurationMs / 1000 / 60).toFixed(2)} minutes\n\n`;

  summary += `📈 RESULT: ${metrics.http_req_failed.value < 0.1 ? '✅ PASS' : '❌ FAIL'}\n`;

  return summary;
}
```

---

## Paso 3: Ejecutar el Test (15 minutos)

### 3.1 En Terminal 2, ejecutar el test

```bash
k6 run tests/auth-load-test.js
```

### 3.2 Observar en tiempo real

La salida mostrará:

```
     scenarios..................: 1 active ▓░░░░░░
     vus........................: 25/50
     iterations.................: 145 ▓░░░░░░
     ✓ login returned 200
     ✓ login returned token
     ✓ login time < 2s
     ✓ GET /me returned 200
     ✓ user data available
     ✓ logout returned 200

     checks...................: 95.2% ✓ 570 ✗ 28
     http_req_duration.......: avg=450ms, p(95)=850ms, p(99)=1200ms
     http_req_failed.........: 2.8%
     http_reqs...............: 435
```

### 3.3 Monitorear en Terminal 1 (servidor)

Buscar:
- ✅ Si CPU sube a 50-70% → Normal
- ⚠️ Si CPU sube a 90%+ → Problema
- 🔴 Si ves errores "connection refused" → Límite alcanzado

---

## Paso 4: Analizar Resultados (5 minutos)

### 4.1 Tabla de Resultados

| Métrica | Valor Obtenido | ✅/⚠️/🔴 | Conclusión |
|---------|---|---|---|
| p95 latencia | 850ms | ✅ | < 2s, muy bien |
| Error rate | 2.8% | ⚠️ | < 10% pero podría mejorar |
| Max latencia | 3500ms | ⚠️ | Algunos requests lentos |
| HTTP success | 97.2% | ✅ | > 95% es aceptable |

### 4.2 Preguntas a responder

**¿Encontramos cuello de botella?**
```
Si el error rate subió de 0% → 10%+: SÍ
Si latencia p95 subió a > 2s: SÍ
Si algún endpoint falló más: SÍ
```

En este ejemplo:
- p95 latencia: 850ms (bueno)
- Error rate: 2.8% (aceptable)
- **Conclusión: Sistema aguanta 50 logins simultáneos sin problemas**

---

## Paso 5: Aumentar Presión (10 minutos)

### 5.1 Encontrar el límite

Modificar el test para 100 usuarios:

```javascript
// En auth-load-test.js, cambiar:
stages: [
  { duration: '2m', target: 100 },  // ← Aumentar de 50 a 100
  { duration: '8m', target: 100 },
  { duration: '2m', target: 0 },
],

vus: 100,  // ← Cambiar de 50 a 100
```

Ejecutar nuevamente:

```bash
k6 run tests/auth-load-test.js
```

### 5.2 Resultado esperado con 100 usuarios

**Escenario A: Sistema Escalable ✅**
```
p95 latencia: 1200ms (aún < 2s)
error rate: 1.5%
→ Puede aguantar 100 usuarios
```

**Escenario B: Degradación ⚠️**
```
p95 latencia: 3000ms+ (> 2s)
error rate: 8-10%
→ Límite cercano a 100 usuarios
```

**Escenario C: Colapso 🔴**
```
p95 latencia: 5000ms+
error rate: > 20%
→ Límite es ~75 usuarios
```

---

## Paso 6: Identificar Causa (20 minutos)

### 6.1 Si los resultados son malos, revisar:

**1. Firebase Console**
```
Ir a: Firebase → Realtime Database/Firestore
Buscar:
- Operaciones/seg durante el test
- Latencia promedio
- ¿Están cerca del límite?
```

**2. Servidor logs**
```bash
# En Terminal 1 (servidor), buscar:
- Errores "ECONNREFUSED" → Pool de conexiones lleno
- Errores "timeout" → Queries lentas
- Warnings de memoria
```

**3. Chrome DevTools**
```
Abrir: http://localhost:4200
F12 → Network tab → Filtrar por "login"
Buscar:
- Status 200 vs errores
- Response time por request
```

---

## Paso 7: Documentar Hallazgos

### 7.1 Crear issue

```markdown
# 🐛 Performance Issue: Auth Service Load Test

## Summary
Tested login endpoint with 50-100 concurrent users

## Results
- ✅ 50 users: p95=850ms, errors=2.8%
- ⚠️ 100 users: p95=3000ms, errors=8.5%
- 🔴 Limit reached around 75 concurrent logins

## Root Cause
After reviewing Firebase logs, found:
- Firestore query on user collection not indexed
- Each login does 3 read operations
- Solution: Create compound index on (email, status)

## Recommendation
1. Add Firestore index (email, status) → estimated 24h
2. Implement login request batching
3. Add caching for user lookups
4. Re-test after index deployment
```

---

## Paso 8: Optimizar y Re-probar

### 8.1 Después de agregar índice a Firestore

```bash
# Re-ejecutar con 100 usuarios
k6 run tests/auth-load-test.js
```

### 8.2 Resultados esperados

**Antes de optimizar:**
- p95: 3000ms ❌
- errors: 8.5% ❌

**Después de optimizar:**
- p95: 1200ms ✅ (mejora 60%)
- errors: 1.5% ✅ (mejora 82%)

---

## Diagrama: Ciclo Completo

```
┌─────────────────────────────────────────────────────────┐
│ 1. PREPARACIÓN                      (5 min)            │
│ - Verificar servidor disponible                         │
│ - Preparar 3 terminales                                 │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CREAR TEST                       (10 min)           │
│ - Escribir script K6                                    │
│ - Definir stages y thresholds                           │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 3. EJECUTAR TEST                    (15 min)           │
│ - k6 run tests/auth-load-test.js                        │
│ - Monitorear servidor y recursos                        │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 4. ANALIZAR RESULTADOS              (5 min)            │
│ - Revisar métricas en console                           │
│ - Comparar con umbrales                                 │
└────────────────┬────────────────────────────────────────┘
                 ↓
            ¿Problemas?
          /             \
        SÍ               NO
        │                │
        ↓                ↓
   ┌─────────────┐   ┌────────────┐
   │ Aumentar    │   │ Documentar │
   │ presión     │   │ resultados │
   │ (100 VUs)   │   │            │
   └─────────────┘   └────────────┘
        │
        ↓
    ¿Colapsó?
      /    \
     SÍ     NO
     │      └→ Fin
     ↓
┌─────────────────────────────────────┐
│ 5. ENCONTRAR CAUSA                  │
│ - Firebase logs                     │
│ - Server logs                       │
│ - Chrome DevTools                   │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 6. OPTIMIZAR                        │
│ - Agregar índices                   │
│ - Cachear queries                   │
│ - Batching de requests              │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 7. RE-PROBAR                        │
│ - Ejecutar test nuevamente          │
│ - Comparar antes/después            │
└─────────────────────────────────────┘
```

---

## Checklist Final

- [ ] Terminal 1: Servidor corriendo (`npm start`)
- [ ] Terminal 2: Test K6 ejecutándose
- [ ] Terminal 3: Monitoreo de recursos
- [ ] Esperar a que termine el test (12 minutos)
- [ ] Revisar console output
- [ ] Revisar Firebase console
- [ ] Revisar servidor logs
- [ ] Documentar hallazgos
- [ ] Crear issue si hay problemas
- [ ] Proponer solución

---

## Referencia Rápida de Umbrales

```
✅ OK                ⚠️ ALERTA           🔴 CRÍTICO
────────────────────────────────────────────────────
p95 < 1s            1-2s               > 2s
error < 0.1%        0.1-1%             > 1%
p99 < 2s            2-3s               > 3s
memory < 100MB      100-200MB          > 200MB
CPU < 60%           60-75%             > 75%
```

---

**¡Listo! Ahora ya sabes cómo ejecutar y analizar un load test en tu aplicación.**

Próximo paso: Ejecutar pruebas en los otros servicios (Actividades, Notificaciones, etc.)
