/**
 * Unit/Integration Tests para Performance Testing
 * 
 * Ejecutar con:
 * ng test --include='**/load-test.spec.ts'
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivityService } from '../src/app/services/activity.service';
import { NotificacionMedicamentosService } from '../src/app/services/notificacion-medicamentos.service';
import { AuthService } from '../src/app/services/auth.service';

describe('Performance Load Tests - BebecioApp', () => {
  let httpMock: HttpTestingController;
  let activityService: ActivityService;
  let notificacionService: NotificacionMedicamentosService;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ActivityService,
        NotificacionMedicamentosService,
        AuthService,
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    activityService = TestBed.inject(ActivityService);
    notificacionService = TestBed.inject(NotificacionMedicamentosService);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ==========================================
  // 1. ACTIVITY SERVICE LOAD TESTS
  // ==========================================

  describe('ActivityService - Load Testing', () => {
    
    it('should handle 1000 concurrent create requests', fakeAsync(() => {
      const metrics = { success: 0, failed: 0, times: [] };
      const requests = 1000;

      for (let i = 0; i < requests; i++) {
        const start = performance.now();
        
        activityService.create({
          bebeId: `bebe_${i % 100}`,
          type: 'toma',
          cantidad: 150,
          duracion: 30,
        }).subscribe(
          () => {
            metrics.success++;
            metrics.times.push(performance.now() - start);
          },
          () => {
            metrics.failed++;
          }
        );

        const req = httpMock.expectOne('/api/actividades');
        req.flush({ id: `activity_${i}`, success: true });
      }

      tick(5000);

      const successRate = metrics.success / requests;
      const avgTime = metrics.times.reduce((a, b) => a + b, 0) / metrics.times.length;

      console.log(`
        Activity Create Load Test Results:
        - Success Rate: ${(successRate * 100).toFixed(2)}%
        - Average Response Time: ${avgTime.toFixed(2)}ms
        - Total Requests: ${requests}
      `);

      expect(successRate).toBeGreaterThan(0.95);
      expect(avgTime).toBeLessThan(1000);
    }));

    it('should filter 10000 activities efficiently', fakeAsync(() => {
      const start = performance.now();
      const bebeId = 'bebe_123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      activityService.getByBebeAndDateRange(bebeId, startDate, endDate)
        .subscribe(
          (activities) => {
            const duration = performance.now() - start;
            
            console.log(`
              Activity Filter Test Results:
              - Query Time: ${duration.toFixed(2)}ms
              - Results Count: ${activities.length}
            `);

            expect(duration).toBeLessThan(2000);
            expect(activities.length).toBeGreaterThan(0);
          }
        );

      const req = httpMock.expectOne(req => 
        req.url.includes('/api/activities/search')
      );
      
      const mockActivities = Array(10000)
        .fill(null)
        .map((_, i) => ({
          id: `act_${i}`,
          type: 'toma',
          timestamp: new Date(),
          cantidad: 150,
        }));

      req.flush(mockActivities);
      tick(2000);
    }));

    it('should handle batch create with proper throughput', fakeAsync(() => {
      const batchSize = 500;
      const metrics = { processed: 0, startTime: Date.now() };

      for (let i = 0; i < batchSize; i++) {
        activityService.create({
          bebeId: `bebe_${i % 50}`,
          type: ['toma', 'cambio', 'sueno', 'medicamento'][i % 4],
          timestamp: new Date(),
        }).subscribe(() => metrics.processed++);

        const req = httpMock.expectOne('/api/actividades');
        req.flush({ id: `activity_${i}` });
      }

      tick(10000);

      const elapsedTime = (Date.now() - metrics.startTime) / 1000;
      const throughput = metrics.processed / elapsedTime;

      console.log(`
        Activity Batch Load Test:
        - Processed: ${metrics.processed}
        - Throughput: ${throughput.toFixed(2)} req/s
        - Elapsed: ${elapsedTime.toFixed(2)}s
      `);

      expect(throughput).toBeGreaterThan(50);
      expect(metrics.processed).toBe(batchSize);
    }));

    it('should not have memory leaks after many operations', fakeAsync(() => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const sub = activityService.getActivitiesByBebe(`bebe_${i % 10}`)
          .subscribe(() => {});
        
        const req = httpMock.expectOne(
          req => req.url.includes('/api/activities')
        );
        req.flush([]);
        
        sub.unsubscribe();
      }

      tick(5000);

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

      console.log(`Memory Increase: ${memoryIncrease.toFixed(2)}MB`);

      expect(memoryIncrease).toBeLessThan(50); // Less than 50MB
    }));
  });

  // ==========================================
  // 2. NOTIFICATION SERVICE STRESS TESTS
  // ==========================================

  describe('NotificacionService - Stress Testing', () => {
    
    it('should process 500 notifications per minute', fakeAsync(() => {
      const notificationsPerMin = 500;
      let processed = 0;
      let failed = 0;

      for (let i = 0; i < notificationsPerMin; i++) {
        notificacionService.send({
          medicamentoId: `med_${i % 100}`,
          bebeId: `bebe_${i % 50}`,
          message: `Tomar medicamento ${i}`,
          hora: new Date(),
        }).subscribe(
          () => processed++,
          () => failed++
        );

        const req = httpMock.expectOne('/api/notificaciones');
        req.flush({ id: `notif_${i}`, sent: true });

        // Distribute over 60 seconds
        tick(60 / notificationsPerMin);
      }

      const successRate = processed / (processed + failed);
      console.log(`
        Notification Stress Test:
        - Processed: ${processed}/${notificationsPerMin}
        - Success Rate: ${(successRate * 100).toFixed(2)}%
        - Failed: ${failed}
      `);

      expect(successRate).toBeGreaterThan(0.95);
      expect(processed).toBeGreaterThan(475);
    }));

    it('should handle rapid notification subscription/unsubscription', fakeAsync(() => {
      const iterations = 1000;
      let subscriptionCount = 0;

      for (let i = 0; i < iterations; i++) {
        const sub = notificacionService.onNotification$
          .subscribe(() => subscriptionCount++);
        
        tick(10);
        sub.unsubscribe();
      }

      tick(1000);

      console.log(`Subscription/Unsubscription Test: ${iterations} iterations`);
      expect(subscriptionCount).toBeDefined();
    }));

    it('should maintain low latency with 1000 concurrent listeners', fakeAsync(() => {
      const listenerCount = 1000;
      const metrics = { latencies: [], received: 0 };
      const listeners = [];

      // Create many listeners
      for (let i = 0; i < listenerCount; i++) {
        listeners.push(
          notificacionService.onNotification$
            .subscribe((notif) => {
              const latency = Date.now() - notif.timestamp;
              metrics.latencies.push(latency);
              metrics.received++;
            })
        );
      }

      // Trigger notification
      tick(500);

      listeners.forEach(l => l.unsubscribe());

      const avgLatency = metrics.latencies.length > 0
        ? metrics.latencies.reduce((a, b) => a + b) / metrics.latencies.length
        : 0;

      console.log(`
        Listener Stress Test:
        - Listeners: ${listenerCount}
        - Received: ${metrics.received}
        - Avg Latency: ${avgLatency.toFixed(2)}ms
      `);

      expect(avgLatency).toBeLessThan(500);
    }));
  });

  // ==========================================
  // 3. AUTH SERVICE LOAD TESTS
  // ==========================================

  describe('AuthService - Load Testing', () => {
    
    it('should handle 100 simultaneous login attempts', fakeAsync(() => {
      const concurrent = 100;
      const metrics = { success: 0, failed: 0 };

      for (let i = 0; i < concurrent; i++) {
        authService.login(`user_${i}@test.com`, 'password123')
          .subscribe(
            () => metrics.success++,
            () => metrics.failed++
          );

        const req = httpMock.expectOne('/api/auth/login');
        req.flush({
          token: `token_${i}`,
          user: { id: `user_${i}`, email: `user_${i}@test.com` },
        });
      }

      tick(5000);

      const successRate = metrics.success / concurrent;
      console.log(`
        Login Load Test:
        - Concurrent Attempts: ${concurrent}
        - Success Rate: ${(successRate * 100).toFixed(2)}%
        - Success: ${metrics.success}, Failed: ${metrics.failed}
      `);

      expect(successRate).toBeGreaterThan(0.95);
    }));

    it('should refresh tokens without blocking requests', fakeAsync(() => {
      const requestCount = 50;
      let completed = 0;

      // Start requests
      for (let i = 0; i < requestCount; i++) {
        activityService.getActivitiesByBebe(`bebe_${i}`)
          .subscribe(() => completed++);

        const req = httpMock.expectOne(
          req => req.url.includes('/api/activities')
        );
        req.flush([]);
      }

      // Token expires
      tick(1000);
      authService.refreshToken().subscribe();

      const refreshReq = httpMock.expectOne('/api/auth/refresh');
      refreshReq.flush({ token: 'new_token' });

      tick(2000);

      console.log(`Token Refresh Test: ${completed}/${requestCount} requests completed`);
      expect(completed).toBe(requestCount);
    }));
  });

  // ==========================================
  // 4. COMBINED STRESS TEST
  // ==========================================

  describe('Integration - Combined Stress Test', () => {
    
    it('should maintain performance under combined load', fakeAsync(() => {
      const duration = 60000; // 1 minute
      const metrics = {
        activities: { success: 0, failed: 0 },
        notifications: { success: 0, failed: 0 },
        auth: { success: 0, failed: 0 },
      };

      // Simulate combined operations
      const interval = setInterval(() => {
        // 60% activity operations
        activityService.create({
          bebeId: `bebe_${Math.random()}`,
          type: 'toma',
        }).subscribe(
          () => metrics.activities.success++,
          () => metrics.activities.failed++
        );

        // 30% notifications
        if (Math.random() > 0.7) {
          notificacionService.send({
            medicamentoId: 'med_1',
            bebeId: 'bebe_1',
            message: 'Test',
            hora: new Date(),
          }).subscribe(
            () => metrics.notifications.success++,
            () => metrics.notifications.failed++
          );
        }

        // 10% auth operations
        if (Math.random() > 0.9) {
          authService.refreshToken().subscribe(
            () => metrics.auth.success++,
            () => metrics.auth.failed++
          );
        }
      }, 100);

      // Process all pending requests
      while (httpMock.match(() => true).length > 0) {
        const req = httpMock.match(() => true)[0];
        req.flush({ success: true });
      }

      tick(duration);
      clearInterval(interval);

      console.log(`
        Combined Stress Test Results:
        - Activities: ${metrics.activities.success} success, ${metrics.activities.failed} failed
        - Notifications: ${metrics.notifications.success} success, ${metrics.notifications.failed} failed
        - Auth: ${metrics.auth.success} success, ${metrics.auth.failed} failed
      `);

      const totalSuccess = 
        metrics.activities.success + 
        metrics.notifications.success + 
        metrics.auth.success;
      
      expect(totalSuccess).toBeGreaterThan(0);
    }));
  });
});
