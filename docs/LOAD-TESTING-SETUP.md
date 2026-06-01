# Configuración y Comandos para Pruebas de Carga

## 1. Instalación de Herramientas

### K6 (Herramienta Principal)

```bash
# Windows - con Chocolatey
choco install k6

# macOS - con Homebrew
brew install k6

# Linux
apt-get install k6

# O descargar desde: https://k6.io/docs/getting-started/installation/
```

### Apache JMeter

```bash
# Descargar desde: https://jmeter.apache.org/download_jmeter.html

# Ejecutar JMeter
jmeter -n -t plan.jmx -l results.jtl -j jmeter.log
```

### Lighthouse

```bash
npm install -g lighthouse
lighthouse https://your-app.com --output=json
```

---

## 2. Ejecución de Pruebas

### Opción 1: Script de Bash (Linux/macOS)

```bash
chmod +x run-load-tests.sh
./run-load-tests.sh
```

### Opción 2: Comandos Manuales

#### Test de Carga Básico
```bash
k6 run tests/load-test-api.js \
  --vus=50 \
  --duration=10m \
  -e BASE_URL="http://localhost:3000" \
  -e AUTH_TOKEN="your-token"
```

#### Test de Estrés Progresivo
```bash
k6 run tests/load-test-api.js \
  --stage 5m:10 \
  --stage 5m:20 \
  --stage 5m:50 \
  --stage 5m:100 \
  -e BASE_URL="http://localhost:3000"
```

#### Test de Spike (Pico repentino)
```bash
k6 run tests/load-test-api.js \
  --stage 2m:10 \
  --stage 1m:100 \
  --stage 2m:10
```

#### Test de Resistencia (Larga duración)
```bash
k6 run tests/load-test-api.js \
  --vus=20 \
  --duration=1h
```

### Opción 3: Unit Tests Angular

```bash
# Test de performance único
ng test --include='**/load-test.spec.ts' --watch=false

# Con cobertura
ng test --include='**/load-test.spec.ts' --code-coverage --watch=false

# Modo watch para desarrollo
ng test --include='**/load-test.spec.ts'
```

---

## 3. Configuración Avanzada

### Configurar Autenticación

```bash
# Con token en variable de entorno
export AUTH_TOKEN="eyJhbGc..."
k6 run tests/load-test-api.js -e AUTH_TOKEN=$AUTH_TOKEN

# Con login automático en setup
# (ver en load-test-api.js la función setup())
```

### Usar K6 Cloud para Análisis Avanzado

```bash
# Registrarse en https://cloud.k6.io/
k6 cloud tests/load-test-api.js --vus=100 --duration=10m
```

### Exportar Resultados

```bash
# JSON
k6 run tests/load-test-api.js --out json=results.json

# CSV
k6 run tests/load-test-api.js --out csv=results.csv

# Múltiples formatos
k6 run tests/load-test-api.js \
  --out json=results.json \
  --out csv=results.csv \
  --out cloud
```

---

## 4. Análisis de Resultados

### Con K6

```bash
# Ver métricas resumen
k6 show results.json

# Estadísticas detalladas
k6 stats results.json

# Importar a Grafana (si lo tienes configurado)
k6 run tests/load-test-api.js --out influxdb=http://localhost:8086
```

### Con Chrome DevTools

1. Abrir DevTools (F12)
2. Tab "Performance"
3. Grabar durante las pruebas
4. Analizar:
   - CPU usage
   - Memory usage
   - FPS
   - Paint times

### Con Firebase Console

1. Ir a **Performance** → **Trace**
2. Observar en tiempo real:
   - Latencias de Firestore
   - Fallos de lectura/escritura
   - Operaciones por segundo

---

## 5. Monitoreo en Tiempo Real

### Abrir Múltiples Tabs del Chrome

```bash
# Terminal 1: Backend
ng serve --port 3000

# Terminal 2: Tests K6
k6 run tests/load-test-api.js --vus=50 --duration=10m

# Terminal 3: Monitor (otra ventana)
watch -n 1 'curl -s http://localhost:3000/api/health | jq'
```

### Firebase Real-time Monitoring

```typescript
// Agregar al app.component.ts durante testing
import { initializePerformanceMonitoring } from 'firebase/performance';

const perf = initializePerformanceMonitoring();

// Metrics customizadas
const trace = perf.trace('my-trace');
trace.start();
// ... código a medir
trace.stop();
```

---

## 6. Matriz de Pruebas Recomendada

### Fase 1: Baseline (Semana 1)

```bash
# Test 1: Establecer baseline sin carga
k6 run tests/load-test-api.js --vus=1 --duration=2m

# Test 2: Carga leve
k6 run tests/load-test-api.js --vus=10 --duration=5m

# Test 3: Carga normal
k6 run tests/load-test-api.js --vus=50 --duration=10m
```

### Fase 2: Identificar Límites (Semana 2)

```bash
# Test 4: Carga media
k6 run tests/load-test-api.js --vus=100 --duration=15m

# Test 5: Carga alta
k6 run tests/load-test-api.js --vus=250 --duration=15m

# Test 6: Punto de ruptura
k6 run tests/load-test-api.js --vus=500 --duration=10m
```

### Fase 3: Stress & Resilience (Semana 3)

```bash
# Test 7: Estrés progresivo
k6 run tests/load-test-api.js \
  --stage 5m:10 \
  --stage 5m:50 \
  --stage 5m:100 \
  --stage 5m:200 \
  --stage 5m:300

# Test 8: Spike repentino
k6 run tests/load-test-api.js \
  --stage 2m:10 \
  --stage 30s:500 \
  --stage 2m:10

# Test 9: Recuperación
k6 run tests/load-test-api.js \
  --stage 5m:100 \
  --stage 1m:500 \
  --stage 5m:100
```

---

## 7. Casos Específicos por Servicio

### Test: AuthService

```bash
# Alta concurrencia de logins
cat > auth-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function() {
  const payload = {
    email: `user_${Math.random()}@test.com`,
    password: 'password123',
  };

  const response = http.post(
    'http://localhost:3000/api/auth/login',
    JSON.stringify(payload),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'login successful': (r) => r.status === 200,
    'token provided': (r) => r.json('token') !== undefined,
  });
}
EOF

k6 run auth-test.js
```

### Test: ActivityService

```bash
# Lectura masiva
k6 run tests/load-test-api.js \
  --duration=10m \
  --vus=100 \
  -e TARGET_ENDPOINT="/api/actividades?limit=500"
```

### Test: Notificaciones

```bash
# Múltiples listeners simultáneos
ng test --include='**/notificacion*.spec.ts' --code-coverage
```

---

## 8. Integración en CI/CD

### GitHub Actions

```yaml
name: Load Testing

on: [push, workflow_dispatch]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install K6
        run: sudo apt-get install -y k6
      
      - name: Start Backend
        run: npm run start &
        env:
          NODE_ENV: test
      
      - name: Wait for Backend
        run: npx wait-on http://localhost:3000
      
      - name: Run Load Tests
        run: k6 run tests/load-test-api.js \
          --vus=50 \
          --duration=5m \
          --out json=results.json
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
      
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('results.json', 'utf8'));
            // Procesar y comentar resultados
```

---

## 9. Troubleshooting

### K6 no se conecta

```bash
# Verificar servidor
curl -v http://localhost:3000/api/health

# Aumentar timeouts
k6 run tests/load-test-api.js --rps=50 --timeout=30s
```

### Errores de CORS

```typescript
// Agregar headers CORS en load-test-api.js
const headers = {
  'Content-Type': 'application/json',
  'Origin': 'http://localhost:3000',
};
```

### Memory leaks detectados

```bash
# Reducir VUs y aumentar duración
k6 run tests/load-test-api.js --vus=20 --duration=30m
```

### Falsos positivos en timeouts

```bash
# Aumentar thresholds
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Aumentar de 1000 a 5000
  },
};
```

---

## 10. Dashboard con Grafana + InfluxDB

```bash
# Instalar
docker run -d -p 8086:8086 --name influxdb influxdb:2.0
docker run -d -p 3000:3000 --name grafana grafana/grafana

# Usar con K6
k6 run tests/load-test-api.js --out influxdb=http://localhost:8086

# Acceder a: http://localhost:3000
```

---

## Referencias Útiles

- **K6 Docs**: https://k6.io/docs/
- **K6 Community**: https://community.k6.io/
- **Firebase Performance**: https://firebase.google.com/docs/performance
- **Google PageSpeed**: https://pagespeed.web.dev/
- **Web Vitals**: https://web.dev/vitals/

