import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonNote,
  IonText, IonIcon, IonModal, IonButtons, IonLabel } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ConfiguracionService } from '../services/configuracion.service';
import { Bebe } from '../models/bebe.model';
import { createOutline, imageOutline, personCircleOutline, trashOutline, close } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { NotificacionVacunasService } from '../services/notificacion-vacunas.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonNote,
    IonText,
    IonIcon,
    IonModal,
    IonButtons,
    IonLabel,
    RouterLink
  ],
})
export class Tab3Page implements OnInit {
  tiempoEntreTomasHoras = 3;
  mensajeGuardado = '';
  onzasDiariasObjetivo = 24;
  showModalBebe = false;

  bebe: Bebe = {
    id: 1,
    nombre: '',
    fechaNacimiento: '',
    edad: 0,
    peso: 0,
    altura: 0,
    foto: 'assets/img/bebe-default.png',
    ultimaAlimentacion: '',
    proximaVacuna: '',
    notas: []
  };

  bebeForm = { ...this.bebe };

  constructor(private configuracionService: ConfiguracionService, private notificacionVacunasService: NotificacionVacunasService) {}

  async ngOnInit() {
    addIcons({
    createOutline,
    close,
    personCircleOutline,
    imageOutline,
    trashOutline
  });
  
    this.tiempoEntreTomasHoras =
      await this.configuracionService.obtenerTiempoEntreTomas();

    this.onzasDiariasObjetivo =
      await this.configuracionService.obtenerOnzasDiariasObjetivo();

      this.bebe = await this.configuracionService.obtenerBebePrincipal();
      this.bebeForm = { ...this.bebe };
  }

  async guardarConfiguracion() {
    if (!this.tiempoEntreTomasHoras || this.tiempoEntreTomasHoras <= 0) {
      this.mensajeGuardado = 'Ingresa un tiempo válido en horas.';
      return;
    }

    if (!this.onzasDiariasObjetivo || this.onzasDiariasObjetivo <= 0) {
      this.mensajeGuardado = 'Ingresa una cantidad válida de onzas diarias.';
      return;
    }

    await this.configuracionService.guardarTiempoEntreTomas(
      this.tiempoEntreTomasHoras
    );

    await this.configuracionService.guardarOnzasDiariasObjetivo(
      this.onzasDiariasObjetivo
    );

    this.mensajeGuardado = 'Configuración guardada correctamente.';
  }

  ionViewWillEnter() {
    this.mensajeGuardado = '';
  }

  ionViewWillLeave() {
    this.mensajeGuardado = '';
  }

  limpiarMensaje() {
    this.mensajeGuardado = '';
  }

  abrirModalBebe() {
    this.bebeForm = { ...this.bebe };
    this.showModalBebe = true;
  }

  cerrarModalBebe() {
    this.showModalBebe = false;
  }

 async guardarDatosBebe() {
  this.bebe = {
    ...this.bebe,
    ...this.bebeForm,
    foto: this.bebeForm.foto || this.bebe.foto
  };

  await this.configuracionService.guardarBebePrincipal(this.bebe);

  await this.notificacionVacunasService.programarNotificacionProximaVacuna(this.bebe);

  this.showModalBebe = false;
  this.mensajeGuardado = 'Datos del bebé guardados correctamente.';
}

  onFotoSeleccionada(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    this.mensajeGuardado = 'Selecciona un archivo de imagen válido.';
    input.value = '';
    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {
    const fotoBase64 = reader.result as string;

    this.bebeForm = {
      ...this.bebeForm,
      foto: fotoBase64
    };

    this.bebe = {
      ...this.bebe,
      foto: fotoBase64
    };

    await this.configuracionService.guardarBebePrincipal(this.bebe);
  };

  reader.readAsDataURL(file);

  input.value = '';
}

  async quitarFotoBebe() {
  this.bebeForm = {
    ...this.bebeForm,
    foto: ''
  };

  this.bebe = {
    ...this.bebe,
    foto: ''
  };

  await this.configuracionService.guardarBebePrincipal(this.bebe);
}
}