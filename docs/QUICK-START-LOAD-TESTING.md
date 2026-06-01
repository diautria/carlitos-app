# 🧪 Guía Rápida: Pruebas de Carga y Estrés para BebecioApp

## ⚡ Quick Start (5 minutos)

### 1. Instalar herramientas

```bash
# K6 (Herramienta principal)
# Windows
choco install k6

# macOS
brew install k6

# O descargar desde: https://k6.io/docs/getting-started/installation/
```

### 2. Iniciar servidor

```bash
# Terminal 1 - Backend
npm install
npm start

# Esperar a que esté disponible en http://localhost:3000
```

### 3. Ejecutar prueba de carga rápida

```bash
# Terminal 2 - Load Test
k6 run tests/load-test-api.js --vus=10 --duration=2m
```

### 4. Revisar resultados

```
    ✓ status is 200
    ✓ response time < 1s
    ✓ has bebes array

    checks...................: 99.5% ✓ 2500 ✗ 1
    data_received...........: 500 kB ▓░░░░░░
    data_sent...............: 300 kB ▓░░░░░░
    http_req_duration.......: avg=450ms, p(95)=780ms, p(99)=950ms
    http_reqs...............: 2501
    http_req_failed.........: 0.04%
```

---

## 📋 Checklist de Ejecución

### Fase 1: Preparación
- [ ] Clonar/descargar el proyecto
- [ ] Instalar K6: `choco install k6` (o según tu SO)
- [ ] Instalar dependencias: `npm install`
- [ ] Verificar backend disponible: `npm start`
- [ ] Verificar API responde: `curl http://localhost:3000/api/health`

### Fase 2: Tests Unitarios de Performance
- [ ] Ejecutar: `npm run test:load`
- [ ] Revisar resultados en console
- [ ] Anotar métricas de baseline

### Fase 3: Load Testing
- [ ] **Test 1 - Carga Leve** (10 usuarios, 5 min)
  ```bash
  npm run k6:load:light
  # Esperar a completar
  # ✓ Verificar que p95 < 1000ms
  ```

- [ ] **Test 2 - Carga Normal** (50 usuarios, 10 min)
  ```bash
  npm run k6:load:basic
  # ✓ Verificar error rate < 0.1%
  ```

- [ ] **Test 3 - Carga Pesada** (250 usuarios, 15 min)
  ```bash
  npm run k6:load:heavy
  # ✓ Documentar degradación observada
  ```

### Fase 4: Stress Testing
- [ ] **Test 4 - Estrés Progresivo** (10→100 usuarios)
  ```bash
  npm run k6:stress:progressive
  # ✓ Anotar en qué punto empiezan errores
  ```

- [ ] **Test 5 - Spike (Pico)** (100 usuarios repentinos)
  ```bash
  npm run k6:stress:spike
  # ✓ Verificar recuperación < 30 segundos
  ```

- [ ] **Test 6 - Resistencia** (20 usuarios, 60 minutos)
  ```bash
  npm run k6:endurance
  # ⏸️ Ejecutar overnight o en background
  ```

### Fase 5: Frontend Performance
- [ ] Ejecutar Lighthouse
  ```bash
  npm run lighthouse:view
  # ✓ Revisar Core Web Vitals
  # ✓ Verificar LCP < 2.5s
  ```

- [ ] Chrome DevTools Profiling
  - [ ] Abrir http://localhost:4200
  - [ ] F12 → Performance → Record
  - [ ] Realizar acciones normales → Stop
  - [ ] Analizar: FCP, LCP, CLS, Memory

### Fase 6: Análisis e Informe
- [ ] Recopilar datos de firebase console
- [ ] Revisar logs del servidor
- [ ] Documentar cuellos de botella encontrados
- [ ] Generar informe final

---

## 🎯 Casos de Prueba Recomendados

### Test 1: Usuarios Concurrentes Crecientes
```bash
# Simular crecimiento de usuarios en tiempo real
npm run k6:stress:progressive

# ¿Qué se mide?
# - Latencia aumenta gradualmente
# - Punto donde error rate sube
# - Recursos (CPU, memoria, conexiones DB)
```

**Métricas a revisar:**
- p95 response time: ¿cuándo supera 1000ms?
- Error rate: ¿cuándo supera 0.1%?
- CPU/Memory en servidor: ¿límite crítico?

### Test 2: Spike de Tráfico
```bash
# Aumentar de 10 a 100 usuarios en 1 minuto
npm run k6:stress:spike

# ¿Qué se mide?
# - Capacidad de respuesta ante picos
# - Tiempo de recuperación
# - Fallos durante el pico
```

### Test 3: Carga Sostenida
```bash
# Mantener 50 usuarios durante 10 minutos
npm run k6:load:basic

# ¿Qué se mide?
# - Estabilidad
# - Memory leaks
# - Connection leaks
```

### Test 4: Operaciones Críticas
```bash
# Enfocarse en operaciones de escritura (crear actividades)
# - 50% GET bebes
# - 40% POST actividades
# - 10% PUT profile

k6 run tests/load-test-api.js --vus=50 --duration=10m
```

---

## 📊 Cómo Interpretar Resultados

### Ejemplo de salida satisfactoria:

```
     checks...................: 99.8% ✓ 2450 ✗ 5
     data_received...........: 1.2 MB ▓░░░░░░
     data_sent...............: 800 kB ▓░░░░░░
     http_req_duration.......: avg=350ms, p(95)=650ms, p(99)=900ms ← ¡ BIEN!
     http_reqs...............: 2455
     http_req_failed.........: 0.20% ← OK (< 0.5%)
```

### Ejemplo de problemas:

```
     http_req_duration.......: avg=2500ms, p(95)=5000ms, p(99)=8000ms ← ⚠️ LENTO
     http_req_failed.........: 15% ← 🔴 CRÍTICO (> 5%)
     iteration_duration.......: avg=45s (debería ser < 10s)
```

### Umbrales recomendados:

| Métrica | ✅ Bien | ⚠️ Alerta | 🔴 Crítico |
|---------|---------|-----------|-----------|
| **p95 latencia** | < 1s | 1-2s | > 2s |
| **p99 latencia** | < 2s | 2-3s | > 3s |
| **Error rate** | < 0.1% | 0.1-1% | > 1% |
| **CPU servidor** | < 50% | 50-75% | > 75% |
| **Memory servidor** | < 60% | 60-80% | > 80% |
| **Conexiones DB** | < 100 | 100-500 | > 500 |

---

## 🔍 Identificar Cuellos de Botella

### Sintoma: Latencia aumenta con carga

**Posibles causas:**
1. ❌ Query de Firestore sin índices
2. ❌ N+1 queries en listados
3. ❌ Falta de paginación
4. ❌ Listeners no optimizados

**Soluciones:**
```typescript
// ❌ Mal
actividades.forEach(act => 
  getAutorInfo(act.autorId) // Múltiples queries!
);

// ✅ Bien
const autorMap = await getAutoresInfo(actividades.map(a => a.autorId));
actividades.forEach(act => 
  autorMap[act.autorId]
);
```

### Sintoma: Memory leak (aumenta continuamente)

**Posibles causas:**
1. ❌ Subscripciones sin unsubscribe
2. ❌ Event listeners no removidos
3. ❌ Cache sin límite de tamaño

**Soluciones:**
```typescript
// ❌ Mal
onInit() {
  this.service.data$.subscribe(d => this.data = d);
}

// ✅ Bien
private destroy$ = new Subject<void>();

onInit() {
  this.service.data$
    .pipe(takeUntil(this.destroy$))
    .subscribe(d => this.data = d);
}

onDestroy() {
  this.destroy$.next();
}
```

### Sintoma: Errores "Connection timeout"

**Posibles causas:**
1. ❌ Demasiadas conexiones simultáneas a BD
2. ❌ Queries muy lentas bloqueando conexiones
3. ❌ Pool de conexiones muy pequeño

**Soluciones:**
- Aumentar pool: `FIREBASE_MAX_CONNECTIONS=500`
- Indexar queries: Ir a Firebase Console → Firestore → Índices
- Usar paginación: `limit(100).paginate(pageSize)`

---

## 💾 Guardar Resultados

### Exportar datos JSON para análisis

```bash
# Guardar resultados
npm run k6:json

# Ver resultados guardados
cat load-test-result.json | jq '.data.metrics'

# Comparar con ejecución anterior
diff load-test-result-v1.json load-test-result-v2.json
```

### Crear gráficas con los datos

```bash
# Instalar herramientas
npm install -D jq gnuplot

# Extraer datos y graficar (ejemplo)
cat load-test-result.json | jq '.data.metrics.http_req_duration' > durations.json
# Luego usar gnuplot o Excel para visualizar
```

---

## 📈 Interpretación de Gráficas de K6

### "Rampa" de usuarios (Expected):
```
VUs
|     ___
|    /   \___
|___/       \___
└──────────────────> Tiempo
```
✓ Sistema estable, sigue la carga

### "Caída" después de aumentar (Problem):
```
VUs         Latencia
|              |___
|             /   \
|            /     \
└─────>     /       \────>
```
⚠️ Puede ser falta de índices o limite de conexiones

### Línea plana en errores (Bad):
```
Errors
|    ___________
|   /
|__/
└─────────────────>
```
🔴 Errores aumentan y no bajan = degradación permanente

---

## 🚀 Próximos Pasos

### Después de identificar problemas:

1. **Documentar**
   - [ ] Crear issue con resultados
   - [ ] Adjuntar gráficas y logs
   - [ ] Proponer solución

2. **Priorizar**
   - [ ] P0: Errores > 10%
   - [ ] P1: Latencia p95 > 2s
   - [ ] P2: Warnings de memory/CPU

3. **Optimizar**
   - [ ] Implementar fixes
   - [ ] Re-ejecutar tests
   - [ ] Comparar resultados

4. **Monitoreo Continuo**
   - [ ] Agregar a CI/CD
   - [ ] Alertas en Slack
   - [ ] Dashboard con Grafana

---

## ❓ FAQ

**P: ¿Con cuántos usuarios debo empezar?**
R: Comienza con 10, luego duplica cada día: 10 → 20 → 50 → 100 → 250 → 500

**P: ¿Cuánto tarda una prueba?**
R: Carga: 10-15 min | Estrés: 20-30 min | Resistencia: 1-2 horas

**P: ¿K6 es gratis?**
R: Sí, la herramienta es open source. K6 Cloud es pago pero opcional.

**P: ¿Puedo ejecutar desde Windows?**
R: Sí, descarga K6 desde https://k6.io/docs/getting-started/installation/

**P: ¿Qué pasa si mi servidor no aguanta?**
R: Es NORMAL encontrar límites. El objetivo es identificarlos y optimizar.

---

## 📞 Soporte

- Docs de K6: https://k6.io/docs/
- Issues detectados: Crear issue con tag `performance`
- Logs de Firebase: Firebase Console → Monitoring

---

**Última actualización:** 2024
**Versión:** 1.0
