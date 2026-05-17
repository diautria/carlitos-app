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
  IonLabel,
  IonModal,
  IonNote,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  alertCircle,
  checkmark,
  checkmarkCircle,
  close,
  flask,
  heart,
  leaf,
  medical,
  moon,
  water, medicalOutline } from 'ionicons/icons';

import {
  ActivityFamilia,
  ActivityFamiliaType
} from '../../models/activity-familia.model';

import { ActivityFamiliaService } from '../../services/activity-familia.service';
import { BebeFamiliaService } from '../../services/bebe-familia.service';
import { BebeFamilia, MedicamentoBebe } from '../../models/bebe-familia.model';
import { NotificacionMedicamentosService } from '../../services/notificacion-medicamentos.service';

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
    IonLabel,
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

  isEdit = false;
  formType: ActivityFamiliaType = 'toma-leche';
  form: any = null;

  bebes: BebeFamilia[] = [];
  medicamentosDisponibles: MedicamentoDisponible[] = [];
modalLista = false;

  constructor() {
    addIcons({close,water,leaf,medical,moon,heart,flask,checkmarkCircle,alertCircle,medicalOutline,checkmark});
  }

  async ngOnInit() {
  this.modalLista = false;

  this.isEdit = this.modo === 'editar';

  await this.cargarMedicamentosRegistrados();

  if (this.isEdit && this.actividad) {
    this.formType = this.actividad.type;
    this.form = { ...this.actividad };
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
        cantidadOnzas: 0,
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

  async saveActivity() {
    try {
      this.form.type = this.formType;

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
        this.form.inicio = this.form.time;

        if (this.form.fin) {
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

      if (!this.form.id) {
        this.form.id = '';
        this.form.createdAt = new Date().toISOString();

        await this.activityFamiliaService.add(this.form);
      } else {
        this.form.updatedAt = new Date().toISOString();

        await this.activityFamiliaService.update(this.form);
      }

      const actividades = await this.activityFamiliaService.getAll();

      if (this.formType === 'medicamento' && medicamentoAdministrado) {
        await this.notificacionMedicamentosService.reprogramarMedicamentoDespuesDeAdministrar(
          medicamentoAdministrado.bebeId,
          medicamentoAdministrado.nombreBebe || '',
          medicamentoAdministrado,
          actividades
        );
      }

      await this.modalController.dismiss({
        actividadGuardada: true
      });
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