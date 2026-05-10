import { Component, OnInit, inject } from '@angular/core';
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
  IonText,
  IonIcon,
  IonLabel, IonModal, IonButtons } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { addIcons } from 'ionicons';
import { settingsOutline, happyOutline, peopleOutline } from 'ionicons/icons';

import { BebeFamiliaService } from '../services/bebe-familia.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonButtons, IonModal, 
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
    IonLabel
  ],
})
export class Tab3Page implements OnInit {
  private bebeFamiliaService = inject(BebeFamiliaService);

  tiempoEntreTomasHoras = 3;
  onzasDiariasObjetivo = 24;
tiempoEntreTomasOriginal = 3;
onzasDiariasObjetivoOriginal = 24;
  bebeActivoId = '';
  nombreBebeActivo = '';

  mensajeGuardado = '';
  mensajeError = '';
  cargando = false;
  guardando = false;

  constructor(private router: Router) {
    addIcons({
      settingsOutline,
      happyOutline,
      peopleOutline
    });
  }

  async ngOnInit() {
    await this.cargarConfiguracion();
  }

  async ionViewWillEnter() {
    this.mensajeGuardado = '';
    this.mensajeError = '';
    await this.cargarConfiguracion();
  }

  async cargarConfiguracion() {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeGuardado = '';

    try {
      const config =
        await this.bebeFamiliaService.obtenerConfiguracionBebeActivo();

      this.bebeActivoId = config.bebeId;
      this.nombreBebeActivo = config.nombre;
      this.tiempoEntreTomasHoras = config.tiempoEntreTomasHoras;
      this.onzasDiariasObjetivo = config.onzasDiariasObjetivo;

      this.tiempoEntreTomasOriginal = config.tiempoEntreTomasHoras;
this.onzasDiariasObjetivoOriginal = config.onzasDiariasObjetivo;
    } catch (error: any) {
      console.error('Error cargando configuración del bebé activo', error);

      this.bebeActivoId = '';
      this.nombreBebeActivo = '';
      this.mensajeError =
        error?.message || 'No se pudo cargar la configuración.';
    } finally {
      this.cargando = false;
    }
  }

  async guardarConfiguracion() {
    this.mensajeGuardado = '';
    this.mensajeError = '';

    if (!this.bebeActivoId) {
      this.mensajeError = 'Seleccioná un bebé en el inicio antes de configurar.';
      return;
    }

    if (!this.tiempoEntreTomasHoras || this.tiempoEntreTomasHoras <= 0) {
      this.mensajeError = 'Ingresá un tiempo válido en horas.';
      return;
    }

    if (!this.onzasDiariasObjetivo || this.onzasDiariasObjetivo <= 0) {
      this.mensajeError = 'Ingresá una cantidad válida de onzas diarias.';
      return;
    }

    this.guardando = true;

    try {
      await this.bebeFamiliaService.guardarConfiguracionBebeActivo({
        tiempoEntreTomasHoras: Number(this.tiempoEntreTomasHoras),
        onzasDiariasObjetivo: Number(this.onzasDiariasObjetivo)
      });

      this.tiempoEntreTomasOriginal = Number(this.tiempoEntreTomasHoras);
this.onzasDiariasObjetivoOriginal = Number(this.onzasDiariasObjetivo);

      this.mensajeGuardado = 'Configuración guardada correctamente.';
    } catch (error: any) {
      console.error('Error guardando configuración', error);
      this.mensajeError =
        error?.message || 'No se pudo guardar la configuración.';
    } finally {
      this.guardando = false;
    }
  }

  limpiarMensaje() {
    this.mensajeGuardado = '';
    this.mensajeError = '';
  }

  get hayCambiosConfiguracion(): boolean {
  return (
    Number(this.tiempoEntreTomasHoras) !== Number(this.tiempoEntreTomasOriginal) ||
    Number(this.onzasDiariasObjetivo) !== Number(this.onzasDiariasObjetivoOriginal)
  );
}

irAFamilia() {
  this.router.navigateByUrl('/familia');
}
}