import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { MedicamentoBebe } from '../models/bebe-familia.model';
import { ActivityFamilia } from '../models/activity-familia.model';

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
    actividades: ActivityFamilia[] = []
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
    actividades: ActivityFamilia[]
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
    actividades: ActivityFamilia[]
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
        proximaDosis = this.parseFechaActividad(ultimaAdministracion.time);
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

    if (!proximaDosis || Number.isNaN(proximaDosis.getTime())) {
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
      if (proximaDosis > ahora) {
        return new Date(ahora.getTime() + 1000);
      }

      return null;
    }

    return fechaNotificacion;
  }

  private obtenerUltimaAdministracion(
    medicamentoId: string,
    actividades: ActivityFamilia[]
  ): ActivityFamilia | null {
    const actividadesMedicamento = actividades
      .filter((actividad: any) =>
        actividad.type === 'medicamento' &&
        actividad.medicamentoId === medicamentoId
      )
      .sort((a, b) =>
        this.parseFechaActividad(b.time).getTime() -
        this.parseFechaActividad(a.time).getTime()
      );

    return actividadesMedicamento[0] || null;
  }

  private obtenerPrimeraDosisDesdeConfiguracion(
    medicamento: MedicamentoBebe
  ): Date | null {
    const fecha = new Date();

    if (medicamento.horario) {
      const [horas, minutos] = medicamento.horario.split(':').map(Number);

      if (!this.esHorarioValido(horas, minutos)) {
        return null;
      }

      fecha.setHours(horas, minutos, 0, 0);
    } else {
      fecha.setHours(8, 0, 0, 0);
    }

    return fecha;
  }

  private obtenerProximaDosisPorHorarioFijo(
    horario: string,
    ultimaAdministracion: ActivityFamilia | null
  ): Date | null {
    const [horas, minutos] = horario.split(':').map(Number);

    const proximaDosis = new Date();

    if (!this.esHorarioValido(horas, minutos)) {
      return null;
    }

    proximaDosis.setHours(horas, minutos, 0, 0);

    if (ultimaAdministracion) {
      const ultimaFecha = this.parseFechaActividad(ultimaAdministracion.time);

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

  private parseFechaActividad(fecha: string): Date {
    if (!fecha) {
      return new Date(NaN);
    }

    const tieneZonaHoraria = /(?:z|[+-]\d{2}:\d{2})$/i.test(fecha);

    if (tieneZonaHoraria) {
      return new Date(fecha);
    }

    const [parteFecha, parteHora = '00:00'] = fecha.split('T');
    const [anio, mes, dia] = parteFecha.split('-').map(Number);
    const [hora = '0', minuto = '0', segundo = '0'] = parteHora.split(':');

    if (!anio || !mes || !dia) {
      return new Date(fecha);
    }

    return new Date(
      anio,
      mes - 1,
      dia,
      Number(hora) || 0,
      Number(minuto) || 0,
      Number(segundo.split('.')[0]) || 0,
      0
    );
  }

  private esHorarioValido(horas: number, minutos: number): boolean {
    return Number.isFinite(horas) &&
      Number.isFinite(minutos) &&
      horas >= 0 &&
      horas <= 23 &&
      minutos >= 0 &&
      minutos <= 59;
  }
}
