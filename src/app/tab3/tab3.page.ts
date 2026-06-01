import { Component, OnInit, inject } from '@angular/core';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonNote,
  IonText,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { addIcons } from 'ionicons';
import { settingsOutline, happyOutline, peopleOutline } from 'ionicons/icons';

import { BebeFamiliaService } from '../services/bebe-familia.service';
import { FamiliaMiembrosService } from '../services/familia-miembros.service';
import { NotificacionSuenosService } from '../services/notificacion-suenos.service';
import { Router } from '@angular/router';
import { ThemePreference, ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonNote,
    IonText,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner
  ],
})
export class Tab3Page implements OnInit {
  private bebeFamiliaService = inject(BebeFamiliaService);
  private familiaMiembrosService = inject(FamiliaMiembrosService);
  private notificacionSuenosService = inject(NotificacionSuenosService);
  private themeService = inject(ThemeService);

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
  esAdminFamilia = false;
  temaSeleccionado: ThemePreference = 'system';

  constructor(private router: Router) {
    addIcons({
      settingsOutline,
      happyOutline,
      peopleOutline
    });
  }

  async ngOnInit() {
    this.temaSeleccionado = await this.themeService.init();
    await this.cargarPermisosYConfiguracion();
  }

  async ionViewWillEnter() {
    this.mensajeGuardado = '';
    this.mensajeError = '';
    this.temaSeleccionado = this.themeService.getPreference();
    await this.cargarPermisosYConfiguracion();
  }

  async cambiarTema(event: CustomEvent) {
    const value = event.detail.value as ThemePreference;

    if (!value || value === this.temaSeleccionado) {
      return;
    }

    this.temaSeleccionado = value;
    await this.themeService.setPreference(value);
  }

  private async cargarPermisosYConfiguracion() {
    try {
      this.esAdminFamilia = await this.familiaMiembrosService.esUsuarioAdmin();
    } catch (error) {
      console.error('Error cargando permisos de ajustes', error);
      this.esAdminFamilia = false;
    }

    if (!this.esAdminFamilia) {
      this.bebeActivoId = '';
      this.nombreBebeActivo = '';
      this.mensajeError = '';
      this.mensajeGuardado = '';
      this.cargando = false;
      return;
    }

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
      this.mensajeError = 'Ingresá un tiempo válido entre tomas.';
      return;
    }

    if (!this.tiempoEntreSuenosHoras || this.tiempoEntreSuenosHoras <= 0) {
      this.mensajeError = 'Ingresá un tiempo válido entre sueños.';
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
        tiempoEntreSuenosHoras: Number(this.tiempoEntreSuenosHoras),
        onzasDiariasObjetivo: Number(this.onzasDiariasObjetivo)
      });
      await this.notificacionSuenosService.programarProximoSuenoBebeActivo();

      this.tiempoEntreTomasOriginal = Number(this.tiempoEntreTomasHoras);
      this.tiempoEntreSuenosOriginal = Number(this.tiempoEntreSuenosHoras);
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
      Number(this.tiempoEntreSuenosHoras) !== Number(this.tiempoEntreSuenosOriginal) ||
      Number(this.onzasDiariasObjetivo) !== Number(this.onzasDiariasObjetivoOriginal)
    );
  }

  irAFamilia() {
    this.router.navigateByUrl('/familia');
  }
}
