import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import {
  IonApp,
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
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
import { addOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ActividadEventosService } from './services/actividad-eventos.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    IonApp,
    IonButtons,
    IonButton,
    IonIcon,
    IonHeader,
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
  private actividadEventosService = inject(ActividadEventosService);
  private themeService = inject(ThemeService);
  private usuarioSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private hayUsuario = false;

  mostrarHeaderApp = false;

  constructor() {
    addIcons({ addOutline });
    this.initializeApp();
    this.observarSesion();
    this.observarRuta();
  }

  ngOnDestroy() {
    this.usuarioSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
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
    this.usuarioSubscription = this.authService.usuario$.subscribe(usuario => {
      this.hayUsuario = !!usuario;
      this.actualizarVisibilidadHeader();
    });
  }

  private observarRuta() {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.actualizarVisibilidadHeader());
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
}
