import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Bebe } from '../models/bebe.model';

@Injectable({
  providedIn: 'root'
})
export class NotificacionVacunasService {
  private readonly notificationId = 2001;

  async programarNotificacionProximaVacuna(bebe: Bebe): Promise<void> {
    await this.cancelarNotificacionProximaVacuna();

    if (!bebe.proximaVacuna) {
      return;
    }

    const fechaVacuna = this.parseFechaLocal(bebe.proximaVacuna);

    const fechaNotificacion = new Date(
      fechaVacuna.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    const ahora = new Date();

    if (fechaNotificacion <= ahora) {
      return;
    }

    const permiso = await LocalNotifications.checkPermissions();

    if (permiso.display !== 'granted') {
      const permisoSolicitado = await LocalNotifications.requestPermissions();

      if (permisoSolicitado.display !== 'granted') {
        return;
      }
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: this.notificationId,
          title: 'Próxima vacuna',
          body: `Falta una semana para la próxima vacuna de ${bebe.nombre || 'tu bebé'}.`,
          schedule: {
            at: fechaNotificacion,
            allowWhileIdle: true
          }
        }
      ]
    });
  }

  async cancelarNotificacionProximaVacuna(): Promise<void> {
    await LocalNotifications.cancel({
      notifications: [
        {
          id: this.notificationId
        }
      ]
    });
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