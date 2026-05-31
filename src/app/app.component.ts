import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import {
  IonApp,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
  ModalController,
  Platform
} from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { UsuarioMenuComponent } from './components/usuario-menu/usuario-menu.component';
import { ActividadFormModalComponent } from './components/actividad-form-modal/actividad-form-modal.component';
import {
  addOutline,
  medicalOutline,
  moonOutline,
  notificationsOffOutline,
  notificationsOutline,
  restaurantOutline,
  shieldCheckmarkOutline,
  waterOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import {
  NotificacionFamiliaService,
  NotificacionRecienteFamilia,
  RecordatorioProgramadoFamilia
} from './services/notificacion-familia.service';
import { ActividadEventosService } from './services/actividad-eventos.service';
import { ThemeService } from './services/theme.service';

interface NotificacionHeaderItem {
  id: string;
  titulo: string;
  fechaObjetivo?: Date;
  icono: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    IonApp,
    IonBadge,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonPopover,
    IonRouterOutlet,
    IonTitle,
    IonToolbar,
    UsuarioMenuComponent
  ]
})
export class AppComponent implements OnDestroy {
  @ViewChild(IonRouterOutlet, { static: true })
  private routerOutlet!: IonRouterOutlet;

  private platform = inject(Platform);
  private router = inject(Router);
  private authService = inject(AuthService);
  private modalController = inject(ModalController);
  private notificacionFamiliaService = inject(NotificacionFamiliaService);
  private actividadEventosService = inject(ActividadEventosService);
  private themeService = inject(ThemeService);
  private usuarioSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private notificacionesSubscription?: Subscription;
  private recordatoriosSubscription?: Subscription;
  private hayUsuario = false;
  private notificacionesVistasIds = new Set<string>();

  mostrarHeaderApp = false;
  notificacionesRecientes: NotificacionRecienteFamilia[] = [];
  recordatoriosProgramados: RecordatorioProgramadoFamilia[] = [];
  notificacionesNoVistas = 0;
  notificacionesAbiertas = false;
  popoverNotificacionesEvent?: Event;

  constructor() {
    addIcons({
      addOutline,
      medicalOutline,
      moonOutline,
      notificationsOffOutline,
      notificationsOutline,
      restaurantOutline,
      shieldCheckmarkOutline,
      waterOutline
    });
    this.initializeApp();
    this.observarSesion();
    this.observarRuta();
    this.observarNotificaciones();
  }

  ngOnDestroy() {
    this.usuarioSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
    this.notificacionesSubscription?.unsubscribe();
    this.recordatoriosSubscription?.unsubscribe();
    this.notificacionFamiliaService.detenerEscuchaNotificaciones();
  }

  private initializeApp() {
    this.platform.ready().then(() => {
      void this.themeService.init();
      this.configurarBotonAtrasAndroid();
    });
  }

  private configurarBotonAtrasAndroid() {
    this.platform.backButton.subscribeWithPriority(10, async () => {
      if (this.routerOutlet?.canGoBack()) {
        await this.routerOutlet.pop();
        return;
      }

      await App.exitApp();
    });
  }

  private observarSesion() {
    this.usuarioSubscription = this.authService.usuario$.subscribe(async usuario => {
      this.hayUsuario = !!usuario;
      this.actualizarVisibilidadHeader();

      if (usuario) {
        try {
          await this.notificacionFamiliaService.iniciarEscuchaNotificaciones();
        } catch (error) {
          console.error('Error iniciando escucha de notificaciones:', error);
        }
      } else {
        this.notificacionFamiliaService.detenerEscuchaNotificaciones();
      }
    });
  }

  private observarRuta() {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.actualizarVisibilidadHeader());
  }

  private observarNotificaciones() {
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

  private actualizarVisibilidadHeader() {
    const url = this.router.url || '';
    const rutasSinHeader = [
      '/login',
      '/inicio'
    ];

    const estaEnRutaPublica = rutasSinHeader.some(ruta => url.startsWith(ruta));
    this.mostrarHeaderApp = this.hayUsuario && !estaEnRutaPublica;
  }

  async abrirModalAgregarActividad() {
    const modal = await this.modalController.create({
      component: ActividadFormModalComponent,
      cssClass: 'custom-modal',
      componentProps: {
        modo: 'crear',
        tipoInicial: 'toma-leche'
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.actividadGuardada) {
      this.actividadEventosService.notificarActividadGuardada();
    }
  }

  get cantidadNotificaciones(): number {
    return this.notificacionesNoVistas;
  }

  get notificacionesHeader(): NotificacionHeaderItem[] {
    const recientes = this.notificacionesRecientes.map(notificacion => ({
      id: notificacion.id,
      titulo: notificacion.titulo,
      fechaObjetivo: notificacion.fecha,
      icono: this.obtenerIconoNotificacion(notificacion.tipo)
    }));

    const programadas = this.recordatoriosProgramados.map(recordatorio => ({
      id: recordatorio.id,
      titulo: this.obtenerTituloRecordatorio(recordatorio),
      fechaObjetivo: recordatorio.fechaObjetivo,
      icono: this.obtenerIconoNotificacion(recordatorio.tipo)
    }));

    return [
      ...recientes,
      ...programadas
    ].slice(0, 12);
  }

  alternarNotificaciones(event: Event): void {
    event.stopPropagation();
    this.popoverNotificacionesEvent = event;
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

  formatearFechaNotificacion(fecha: Date | undefined): string {
    if (!fecha) {
      return '';
    }

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}, ${horas}:${minutos}`;
  }

  private obtenerTituloRecordatorio(
    recordatorio: RecordatorioProgramadoFamilia
  ): string {
    if (recordatorio.tipo === 'toma-leche') {
      return 'Próxima toma de leche';
    }

    if (recordatorio.tipo === 'vacuna') {
      return 'Próxima vacuna';
    }

    if (recordatorio.tipo === 'sueno') {
      return 'Próximo sueño';
    }

    return recordatorio.titulo || 'Próximo recordatorio';
  }

  private obtenerIconoNotificacion(tipo: string): string {
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
}
