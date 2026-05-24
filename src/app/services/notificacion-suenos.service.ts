import { Injectable } from '@angular/core';
import { ActivityFamilia } from '../models/activity-familia.model';
import { BebeFamiliaService } from './bebe-familia.service';
import { ActivityFamiliaService } from './activity-familia.service';
import { NotificacionFamiliaService } from './notificacion-familia.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionSuenosService {
  private readonly notificationBaseId = 400000;
  private readonly horaInicioPermitida = 8;
  private readonly horaFinPermitida = 22;

  constructor(
    private bebeFamiliaService: BebeFamiliaService,
    private activityFamiliaService: ActivityFamiliaService,
    private notificacionFamiliaService: NotificacionFamiliaService
  ) {}

  async programarProximoSuenoBebeActivo(): Promise<void> {
    const config = await this.bebeFamiliaService.obtenerConfiguracionBebeActivo();
    const notificationId = this.obtenerNotificationIdBebe(config.bebeId);

    await this.cancelarNotificacionPorBebe(config.bebeId);

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

    if (fechaProximoSueno <= new Date()) {
      return;
    }

    if (!this.estaDentroDelHorarioPermitido(fechaProximoSueno)) {
      return;
    }

    await this.notificacionFamiliaService.programarRecordatorioFamilia({
      recordatorioId: this.obtenerRecordatorioIdBebe(config.bebeId),
      notificationId,
      tipo: 'sueno',
      titulo: `Hora de dormir para ${config.nombre || 'tu bebe'}`,
      mensaje: 'Ya es hora de que vuelva a dormir.',
      fechaNotificacion: fechaProximoSueno,
      bebeId: config.bebeId
    });
  }

  async cancelarProximoSuenoBebeActivo(): Promise<void> {
    const config = await this.bebeFamiliaService.obtenerConfiguracionBebeActivo();

    await this.cancelarNotificacionPorBebe(config.bebeId);
  }

  private estaDentroDelHorarioPermitido(fecha: Date): boolean {
    const minutosDelDia = fecha.getHours() * 60 + fecha.getMinutes();
    const inicio = this.horaInicioPermitida * 60;
    const fin = this.horaFinPermitida * 60;

    return minutosDelDia >= inicio && minutosDelDia <= fin;
  }

  private async cancelarNotificacionPorBebe(bebeId: string): Promise<void> {
    await this.notificacionFamiliaService.cancelarRecordatorioFamilia(
      this.obtenerRecordatorioIdBebe(bebeId)
    );
  }

  private obtenerRecordatorioIdBebe(bebeId: string): string {
    return `sueno-${bebeId}`;
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
