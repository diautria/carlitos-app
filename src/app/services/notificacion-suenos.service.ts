import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ActivityFamilia } from '../models/activity-familia.model';
import { BebeFamiliaService } from './bebe-familia.service';
import { ActivityFamiliaService } from './activity-familia.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionSuenosService {
  private readonly notificationBaseId = 200000;
  private readonly horaInicioPermitida = 8;
  private readonly horaFinPermitida = 22;

  constructor(
    private bebeFamiliaService: BebeFamiliaService,
    private activityFamiliaService: ActivityFamiliaService
  ) {}

  async programarProximoSuenoBebeActivo(): Promise<void> {
    const config = await this.bebeFamiliaService.obtenerConfiguracionBebeActivo();
    const notificationId = this.obtenerNotificationIdBebe(config.bebeId);

    await this.cancelarNotificacionPorId(notificationId);

    const permisoOk = await this.asegurarPermiso();

    if (!permisoOk) {
      return;
    }

    const tiempoEntreSuenosHoras = Number(config.tiempoEntreSuenosHoras || 0);

    if (!tiempoEntreSuenosHoras || tiempoEntreSuenosHoras <= 0) {
      return;
    }

    const actividades = await this.activityFamiliaService.getAllByBebeId(
      config.bebeId
    );

    const haySuenoActivo = actividades.some(actividad =>
      actividad.type === 'sueno' &&
      !(actividad as any).fin
    );

    if (haySuenoActivo) {
      return;
    }

    const suenosFinalizados = actividades
      .filter(actividad =>
        actividad.type === 'sueno' &&
        !!(actividad as any).fin
      )
      .sort((a, b) =>
        this.parseFechaLocal((b as any).fin).getTime() -
        this.parseFechaLocal((a as any).fin).getTime()
      );

    const ultimoSueno = suenosFinalizados[0];

    if (!ultimoSueno) {
      return;
    }

    const fechaFinUltimoSueno = this.parseFechaLocal((ultimoSueno as any).fin);

    if (Number.isNaN(fechaFinUltimoSueno.getTime())) {
      return;
    }

    const fechaProximoSueno = new Date(
      fechaFinUltimoSueno.getTime() + tiempoEntreSuenosHoras * 60 * 60 * 1000
    );

    const ahora = new Date();

    if (fechaProximoSueno <= ahora) {
      return;
    }

    if (!this.estaDentroDelHorarioPermitido(fechaProximoSueno)) {
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `Hora de dormir para ${config.nombre || 'tu bebe'}`,
          body: 'Ya es hora de que vuelva a dormir.',
          schedule: {
            at: fechaProximoSueno,
            allowWhileIdle: true
          },
          extra: {
            bebeId: config.bebeId,
            tipo: 'sueno'
          }
        }
      ]
    });
  }

  async cancelarProximoSuenoBebeActivo(): Promise<void> {
    const config = await this.bebeFamiliaService.obtenerConfiguracionBebeActivo();
    await this.cancelarNotificacionPorId(
      this.obtenerNotificationIdBebe(config.bebeId)
    );
  }

  private estaDentroDelHorarioPermitido(fecha: Date): boolean {
    const minutosDelDia = fecha.getHours() * 60 + fecha.getMinutes();
    const inicio = this.horaInicioPermitida * 60;
    const fin = this.horaFinPermitida * 60;

    return minutosDelDia >= inicio && minutosDelDia <= fin;
  }

  private async cancelarNotificacionPorId(id: number): Promise<void> {
    await LocalNotifications.cancel({
      notifications: [
        { id }
      ]
    });
  }

  private obtenerNotificationIdBebe(bebeId: string): number {
    return this.notificationBaseId + this.hashStringToNumber(bebeId, 99999);
  }

  private hashStringToNumber(value: string, max: number): number {
    let hash = 0;

    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0;
    }

    return Math.abs(hash) % max;
  }

  private async asegurarPermiso(): Promise<boolean> {
    const permiso = await LocalNotifications.checkPermissions();

    if (permiso.display === 'granted') {
      return true;
    }

    const permisoSolicitado = await LocalNotifications.requestPermissions();

    return permisoSolicitado.display === 'granted';
  }

  private parseFechaLocal(value: string): Date {
    if (!value) {
      return new Date(NaN);
    }

    const tieneZonaHoraria = /(?:z|[+-]\d{2}:\d{2})$/i.test(value);

    if (tieneZonaHoraria) {
      return new Date(value);
    }

    const [fecha, hora = '00:00'] = value.split('T');

    if (!fecha || !hora) {
      return new Date(value);
    }

    const [year, month, day] = fecha.split('-').map(Number);
    const [hours = '0', minutes = '0', seconds = '0'] = hora.split(':');

    if (!year || !month || !day) {
      return new Date(value);
    }

    return new Date(
      year,
      month - 1,
      day,
      Number(hours) || 0,
      Number(minutes) || 0,
      Number(seconds.split('.')[0]) || 0,
      0
    );
  }
}
