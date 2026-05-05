import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Activity } from '../models/activity.model';
import { ConfiguracionService } from './configuracion.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionTomasService {
  private readonly notificationId = 1001;

  constructor(private configuracionService: ConfiguracionService) {}

  async programarNotificacionProximaToma(activities: Activity[]): Promise<void> {
    await this.cancelarNotificacionProximaToma();

    const tomasLeche = activities
      .filter(a => a.type === 'toma-leche')
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const ultimaToma = tomasLeche[0];

    if (!ultimaToma) {
      return;
    }

    const horasEntreTomas =
      await this.configuracionService.obtenerTiempoEntreTomas();

    const fechaUltimaToma = this.parseFechaLocal(ultimaToma.time);
    
    const fechaProximaToma = new Date(
      fechaUltimaToma.getTime() + horasEntreTomas * 60 * 60 * 1000
    );

    const fechaNotificacion = new Date(
      fechaProximaToma.getTime() - 15 * 60 * 1000
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
          title: 'Próxima toma de leche',
          body: 'Faltan 15 minutos para la próxima toma.',
          schedule: {
            at: fechaNotificacion,
            allowWhileIdle: true
          }
        }
      ]
    });
  }

  async cancelarNotificacionProximaToma(): Promise<void> {
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

  // Quita zona UTC si alguna actividad vieja quedó guardada con Z
  const cleanValue = value.replace('Z', '');

  // Esperado: 2026-05-05T10:30 o 2026-05-05T10:30:00
  const [fecha, hora] = cleanValue.split('T');

  if (!fecha || !hora) {
    return new Date(value);
  }

  const [year, month, day] = fecha.split('-').map(Number);
  const [hours, minutes] = hora.split(':').map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hours || 0,
    minutes || 0,
    0,
    0
  );
}
}