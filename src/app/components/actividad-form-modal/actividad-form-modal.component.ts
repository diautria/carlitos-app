import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonNote,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  add,
  alertCircle,
  checkmark,
  checkmarkCircle,
  close,
  flask,
  heart,
  leaf,
  medical,
  moon,
  medicalOutline,
  water
} from 'ionicons/icons';

import {
  ActivityFamilia,
  ActivityFamiliaType
} from '../../models/activity-familia.model';

import { ActivityFamiliaService } from '../../services/activity-familia.service';
import { BebeFamiliaService } from '../../services/bebe-familia.service';
import { BebeFamilia, MedicamentoBebe } from '../../models/bebe-familia.model';
import { NotificacionMedicamentosService } from '../../services/notificacion-medicamentos.service';
import { NotificacionSuenosService } from '../../services/notificacion-suenos.service';
import { ActividadEventosService } from '../../services/actividad-eventos.service';

interface MedicamentoDisponible extends MedicamentoBebe {
  bebeId: string;
  nombreBebe: string;
}

@Component({
  selector: 'app-actividad-form-modal',
  templateUrl: './actividad-form-modal.component.html',
  styleUrls: ['./actividad-form-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonInput,
    IonDatetime,
    IonTextarea,
    IonNote
  ]
})
export class ActividadFormModalComponent implements OnInit {
  @Input() modo: 'crear' | 'editar' = 'crear';
  @Input() tipoInicial: ActivityFamiliaType = 'toma-leche';
  @Input() actividad?: ActivityFamilia;

  private modalController = inject(ModalController);
  private alertController = inject(AlertController);
  private activityFamiliaService = inject(ActivityFamiliaService);
  private bebeFamiliaService = inject(BebeFamiliaService);
  private notificacionMedicamentosService = inject(NotificacionMedicamentosService);
  private notificacionSuenosService = inject(NotificacionSuenosService);
  private actividadEventosService = inject(ActividadEventosService);

  isEdit = false;
  formType: ActivityFamiliaType = 'toma-leche';
  form: any = null;
  cantidadOnzasOptions = Array.from({ length: 9 }, (_, i) => i + 1);
  otraCantidadActiva = false;

  bebes: BebeFamilia[] = [];
  medicamentosDisponibles: MedicamentoDisponible[] = [];
  modalLista = false;

  constructor() {
    addIcons({close,water,leaf,medical,moon,add,heart,flask,checkmarkCircle,alertCircle,medicalOutline,checkmark});
  }

  async ngOnInit() {
    this.modalLista = false;

    this.isEdit = this.modo === 'editar';

    await this.cargarMedicamentosRegistrados();

    if (this.isEdit && this.actividad) {
      this.formType = this.actividad.type;
      this.form = { ...this.actividad };

      // Convertir tiempos a formato correcto para ion-datetime
      if (this.formType === 'sueno') {
        this.form.time = this.convertToDatetimeFormat(this.form.time);
        if (this.form.fin) {
          this.form.fin = this.convertToDatetimeFormat(this.form.fin);
        }
      } else {
        this.form.time = this.convertToDatetimeFormat(this.form.time);
      }
    } else {
      this.formType = this.tipoInicial || 'toma-leche';

      if (
        this.formType === 'medicamento' &&
        !this.tieneMedicamentosRegistrados()
      ) {
        this.formType = 'toma-leche';
      }

      this.form = this.getEmptyForm(this.formType);
    }

    if (this.formType === 'toma-leche') {
      this.otraCantidadActiva =
        !!this.form.cantidadOnzas && this.form.cantidadOnzas > 9;
    }

    this.modalLista = true;
  }

  private async cargarMedicamentosRegistrados() {
    try {
      const bebes = await this.bebeFamiliaService.obtenerBebesFamiliaActual();

      this.bebes = bebes || [];
      this.medicamentosDisponibles = [];

      for (const bebe of this.bebes) {
        const medicamentos = bebe.medicamentos || [];

        for (const medicamento of medicamentos) {
          if (!medicamento.activo) {
            continue;
          }

          this.medicamentosDisponibles.push({
            ...medicamento,
            bebeId: bebe.id,
            nombreBebe: bebe.nombre
          });
        }
      }
    } catch (error) {
      console.error('Error cargando medicamentos registrados', error);
      this.bebes = [];
      this.medicamentosDisponibles = [];
    }
  }

  tieneMedicamentosRegistrados(): boolean {
    return this.medicamentosDisponibles.length > 0;
  }

  getEmptyForm(type: ActivityFamiliaType) {
    const base = {
      id: '',
      type,
      time: this.getLocalDateTimeForInput(),
      createdAt: new Date().toISOString(),
      updatedAt: undefined
    };

    if (type === 'toma-leche') {
      return {
        ...base,
        cantidadOnzas: 3,
        esLecheMaterna: false
      };
    }

    if (type === 'cambio-panal') {
      return {
        ...base,
        tieneHeces: false
      };
    }

    if (type === 'medicamento') {
      return {
        ...base,
        medicamentoId: '',
        nombreMedicamento: '',
        dosisGotas: 0,
        observaciones: ''
      };
    }

    if (type === 'sueno') {
      return {
        ...base,
        inicio: base.time,
        fin: null,
        duracionMinutos: 0,
        observaciones: ''
      };
    }

    return base;
  }

  onTypeChange(type: ActivityFamiliaType) {
    this.formType = type;
    this.form = this.getEmptyForm(type);
  }

  onMedicamentoChange(medicamentoId: string) {
    const medicamento = this.medicamentosDisponibles.find(
      item => item.id === medicamentoId
    );

    if (!medicamento) {
      this.form.medicamentoId = '';
      this.form.nombreMedicamento = '';
      this.form.dosisGotas = 0;
      return;
    }

    this.form.medicamentoId = medicamento.id;
    this.form.nombreMedicamento = medicamento.nombre;
    this.form.dosisGotas = medicamento.dosisGotas;
    this.form.bebeId = medicamento.bebeId;
  }

  selectCantidadOnzas(value: number) {
    this.otraCantidadActiva = false;
    this.form.cantidadOnzas = value;
  }

  activarOtraCantidad() {
    this.otraCantidadActiva = true;
    this.form.cantidadOnzas = null;
  }

  async saveActivity() {
    try {
      this.form.type = this.formType;
      this.form.time = this.normalizarFechaHoraLocal(this.form.time);

      let medicamentoAdministrado: any = null;

      if (this.formType === 'toma-leche') {
        this.form.cantidadOnzas = Number(this.form.cantidadOnzas || 0);
        this.form.esLecheMaterna = !!this.form.esLecheMaterna;
      }

      if (this.formType === 'cambio-panal') {
        this.form.tieneHeces = !!this.form.tieneHeces;
      }

      if (this.formType === 'medicamento') {
        if (!this.form.medicamentoId) {
          const alert = await this.alertController.create({
            header: 'Medicamento',
            message: 'Debes seleccionar un medicamento registrado.',
            buttons: ['Aceptar']
          });

          await alert.present();
          return;
        }

        const medicamento = this.medicamentosDisponibles.find(
          item => item.id === this.form.medicamentoId
        );

        if (!medicamento) {
          const alert = await this.alertController.create({
            header: 'Medicamento',
            message: 'No se encontró el medicamento seleccionado.',
            buttons: ['Aceptar']
          });

          await alert.present();
          return;
        }

        medicamentoAdministrado = medicamento;

        this.form.nombreMedicamento = medicamento.nombre;
        this.form.dosisGotas = Number(this.form.dosisGotas || medicamento.dosisGotas || 0);
        this.form.observaciones = this.form.observaciones?.trim() || '';
        this.form.bebeId = medicamento.bebeId;

        if (!this.form.dosisGotas || this.form.dosisGotas <= 0) {
          const alert = await this.alertController.create({
            header: 'Medicamento',
            message: 'La dosis en gotas debe ser mayor que cero.',
            buttons: ['Aceptar']
          });

          await alert.present();
          return;
        }
      }

      if (this.formType === 'sueno') {
        // Solo actualizar inicio si es modo crear, no editar
        if (!this.isEdit) {
          this.form.inicio = this.form.time;
        } else {
          this.form.inicio = this.normalizarFechaHoraLocal(
            this.form.inicio || this.form.time,
            this.form.time
          );
        }

        if (this.form.fin) {
          this.form.fin = this.normalizarFechaHoraLocal(
            this.form.fin,
            this.form.inicio || this.form.time
          );

          const inicio = new Date(this.form.inicio);
          const fin = new Date(this.form.fin);

          if (fin <= inicio) {
            const alert = await this.alertController.create({
              header: 'Sueño',
              message: 'La hora de fin debe ser posterior a la hora de inicio.',
              buttons: ['Aceptar']
            });

            await alert.present();
            return;
          }

          this.form.duracionMinutos = Math.round(
            (fin.getTime() - inicio.getTime()) / 60000
          );
        } else {
          const suenoActivo = await this.activityFamiliaService.obtenerSuenoActivo();

          if (suenoActivo && suenoActivo.id !== this.form.id) {
            const alert = await this.alertController.create({
              header: 'Sueño en curso',
              message: 'Ya hay un sueño en curso. Primero debes finalizarlo.',
              buttons: ['Aceptar']
            });

            await alert.present();
            return;
          }

          this.form.fin = null;
          this.form.duracionMinutos = 0;
        }

        this.form.observaciones = this.form.observaciones?.trim() || '';
      }

      let actividadGuardada: ActivityFamilia = this.form;

      if (!this.form.id) {
        this.form.id = '';
        this.form.createdAt = new Date().toISOString();

        actividadGuardada = await this.activityFamiliaService.add(this.form);
        this.form = {
          ...this.form,
          ...actividadGuardada
        };
      } else {
        this.form.updatedAt = new Date().toISOString();

        await this.activityFamiliaService.update(this.form);
        actividadGuardada = this.form;
      }

      const actividadesHoyPromise = this.activityFamiliaService.getByDay(new Date())
        .catch(error => {
          console.error('Error obteniendo actividades para recordatorios', error);
          return [] as ActivityFamilia[];
        });

      await this.modalController.dismiss({
        actividadGuardada: true,
        actividad: actividadGuardada
      });

      this.actividadEventosService.notificarActividadGuardada(actividadGuardada);

      if (this.formType === 'medicamento' && medicamentoAdministrado) {
        void this.activityFamiliaService
          .getAllByBebeId(medicamentoAdministrado.bebeId)
          .then(actividades =>
            this.notificacionMedicamentosService.reprogramarMedicamentoDespuesDeAdministrar(
            medicamentoAdministrado.bebeId,
            medicamentoAdministrado.nombreBebe || '',
            medicamentoAdministrado,
            actividades
            )
          );
      }

      if (this.formType === 'sueno') {
        void actividadesHoyPromise.then(actividades =>
          this.notificacionSuenosService.programarProximoSuenoBebeActivo(
            actividades
          )
        );
      }
    } catch (error: any) {
      console.error('Error guardando actividad', error);

      const alert = await this.alertController.create({
        header: 'No se pudo guardar',
        message: error?.message || 'No se pudo guardar la actividad.',
        buttons: ['Aceptar']
      });

      await alert.present();
    }
  }

  closeModal() {
    this.modalController.dismiss({
      actividadGuardada: false
    });
  }

  private getLocalDateTimeForInput(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private normalizarFechaHoraLocal(value: string, baseValue?: string): string {
    if (!value) {
      return this.getLocalDateTimeForInput();
    }

    const horaSola = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

    if (horaSola) {
      const base = baseValue && baseValue.includes('T')
        ? new Date(baseValue)
        : new Date();

      base.setHours(Number(horaSola[1]), Number(horaSola[2]), 0, 0);

      return this.getLocalDateTimeForInput(base);
    }

    const fecha = new Date(value);

    if (!Number.isNaN(fecha.getTime())) {
      return this.getLocalDateTimeForInput(fecha);
    }

    return this.getLocalDateTimeForInput();
  }

  private convertToDatetimeFormat(isoString: string | null | undefined): string {
    if (!isoString) return this.getLocalDateTimeForInput();
    try {
      const date = new Date(isoString);
      return this.getLocalDateTimeForInput(date);
    } catch {
      return this.getLocalDateTimeForInput();
    }
  }

  limpiarCeroInput(campo: 'cantidadOnzas' | 'dosisGotas') {
  if (
    this.form[campo] === 0 ||
    this.form[campo] === '0'
  ) {
    this.form[campo] = null;
  }
}

restaurarCeroInput(campo: 'cantidadOnzas' | 'dosisGotas') {
  if (
    this.form[campo] === null ||
    this.form[campo] === undefined ||
    this.form[campo] === ''
  ) {
    this.form[campo] = 0;
  }
}
}
