import { Injectable } from '@angular/core';
import { BebeFamilia } from '../models/bebe-familia.model';
import { BebeFamiliaService } from './bebe-familia.service';
import { NotificacionFamiliaService } from './notificacion-familia.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionVacunasService {
  private readonly notificationBaseId = 200000;

  constructor(
    private bebeFamiliaService: BebeFamiliaService,
    private notificacionFamiliaService: NotificacionFamiliaService
  ) {}

  async programarNotificacionesVacunasTodos(): Promise<void> {
    const bebes = await this.bebeFamiliaService.obtenerBebesFamiliaActual();

    for (const bebe of bebes) {
      await this.programarNotificacionProximaVacunaBebe(bebe);
    }
  }

  async programarNotificacionProximaVacunaBebe(
    bebe: BebeFamilia
  ): Promise<void> {
    const notificationId = this.obtenerNotificationIdBebe(bebe.id);

    await this.cancelarNotificacionPorBebe(bebe.id);

    if (!bebe.proximaVacuna) {
      return;
    }

    const fechaVacuna = this.parseFechaLocal(bebe.proximaVacuna);

    if (Number.isNaN(fechaVacuna.getTime())) {
      return;
    }

    const fechaNotificacion = new Date(
      fechaVacuna.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    const ahora = new Date();

    if (fechaNotificacion <= ahora) {
      if (fechaVacuna > ahora) {
        await this.programarNotificacion(
          notificationId,
          bebe,
          new Date(ahora.getTime() + 1000),
          fechaVacuna,
          'La proxima vacuna esta dentro de los proximos 7 dias.'
        );
      }

      return;
    }

    await this.programarNotificacion(
      notificationId,
      bebe,
      fechaNotificacion,
      fechaVacuna,
      'Falta una semana para la proxima vacuna.'
    );
  }

  async cancelarNotificacionesVacunasTodos(): Promise<void> {
    const bebes = await this.bebeFamiliaService.obtenerBebesFamiliaActual();

    for (const bebe of bebes) {
      await this.cancelarNotificacionPorBebe(bebe.id);
    }
  }

  async cancelarNotificacionProximaVacuna(): Promise<void> {
    await this.cancelarNotificacionesVacunasTodos();
  }

  async programarNotificacionProximaVacuna(
    bebe: BebeFamilia
  ): Promise<void> {
    await this.programarNotificacionProximaVacunaBebe(bebe);
  }

  private async cancelarNotificacionPorBebe(bebeId: string): Promise<void> {
    await this.notificacionFamiliaService.cancelarRecordatorioFamilia(
      this.obtenerRecordatorioIdBebe(bebeId)
    );
  }

  private async programarNotificacion(
    notificationId: number,
    bebe: BebeFamilia,
    fechaNotificacion: Date,
    fechaObjetivo: Date,
    body: string
  ): Promise<void> {
    await this.notificacionFamiliaService.programarRecordatorioFamilia({
      recordatorioId: this.obtenerRecordatorioIdBebe(bebe.id),
      notificationId,
      tipo: 'vacuna',
      titulo: `Proxima vacuna de ${bebe.nombre || 'tu bebe'}`,
      mensaje: body,
      fechaNotificacion,
      fechaObjetivo,
      bebeId: bebe.id
    });
  }

  private obtenerRecordatorioIdBebe(bebeId: string): string {
    return `vacuna-${bebeId}`;
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

    const [fecha, hora] = value.split('T');

    if (!fecha) {
      return new Date(value);
    }

    const [year, month, day] = fecha.split('-').map(Number);

    if (!year || !month || !day) {
      return new Date(value);
    }

    let hours = 9;
    let minutes = 0;

    if (hora) {
      const partesHora = hora.split(':');
      hours = Number(partesHora[0]) || 9;
      minutes = Number(partesHora[1]) || 0;
    }

    return new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      0,
      0
    );
  }
}
