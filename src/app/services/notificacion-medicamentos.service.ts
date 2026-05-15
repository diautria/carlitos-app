import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { MedicamentoBebe } from '../models/bebe-familia.model';
import { Activity } from '../models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class NotificacionMedicamentosService {
  private readonly minutosAntes = 5;
  private readonly baseNotificationId = 3000;

  async programarNotificacionesMedicamentos(
  bebeId: string,
  nombreBebe: string,
  medicamentos: MedicamentoBebe[],
  actividades: Activity[] = []
): Promise<void> {
  const tienePermiso = await this.asegurarPermiso();

  if (!tienePermiso) {
    return;
  }

  await this.cancelarNotificacionesMedicamentos(medicamentos);

  const notifications: any[] = [];

    const medicamentosActivos = medicamentos.filter(m => m.activo);

    for (const medicamento of medicamentosActivos) {
      const fechaNotificacion = this.calcularProximaNotificacion(
        medicamento,
        actividades
      );

      if (!fechaNotificacion) {
        continue;
      }

      notifications.push({
        id: this.obtenerNotificationId(medicamento.id),
        title: 'Medicamento de ' + nombreBebe,
        body: `${medicamento.nombre}: ${medicamento.dosisGotas} gotas`,
        schedule: {
          at: fechaNotificacion,
          allowWhileIdle: true
        },
        smallIcon: 'ic_stat_icon_config_sample',
        extra: {
          bebeId,
          medicamentoId: medicamento.id
        }
      });
    }

    if (notifications.length === 0) {
      return;
    }

    await LocalNotifications.schedule({
      notifications
    });
  }

  async reprogramarMedicamentoDespuesDeAdministrar(
  bebeId: string,
  nombreBebe: string,
  medicamento: MedicamentoBebe,
  actividades: Activity[]
): Promise<void> {
  const tienePermiso = await this.asegurarPermiso();

  if (!tienePermiso) {
    return;
  }

  await this.cancelarNotificacionMedicamento(medicamento.id);

  if (!medicamento.activo) {
    return;
  }

  const fechaNotificacion = this.calcularProximaNotificacion(
    medicamento,
    actividades
  );

  if (!fechaNotificacion) {
    return;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: this.obtenerNotificationId(medicamento.id),
        title: 'Medicamento de ' + nombreBebe,
        body: `${medicamento.nombre}: ${medicamento.dosisGotas} gotas`,
        schedule: {
          at: fechaNotificacion,
          allowWhileIdle: true
        },
        smallIcon: 'ic_stat_icon_config_sample',
        extra: {
          bebeId,
          medicamentoId: medicamento.id
        }
      }
    ]
  });
}

  async cancelarNotificacionesMedicamentos(
    medicamentos: MedicamentoBebe[]
  ): Promise<void> {
    if (!medicamentos || medicamentos.length === 0) {
      return;
    }

    const notifications = medicamentos.map(medicamento => ({
      id: this.obtenerNotificationId(medicamento.id)
    }));

    await LocalNotifications.cancel({
      notifications
    });
  }

  async cancelarNotificacionMedicamento(
    medicamentoId: string
  ): Promise<void> {
    await LocalNotifications.cancel({
      notifications: [
        {
          id: this.obtenerNotificationId(medicamentoId)
        }
      ]
    });
  }

  private calcularProximaNotificacion(
    medicamento: MedicamentoBebe,
    actividades: Activity[]
  ): Date | null {
    if (!medicamento.activo) {
      return null;
    }

    const ahora = new Date();

    const ultimaAdministracion = this.obtenerUltimaAdministracion(
      medicamento.id,
      actividades
    );

    let proximaDosis: Date | null = null;

    if (medicamento.frecuenciaHoras && medicamento.frecuenciaHoras > 0) {
      if (ultimaAdministracion) {
        proximaDosis = new Date(ultimaAdministracion.time);
        proximaDosis.setHours(
          proximaDosis.getHours() + Number(medicamento.frecuenciaHoras)
        );
      } else {
        proximaDosis = this.obtenerPrimeraDosisDesdeConfiguracion(medicamento);
      }
    } else if (medicamento.horario) {
      proximaDosis = this.obtenerProximaDosisPorHorarioFijo(
        medicamento.horario,
        ultimaAdministracion
      );
    }

    if (!proximaDosis) {
      return null;
    }

    while (proximaDosis <= ahora) {
      if (medicamento.frecuenciaHoras && medicamento.frecuenciaHoras > 0) {
        proximaDosis.setHours(
          proximaDosis.getHours() + Number(medicamento.frecuenciaHoras)
        );
      } else {
        proximaDosis.setDate(proximaDosis.getDate() + 1);
      }
    }

    const fechaNotificacion = new Date(proximaDosis);
    fechaNotificacion.setMinutes(
      fechaNotificacion.getMinutes() - this.minutosAntes
    );

    if (fechaNotificacion <= ahora) {
      return null;
    }

    return fechaNotificacion;
  }

  private obtenerUltimaAdministracion(
    medicamentoId: string,
    actividades: Activity[]
  ): Activity | null {
    const actividadesMedicamento = actividades
      .filter((actividad: any) =>
        actividad.type === 'medicamento' &&
        actividad.medicamentoId === medicamentoId
      )
      .sort((a, b) =>
        new Date(b.time).getTime() - new Date(a.time).getTime()
      );

    return actividadesMedicamento[0] || null;
  }

  private obtenerPrimeraDosisDesdeConfiguracion(
    medicamento: MedicamentoBebe
  ): Date | null {
    const fecha = new Date();

    if (medicamento.horario) {
      const [horas, minutos] = medicamento.horario.split(':').map(Number);
      fecha.setHours(horas, minutos, 0, 0);
    } else {
      fecha.setHours(8, 0, 0, 0);
    }

    return fecha;
  }

  private obtenerProximaDosisPorHorarioFijo(
    horario: string,
    ultimaAdministracion: Activity | null
  ): Date {
    const [horas, minutos] = horario.split(':').map(Number);

    const proximaDosis = new Date();
    proximaDosis.setHours(horas, minutos, 0, 0);

    if (ultimaAdministracion) {
      const ultimaFecha = new Date(ultimaAdministracion.time);

      const yaFueAdministradoHoy =
        ultimaFecha.getFullYear() === proximaDosis.getFullYear() &&
        ultimaFecha.getMonth() === proximaDosis.getMonth() &&
        ultimaFecha.getDate() === proximaDosis.getDate();

      if (yaFueAdministradoHoy) {
        proximaDosis.setDate(proximaDosis.getDate() + 1);
      }
    }

    return proximaDosis;
  }

  private obtenerNotificationId(medicamentoId: string): number {
    let hash = 0;

    for (let i = 0; i < medicamentoId.length; i++) {
      hash = medicamentoId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return this.baseNotificationId + Math.abs(hash % 100000);
  }

  private async asegurarPermiso(): Promise<boolean> {
  const permiso = await LocalNotifications.checkPermissions();

  if (permiso.display === 'granted') {
    return true;
  }

  const permisoSolicitado = await LocalNotifications.requestPermissions();

  return permisoSolicitado.display === 'granted';
}
}