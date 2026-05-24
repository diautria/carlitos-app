import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ActivityFamilia } from '../models/activity-familia.model';

@Injectable({
  providedIn: 'root'
})
export class ActividadEventosService {
  private actividadGuardadaSubject = new Subject<ActivityFamilia | void>();

  actividadGuardada$ = this.actividadGuardadaSubject.asObservable();

  notificarActividadGuardada(activity?: ActivityFamilia): void {
    this.actividadGuardadaSubject.next(activity);
  }
}
