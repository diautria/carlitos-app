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
      await this.authService.loginConGoogle();
      await this.router.navigateByUrl('/inicio', { replaceUrl: true });
    } catch (error) {
      console.error('Error iniciando sesión con Google', error);
    }
  }
}