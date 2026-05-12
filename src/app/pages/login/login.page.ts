import { Component, inject } from '@angular/core';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonText, IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonToolbar, IonHeader, 
    IonContent,
    IonButton,
    IonIcon,
    IonText
  ]
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({ logoGoogle });
  }

  async loginConGoogle() {
    try {
      console.log('Click login Google');

      await this.authService.loginConGoogle();

      console.log('Login correcto, navegando...');

      await this.router.navigateByUrl('/tabs/tab1', {
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