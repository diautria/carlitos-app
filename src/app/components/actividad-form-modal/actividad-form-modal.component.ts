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
  IonSpinner,
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
  restaurant,
  water
} from 'ionicons/icons';

import {
  ActivityFamilia,
  ActivityFamiliaType,
  NivelAceptacionComida,
  TipoComida,
  MomentoComida,
  TipoReaccionComida
} from '../../models/activity-familia.model';

import { ActivityFamiliaService } from '../../services/activity-familia.service';
import { BebeFamiliaService } from '../../services/bebe-familia.service';
import { BebeFamilia, MedicamentoBebe } from '../../models/bebe-familia.model';
import { NotificacionMedicamentosService } from '../../services/notificacion-medicamentos.service';
import { NotificacionSuenosService } from '../../services/notificacion-suenos.service';
import { ActividadEventosService } from '../../services/actividad-eventos.service';
import { AlimentoFamiliaService } from '../../services/alimento-familia.service';
import { AlimentoFamilia } from '../../models/alimento-familia.model';

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
    IonSpinner,
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
  private alimentoFamiliaService = inject(AlimentoFamiliaService);

  isEdit = false;
  formType: ActivityFamiliaType = 'toma-leche';
  form: any = null;
  cantidadOnzasOptions = Array.from({ length: 9 }, (_, i) => i + 1);
  otraCantidadActiva = false;
  momentosComida: Array<{ value: MomentoComida; label: string }> = [
    { value: 'desayuno', label: 'Desayuno' },
    { value: 'almuerzo', label: 'Almuerzo' },
    { value: 'merienda', label: 'Merienda' },
    { value: 'cena', label: 'Cena' },
    { value: 'snack', label: 'Snack' },
    { value: 'otro', label: 'Otro' }
  ];
  tiposComida: Array<{ value: TipoComida; label: string }> = [
    { value: 'pure', label: 'Puré' },
    { value: 'papilla', label: 'Papilla' },
    { value: 'solido-blando', label: 'Sólido blando' },
    { value: 'blw', label: 'BLW' },
    { value: 'mixto', label: 'Mixto' },
    { value: 'liquido-caldo', label: 'Caldo' }
  ];
  aceptacionesComida: Array<{ value: NivelAceptacionComida; label: string }> = [
    { value: 'muy-bien', label: 'Muy bien' },
    { value: 'bien', label: 'Bien' },
    { value: 'regular', label: 'Regular' },
    { value: 'rechazo', label: 'Rechazó' },
    { value: 'solo-probo', label: 'Solo probó' }
  ];
  reaccionesComida: Array<{ value: TipoReaccionComida; label: string }> = [
    { value: 'ronchas', label: 'Ronchas' },
    { value: 'vomito', label: 'Vómito' },
    { value: 'diarrea', label: 'Diarrea' },
    { value: 'estrenimiento', label: 'Estreñimiento' },
    { value: 'gases', label: 'Gases' },
    { value: 'irritacion', label: 'Irritación' },
    { value: 'otra', label: 'Otra' }
  ];

  alimentosComidaOptions: AlimentoFamilia[] = [];
  cargandoCatalogoAlimentos = false;
  alimentoManualActivo = false;
  editandoListaAlimentos = false;
  nuevoAlimentoNombre = '';
  private catalogoAlimentosCargado = false;
  private catalogoAlimentosPromise?: Promise<void>;

  bebes: BebeFamilia[] = [];
  medicamentosDisponibles: MedicamentoDisponible[] = [];
  cargandoMedicamentos = false;
  modalLista = false;
  guardando = false;
  private medicamentosCargados = false;
  private medicamentosPromise?: Promise<void>;

  constructor() {
    addIcons({close,water,leaf,medical,moon,restaurant,add,heart,flask,checkmarkCircle,alertCircle,medicalOutline,checkmark});
  }

  async ngOnInit() {
    this.modalLista = false;

    this.isEdit = this.modo === 'editar';

    if (this.isEdit && this.actividad) {
      this.formType = this.actividad.type;
      this.form = { ...this.actividad };

      if (this.formType === 'medicamento') {
        await this.cargarMedicamentosRegistrados();
      }

      if (this.formType === 'comida') {
        await this.cargarCatalogoAlimentos();
        this.prepararFormularioComidaParaEditar();
      }

      // Convertir tiempos a formato correcto para ion-datetime
      if (this.formType === 'sueno') {
        this.form.time = this.convertToDatetimeFormat(
          this.form.time || (this.form as any).inicio
        );
        if (this.form.fin) {
          this.form.fin = this.convertToDatetimeFormat(this.form.fin);
        }
      } else {
        this.form.time = this.convertToDatetimeFormat(this.form.time);
      }

      this.sincronizarFechaActividadDesdeTime();
    } else {
      this.formType = this.tipoInicial || 'toma-leche';

      this.form = this.getEmptyForm(this.formType);
      this.sincronizarFechaActividadDesdeTime();

      if (this.formType === 'medicamento') {
        await this.cargarMedicamentosRegistrados();
      }

      if (this.formType === 'comida') {
        await this.cargarCatalogoAlimentos();
      }
    }

    if (this.formType === 'toma-leche') {
      this.otraCantidadActiva = this.debeUsarOtraCantidad(
        this.form.cantidadOnzas
      );
    }

    this.modalLista = true;
  }

  private async cargarMedicamentosRegistrados() {
    if (this.medicamentosCargados) {
      return;
    }

    if (this.medicamentosPromise) {
      return this.medicamentosPromise;
    }

    this.medicamentosPromise = this.cargarMedicamentosRegistradosDesdeServicio();
    await this.medicamentosPromise;
  }

  private async cargarMedicamentosRegistradosDesdeServicio() {
    this.cargandoMedicamentos = true;

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

      this.medicamentosCargados = true;
    } catch (error) {
      console.error('Error cargando medicamentos registrados', error);
      this.bebes = [];
      this.medicamentosDisponibles = [];
    } finally {
      this.cargandoMedicamentos = false;
      this.medicamentosPromise = undefined;
    }
  }

  getEmptyForm(type: ActivityFamiliaType) {
    const base = {
      id: '',
      type,
      time: this.getLocalDateTimeForInput(),
      fechaActividad: this.getLocalDateForInput(),
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

    if (type === 'comida') {
      return {
        ...base,
        momento: 'almuerzo',
        tipoComida: 'pure',
        alimentos: [],
        alimentosSeleccionados: [],
        alimentosTexto: '',
        cantidadAproximada: null,
        unidadCantidad: 'cucharaditas',
        aceptacion: 'bien',
        esPrimeraVez: false,
        huboReaccion: false,
        reaccion: [],
        observaciones: ''
      };
    }

    return base;
  }

  async onTypeChange(type: ActivityFamiliaType) {
    const fechaActividadActual =
      this.form?.fechaActividad || this.getLocalDateForInput();

    this.formType = type;
    this.form = this.getEmptyForm(type);
    this.form.fechaActividad = fechaActividadActual;
    this.form.time = this.combinarFechaActividadConHora(
      this.form.time,
      fechaActividadActual
    );

    if (this.formType === 'sueno') {
      this.form.inicio = this.form.time;
    }

    this.otraCantidadActiva = false;
    this.alimentoManualActivo = false;

    if (type === 'comida') {
      await this.cargarCatalogoAlimentos();
    }

    if (type === 'medicamento') {
      await this.cargarMedicamentosRegistrados();
    }
  }

  private async cargarCatalogoAlimentos(forzarRecarga = false) {
    if (forzarRecarga) {
      this.catalogoAlimentosCargado = false;
      this.catalogoAlimentosPromise = undefined;
    }

    if (this.catalogoAlimentosCargado) {
      return;
    }

    if (this.catalogoAlimentosPromise) {
      return this.catalogoAlimentosPromise;
    }

    this.catalogoAlimentosPromise = this.cargarCatalogoAlimentosDesdeServicio();
    await this.catalogoAlimentosPromise;
  }

  private async cargarCatalogoAlimentosDesdeServicio() {
    this.cargandoCatalogoAlimentos = true;

    try {
      this.alimentosComidaOptions =
        await this.alimentoFamiliaService.obtenerAlimentosFamiliaActual();
      this.catalogoAlimentosCargado = true;
    } catch (error) {
      console.error('Error cargando alimentos', error);
      this.alimentosComidaOptions = [];
    } finally {
      this.cargandoCatalogoAlimentos = false;
      this.catalogoAlimentosPromise = undefined;
    }
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
    const cantidadActual = Number(this.form.cantidadOnzas || 0);

    this.otraCantidadActiva = true;

    if (this.cantidadOnzasOptions.includes(cantidadActual)) {
      this.form.cantidadOnzas = null;
    }
  }

  private debeUsarOtraCantidad(value: any): boolean {
    const cantidad = Number(value || 0);

    return cantidad > 0 && !this.cantidadOnzasOptions.includes(cantidad);
  }

  toggleReaccionComida(value: TipoReaccionComida) {
    const reacciones = Array.isArray(this.form.reaccion)
      ? [...this.form.reaccion]
      : [];

    this.form.reaccion = reacciones.includes(value)
      ? reacciones.filter(item => item !== value)
      : [...reacciones, value];
  }

  toggleAlimentoComida(nombre: string) {
    const seleccionados = Array.isArray(this.form.alimentosSeleccionados)
      ? [...this.form.alimentosSeleccionados]
      : [];

    this.form.alimentosSeleccionados = seleccionados.includes(nombre)
      ? seleccionados.filter(item => item !== nombre)
      : [...seleccionados, nombre];
  }

  activarAlimentoManual() {
    this.alimentoManualActivo = !this.alimentoManualActivo;

    if (!this.alimentoManualActivo) {
      this.form.alimentosTexto = '';
    }
  }

  async agregarAlimentoCatalogo() {
    const nombre = this.nuevoAlimentoNombre.trim();

    if (!nombre) {
      return;
    }

    await this.alimentoFamiliaService.crearAlimentosPorNombres([nombre]);
    this.nuevoAlimentoNombre = '';
    await this.cargarCatalogoAlimentos(true);
    this.toggleAlimentoComida(nombre);
  }

  async quitarAlimentoCatalogo(alimento: AlimentoFamilia) {
    await this.alimentoFamiliaService.desactivarAlimento(alimento.id);
    this.form.alimentosSeleccionados = (this.form.alimentosSeleccionados || [])
      .filter((nombre: string) => nombre !== alimento.nombre);
    await this.cargarCatalogoAlimentos(true);
  }

  private prepararFormularioComidaParaEditar() {
    if (this.formType !== 'comida') {
      return;
    }

    const alimentos = Array.isArray(this.form.alimentos)
      ? this.form.alimentos.map((item: any) => item.nombre).filter(Boolean)
      : [];
    const alimentosBase = new Set(
      this.alimentosComidaOptions.map(alimento => alimento.nombre)
    );
    const seleccionados = alimentos.filter((nombre: string) =>
      alimentosBase.has(nombre)
    );
    const manuales = alimentos.filter((nombre: string) =>
      !alimentosBase.has(nombre)
    );

    this.form.alimentosSeleccionados = seleccionados;
    this.form.alimentosTexto = manuales.join(', ');
    this.alimentoManualActivo = manuales.length > 0;
    this.form.reaccion = Array.isArray(this.form.reaccion)
      ? this.form.reaccion
      : [];
  }

  private async normalizarFormularioComida(): Promise<boolean> {
    const seleccionados = Array.isArray(this.form.alimentosSeleccionados)
      ? this.form.alimentosSeleccionados
      : [];
    const manuales = String(this.form.alimentosTexto || '')
      .split(',')
      .map(nombre => nombre.trim())
      .filter(Boolean);
    const nombres = Array.from(new Set([...seleccionados, ...manuales]));

    if (nombres.length === 0) {
      return false;
    }

    const alimentosCatalogo =
      await this.alimentoFamiliaService.crearAlimentosPorNombres(nombres);

    this.form.alimentos = nombres.map(nombre => {
      const alimento = alimentosCatalogo.find(
        item => item.nombre.toLowerCase() === nombre.toLowerCase()
      );

      return {
        alimentoId: alimento?.id,
        nombre,
        categoria: alimento?.categoria
      };
    });
    this.form.cantidadAproximada =
      this.form.cantidadAproximada !== null &&
      this.form.cantidadAproximada !== undefined &&
      this.form.cantidadAproximada !== ''
        ? Number(this.form.cantidadAproximada)
        : null;
    this.form.huboReaccion = !!this.form.huboReaccion;
    this.form.reaccion = this.form.huboReaccion && Array.isArray(this.form.reaccion)
      ? this.form.reaccion
      : [];
    this.form.observaciones = this.form.observaciones?.trim() || '';

    delete this.form.alimentosTexto;
    delete this.form.alimentosSeleccionados;

    return this.form.alimentos.length > 0;
  }

  async saveActivity() {
    if (this.guardando) {
      return;
    }

    this.guardando = true;

    try {
      this.form.type = this.formType;
      this.form.time = this.combinarFechaActividadConHora(
        this.form.time,
        this.form.fechaActividad
      );
      this.form.time = this.normalizarFechaHoraLocal(this.form.time);

      let medicamentoAdministrado: any = null;

      if (this.formType === 'toma-leche') {
        this.form.cantidadOnzas = Number(this.form.cantidadOnzas || 0);
        this.form.esLecheMaterna = !!this.form.esLecheMaterna;
      }

      if (this.formType === 'cambio-panal') {
        this.form.tieneHeces = !!this.form.tieneHeces;
      }

      if (this.formType === 'comida') {
        const tieneAlimentos = await this.normalizarFormularioComida();

        if (!tieneAlimentos) {
          const alert = await this.alertController.create({
            header: 'Comida',
            message: 'Agrega al menos un alimento.',
            buttons: ['Aceptar']
          });

          await alert.present();
          return;
        }
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
        this.form.time = this.form.inicio;

        if (this.form.fin) {
          this.form.fin = this.normalizarFechaHoraLocal(
            this.combinarFechaActividadConHora(
              this.form.fin,
              this.form.fechaActividad
            ),
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

      const actividadParaGuardar = { ...this.form };
      delete actividadParaGuardar.fechaActividad;

      let actividadGuardada: ActivityFamilia = actividadParaGuardar;

      if (!actividadParaGuardar.id) {
        actividadParaGuardar.id = '';
        actividadParaGuardar.createdAt = new Date().toISOString();

        actividadGuardada = await this.activityFamiliaService.add(actividadParaGuardar);
        this.form = {
          ...this.form,
          ...actividadGuardada
        };
      } else {
        actividadParaGuardar.updatedAt = new Date().toISOString();

        await this.activityFamiliaService.update(actividadParaGuardar);
        actividadGuardada = actividadParaGuardar;
      }

      const alimentosUsados = this.formType === 'comida'
        ? (this.form.alimentos || []).map((alimento: any) => alimento.nombre)
        : [];

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

      if (this.formType === 'comida' && alimentosUsados.length) {
        void this.alimentoFamiliaService.marcarAlimentosUsados(alimentosUsados);
      }

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
    } finally {
      this.guardando = false;
    }
  }

  closeModal() {
    if (this.guardando) {
      return;
    }

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

  private getLocalDateForInput(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private sincronizarFechaActividadDesdeTime(): void {
    if (!this.form) {
      return;
    }

    const fecha = new Date(this.form.time || this.form.inicio || new Date());

    this.form.fechaActividad = Number.isNaN(fecha.getTime())
      ? this.getLocalDateForInput()
      : this.getLocalDateForInput(fecha);
  }

  actualizarFechaActividad(): void {
    if (!this.form?.fechaActividad) {
      this.form.fechaActividad = this.getLocalDateForInput();
    }

    this.form.time = this.combinarFechaActividadConHora(
      this.form.time,
      this.form.fechaActividad
    );

    if (this.formType === 'sueno') {
      this.form.inicio = this.form.time;

      if (this.form.fin) {
        this.form.fin = this.combinarFechaActividadConHora(
          this.form.fin,
          this.form.fechaActividad
        );
      }
    }
  }

  private combinarFechaActividadConHora(
    value: string,
    fechaActividad?: string
  ): string {
    const fecha = fechaActividad || this.getLocalDateForInput();
    const hora = this.obtenerHoraMinutos(value);

    return `${fecha}T${hora}`;
  }

  private obtenerHoraMinutos(value: string): string {
    if (!value) {
      const ahora = new Date();
      return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    }

    const horaSola = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

    if (horaSola) {
      return `${String(Number(horaSola[1])).padStart(2, '0')}:${horaSola[2]}`;
    }

    const fecha = new Date(value);

    if (!Number.isNaN(fecha.getTime())) {
      return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
    }

    const partes = value.split('T');
    const hora = partes[1]?.slice(0, 5);

    return hora && /^\d{2}:\d{2}$/.test(hora) ? hora : '00:00';
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
