import { Injectable } from '@angular/core';
import { ActivityFamilia } from '../models/activity-familia.model';
import { BebeFamilia } from '../models/bebe-familia.model';
import { BebeFamiliaService } from './bebe-familia.service';
import { ActivityFamiliaService } from './activity-familia.service';
import { NotificacionFamiliaService } from './notificacion-familia.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionTomasService {
  private readonly notificationBaseId = 100000;
  private readonly minutosAntes = 15;

  constructor(
    private bebeFamiliaService: BebeFamiliaService,
    private activityFamiliaService: ActivityFamiliaService,
    private notificacionFamiliaService: NotificacionFamiliaService
  ) {}

  async programarNotificacionesProximasTomasTodos(): Promise<void> {
    const bebes = await this.bebeFamiliaService.obtenerBebesFamiliaActual();

    for (const bebe of bebes) {
      await this.programarNotificacionProximaTomaBebe(bebe);
    }
  }

  async programarNotificacionProximaTomaBebe(
    bebe: BebeFamilia
  ): Promise<void> {
    const notificationId = this.obtenerNotificationIdBebe(bebe.id);

    await this.cancelarNotificacionPorBebe(bebe.id);

    const actividades = await this.activityFamiliaService.getAllByBebeId(
      bebe.id
    );

    const tomasLeche = actividades
      .filter(a => a.type === 'toma-leche')
      .sort((a, b) =>
        this.parseFechaLocal(b.time).getTime() -
        this.parseFechaLocal(a.time).getTime()
      );

    const ultimaToma = tomasLeche[0];

    if (!ultimaToma) {
      return;
    }

    const horasEntreTomas = Number(
      (bebe as any).tiempoEntreTomasHoras || 3
    );

    if (!horasEntreTomas || horasEntreTomas <= 0) {
      return;
    }

    const fechaUltimaToma = this.parseFechaLocal(ultimaToma.time);

    if (Number.isNaN(fechaUltimaToma.getTime())) {
      return;
    }

    const fechaProximaToma = new Date(
      fechaUltimaToma.getTime() + horasEntreTomas * 60 * 60 * 1000
    );

    const fechaNotificacion = new Date(
      fechaProximaToma.getTime() - this.minutosAntes * 60 * 1000
    );

    const ahora = new Date();

    if (fechaNotificacion <= ahora) {
      if (fechaProximaToma > ahora) {
        await this.programarNotificacion(
          notificationId,
          bebe,
          new Date(ahora.getTime() + 1000),
          `Faltan menos de ${this.minutosAntes} minutos para la proxima toma de leche.`
        );
      }

      return;
    }

    await this.programarNotificacion(
      notificationId,
      bebe,
      fechaNotificacion,
      `Faltan ${this.minutosAntes} minutos para la proxima toma de leche.`
    );
  }

  async programarNotificacionProximaToma(
    activities: ActivityFamilia[]
  ): Promise<void> {
    await this.programarNotificacionesProximasTomasTodos();
  }

  async cancelarNotificacionProximaToma(): Promise<void> {
    await this.cancelarNotificacionesProximasTomasTodos();
  }

  async cancelarNotificacionesProximasTomasTodos(): Promise<void> {
    const bebes = await this.bebeFamiliaService.obtenerBebesFamiliaActual();

    for (const bebe of bebes) {
      await this.cancelarNotificacionPorBebe(bebe.id);
    }
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
    body: string
  ): Promise<void> {
    await this.notificacionFamiliaService.programarRecordatorioFamilia({
      recordatorioId: this.obtenerRecordatorioIdBebe(bebe.id),
      notificationId,
      tipo: 'toma-leche',
      titulo: `Proxima toma de ${bebe.nombre || 'tu bebe'}`,
      mensaje: body,
      fechaNotificacion,
      bebeId: bebe.id
    });
  }

  private obtenerRecordatorioIdBebe(bebeId: string): string {
    return `toma-${bebeId}`;
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
