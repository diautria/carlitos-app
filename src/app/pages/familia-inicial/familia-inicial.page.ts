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
import { FamiliaMiembrosService } from '../../services/familia-miembros.service';
import { CommonModule, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';

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
    IonIcon,
    CommonModule,
FormsModule,
NgIf,
NgSwitch,
NgSwitchCase,
IonInput, IonItem, IonLabel, IonText, IonButton, IonSpinner
  ]
})
export class FamiliaInicialPage {
  private familiaService = inject(FamiliaService);
    private familiaMiembrosService = inject(FamiliaMiembrosService);

  private router = inject(Router);

  nombreFamilia = '';
  cargando = false;
  error = '';
modo: 'crear' | 'unirse' = 'crear';
codigoInvitacion = '';

  constructor() {
  addIcons({
    peopleOutline,
    shieldCheckmarkOutline
  });
}

  // async crearFamilia() {
  //   const nombre = this.nombreFamilia.trim();

  //   if (!nombre) {
  //     this.error = 'Ingresá un nombre para la familia.';
  //     return;
  //   }

  //   try {
  //     this.cargando = true;
  //     this.error = '';

  //     await this.familiaService.crearFamilia(nombre);

  //     await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
  //   } catch (error) {
  //     console.error('Error creando familia', error);
  //     this.error = 'No se pudo crear la familia. Intentá nuevamente.';
  //   } finally {
  //     this.cargando = false;
  //   }
  // }

  cambiarModo(modo: 'crear' | 'unirse') {
  console.log('cambiando modo:', modo);

  this.modo = modo;
  this.error = '';
}

normalizarCodigo() {
  this.codigoInvitacion = (this.codigoInvitacion || '').toUpperCase();
  this.error = '';
}

async crearFamilia() {
  const nombre = this.nombreFamilia.trim();

  if (!nombre) {
    this.error = 'Ingresá el nombre de la familia.';
    return;
  }

  this.cargando = true;
  this.error = '';

  try {
    await this.familiaService.crearFamilia(nombre);

    await this.router.navigateByUrl('/tabs/tab1', {
      replaceUrl: true
    });
  } catch (error: any) {
    console.error('Error creando familia', error);
    this.error = error?.message || 'No se pudo crear la familia.';
  } finally {
    this.cargando = false;
  }
}

async unirmeConCodigo() {
  const codigo = this.codigoInvitacion.trim().toUpperCase();

  if (!codigo) {
    this.error = 'Ingresá el código de invitación.';
    return;
  }

  this.cargando = true;
  this.error = '';

  try {
    await this.familiaMiembrosService.unirseAFamiliaConCodigo(codigo);

    await this.router.navigateByUrl('/tabs/tab1', {
      replaceUrl: true
    });
  } catch (error: any) {
    console.error('Error al unirse a la familia', error);
    this.error = error?.message || 'No se pudo unir a la familia.';
  } finally {
    this.cargando = false;
  }
}
}