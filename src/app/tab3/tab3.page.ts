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
  IonIcon
} from '@ionic/angular/standalone';
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
    IonIcon
  ],
})
export class Tab3Page implements OnInit {
  private bebeFamiliaService = inject(BebeFamiliaService);

  tiempoEntreTomasHoras = 3;
  tiempoEntreSuenosHoras = 2;
  onzasDiariasObjetivo = 24;

  tiempoEntreTomasOriginal = 3;
  tiempoEntreSuenosOriginal = 2;
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
      this.tiempoEntreSuenosHoras = config.tiempoEntreSuenosHoras;
      this.onzasDiariasObjetivo = config.onzasDiariasObjetivo;

      this.tiempoEntreTomasOriginal = config.tiempoEntreTomasHoras;
      this.tiempoEntreSuenosOriginal = config.tiempoEntreSuenosHoras;
      this.onzasDiariasObjetivoOriginal = config.onzasDiariasObjetivo;
    } catch (error: any) {
      console.error('Error cargando configuracion del bebe activo', error);

      this.bebeActivoId = '';
      this.nombreBebeActivo = '';
      this.mensajeError =
        error?.message || 'No se pudo cargar la configuracion.';
    } finally {
      this.cargando = false;
    }
  }

  async guardarConfiguracion() {
    this.mensajeGuardado = '';
    this.mensajeError = '';

    if (!this.bebeActivoId) {
      this.mensajeError = 'Selecciona un bebe en el inicio antes de configurar.';
      return;
    }

    if (!this.tiempoEntreTomasHoras || this.tiempoEntreTomasHoras <= 0) {
      this.mensajeError = 'Ingresa un tiempo valido entre tomas.';
      return;
    }

    if (!this.tiempoEntreSuenosHoras || this.tiempoEntreSuenosHoras <= 0) {
      this.mensajeError = 'Ingresa un tiempo valido entre suenos.';
      return;
    }

    if (!this.onzasDiariasObjetivo || this.onzasDiariasObjetivo <= 0) {
      this.mensajeError = 'Ingresa una cantidad valida de onzas diarias.';
      return;
    }

    this.guardando = true;

    try {
      await this.bebeFamiliaService.guardarConfiguracionBebeActivo({
        tiempoEntreTomasHoras: Number(this.tiempoEntreTomasHoras),
        tiempoEntreSuenosHoras: Number(this.tiempoEntreSuenosHoras),
        onzasDiariasObjetivo: Number(this.onzasDiariasObjetivo)
      });

      this.tiempoEntreTomasOriginal = Number(this.tiempoEntreTomasHoras);
      this.tiempoEntreSuenosOriginal = Number(this.tiempoEntreSuenosHoras);
      this.onzasDiariasObjetivoOriginal = Number(this.onzasDiariasObjetivo);

      this.mensajeGuardado = 'Configuracion guardada correctamente.';
    } catch (error: any) {
      console.error('Error guardando configuracion', error);
      this.mensajeError =
        error?.message || 'No se pudo guardar la configuracion.';
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
      Number(this.tiempoEntreSuenosHoras) !== Number(this.tiempoEntreSuenosOriginal) ||
      Number(this.onzasDiariasObjetivo) !== Number(this.onzasDiariasObjetivoOriginal)
    );
  }

  irAFamilia() {
    this.router.navigateByUrl('/familia');
  }
}
