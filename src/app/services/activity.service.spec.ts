import { TestBed } from '@angular/core/testing';
import { ActivityService } from './activity.service';
import { Activity } from '../models/activity.model';

describe('ActivityService', () => {
  let service: ActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add and get activities', async () => {
    const act: Activity = {
      id: 'test',
      type: 'toma-leche',
      time: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      cantidadOnzas: 3,
      esLecheMaterna: false,
    };
    await service.saveAll([]);
    await service.add(act);
    const all = await service.getAll();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe('test');
  });
});
