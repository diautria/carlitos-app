import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Bebe, Actividad } from '../models/bebe.model';

@Injectable({
  providedIn: 'root'
})
export class BebeService {
  private bebes: Bebe[] = [
    {
      id: 1,
      nombre: 'Carlos Daniel',
      fechaNacimiento: '2025-12-19',
      edad: 4,
      peso: 6,
      altura: 62,
      foto: 'assets/img/bebe.jpg',
      ultimaAlimentacion: '2026-04-23T09:15:00',
      proximaVacuna: '2026-06-01',
      notas: ['Alérgico a la lactosa', 'Duerme muy bien']
    }
  ];

  private actividades: Actividad[] = [
    {
      id: 1,
      tipo: 'alimentacion',
      titulo: 'Almuerzo',
      descripcion: 'Puré de verduras - 150g',
      fecha: new Date('2026-04-23T09:15:00'),
      bebeId: 1
    }
  ];

  private bebesSubject = new BehaviorSubject<Bebe[]>(this.bebes);
  private actividadesSubject = new BehaviorSubject<Actividad[]>(this.actividades);

  getBebes(): Observable<Bebe[]> {
    return this.bebesSubject.asObservable();
  }

  getBebeById(id: number): Bebe | undefined {
    return this.bebes.find(b => b.id === id);
  }

  getActividades(): Observable<Actividad[]> {
    return this.actividadesSubject.asObservable();
  }

  getActividadesByBebeId(bebeId: number): Actividad[] {
    return this.actividades.filter(a => a.bebeId === bebeId);
  }

  getActividadesRecientes(limit: number = 5): Actividad[] {
    return [...this.actividades]
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, limit);
  }
}