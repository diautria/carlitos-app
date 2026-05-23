import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BebeFamilia } from '../models/bebe-familia.model';
import { BebeFamiliaService } from './bebe-familia.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionVacunasService {
  private readonly notificationBaseId = 200000;

  constructor(private bebeFamiliaService: BebeFamiliaService) {}

  async programarNotificacionesVacunasTodos(): Promise<void> {
    const bebes = await this.bebeFamiliaService.obtenerBebesFamiliaActual();

    if (!bebes.length) {
      return;
    }

    const permisoOk = await this.asegurarPermiso();

    if (!permisoOk) {
      return;
    }

    for (const bebe of bebes) {
      await this.programarNotificacionProximaVacunaBebe(bebe);
    }
  }

  async programarNotificacionProximaVacunaBebe(
    bebe: BebeFamilia
  ): Promise<void> {
    const notificationId = this.obtenerNotificationIdBebe(bebe.id);

    await this.cancelarNotificacionPorId(notificationId);

    const permisoOk = await this.asegurarPermiso();

    if (!permisoOk) {
      return;
    }

    if (!bebe.proximaVacuna) {
      console.log('No hay próxima vacuna para:', bebe.nombre);
      return;
    }

    const fechaVacuna = this.parseFechaLocal(bebe.proximaVacuna);

    if (Number.isNaN(fechaVacuna.getTime())) {
      console.log('Fecha de próxima vacuna inválida:', {
        bebe: bebe.nombre,
        proximaVacuna: bebe.proximaVacuna
      });
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
          'La próxima vacuna está dentro de los próximos 7 días.'
        );

        console.log('Notificación de vacuna próxima programada:', {
          bebe: bebe.nombre,
          notificationId,
          fechaVacuna
        });

        return;
      }

      console.log('No se programa vacuna porque la fecha ya pasó:', {
        bebe: bebe.nombre,
        fechaVacuna,
        fechaNotificacion
      });
      return;
    }

    await this.programarNotificacion(
      notificationId,
      bebe,
      fechaNotificacion,
      'Falta una semana para la próxima vacuna.'
    );

    console.log('Notificación de vacuna programada:', {
      bebe: bebe.nombre,
      notificationId,
      fechaVacuna,
      notificacion: fechaNotificacion
    });
  }

  async cancelarNotificacionesVacunasTodos(): Promise<void> {
    const pending = await LocalNotifications.getPending();

    const notifications = pending.notifications
      .filter(n =>
        n.id >= this.notificationBaseId &&
        n.id < this.notificationBaseId + 100000
      )
      .map(n => ({
        id: n.id
      }));

    if (!notifications.length) {
      return;
    }

    await LocalNotifications.cancel({
      notifications
    });
  }

  async cancelarNotificacionProximaVacuna(): Promise<void> {
    await this.cancelarNotificacionesVacunasTodos();
  }

  async programarNotificacionProximaVacuna(
    bebe: BebeFamilia
  ): Promise<void> {
    await this.programarNotificacionProximaVacunaBebe(bebe);
  }

  private async cancelarNotificacionPorId(id: number): Promise<void> {
    await LocalNotifications.cancel({
      notifications: [
        { id }
      ]
    });
  }

  private async programarNotificacion(
    notificationId: number,
    bebe: BebeFamilia,
    fechaNotificacion: Date,
    body: string
  ): Promise<void> {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `Próxima vacuna de ${bebe.nombre || 'tu bebé'}`,
          body,
          smallIcon: 'ic_notification_app',
          schedule: {
            at: fechaNotificacion,
            allowWhileIdle: true
          },
          extra: {
            bebeId: bebe.id
          }
        }
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
