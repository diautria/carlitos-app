import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  flaskOutline,
  medicalOutline,
  moonOutline,
  notificationsOffOutline,
  notificationsOutline,
  restaurantOutline,
  shieldCheckmarkOutline,
  waterOutline
} from 'ionicons/icons';
import {
  NotificacionFamiliaService,
  NotificacionRecienteFamilia,
  RecordatorioProgramadoFamilia
} from '../../services/notificacion-familia.service';

interface NotificacionMenuItem {
  id: string;
  titulo: string;
  mensaje: string;
  fechaObjetivo?: Date;
  fechaAviso?: Date;
  estado: 'Reciente' | 'Proxima';
  icono: string;
}

@Component({
  selector: 'app-notificaciones-menu',
  templateUrl: './notificaciones-menu.component.html',
  styleUrls: ['./notificaciones-menu.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonBadge,
    IonButton,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPopover
  ]
})
export class NotificacionesMenuComponent implements OnInit, OnDestroy {
  private notificacionFamiliaService = inject(NotificacionFamiliaService);
  private notificacionesSubscription?: Subscription;
  private recordatoriosSubscription?: Subscription;

  notificacionesRecientes: NotificacionRecienteFamilia[] = [];
  recordatoriosProgramados: RecordatorioProgramadoFamilia[] = [];
  notificacionesNoVistas = 0;
  notificacionesAbiertas = false;
  popoverEvent?: Event;
  private notificacionesVistasIds = new Set<string>();

  constructor() {
    addIcons({
      flaskOutline,
      medicalOutline,
      moonOutline,
      notificationsOffOutline,
      notificationsOutline,
      restaurantOutline,
      shieldCheckmarkOutline,
      waterOutline
    });
  }

  ngOnInit(): void {
    this.notificacionesSubscription =
      this.notificacionFamiliaService.notificacionesRecientes$.subscribe(
        notificaciones => {
          this.notificacionesRecientes = notificaciones;
          this.notificacionesNoVistas = notificaciones.filter(
            notificacion => !this.notificacionesVistasIds.has(notificacion.id)
          ).length;
        }
      );

    this.recordatoriosSubscription =
      this.notificacionFamiliaService.recordatoriosProgramados$.subscribe(
        recordatorios => {
          this.recordatoriosProgramados = recordatorios;
        }
      );
  }

  ngOnDestroy(): void {
    this.notificacionesSubscription?.unsubscribe();
    this.recordatoriosSubscription?.unsubscribe();
  }

  get cantidadNotificaciones(): number {
    return this.notificacionesNoVistas;
  }

  alternarNotificaciones(event: Event): void {
    event.stopPropagation();
    this.popoverEvent = event;
    this.notificacionesAbiertas = !this.notificacionesAbiertas;
  }

  cerrarNotificaciones(): void {
    this.notificacionesAbiertas = false;
  }

  marcarNotificacionesComoVistas(): void {
    this.notificacionesRecientes.forEach(notificacion => {
      this.notificacionesVistasIds.add(notificacion.id);
    });

    this.notificacionesNoVistas = 0;
  }

  get notificaciones(): NotificacionMenuItem[] {
    const recientes = this.notificacionesRecientes.map(notificacion => ({
      id: notificacion.id,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      fechaObjetivo: notificacion.fecha,
      estado: 'Reciente' as const,
      icono: this.obtenerIconoTipo(notificacion.tipo)
    }));

    const programadas = this.recordatoriosProgramados.map(recordatorio => ({
      id: recordatorio.id,
      titulo: this.obtenerTituloRecordatorio(recordatorio),
      mensaje: this.obtenerMensajeRecordatorio(recordatorio),
      fechaObjetivo: recordatorio.fechaObjetivo,
      fechaAviso: recordatorio.fechaNotificacion,
      estado: 'Proxima' as const,
      icono: this.obtenerIconoTipo(recordatorio.tipo)
    }));

    return [
      ...recientes,
      ...programadas
    ].slice(0, 12);
  }

  private obtenerTituloRecordatorio(
    recordatorio: RecordatorioProgramadoFamilia
  ): string {
    const nombre = this.obtenerNombreDesdeTitulo(recordatorio.titulo);

    if (recordatorio.tipo === 'toma-leche') {
      return `Proxima toma de leche${nombre ? ` de ${nombre}` : ''}`;
    }

    if (recordatorio.tipo === 'vacuna') {
      return `Proxima vacuna${nombre ? ` de ${nombre}` : ''}`;
    }

    if (recordatorio.tipo === 'sueno') {
      return `Proximo sueno${nombre ? ` para ${nombre}` : ''}`;
    }

    if (recordatorio.tipo === 'medicamento') {
      return recordatorio.titulo || 'Proximo medicamento';
    }

    return recordatorio.titulo || 'Proximo recordatorio';
  }

  private obtenerMensajeRecordatorio(
    recordatorio: RecordatorioProgramadoFamilia
  ): string {
    if (recordatorio.tipo === 'vacuna') {
      return 'Fecha de la vacuna';
    }

    if (recordatorio.tipo === 'toma-leche') {
      return 'Hora estimada de la toma';
    }

    if (recordatorio.tipo === 'sueno') {
      return 'Hora estimada para dormir';
    }

    if (recordatorio.tipo === 'medicamento') {
      return recordatorio.mensaje || 'Proxima dosis';
    }

    return recordatorio.mensaje || 'Recordatorio programado';
  }

  private obtenerNombreDesdeTitulo(titulo: string): string {
    const paraMatch = titulo.match(/\bpara\s+(.+)$/i);

    if (paraMatch?.[1]) {
      return paraMatch[1].trim();
    }

    const deMatch = titulo.match(/\bde\s+(.+)$/i);

    if (deMatch?.[1]) {
      return deMatch[1].trim();
    }

    return '';
  }

  private obtenerIconoTipo(tipo: string): string {
    if (tipo === 'toma-leche') {
      return 'water-outline';
    }

    if (tipo === 'vacuna') {
      return 'shield-checkmark-outline';
    }

    if (tipo === 'medicamento') {
      return 'medical-outline';
    }

    if (tipo === 'sueno') {
      return 'moon-outline';
    }

    if (tipo === 'comida') {
      return 'restaurant-outline';
    }

    return 'notifications-outline';
  }

  formatearFechaCorta(fecha: Date | undefined): string {
    if (!fecha) {
      return '';
    }

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}, ${horas}:${minutos}`;
  }
}
