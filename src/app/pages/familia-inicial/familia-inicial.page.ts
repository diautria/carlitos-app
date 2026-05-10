import { Component, inject } from '@angular/core';
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FamiliaService } from '../../services/familia.service';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-familia-inicial',
  templateUrl: './familia-inicial.page.html',
  styleUrls: ['./familia-inicial.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonText,
    IonSpinner,
    IonIcon
  ]
})
export class FamiliaInicialPage {
  private familiaService = inject(FamiliaService);
  private router = inject(Router);

  nombreFamilia = '';
  cargando = false;
  error = '';

  constructor() {
  addIcons({
    peopleOutline,
    shieldCheckmarkOutline
  });
}

  async crearFamilia() {
    const nombre = this.nombreFamilia.trim();

    if (!nombre) {
      this.error = 'Ingresá un nombre para la familia.';
      return;
    }

    try {
      this.cargando = true;
      this.error = '';

      await this.familiaService.crearFamilia(nombre);

      await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
    } catch (error) {
      console.error('Error creando familia', error);
      this.error = 'No se pudo crear la familia. Intentá nuevamente.';
    } finally {
      this.cargando = false;
    }
  }
}