import { Component, OnDestroy, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import {
  AlertController,
  IonAvatar,
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { logOutOutline, personCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-usuario-menu',
  templateUrl: './usuario-menu.component.html',
  styleUrls: ['./usuario-menu.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    IonAvatar,
    IonButton,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPopover
  ]
})
export class UsuarioMenuComponent implements OnDestroy {
  private authService = inject(AuthService);
  private firestore = inject(Firestore);
  private alertController = inject(AlertController);
  private router = inject(Router);
  private usuarioSubscription?: Subscription;

  usuarioNombre = 'Usuario';
  usuarioFotoUrl = '';

  constructor() {
    addIcons({
      logOutOutline,
      personCircleOutline
    });

    this.usuarioSubscription = this.authService.usuario$.subscribe(async usuario => {
      if (!usuario) {
        this.usuarioNombre = 'Usuario';
        this.usuarioFotoUrl = '';
        return;
      }

      this.usuarioNombre = usuario.displayName || usuario.email || 'Usuario';
      this.usuarioFotoUrl = usuario.photoURL || '';

      await this.cargarPerfilDesdeFirestore(usuario.uid);
    });
  }

  ngOnDestroy() {
    this.usuarioSubscription?.unsubscribe();
  }

  async confirmarCerrarSesion() {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Querés cerrar tu sesión en este dispositivo?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: async () => {
            await this.cerrarSesion();
          }
        }
      ]
    });

    await alert.present();
  }

  private async cargarPerfilDesdeFirestore(uid: string) {
    try {
      const usuarioRef = doc(this.firestore, `usuarios/${uid}`);
      const usuarioSnap = await getDoc(usuarioRef);

      if (!usuarioSnap.exists()) {
        return;
      }

      const data = usuarioSnap.data();
      const foto = data['photoURL'] || data['fotoUrl'];
      const nombre = data['displayName'] || data['nombre'];

      if (foto) {
        this.usuarioFotoUrl = foto;
      }

      if (nombre && this.usuarioNombre === 'Usuario') {
        this.usuarioNombre = nombre;
      }
    } catch (error) {
      console.error('Error cargando perfil del usuario', error);
    }
  }

  private async cerrarSesion() {
    try {
      await this.cancelarNotificacionesLocales();
      await this.authService.logout();
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      console.error('Error cerrando sesión', error);

      const alert = await this.alertController.create({
        header: 'No se pudo cerrar sesión',
        message: 'Intentá nuevamente en unos segundos.',
        buttons: ['Aceptar']
      });

      await alert.present();
    }
  }

  private async cancelarNotificacionesLocales(): Promise<void> {
    const pending = await LocalNotifications.getPending();
    const notifications = pending.notifications.map(notification => ({
      id: notification.id
    }));

    if (!notifications.length) {
      return;
    }

    await LocalNotifications.cancel({
      notifications
    });
  }
}
