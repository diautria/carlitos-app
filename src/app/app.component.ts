import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import {
  IonApp,
  IonButtons,
  IonHeader,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
  Platform
} from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { UsuarioMenuComponent } from './components/usuario-menu/usuario-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    IonApp,
    IonButtons,
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
  private usuarioSubscription?: Subscription;
  private routerSubscription?: Subscription;
  private hayUsuario = false;

  mostrarHeaderApp = false;

  constructor() {
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
}
