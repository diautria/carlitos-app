import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonText,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonList,
  IonInput,
  IonModal,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  copyOutline,
  refreshOutline,
  trashOutline,
  shieldCheckmarkOutline,
  personOutline,
  close,
  logInOutline
} from 'ionicons/icons';

import { FamiliaMiembrosService } from '../../services/familia-miembros.service';
import { FamiliaMiembro } from '../../models/familia-miembro.model';

@Component({
  selector: 'app-familia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonText,
    IonItem,
    IonLabel,
    IonAvatar,
    IonBadge,
    IonList,
    IonInput,
    IonModal,
    IonNote
  ],
  templateUrl: './familia.page.html',
  styleUrls: ['./familia.page.scss']
})
export class FamiliaPage implements OnInit {
  private alertController = inject(AlertController);
  private familiaMiembrosService = inject(FamiliaMiembrosService);

  miembros: FamiliaMiembro[] = [];
  codigoInvitacion = '';
  codigoParaUnirse = '';

  cargando = false;
  esAdmin = false;

  mensaje = '';
  error = '';

  showModalCodigo = false;

  constructor() {
    addIcons({
      peopleOutline,
      copyOutline,
      refreshOutline,
      trashOutline,
      shieldCheckmarkOutline,
      personOutline,
      close,
      logInOutline
    });
  }

  async ngOnInit() {
    await this.cargarDatos();
  }

  async ionViewWillEnter() {
    await this.cargarDatos();
  }

  async cargarDatos() {
  this.cargando = true;
  this.mensaje = '';
  this.error = '';

  try {
    this.esAdmin = await this.familiaMiembrosService.esUsuarioAdmin();

    if (!this.esAdmin) {
      this.error = 'Solo un administrador puede gestionar la familia.';
      this.miembros = [];
      this.codigoInvitacion = '';
      return;
    }

    this.miembros = await this.familiaMiembrosService.obtenerMiembrosFamiliaActiva();
    this.codigoInvitacion =
      await this.familiaMiembrosService.obtenerCodigoInvitacionFamiliaActiva();
  } catch (error: any) {
    console.error('Error cargando familia', error);
    this.error = error?.message || 'No se pudo cargar la familia.';
  } finally {
    this.cargando = false;
  }
}

  async copiarCodigo() {
    if (!this.codigoInvitacion) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.codigoInvitacion);
      this.mensaje = 'Código copiado.';
      this.error = '';
    } catch {
      this.mensaje = `Código: ${this.codigoInvitacion}`;
      this.error = '';
    }
  }

  async regenerarCodigo() {
    if (!this.esAdmin) {
      this.error = 'Solo un administrador puede regenerar el código.';
      return;
    }

    const confirmar = await this.confirmarAccion(
      'Regenerar código',
      '¿Regenerar el código? El código anterior dejará de funcionar.'
    );

    if (!confirmar) {
      return;
    }

    try {
      this.codigoInvitacion =
        await this.familiaMiembrosService.regenerarCodigoInvitacion();

      this.mensaje = 'Código regenerado correctamente.';
      this.error = '';
    } catch (error: any) {
      console.error('Error regenerando código', error);
      this.error = error?.message || 'No se pudo regenerar el código.';
    }
  }

  abrirModalCodigo() {
    this.codigoParaUnirse = '';
    this.mensaje = '';
    this.error = '';
    this.showModalCodigo = true;
  }

  cerrarModalCodigo() {
    this.showModalCodigo = false;
    this.codigoParaUnirse = '';
  }

  async unirseConCodigo() {
    const codigo = this.codigoParaUnirse.trim();

    if (!codigo) {
      this.error = 'Ingresá un código válido.';
      return;
    }

    try {
      await this.familiaMiembrosService.unirseAFamiliaConCodigo(codigo);

      this.showModalCodigo = false;
      this.codigoParaUnirse = '';

      this.mensaje = 'Te uniste a la familia correctamente.';
      this.error = '';

      await this.cargarDatos();
    } catch (error: any) {
      console.error('Error uniéndose a familia', error);
      this.error = error?.message || 'No se pudo unir a la familia.';
    }
  }

  async quitarMiembro(miembro: FamiliaMiembro) {
    if (!this.esAdmin) {
      this.error = 'Solo un administrador puede quitar miembros.';
      return;
    }

    const confirmar = await this.confirmarAccion(
      'Quitar miembro',
      `¿Quitar a ${miembro.nombre || miembro.email}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await this.familiaMiembrosService.quitarMiembro(miembro.uid);

      this.mensaje = 'Miembro quitado correctamente.';
      this.error = '';

      await this.cargarDatos();
    } catch (error: any) {
      console.error('Error quitando miembro', error);
      this.error = error?.message || 'No se pudo quitar el miembro.';
    }
  }

  async hacerAdmin(miembro: FamiliaMiembro) {
    if (!this.esAdmin) {
      this.error = 'Solo un administrador puede cambiar roles.';
      return;
    }

    try {
      await this.familiaMiembrosService.cambiarRolMiembro(
        miembro.uid,
        'admin'
      );

      this.mensaje = 'Miembro actualizado como administrador.';
      this.error = '';

      await this.cargarDatos();
    } catch (error: any) {
      console.error('Error cambiando rol', error);
      this.error = error?.message || 'No se pudo cambiar el rol.';
    }
  }

  async quitarAdmin(miembro: FamiliaMiembro) {
  if (!this.esAdmin) {
    this.error = 'Solo un administrador puede cambiar roles.';
    return;
  }

  if (miembro.rol === 'admin' && this.cantidadAdmins <= 1) {
    this.error = 'No podés quitar el último administrador de la familia.';
    return;
  }

  try {
    await this.familiaMiembrosService.cambiarRolMiembro(
      miembro.uid,
      'miembro'
    );

    this.mensaje = 'Miembro actualizado.';
    this.error = '';

    await this.cargarDatos();
  } catch (error: any) {
    console.error('Error cambiando rol', error);
    this.error = error?.message || 'No se pudo cambiar el rol.';
  }
}

  async confirmarAccion(header: string, message: string): Promise<boolean> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          role: 'confirm'
        }
      ],
      backdropDismiss: false
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  limpiarMensajes() {
    this.mensaje = '';
    this.error = '';
  }

  get cantidadAdmins(): number {
  return this.miembros.filter(m => m.rol === 'admin').length;
}

puedeQuitarAdmin(miembro: FamiliaMiembro): boolean {
  return this.esAdmin && miembro.rol === 'admin' && this.cantidadAdmins > 1;
}

puedeQuitarMiembro(miembro: FamiliaMiembro): boolean {
  if (!this.esAdmin) {
    return false;
  }

  if (miembro.rol === 'admin' && this.cantidadAdmins <= 1) {
    return false;
  }

  return true;
}
}