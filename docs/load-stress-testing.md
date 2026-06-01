# Estrategia de Pruebas de Carga y Estrés - BebecioApp

## 📊 Descripción General

Plan completo de pruebas para identificar cuellos de botella en:
- **Backend Firebase**: Lectura/escritura de datos, autenticación, notificaciones
- **Frontend Angular**: Renderizado, manejo de listas grandes, consumo de memoria
- **APIs locales**: Almacenamiento en dispositivo, sincronización
- **Red**: Latencia, desconexiones, reconexión

---

## 1. PRUEBAS DE CARGA (Load Testing)

### 1.1 Prueba: Carga Concurrente de Datos de Bebés

**Objetivo**: Identificar degradación de performance con múltiples bebés por familia

| Aspecto | Valor |
|---------|-------|
| **Usuarios concurrentes** | 50 |
| **Bebés por usuario** | 5-15 |
| **Duración** | 10 minutos |
| **Ramp-up** | 2 minutos |
| **Métrica crítica** | Tiempo de respuesta GET `/bebés` |
| **Umbral aceptable** | < 2s |

**Herramienta**: K6 / Apache JMeter

```javascript
// Script K6 - load-test-bebas.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.0.0/index.js';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '8m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  const token = __ENV.AUTH_TOKEN;
  const userId = randomIntBetween(1, 1000);
  
  const url = `https://your-firebase-api.com/api/users/${userId}/bebes`;
  const response = http.get(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  check(response, {
    'status es 200': (r) => r.status === 200,
    'tiempo respuesta < 2s': (r) => r.timings.duration < 2000,
    'tiene array bebes': (r) => r.json('bebes') !== undefined,
  });

  sleep(randomIntBetween(1, 3));
}
```

---

### 1.2 Prueba: Escritura Masiva de Actividades

**Objetivo**: Medir carga en Firebase al crear muchos registros de actividad

| Aspecto | Valor |
|---------|-------|
| **Usuarios concurrentes** | 100 |
| **Actividades por usuario/min** | 3-5 |
| **Duración** | 15 minutos |
| **Métrica crítica** | Latencia de escritura POST |
| **Umbral aceptable** | < 1s p95 |

**Actividades a registrar**:
- Tomas de leche
- Cambios de pañal
- Sueño
- Medicamentos
- Mediciones (peso, talla)

```typescript
// Angular Service Performance Test
import { Injectable } from '@angular/core';
import { performance } from 'perf_hooks';

@Injectable({ providedIn: 'root' })
export class LoadTestService {
  
  async testMasiveActivityCreation(userId: string, count: number) {
    const metrics = { success: 0, failed: 0, times: [] };
    
    for (let i = 0; i < count; i++) {
      const start = performance.now();
      
      try {
        await this.activityService.createActivity({
          bebeId: this.generateRandomBebeId(),
          type: this.getRandomActivityType(),
          timestamp: new Date(),
          data: this.generateActivityData(),
        }).toPromise();
        
        metrics.success++;
      } catch (error) {
        metrics.failed++;
      }
      
      const duration = performance.now() - start;
      metrics.times.push(duration);
    }
    
    return this.calculateMetrics(metrics);
  }
  
  private calculateMetrics(metrics: any) {
    const sorted = metrics.times.sort((a: number, b: number) => a - b);
    return {
      success: metrics.success,
      failed: metrics.failed,
      avg: sorted.reduce((a: number, b: number) => a + b) / sorted.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      max: sorted[sorted.length - 1],
    };
  }
}
```

---

### 1.3 Prueba: Sincronización de Datos en Tiempo Real

**Objetivo**: Validar Firestore listeners bajo carga

| Aspecto | Valor |
|---------|-------|
| **Clientes simultáneos** | 50 |
| **Listeners activos** | 3-5 por cliente |
| **Duración** | 10 minutos |
| **Métrica crítica** | Latencia de update en listeners |
| **Umbral aceptable** | < 500ms |

```typescript
// Test de Listeners en Tiempo Real
testRealtimeListeners() {
  const collections = [
    'bebes',
    'actividades',
    'notificaciones',
  ];
  
  const metrics = { updates: 0, latencies: [] };
  const startTime = Date.now();
  
  collections.forEach(collection => {
    this.db.collection(collection)
      .where('familiaId', '==', this.familiaId)
      .onSnapshot((snapshot) => {
        const receivedTime = Date.now();
        const latency = receivedTime - startTime;
        metrics.latencies.push(latency);
        metrics.updates++;
      });
  });
  
  return metrics;
}
```

---

### 1.4 Prueba: Renderizado de Listas Grandes

**Objetivo**: Identificar degradación en Angular con muchos items

| Aspecto | Valor |
|---------|-------|
| **Items en lista** | 500-5000 |
| **Scroll performance** | 60 FPS |
| **Memory usage** | < 100MB |
| **Duración** | 5 minutos |

```typescript
// Component Performance Test
describe('ListaActividades - Load Test', () => {
  let component: ListaActividadesComponent;
  let fixture: ComponentFixture<ListaActividadesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListaActividadesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaActividadesComponent);
    component = fixture.componentInstance;
  });

  it('debe renderizar 5000 items sin bloquear UI', (done) => {
    const largeDataset = Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      type: 'toma',
      timestamp: new Date(),
      cantidad: Math.random() * 200,
    }));

    const startTime = performance.now();
    component.actividades = largeDataset;
    fixture.detectChanges();

    // Simular scroll
    const scrollContainer = fixture.nativeElement.querySelector('.scroll-container');
    for (let i = 0; i < 100; i++) {
      scrollContainer.scrollTop += 100;
    }

    setTimeout(() => {
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(3000); // 3 segundos máximo
      expect(document.querySelectorAll('.activity-item').length).toBeGreaterThan(0);
      
      done();
    }, 1000);
  });

  it('debe usar TrackBy para optimizar renderizado', () => {
    const spy = spyOn(component, 'trackByActivityId');
    
    component.actividades = createLargeActivityList(1000);
    fixture.detectChanges();
    
    expect(spy).toHaveBeenCalled();
  });
});
```

---

## 2. PRUEBAS DE ESTRÉS (Stress Testing)

### 2.1 Prueba: Límite de Conexión Firebase

**Objetivo**: Encontrar punto de ruptura de Firestore

| Aspecto | Valor |
|---------|-------|
| **Incremento/5min** | +50 usuarios |
| **Máximo objetivo** | 500+ usuarios |
| **Métrica** | Tasa de fallos |
| **Criterio parada** | Tasa fallos > 50% |

```javascript
// K6 Stress Test - Firebase Breaking Point
export const options = {
  stages: [
    { duration: '5m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '5m', target: 150 },
    { duration: '5m', target: 200 },
    { duration: '5m', target: 250 },
    { duration: '5m', target: 300 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.5'], // Parar si > 50% fallos
  },
};

export default function () {
  // Múltiples operaciones simultáneas
  const batch = http.batch([
    ['GET', 'https://api.com/bebes'],
    ['POST', 'https://api.com/actividades', { /* data */ }],
    ['GET', 'https://api.com/notificaciones'],
    ['PUT', 'https://api.com/usuario/profile'],
  ]);

  check(batch[0], { 'GET bebes success': (r) => r.status === 200 });
  check(batch[1], { 'POST actividad success': (r) => r.status === 201 });
}
```

---

### 2.2 Prueba: Desconexión de Red y Reconexión

**Objetivo**: Validar sincronización offline/online

| Escenario | Duración | Métrica |
|-----------|----------|---------|
| Online normal | 2 min | Sincronización OK |
| Desconectado | 3 min | Datos quedan en queue |
| Conexión lenta | 2 min | Reintento automático |
| Reconexión | 2 min | Sync en < 5s |
| Sin conectividad | 5 min | Datos persisten localmente |

```typescript
// Network Resilience Test
describe('Sincronización Offline/Online', () => {
  
  it('debe encolar cambios cuando no hay conectividad', fakeAsync(() => {
    // Simular offline
    navigator.onLine = false;
    
    const activity = { type: 'toma', cantidad: 150 };
    component.addActivity(activity);
    
    // Verificar que se guardó localmente
    expect(component.pendingSync.length).toBe(1);
    
    // Reconectar
    tick(5000);
    navigator.onLine = true;
    window.dispatchEvent(new Event('online'));
    
    tick(10000); // Esperar sincronización
    
    // Verificar sincronización
    expect(component.pendingSync.length).toBe(0);
  }));

  it('debe manejar timeout en conexión lenta', fakeAsync(() => {
    // Simular conexión lenta (2s latency)
    const slowRequest$ = timer(2000).pipe(
      switchMap(() => this.activityService.sync())
    );
    
    let completed = false;
    slowRequest$.subscribe(() => completed = true);
    
    tick(3000);
    
    expect(completed).toBe(true);
  }));
});
```

---

### 2.3 Prueba: Sobrecarga de Notificaciones

**Objetivo**: Máximo de notificaciones que la app puede procesar

| Aspecto | Valor |
|---------|-------|
| **Notificaciones/min** | 10, 50, 100, 500, 1000+ |
| **Tipos** | Medicamentos, tomas, sueño, vacunas |
| **Métrica** | Pérdida, latencia, memory leak |
| **Umbral crítico** | > 500/min |

```typescript
// Notification Stress Test
describe('Notificaciones bajo estrés', () => {
  
  it('debe procesar 500 notificaciones/min sin perderlas', fakeAsync(() => {
    const notificaciones = generateNotifications(500);
    let processed = 0;
    
    notificaciones.forEach(notif => {
      this.notificacionService.send(notif)
        .subscribe(() => processed++);
    });
    
    tick(60000); // 1 minuto
    
    expect(processed).toBe(500);
  }));

  it('debe detectar memory leaks en listeners de notificaciones', () => {
    const initialMemory = (performance as any).memory.usedJSHeapSize;
    
    // Crear y destruir muchos listeners
    for (let i = 0; i < 1000; i++) {
      const sub = this.notificacionService.onNotification$
        .subscribe(console.log);
      sub.unsubscribe();
    }
    
    const finalMemory = (performance as any).memory.usedJSHeapSize;
    const increase = (finalMemory - initialMemory) / 1024 / 1024;
    
    expect(increase).toBeLessThan(50); // Menos de 50MB
  });
});
```

---

## 3. HERRAMIENTAS RECOMENDADAS

### 3.1 Para Testing de API Backend

| Herramienta | Caso de Uso | Ventajas |
|-------------|-----------|----------|
| **K6** | Load/Stress testing | JavaScript, métricas en tiempo real, escalable |
| **Apache JMeter** | Load testing complejo | GUI, análisis detallado, comunidad grande |
| **Locust** | Load testing distribuidoload | Python, flexible, fácil de escalar |
| **Artillery** | API stress test | YAML, integración CI/CD, fácil de usar |

### 3.2 Para Testing de Frontend

| Herramienta | Caso de Uso |
|-------------|-----------|
| **Lighthouse** | Performance, Accessibility |
| **Chrome DevTools** | Memory, CPU, Network profiling |
| **Cypress** | E2E load testing |
| **Angular Testing Utilities** | Unit tests de performance |

### 3.3 Para Monitoreo Firebase

```typescript
// Configurar logging de performance
import { initializePerformanceMonitoring } from 'firebase/performance';

const perf = initializePerformanceMonitoring();
perf.instrumentationEnabled = true;

// Custom metrics
const metric = perf.measureUserTiming('sync-operation');
metric.stop();
```

---

## 4. MÉTRICAS CRÍTICAS A MEDIR

### 4.1 Métricas de Backend

| Métrica | Umbral Aceptable | Umbral Crítico |
|---------|-----------------|----------------|
| Latencia P95 (GET) | < 1s | > 5s |
| Latencia P99 (POST) | < 2s | > 10s |
| Error Rate | < 0.1% | > 5% |
| Throughput (req/s) | > 100 | < 10 |
| CPU % | < 70% | > 90% |
| Memory % | < 75% | > 90% |

### 4.2 Métricas de Frontend (Mobile)

| Métrica | Umbral Aceptable | Umbral Crítico |
|---------|-----------------|----------------|
| FCP (First Contentful Paint) | < 1s | > 3s |
| LCP (Largest Contentful Paint) | < 2.5s | > 4s |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.25 |
| Memory (MB) | < 100 | > 200 |
| Battery drain (% en 1h) | < 5% | > 15% |

---

## 5. CASOS DE PRUEBA ESPECÍFICOS POR SERVICIO

### 5.1 `AuthService` - Autenticación

```typescript
// Casos de prueba
describe('AuthService - Load Testing', () => {
  
  // 1. Logins simultáneos
  it('debe manejar 100 logins simultáneos', async () => {
    const promises = Array(100)
      .fill(null)
      .map((_, i) => this.auth.login(`user${i}@test.com`, 'password'));
    
    const results = await Promise.allSettled(promises);
    const successes = results.filter(r => r.status === 'fulfilled').length;
    
    expect(successes).toBeGreaterThan(95); // 95% éxito
  });

  // 2. Token refresh bajo carga
  it('debe refrescar tokens sin bloquear requestsgetClass', fakeAsync(() => {
    const requests = [];
    
    for (let i = 0; i < 50; i++) {
      requests.push(
        this.http.get('/api/data').toPromise()
      );
    }
    
    tick(1000); // Token expira
    this.auth.refreshToken();
    
    tick(2000);
    
    Promise.all(requests).then(results => {
      expect(results.every(r => r !== undefined)).toBe(true);
    });
  }));
});
```

### 5.2 `ActivityService` - Actividades

```typescript
describe('ActivityService - Load Testing', () => {
  
  // 1. Creación masiva
  it('crear 10000 actividades sin degradación', async () => {
    const metrics = { created: 0, failed: 0, times: [] };
    
    for (let i = 0; i < 10000; i++) {
      const start = performance.now();
      try {
        await this.activityService.create({
          bebeId: 'bebe123',
          type: 'toma',
          duration: 30 + Math.random() * 30,
        }).toPromise();
        metrics.created++;
      } catch (e) {
        metrics.failed++;
      }
      metrics.times.push(performance.now() - start);
    }
    
    const avg = metrics.times.reduce((a, b) => a + b) / metrics.times.length;
    expect(avg).toBeLessThan(1000); // Promedio < 1s
    expect(metrics.created / (metrics.created + metrics.failed)).toBeGreaterThan(0.99);
  });

  // 2. Lectura con filtros
  it('debe filtrar 100k actividades en < 2s', async () => {
    const start = performance.now();
    
    const activities = await this.activityService
      .getByBebeAndDateRange('bebe123', startDate, endDate)
      .toPromise();
    
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(2000);
    expect(activities.length).toBeGreaterThan(0);
  });
});
```

### 5.3 `NotificacionService` - Notificaciones

```typescript
describe('NotificacionService - Stress Testing', () => {
  
  // 1. Múltiples notificaciones simultáneas
  it('procesar 1000 notificaciones/min simultaneamente', fakeAsync(() => {
    let processed = 0;
    let errors = 0;
    
    // Simular 1000 notificaciones en 1 minuto
    for (let i = 0; i < 1000; i++) {
      this.notificacionService.send({
        type: ['medicamento', 'toma', 'sueno', 'vacuna'][Math.floor(Math.random() * 4)],
        bebeId: `bebe${Math.random()}`,
        message: `Notificación ${i}`,
      }).subscribe(
        () => processed++,
        () => errors++
      );
      
      tick(60 / 1000); // Distribuir en 60 segundos
    }
    
    tick(60000);
    
    expect(processed).toBeGreaterThan(950);
    expect(errors).toBeLessThan(50);
  }));

  // 2. Memory leak en subscripciones
  it('no debe tener memory leaks en listeners', () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const subscriptions = [];
    
    for (let i = 0; i < 1000; i++) {
      subscriptions.push(
        this.notificacionService.onNotification$
          .subscribe(console.log)
      );
    }
    
    subscriptions.forEach(sub => sub.unsubscribe());
    
    // Force garbage collection simulation
    setTimeout(() => {
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const leak = Math.abs(finalMemory - initialMemory) / 1024 / 1024;
      
      expect(leak).toBeLessThan(50); // Menos de 50MB
    }, 5000);
  });
});
```

---

## 6. PLAN DE EJECUCIÓN

### Fase 1: Baseline (Semana 1)
- [ ] Configurar herramientas (K6, JMeter, Chrome DevTools)
- [ ] Documentar baseline de performance actual
- [ ] Crear scripts de prueba iniciales

### Fase 2: Load Testing (Semana 2)
- [ ] Ejecutar pruebas de carga por servicio
- [ ] Identificar cuellos de botella
- [ ] Documentar resultados

### Fase 3: Stress Testing (Semana 3)
- [ ] Encontrar puntos de ruptura
- [ ] Pruebas de resiliencia
- [ ] Validar recuperación

### Fase 4: Optimización (Semana 4)
- [ ] Implementar fixes basados en resultados
- [ ] Re-ejecutar pruebas
- [ ] Documentar mejoras

---

## 7. ANÁLISIS DE CUELLOS DE BOTELLA ESPERADOS

### Posibles Issues en Firebase
- ⚠️ Indices de Firestore no optimizados
- ⚠️ Límite de escritura simultánea
- ⚠️ Paginación ineficiente
- ⚠️ Listeners no limpios

### Posibles Issues en Angular
- ⚠️ Change detection no optimizada
- ⚠️ TrackBy functions faltantes
- ⚠️ Subscripciones sin unsubscribe
- ⚠️ Operadores RxJS ineficientes

### Posibles Issues en Red
- ⚠️ Payloads demasiado grandes
- ⚠️ Falta de compresión
- ⚠️ Sin caching
- ⚠️ Sin lazy loading

---

## 8. DASHBOARD DE MONITOREO RECOMENDADO

```bash
# Herramientas sugeridas
- Firebase Console: Monitoring de Firestore
- Chrome DevTools: Memory, CPU, Network
- K6 Cloud: Análisis de resultados
- Grafana: Dashboards personalizados
```

---

## 9. REFERENCIAS

- K6 Documentation: https://k6.io/docs/
- Firebase Performance: https://firebase.google.com/docs/performance
- Angular Performance Guide: https://angular.io/guide/performance-best-practices
- Web Vitals: https://web.dev/vitals/
- Ionic Performance: https://ionicframework.com/docs/best-practices/performance
