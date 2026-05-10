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

    if (!bebe.proximaVacuna) {
      console.log('No hay próxima vacuna para:', bebe.nombre);
      return;
    }

    const fechaVacuna = this.parseFechaLocal(bebe.proximaVacuna);

    const fechaNotificacion = new Date(
      fechaVacuna.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    const ahora = new Date();

    if (fechaNotificacion <= ahora) {
      console.log('No se programa vacuna porque la fecha ya pasó:', {
        bebe: bebe.nombre,
        fechaVacuna,
        fechaNotificacion
      });
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `Próxima vacuna de ${bebe.nombre || 'tu bebé'}`,
          body: 'Falta una semana para la próxima vacuna.',
          schedule: {
            at: fechaNotificacion,
            allowWhileIdle: true
          }
        }
      ]
    });

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
      return new Date();
    }

    const cleanValue = value.replace('Z', '');
    const [fecha, hora] = cleanValue.split('T');

    if (!fecha) {
      return new Date(value);
    }

    const [year, month, day] = fecha.split('-').map(Number);

    let hours = 9;
    let minutes = 0;

    if (hora) {
      const partesHora = hora.split(':').map(Number);
      hours = partesHora[0] || 9;
      minutes = partesHora[1] || 0;
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