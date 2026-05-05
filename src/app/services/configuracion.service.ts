import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Bebe } from '../models/bebe.model';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private readonly tiempoEntreTomasKey = 'tiempoEntreTomasHoras';
  private readonly onzasDiariasKey = 'onzasDiariasObjetivo';
  private readonly bebeKey = 'bebePrincipal';

  async obtenerTiempoEntreTomas(): Promise<number> {
    const result = await Preferences.get({
      key: this.tiempoEntreTomasKey
    });

    return Number(result.value ?? 3);
  }

  async guardarTiempoEntreTomas(horas: number): Promise<void> {
    await Preferences.set({
      key: this.tiempoEntreTomasKey,
      value: horas.toString()
    });
  }

  async obtenerOnzasDiariasObjetivo(): Promise<number> {
    const result = await Preferences.get({
        key: this.onzasDiariasKey
    });

    return Number(result.value ?? 24);
    }

    async guardarOnzasDiariasObjetivo(onzas: number): Promise<void> {
      await Preferences.set({
          key: this.onzasDiariasKey,
          value: onzas.toString()
      });
    }

    async obtenerBebePrincipal(): Promise<Bebe> {
  const result = await Preferences.get({
    key: this.bebeKey
  });

  if (result.value) {
    return JSON.parse(result.value) as Bebe;
  }

  return {
    id: 1,
    nombre: '',
    fechaNacimiento: '',
    edad: 0,
    peso: 0,
    altura: 0,
    foto: '',
    ultimaAlimentacion: '',
    proximaVacuna: '',
    notas: []
  };
}

  async guardarBebePrincipal(bebe: Bebe): Promise<void> {
    await Preferences.set({
      key: this.bebeKey,
      value: JSON.stringify(bebe)
    });
  }
}