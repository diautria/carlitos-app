# 🎯 Visual Guide - Load & Stress Testing

## 📊 Cómo Funciona una Prueba de Carga

### Virtual Users (VUs) ramping up

```
VUs (Usuarios Virtuales)
│
│     Ramp-up      Soak         Ramp-down
│      (2m)        (8m)           (2m)
│     ╱──┐
│    ╱   │ 50 VUs (pico)
│   ╱    │
│  ╱     └─────────┐
│ ╱               │ 
│────────────────┴──────────────┬────→ Tiempo
  0                            12 min

Cada VU: 1 usuario virtual haciendo requests continuamente
```

### Latencia esperada durante el test

```
Latencia (ms)
│
│  ╱─────────────╲
│ ╱               ╲  
│ 450ms            ╲___  degradación gradual
│ p50              ╲
│                   ╲ 850ms - p95
│                    ╲
│                     ╲___1200ms - p99 (max aceptable)
└────────────────────────────────→ VUs (0→100)
```

---

## 🧪 Tipos de Pruebas y Cómo Lucen

### Tipo 1: Load Test (Carga Normal)

**Patrón:**
```
Carga: 50 usuarios sostenidos 10 minutos

VUs   │         ╭─────────────╮
      │        ╱               ╲
   50 │ ______╱                 ╲______
      │
   0  └──────────────────────────────→ Tiempo
            ↑                    ↑
         Ramp-up            Ramp-down
         (2 min)            (2 min)
```

**Qué mide:**
- ✓ Sistema estable bajo carga normal
- ✓ Recursos sin memory leaks
- ✓ Respuesta consistente

**Resultado bueno:**
```
Latencia: 400-600ms (constante)
Errors: < 0.1%
Memory: sin cambios
```

---

### Tipo 2: Stress Test (Estrés Progresivo)

**Patrón:**
```
Incremento gradual hasta encontrar límite

VUs   │
      │                        ╱←Quizás falla aquí?
      │                    ╱─┐
   300│                ╱─┐   
      │            ╱─┐     
   200│        ╱─┐      
      │    ╱─┐       
   100│╱─┐         
      │
   0  └──────────────────────→ Tiempo
       5m 10m 15m 20m 25m
```

**Qué mide:**
- ✓ Encontrar punto de ruptura
- ✓ A qué carga empieza a fallar
- ✓ Comportamiento bajo estrés

**Resultado esperado:**
```
0-100 VUs: latencia 400ms, 0% errors
100-200 VUs: latencia 600ms, 1-2% errors
200+ VUs: latencia 2000ms+, 10%+ errors ← LÍMITE

Conclusión: Max capacidad = 180 usuarios
```

---

### Tipo 3: Spike Test (Pico Repentino)

**Patrón:**
```
Salto repentino de carga

VUs   │    ╭─← SPIKE (100 usuarios de repente)
      │   ╱ │
   100│  │  │
      │  │  │ ← ¿Sistema se recupera?
   50 │  │  │
      │  │  │
   10 │──┘  └─→ Vuelve a 10
      │
   0  └────────────────────→ Tiempo
       2m  1m  2m
```

**Qué mide:**
- ✓ Capacidad de reacción ante picos
- ✓ Tiempo de recuperación
- ✓ Pérdida de requests durante pico

**Resultado esperado:**
```
Pico de 100 VUs:
- Algunos requests fallan (normal)
- Después de 30s: vuelve a normal
- Max latencia durante pico: 3000ms
```

---

## 📈 Gráficas de Resultados

### Gráfica 1: Sistema Saludable ✅

```
Latencia (ms)            Error Rate (%)
│ 600                    │ 2
│    ╭──────────╮        │    ╭─────────╮
│   ╱            ╲       │   ╱           ╲
│  ╱              ╲      │  ╱             ╲
│ ╱   p95          ╲     │ ╱                ╲
└─────────────────→      └──────────────→
  0  100 VUs max         0  100 VUs max

✅ Latencia constante < 2s
✅ Errores < 1%
✅ Sin degradación gradual
```

### Gráfica 2: Problema Detectado ⚠️

```
Latencia (ms)            Error Rate (%)
│ 6000                   │ 30
│       ╱ ← Degradación  │       ╱ ← Aumenta
│      ╱  gradual        │      ╱
│     ╱                  │     ╱
│  ╱                     │  ╱
└────────────→           └─────────→
  0  75  150 VUs         0  75  150 VUs
        ↑                    ↑
      LÍMITE               LÍMITE

⚠️ Latencia sube a 5000ms+
⚠️ Errores > 10%
⚠️ Degradación en 75 VUs
```

### Gráfica 3: Colapso 🔴

```
Latencia (ms)
│ 10000
│        ╱╱╱ ← Sube verticalmente
│       ╱
│      ╱
│    ╱
│   ╱
└──╱──────────→
  0  50 VUs

🔴 Colapsa antes de 50 VUs
🔴 Latencia > 10s
🔴 Posible error crítico
```

---

## 🔍 Cómo Identificar Cuellos de Botella

### Patrón 1: Database Query lenta

```
Comportamiento:
- Latencia sube exponencialmente ↑↑↑
- Errors: bajo (< 5%)
- CPU servidor: bajo (< 40%)
- Database: 99% CPU

Solución: Agregar índices a Firestore
```

### Patrón 2: Connection pool agotado

```
Comportamiento:
- Latencia normal hasta 100 VUs
- Luego COLAPSA (10s+)
- Errors: MUCHOS (> 50%)
- Conexiones DB: MAXED OUT

Solución: Aumentar pool size
CONEXIONES DISPONIBLES: ─────── ← LLENO
```

### Patrón 3: Memory leak

```
Comportamiento:
- Primeros 5 min: OK
- Luego: latencia sube gradualmente
- Errors: incrementan lentamente
- Memory: sube sin parar

Solución: Buscar subscripciones sin unsubscribe
```

### Patrón 4: Code ineficiente

```
Comportamiento:
- CPU: 90%+ incluso con pocos VUs
- Latencia: alta desde el inicio
- No es problema de DB (DB CPU bajo)

Solución: Revisar código hot path
```

---

## 🛠️ Herramientas Visuales

### K6 Cloud (Recomendado)

```
┌─────────────────────────────────┐
│  K6 Cloud Dashboard             │
├─────────────────────────────────┤
│                                 │
│  VUs Timeline      Error Rate   │
│  ┌─────────────┐  ┌──────────┐  │
│  │ ╱─────────╲ │  │ 0.5% ────│  │
│  │            │  │          │  │
│  └────────────┘  └──────────┘  │
│                                 │
│  P95 Latency: 850ms             │
│  Throughput: 150 req/s          │
│  Success Rate: 99.5%            │
│                                 │
└─────────────────────────────────┘
```

### Chrome DevTools Performance

```
Time (ms)
│  FCP ▌    LCP ▌▌▌▌▌     LTI ▌
│  │         │            │
│  ↓         ↓            ↓
└──┴─────────┴────────────┴──→
   0    2000         4000
   
   FCP = First Contentful Paint
   LCP = Largest Contentful Paint
   LTI = Long Task Indicator
```

### Firebase Console

```
┌──────────────────────────────┐
│ Firebase Monitoring          │
├──────────────────────────────┤
│ Firestore Metrics:           │
│                              │
│ Reads/sec:     ▂▄▆▆▅▄▂       │
│                              │
│ Latency:       ▂▂▂▃▄▆▆▅      │
│                              │
│ Errors:        ▁▁▁▁▁▁▁▂      │
│                              │
└──────────────────────────────┘
```

---

## 📊 Tabla de Comparación: Antes vs Después

### Escenario: Problema con Auth Service

```
┌────────────────────┬────────────┬────────────┬──────────┐
│ Métrica            │ Antes      │ Después    │ Mejora   │
├────────────────────┼────────────┼────────────┼──────────┤
│ p95 Latencia       │ 3200ms ❌  │  950ms ✅  │ 70% ↑    │
│ Error Rate         │   12% ❌   │   1.2% ✅  │ 90% ↑    │
│ Max VUs Soportados │   75 ❌    │  250+ ✅   │ 233% ↑   │
│ Firestore Reads    │ 2000/sec ❌│  500/sec ✅│ 75% ↓    │
│ Cost Firebase      │ $1500/mes  │  $200/mes  │ 87% ↓    │
└────────────────────┴────────────┴────────────┴──────────┘

Cambios realizados:
1. ✓ Agregó índice (email, status) en Firestore
2. ✓ Implementó caching de usuario por 5min
3. ✓ Batching de auth requests
```

---

## 🎓 Quick Reference: Qué Esperar por Servicio

### AuthService
```
Carga Esperada: 100-500 usuarios concurrentes
p95 Latencia: 600-1000ms
Error Rate: < 1%
Bottleneck típico: Database index
```

### ActivityService
```
Carga Esperada: 200-1000 usuarios concurrentes
p95 Latencia: 800-1500ms
Error Rate: < 2%
Bottleneck típico: Query sin paginación
```

### NotificacionService
```
Carga Esperada: 500-2000 eventos/min
Latencia: 100-300ms
Error Rate: < 0.5%
Bottleneck típico: Message queue processing
```

---

## 🚨 Red Flags (Cosas que indican problemas)

```
🔴 STOP TEST si observas:

1. Latencia p95 > 5000ms
2. Error rate > 50%
3. Server not responding (timeout)
4. Database connection errors
5. Out of memory errors
6. CPU 100% sostenido

⚠️ REVIEW si observas:

1. Latencia > 2000ms
2. Error rate 5-10%
3. Memory creeping up
4. Slow DNS resolution
5. Connection pool utilization > 80%
```

---

## 🎯 Flujo de Decisión: Qué hacer con los resultados

```
┌─ ¿Errores > 5%?
│  ├─ SÍ → Problema crítico, investigar inmediatamente
│  └─ NO → Continuar
│
├─ ¿Latencia p95 > 2000ms?
│  ├─ SÍ → Posible cuello de botella
│  │      ├─ Database slow? → Agregar índices
│  │      ├─ Code ineficiente? → Profile CPU
│  │      └─ Network? → Revisar payload size
│  └─ NO → Continuar
│
├─ ¿Memory aumenta con el tiempo?
│  ├─ SÍ → Memory leak probable
│  │      → Buscar subscripciones sin unsubscribe
│  └─ NO → Continuar
│
└─ ✅ TODO OK, documentar como BASELINE
```

---

## 📚 Documentación Relacionada

- **Guía Completa:** [load-stress-testing.md](./load-stress-testing.md)
- **Setup Técnico:** [LOAD-TESTING-SETUP.md](./LOAD-TESTING-SETUP.md)
- **Quick Start:** [QUICK-START-LOAD-TESTING.md](./QUICK-START-LOAD-TESTING.md)
- **Ejemplo Práctico:** [EJEMPLO-AUTH-LOAD-TEST.md](./EJEMPLO-AUTH-LOAD-TEST.md)

---

**¡Ahora estás listo para ejecutar pruebas y encontrar cuellos de botella! 🚀**
