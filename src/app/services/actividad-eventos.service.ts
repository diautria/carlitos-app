import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActividadEventosService {
  private actividadGuardadaSubject = new Subject<void>();

  actividadGuardada$ = this.actividadGuardadaSubject.asObservable();

  notificarActividadGuardada(): void {
    this.actividadGuardadaSubject.next();
  }
}
