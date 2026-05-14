import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { MedicamentoBebe } from '../models/bebe-familia.model';

@Injectable({
  providedIn: 'root'
})
export class NotificacionMedicamentosService {
  private readonly minutosAntes = 5;
  private readonly baseNotificationId = 3000;

  async programarNotificacionesMedicamentos(
    bebeId: string,
    nombreBebe: string,
    medicamentos: MedicamentoBebe[]
  ): Promise<void> {
    await this.cancelarNotificacionesMedicamentos(medicamentos);

    const notificaciones: any[] = [];

    const medicamentosActivos = medicamentos.filter(
      (medicamento: MedicamentoBebe) => medicamento.activo
    );

    for (const medicamento of medicamentosActivos) {
      const fechas = this.calcularFechasDiariasNotificacion(medicamento);

      for (let index = 0; index < fechas.length; index++) {
        const fecha = fechas[index];

        notificaciones.push({
          id: this.obtenerNotificationId(medicamento.id, index),
          title: 'Medicamento de ' + nombreBebe,
          body: `${medicamento.nombre}: ${medicamento.dosisGotas} gotas`,
          schedule: {
            at: fecha,
            repeats: true,
            every: 'day',
            allowWhileIdle: true
          },
          smallIcon: 'ic_stat_icon_config_sample',
          extra: {
            bebeId,
            medicamentoId: medicamento.id
          }
        });
      }
    }

    if (notificaciones.length === 0) {
      return;
    }

    await LocalNotifications.schedule({
      notifications: notificaciones
    });
  }

  async cancelarNotificacionesMedicamentos(
    medicamentos: MedicamentoBebe[]
  ): Promise<void> {
    if (!medicamentos || medicamentos.length === 0) {
      return;
    }

    const notifications: { id: number }[] = [];

    for (const medicamento of medicamentos) {
      for (let index = 0; index < 24; index++) {
        notifications.push({
          id: this.obtenerNotificationId(medicamento.id, index)
        });
      }
    }

    await LocalNotifications.cancel({
      notifications
    });
  }

  async cancelarNotificacionMedicamento(
    medicamentoId: string
  ): Promise<void> {
    const notifications: { id: number }[] = [];

    for (let index = 0; index < 24; index++) {
      notifications.push({
        id: this.obtenerNotificationId(medicamentoId, index)
      });
    }

    await LocalNotifications.cancel({
      notifications
    });
  }

  private calcularFechasDiariasNotificacion(
    medicamento: MedicamentoBebe
  ): Date[] {
    if (medicamento.frecuenciaHoras && medicamento.frecuenciaHoras > 0) {
      return this.calcularFechasPorFrecuencia(
        medicamento.frecuenciaHoras,
        medicamento.horario
      );
    }

    if (medicamento.horario) {
      return [
        this.calcularFechaDesdeHorario(medicamento.horario)
      ];
    }

    return [];
  }

  private calcularFechasPorFrecuencia(
    frecuenciaHoras: number,
    horarioBase?: string
  ): Date[] {
    const fechas: Date[] = [];

    const frecuencia = Number(frecuenciaHoras);

    if (!frecuencia || frecuencia <= 0 || frecuencia > 24) {
      return fechas;
    }

    const base = new Date();

    if (horarioBase) {
      const [horas, minutos] = horarioBase.split(':').map(Number);
      base.setHours(horas, minutos, 0, 0);
    } else {
      base.setHours(8, 0, 0, 0);
    }

    const horaBase = base.getHours();
    const minutoBase = base.getMinutes();

    for (let hora = horaBase; hora < 24; hora += frecuencia) {
      const fecha = new Date();
      fecha.setHours(hora, minutoBase, 0, 0);

      fecha.setMinutes(fecha.getMinutes() - this.minutosAntes);

      if (fecha <= new Date()) {
        fecha.setDate(fecha.getDate() + 1);
      }

      fechas.push(fecha);
    }

    return fechas;
  }

  private calcularFechaDesdeHorario(horario: string): Date {
    const [horas, minutos] = horario.split(':').map(Number);

    const fecha = new Date();
    fecha.setHours(horas, minutos, 0, 0);

    fecha.setMinutes(fecha.getMinutes() - this.minutosAntes);

    if (fecha <= new Date()) {
      fecha.setDate(fecha.getDate() + 1);
    }

    return fecha;
  }

  private obtenerNotificationId(medicamentoId: string, index: number): number {
    let hash = 0;

    for (let i = 0; i < medicamentoId.length; i++) {
      hash = medicamentoId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return this.baseNotificationId + Math.abs(hash % 100000) + index;
  }
}