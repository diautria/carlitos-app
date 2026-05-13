import { Component, inject } from '@angular/core';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonHeader,
  IonToolbar
} from '@ionic/angular/standalone';

import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from '@angular/fire/firestore';

import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonToolbar,
    IonHeader,
    IonContent,
    IonButton,
    IonIcon,
    IonText
  ]
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  constructor() {
    addIcons({ logoGoogle });
  }

  async loginConGoogle() {
    try {
      console.log('Click login Google');

      await this.authService.loginConGoogle();

      const usuario = this.auth.currentUser;

      if (!usuario) {
        console.warn('No se encontró usuario después del login');
        await this.router.navigateByUrl('/login', { replaceUrl: true });
        return;
      }

      const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);
      const usuarioSnap = await getDoc(usuarioRef);

      if (!usuarioSnap.exists()) {
        console.log('Usuario nuevo, creando documento en Firestore');

        await setDoc(usuarioRef, {
          uid: usuario.uid,
          email: usuario.email || '',
          nombre: usuario.displayName || '',
          fotoUrl: usuario.photoURL || '',
          familiaActivaId: null,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp()
        });

        await this.router.navigateByUrl('/familia-inicial', {
          replaceUrl: true
        });

        return;
      }

      const usuarioData = usuarioSnap.data();

      if (usuarioData['familiaActivaId']) {
        console.log('Usuario con familia activa, navegando a Mi bebé');

        await this.router.navigateByUrl('/tabs/tab1', {
          replaceUrl: true
        });

        return;
      }

      console.log('Usuario sin familia activa, navegando a familia inicial');

      await this.router.navigateByUrl('/familia-inicial', {
        replaceUrl: true
      });

    } catch (error: any) {
      console.error('Error login Google:', error);

      alert(
        'No se pudo iniciar sesión: ' +
        (error?.message || error?.code || 'Error desconocido')
      );
    }
  }
}