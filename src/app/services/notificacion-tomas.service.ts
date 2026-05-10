import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ActivityFamilia } from '../models/activity-familia.model';
import { BebeFamilia } from '../models/bebe-familia.model';
import { BebeFamiliaService } from './bebe-familia.service';
import { ActivityFamiliaService } from './activity-familia.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionTomasService {
  private readonly notificationBaseId = 100000;

  constructor(
    private bebeFamiliaService: BebeFamiliaService,
    private activityFamiliaService: ActivityFamiliaService
  ) {}

  async programarNotificacionesProximasTomasTodos(): Promise<void> {
    const bebes = await this.bebeFamiliaService.obtenerBebesFamiliaActual();

    if (!bebes.length) {
      return;
    }

    const permisoOk = await this.asegurarPermiso();

    if (!permisoOk) {
      return;
    }

    for (const bebe of bebes) {
      await this.programarNotificacionProximaTomaBebe(bebe);
    }
  }

  async programarNotificacionProximaTomaBebe(
    bebe: BebeFamilia
  ): Promise<void> {
    const notificationId = this.obtenerNotificationIdBebe(bebe.id);

    await this.cancelarNotificacionPorId(notificationId);

    const actividades = await this.activityFamiliaService.getAllByBebeId(
      bebe.id
    );

    const tomasLeche = actividades
      .filter(a => a.type === 'toma-leche')
      .sort((a, b) => {
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      });

    const ultimaToma = tomasLeche[0];

    if (!ultimaToma) {
      console.log('No hay tomas para programar notificación:', bebe.nombre);
      return;
    }

    const horasEntreTomas = Number(
      (bebe as any).tiempoEntreTomasHoras || 3
    );

    if (!horasEntreTomas || horasEntreTomas <= 0) {
      return;
    }

    const fechaUltimaToma = this.parseFechaLocal(ultimaToma.time);

    const fechaProximaToma = new Date(
      fechaUltimaToma.getTime() + horasEntreTomas * 60 * 60 * 1000
    );

    const fechaNotificacion = new Date(
      fechaProximaToma.getTime() - 15 * 60 * 1000
    );

    const ahora = new Date();

    if (fechaNotificacion <= ahora) {
      console.log('No se programa porque la notificación ya pasó:', {
        bebe: bebe.nombre,
        fechaUltimaToma,
        fechaProximaToma,
        fechaNotificacion
      });
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `Próxima toma de ${bebe.nombre || 'tu bebé'}`,
          body: 'Faltan 15 minutos para la próxima toma de leche.',
          schedule: {
            at: fechaNotificacion,
            allowWhileIdle: true
          }
        }
      ]
    });

    console.log('Notificación de toma programada:', {
      bebe: bebe.nombre,
      notificationId,
      ultimaToma: fechaUltimaToma,
      proximaToma: fechaProximaToma,
      notificacion: fechaNotificacion
    });
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