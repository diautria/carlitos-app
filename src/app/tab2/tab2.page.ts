import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { ActividadFormModalComponent } from '../components/actividad-form-modal/actividad-form-modal.component';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonModal,
  IonInput,
  IonDatetime,
  IonIcon,
  IonButtons,
  IonItemDivider,
  AlertController,
  IonSegment,
  IonSegmentButton,
  IonAccordion,
  IonAccordionGroup,
  IonNote,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonFooter,
  IonDatetimeButton,
  IonTextarea,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  addCircle,
  statsChartOutline,
  water,
  leaf,
  createOutline,
  trashOutline,
  close,
  heart,
  flask,
  checkmarkCircle,
  alertCircle,
  checkmark,
  filterOutline,
  refreshOutline,
  calendarOutline,
  timeOutline,
  medical, medicalOutline, moonOutline, moon, waterOutline, leafOutline } from 'ionicons/icons';

import { ActivityFamiliaService } from '../services/activity-familia.service';
import {
  ActivityFamilia,
  ActivityFamiliaType
} from '../models/activity-familia.model';

import { NotificacionTomasService } from '../services/notificacion-tomas.service';
import { BebeFamiliaService } from '../services/bebe-familia.service';
import { BebeFamilia, MedicamentoBebe } from '../models/bebe-familia.model';
import { NotificacionMedicamentosService } from '../services/notificacion-medicamentos.service';

interface ActivityDateGroup {
  fecha: string;
  activities: ActivityFamilia[];
}

interface ActivityMonthGroup {
  monthKey: string;
  monthName: string;
  activities: ActivityFamilia[];
  dateGroups: ActivityDateGroup[];
}

interface ActivityYearGroup {
  year: string;
  months: ActivityMonthGroup[];
}

interface ActivityFilters {
  rangoFecha: 'todos' | 'hoy' | 'ayer' | '7dias' | '30dias' | 'personalizado';
  fechaDesde: string;
  fechaHasta: string;
  horaDesde: string;
  horaHasta: string;

  tipoLeche: 'todas' | 'materna' | 'formula';
  onzasMin: number | null;
  onzasMax: number | null;

  tipoPanal: 'todos' | 'pipi' | 'popo';

  medicamentoId: string;
  dosisGotasMin: number | null;
  dosisGotasMax: number | null;

  estadoSueno: 'todos' | 'en-curso' | 'finalizados';
  duracionSuenoMin: number | null;
  duracionSuenoMax: number | null;
}

interface ResumenFiltros {
  total: number;
  tomas: number;
  panales: number;
  medicamentos: number;
  suenos: number;
}

interface MedicamentoDisponible extends MedicamentoBebe {
  bebeId: string;
  nombreBebe: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonModal,
    IonInput,
    IonDatetime,
    IonIcon,
    IonButtons,
    IonLabel,
    IonItem,
    IonList,
    IonSegment,
    IonSegmentButton,
    IonAccordion,
    IonAccordionGroup,
    IonNote,
    IonBadge,
    IonItemDivider,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonFooter,
    IonDatetimeButton,
    IonTextarea,
    IonSelect,
    IonSelectOption
  ]
})
export class Tab2Page implements OnInit {
  activities: ActivityFamilia[] = [];
  filteredActivities: ActivityFamilia[] = [];

  bebes: BebeFamilia[] = [];
  medicamentosDisponibles: MedicamentoDisponible[] = [];

  loading = false;
  primeraCarga = true;

  selectedTab: ActivityFamiliaType = 'toma-leche';

  groupedTomasLeche: ActivityYearGroup[] = [];
  groupedCambiosPanal: ActivityYearGroup[] = [];
  groupedMedicamentos: ActivityYearGroup[] = [];

  showModal = false;
  showModalFiltros = false;
  showModalEstadisticas = false;

  isEdit = false;
  formType: ActivityFamiliaType = 'toma-leche';
  form: any = this.getEmptyForm('toma-leche');

  filters: ActivityFilters = this.getDefaultFilters();
  filtersDraft: ActivityFilters = this.getDefaultFilters();

  resumenFiltros: ResumenFiltros = {
    total: 0,
    tomas: 0,
    panales: 0,
    medicamentos: 0,
  suenos: 0
  };

  openGroupsTomaLeche: string[] = [];
  openGroupsCambioPanal: string[] = [];
  openGroupsMedicamentos: string[] = [];

  openMonthGroupsTomaLeche: Record<string, string[]> = {};
  openMonthGroupsCambioPanal: Record<string, string[]> = {};
  openMonthGroupsMedicamentos: Record<string, string[]> = {};

  openDateGroupsTomaLeche: Record<string, string[]> = {};
  openDateGroupsCambioPanal: Record<string, string[]> = {};
  openDateGroupsMedicamentos: Record<string, string[]> = {};

  estadisticas = {
  promedioOnzasPorDia: 0,
  totalFormula: 0,
  totalMaterna: 0,
  totalTomas: 0,
  totalPanales: 0,
  totalPopo: 0,
  totalPipi: 0,
  totalMedicamentos: 0,
  promedioPanalesPorDia: 0,

  totalSuenos: 0,
  totalMinutosSueno: 0,
  totalSuenoTexto: '0 min',
  promedioSuenoTexto: '0 min',
  suenoMasLargoTexto: '0 min',
  suenosEnCurso: 0
};

  groupedSuenos: ActivityYearGroup[] = [];
openGroupsSuenos: string[] = [];
openMonthGroupsSuenos: Record<string, string[]> = {};
openDateGroupsSuenos: Record<string, string[]> = {};

  constructor(
    private activityFamiliaService: ActivityFamiliaService,
    private alertController: AlertController,
    private notificacionTomasService: NotificacionTomasService,
    private bebeFamiliaService: BebeFamiliaService,
    private notificacionMedicamentosService: NotificacionMedicamentosService,
    private modalController: ModalController
  ) {
    addIcons({addCircle,statsChartOutline,filterOutline,waterOutline,leafOutline,medical,moonOutline,createOutline,trashOutline,leaf,moon,close,water,heart,flask,checkmarkCircle,alertCircle,checkmark,calendarOutline,timeOutline,refreshOutline,medicalOutline});
  }

  async ngOnInit() {
    await this.cargarMedicamentosRegistrados();
    await this.loadActivities();
  }

  async ionViewWillEnter() {
    await this.cargarMedicamentosRegistrados();
    await this.loadActivities();
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

  async loadActivities() {
  if (this.primeraCarga) {
    this.loading = true;
  }

  try {
    const gruposTomaActuales = [...this.openGroupsTomaLeche];
    const gruposPanalActuales = [...this.openGroupsCambioPanal];
    const gruposMedicamentosActuales = [...this.openGroupsMedicamentos];
    const gruposSuenosActuales = [...this.openGroupsSuenos];

    const mesesTomaActuales = { ...this.openMonthGroupsTomaLeche };
    const mesesPanalActuales = { ...this.openMonthGroupsCambioPanal };
    const mesesMedicamentosActuales = { ...this.openMonthGroupsMedicamentos };
    const mesesSuenosActuales = { ...this.openMonthGroupsSuenos };

    const fechasTomaActuales = { ...this.openDateGroupsTomaLeche };
    const fechasPanalActuales = { ...this.openDateGroupsCambioPanal };
    const fechasMedicamentosActuales = { ...this.openDateGroupsMedicamentos };
    const fechasSuenosActuales = { ...this.openDateGroupsSuenos };

    const actividades = await this.activityFamiliaService.getAll();

    this.activities = actividades.sort((a, b) =>
      b.time.localeCompare(a.time)
    );

    this.aplicarFiltros(false);

    this.openGroupsTomaLeche = gruposTomaActuales.length
      ? gruposTomaActuales
      : this.getDefaultOpenGroups('toma-leche');

    this.openGroupsCambioPanal = gruposPanalActuales.length
      ? gruposPanalActuales
      : this.getDefaultOpenGroups('cambio-panal');

    this.openGroupsMedicamentos = gruposMedicamentosActuales.length
      ? gruposMedicamentosActuales
      : this.getDefaultOpenGroups('medicamento');

    this.openGroupsSuenos = gruposSuenosActuales.length
      ? gruposSuenosActuales
      : this.getDefaultOpenGroups('sueno');

    this.openMonthGroupsTomaLeche = Object.keys(mesesTomaActuales).length
      ? mesesTomaActuales
      : this.getDefaultOpenMonthGroupsByYear('toma-leche');

    this.openMonthGroupsCambioPanal = Object.keys(mesesPanalActuales).length
      ? mesesPanalActuales
      : this.getDefaultOpenMonthGroupsByYear('cambio-panal');

    this.openMonthGroupsMedicamentos = Object.keys(mesesMedicamentosActuales).length
      ? mesesMedicamentosActuales
      : this.getDefaultOpenMonthGroupsByYear('medicamento');

    this.openMonthGroupsSuenos = Object.keys(mesesSuenosActuales).length
      ? mesesSuenosActuales
      : this.getDefaultOpenMonthGroupsByYear('sueno');

    this.openDateGroupsTomaLeche = Object.keys(fechasTomaActuales).length
      ? fechasTomaActuales
      : this.getDefaultOpenDateGroupsByMonth('toma-leche');

    this.openDateGroupsCambioPanal = Object.keys(fechasPanalActuales).length
      ? fechasPanalActuales
      : this.getDefaultOpenDateGroupsByMonth('cambio-panal');

    this.openDateGroupsMedicamentos = Object.keys(fechasMedicamentosActuales).length
      ? fechasMedicamentosActuales
      : this.getDefaultOpenDateGroupsByMonth('medicamento');

    this.openDateGroupsSuenos = Object.keys(fechasSuenosActuales).length
      ? fechasSuenosActuales
      : this.getDefaultOpenDateGroupsByMonth('sueno');

    await this.notificacionTomasService.programarNotificacionProximaToma(
      this.activities
    );
  } catch (error: any) {
    console.error('Error cargando actividades', error);

    this.activities = [];
    this.filteredActivities = [];
    this.groupedTomasLeche = [];
    this.groupedCambiosPanal = [];
    this.groupedMedicamentos = [];
    this.groupedSuenos = [];

    if (error?.message && this.primeraCarga) {
      const alert = await this.alertController.create({
        header: 'Actividades',
        message: error.message,
        buttons: ['Aceptar']
      });

      await alert.present();
    }
  } finally {
    this.loading = false;
    this.primeraCarga = false;
  }
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

  async openAddModal() {
  const tipoInicial =
    this.selectedTab === 'medicamento' && !this.tieneMedicamentosRegistrados()
      ? 'toma-leche'
      : this.selectedTab;

  const modal = await this.modalController.create({
    component: ActividadFormModalComponent,
    cssClass: 'custom-modal',
    componentProps: {
      modo: 'crear',
      tipoInicial
    }
  });

  await modal.present();

  const { data } = await modal.onDidDismiss();

  if (data?.actividadGuardada) {
    await this.cargarMedicamentosRegistrados();
    await this.loadActivities();
  }
}

 async openEditModal(activity: ActivityFamilia) {
  const modal = await this.modalController.create({
    component: ActividadFormModalComponent,
    cssClass: 'custom-modal',
    componentProps: {
      modo: 'editar',
      actividad: activity
    }
  });

  await modal.present();

  const { data } = await modal.onDidDismiss();

  if (data?.actividadGuardada) {
    await this.cargarMedicamentosRegistrados();
    await this.loadActivities();
  }
}

  closeModal() {
    this.showModal = false;
  }

  onModalDismiss() {
    this.showModal = false;
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

    await this.loadActivities();

    if (this.formType === 'medicamento' && medicamentoAdministrado) {
      await this.
        notificacionMedicamentosService.reprogramarMedicamentoDespuesDeAdministrar(
          medicamentoAdministrado.bebeId,
          medicamentoAdministrado.nombreBebe || '',
          medicamentoAdministrado,
          this.activities
        );
    }

    this.closeModal();
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

  async deleteActivity(id: string) {
  const actividadAEliminar = this.activities.find(
    activity => activity.id === id
  );

  const alert = await this.alertController.create({
    header: 'Eliminar actividad',
    message: '¿Confirmas eliminar esta actividad?',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          await this.activityFamiliaService.delete(id);
          await this.loadActivities();

          if (
            actividadAEliminar?.type === 'medicamento' &&
            (actividadAEliminar as any).medicamentoId
          ) {
            const medicamento = this.medicamentosDisponibles.find(
              item => item.id === (actividadAEliminar as any).medicamentoId
            );

            if (medicamento) {
              await this.notificacionMedicamentosService
                .reprogramarMedicamentoDespuesDeAdministrar(
                  medicamento.bebeId,
                  (medicamento as any).nombreBebe || '',
                  medicamento,
                  this.activities
                );
            }
          }
        }
      }
    ]
  });

  await alert.present();
}

  onTypeChange(type: ActivityFamiliaType) {
    this.formType = type;
    this.form = this.getEmptyForm(type);
  }

  onTabChange(event: any) {
  const value = event.detail.value as ActivityFamiliaType;

  if (value === 'medicamento' && !this.tieneMedicamentosRegistrados()) {
    this.selectedTab = 'toma-leche';
    return;
  }

  this.selectedTab = value;
}

 onYearAccordionChange(type: ActivityFamiliaType, event: any) {
  const value = event.detail.value || [];
  const values = Array.isArray(value) ? value : [value];

  if (type === 'toma-leche') {
    this.openGroupsTomaLeche = values;
    return;
  }

  if (type === 'cambio-panal') {
    this.openGroupsCambioPanal = values;
    return;
  }

  if (type === 'medicamento') {
    this.openGroupsMedicamentos = values;
    return;
  }

  if (type === 'sueno') {
    this.openGroupsSuenos = values;
  }
}

  onMonthAccordionChange(type: ActivityFamiliaType, year: string, event: any) {
  event.stopPropagation();

  const value = event.detail.value || [];
  const values = Array.isArray(value) ? value : [value];

  if (type === 'toma-leche') {
    this.openMonthGroupsTomaLeche = {
      ...this.openMonthGroupsTomaLeche,
      [year]: values
    };
    return;
  }

  if (type === 'cambio-panal') {
    this.openMonthGroupsCambioPanal = {
      ...this.openMonthGroupsCambioPanal,
      [year]: values
    };
    return;
  }

  if (type === 'medicamento') {
    this.openMonthGroupsMedicamentos = {
      ...this.openMonthGroupsMedicamentos,
      [year]: values
    };
    return;
  }

  if (type === 'sueno') {
    this.openMonthGroupsSuenos = {
      ...this.openMonthGroupsSuenos,
      [year]: values
    };
  }
}

  onDateAccordionChange(
  type: ActivityFamiliaType,
  monthKey: string,
  event: any
) {
  event.stopPropagation();

  const value = event.detail.value || [];
  const values = Array.isArray(value) ? value : [value];

  if (type === 'toma-leche') {
    this.openDateGroupsTomaLeche = {
      ...this.openDateGroupsTomaLeche,
      [monthKey]: values
    };
    return;
  }

  if (type === 'cambio-panal') {
    this.openDateGroupsCambioPanal = {
      ...this.openDateGroupsCambioPanal,
      [monthKey]: values
    };
    return;
  }

  if (type === 'medicamento') {
    this.openDateGroupsMedicamentos = {
      ...this.openDateGroupsMedicamentos,
      [monthKey]: values
    };
    return;
  }

  if (type === 'sueno') {
    this.openDateGroupsSuenos = {
      ...this.openDateGroupsSuenos,
      [monthKey]: values
    };
  }
}

  getOpenMonthGroups(type: ActivityFamiliaType, year: string): string[] {
    if (type === 'toma-leche') {
      return this.openMonthGroupsTomaLeche[year] || [];
    }

    if (type === 'cambio-panal') {
      return this.openMonthGroupsCambioPanal[year] || [];
    }

     if (type === 'medicamento') {
    return this.openMonthGroupsMedicamentos[year] || [];
  }

  return this.openMonthGroupsSuenos[year] || [];
  }

  getOpenDateGroups(type: ActivityFamiliaType, monthKey: string): string[] {
    if (type === 'toma-leche') {
      return this.openDateGroupsTomaLeche[monthKey] || [];
    }

    if (type === 'cambio-panal') {
      return this.openDateGroupsCambioPanal[monthKey] || [];
    }

    if (type === 'medicamento') {
    return this.openDateGroupsMedicamentos[monthKey] || [];
  }

  return this.openDateGroupsSuenos[monthKey] || [];
  }

  getDefaultOpenGroups(type: ActivityFamiliaType): string[] {
    const currentYear = new Date().getFullYear().toString();

    const grupos = this.getGroupsByType(type);
    const grupoAnioActual = grupos.find(g => g.year === currentYear);

    return grupoAnioActual ? [grupoAnioActual.year] : [];
  }

  getDefaultOpenMonthGroupsByYear(type: ActivityFamiliaType): Record<string, string[]> {
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentMonthKey = `${currentYear}-${currentMonth}`;

    const grupos = this.getGroupsByType(type);

    const result: Record<string, string[]> = {};
    const grupoAnioActual = grupos.find(g => g.year === currentYear);

    if (!grupoAnioActual) {
      return result;
    }

    const existeMesActual = grupoAnioActual.months.some(
      mes => mes.monthKey === currentMonthKey
    );

    if (existeMesActual) {
      result[currentYear] = [currentMonthKey];
    }

    return result;
  }

  getDefaultOpenDateGroupsByMonth(
    type: ActivityFamiliaType
  ): Record<string, string[]> {
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentDay = String(new Date().getDate()).padStart(2, '0');

    const currentMonthKey = `${currentYear}-${currentMonth}`;
    const todayKey = `${currentYear}-${currentMonth}-${currentDay}`;

    const grupos = this.getGroupsByType(type);

    const result: Record<string, string[]> = {};
    const grupoAnioActual = grupos.find(g => g.year === currentYear);

    if (!grupoAnioActual) {
      return result;
    }

    const grupoMesActual = grupoAnioActual.months.find(
      mes => mes.monthKey === currentMonthKey
    );

    if (!grupoMesActual) {
      return result;
    }

    const existeHoy = grupoMesActual.dateGroups.some(
      fecha => fecha.fecha === todayKey
    );

    if (existeHoy) {
      result[currentMonthKey] = [todayKey];
    }

    return result;
  }

  private getGroupsByType(type: ActivityFamiliaType): ActivityYearGroup[] {
    if (type === 'toma-leche') {
      return this.groupedTomasLeche;
    }

    if (type === 'cambio-panal') {
      return this.groupedCambiosPanal;
    }

    if (type === 'medicamento') {
    return this.groupedMedicamentos;
  }

  return this.groupedSuenos;
  }

  getGroupedActivitiesByType(type: ActivityFamiliaType): ActivityYearGroup[] {
    const activitiesByType = this.filteredActivities.filter(a => a.type === type);

    const yearGroups = activitiesByType.reduce((acc, activity) => {
      const date = new Date(activity.time);
      const year = date.getFullYear().toString();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;

      if (!acc[year]) {
        acc[year] = {};
      }

      if (!acc[year][monthKey]) {
        acc[year][monthKey] = [];
      }

      acc[year][monthKey].push(activity);

      return acc;
    }, {} as Record<string, Record<string, ActivityFamilia[]>>);

    return Object.entries(yearGroups)
      .map(([year, months]) => ({
        year,
        months: Object.entries(months)
          .map(([monthKey, activities]) => {
            const sortedActivities = [...activities].sort((a, b) =>
              b.time.localeCompare(a.time)
            );

            return {
              monthKey,
              monthName: this.formatMonthName(monthKey),
              activities: sortedActivities,
              dateGroups: this.getActivitiesGroupedByDate(sortedActivities)
            };
          })
          .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      }))
      .sort((a, b) => b.year.localeCompare(a.year));
  }

  getActivitiesGroupedByDate(activities: ActivityFamilia[]): ActivityDateGroup[] {
    const groups = activities.reduce((acc, activity) => {
      const fecha = this.getDateKey(activity.time);

      if (!acc[fecha]) {
        acc[fecha] = [];
      }

      acc[fecha].push(activity);

      return acc;
    }, {} as Record<string, ActivityFamilia[]>);

    return Object.entries(groups)
      .map(([fecha, groupedActivities]) => ({
        fecha,
        activities: [...groupedActivities].sort((a, b) =>
          b.time.localeCompare(a.time)
        )
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  private formatMonthName(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);

    const monthName = date.toLocaleDateString('es-UY', {
      month: 'long'
    });

    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }

  formatDateGroup(fecha: string): string {
    const [year, month, day] = fecha.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const hoy = new Date();

    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    if (this.isSameDay(date, hoy)) {
      return 'Hoy';
    }

    if (this.isSameDay(date, ayer)) {
      return 'Ayer';
    }

    const fechaFormateada = date.toLocaleDateString('es-UY', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  }

  private getDateKey(value: string): string {
    const date = new Date(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private getLocalDateTimeForInput(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  abrirModalFiltros() {
    this.filtersDraft = this.clonarFiltros(this.filters);
    this.showModalFiltros = true;
  }

  cerrarModalFiltros() {
    this.showModalFiltros = false;
  }

  aplicarFiltrosDesdeModal() {
    this.filters = this.normalizarFiltros(this.filtersDraft);
    this.aplicarFiltros(true);
    this.cerrarModalFiltros();
  }

  limpiarFiltrosDesdeModal() {
    this.filtersDraft = this.getDefaultFilters();
  }

  limpiarFiltros() {
    this.filters = this.getDefaultFilters();
    this.filtersDraft = this.getDefaultFilters();
    this.aplicarFiltros(true);
  }

  getDefaultFilters(): ActivityFilters {
  return {
    rangoFecha: 'todos',
    fechaDesde: '',
    fechaHasta: '',
    horaDesde: '',
    horaHasta: '',

    tipoLeche: 'todas',
    onzasMin: null,
    onzasMax: null,

    tipoPanal: 'todos',

    medicamentoId: '',
    dosisGotasMin: null,
    dosisGotasMax: null,

    estadoSueno: 'todos',
    duracionSuenoMin: null,
    duracionSuenoMax: null
  };
}

  hayFiltrosActivos(): boolean {
    return JSON.stringify(this.filters) !== JSON.stringify(this.getDefaultFilters());
  }

  getCantidadFiltrosActivos(): number {
    return this.contarFiltrosActivos(this.filters);
  }

  getPreviewResumenFiltros(): ResumenFiltros {
    const filtros = this.normalizarFiltros(this.filtersDraft);
    const actividades = this.filtrarActividadesConFiltros(filtros);

    return this.obtenerResumenFiltros(actividades);
  }

  aplicarFiltros(resetAcordeones = true) {
    this.filteredActivities = this.filtrarActividadesConFiltros(this.filters)
      .sort((a, b) => b.time.localeCompare(a.time));

    this.groupedTomasLeche = this.getGroupedActivitiesByType('toma-leche');
    this.groupedCambiosPanal = this.getGroupedActivitiesByType('cambio-panal');
    this.groupedMedicamentos = this.getGroupedActivitiesByType('medicamento');
    this.groupedSuenos = this.getGroupedActivitiesByType('sueno');

    this.resumenFiltros = this.obtenerResumenFiltros(this.filteredActivities);

    if (resetAcordeones) {
      this.openGroupsTomaLeche = this.getDefaultOpenGroups('toma-leche');
      this.openGroupsCambioPanal = this.getDefaultOpenGroups('cambio-panal');
      this.openGroupsMedicamentos = this.getDefaultOpenGroups('medicamento');
      this.openGroupsSuenos = this.getDefaultOpenGroups('sueno');

      this.openMonthGroupsTomaLeche =
        this.getDefaultOpenMonthGroupsByYear('toma-leche');

      this.openMonthGroupsCambioPanal =
        this.getDefaultOpenMonthGroupsByYear('cambio-panal');

      this.openMonthGroupsMedicamentos =
        this.getDefaultOpenMonthGroupsByYear('medicamento');

        this.openMonthGroupsSuenos =
  this.getDefaultOpenMonthGroupsByYear('sueno');

      this.openDateGroupsTomaLeche =
        this.getDefaultOpenDateGroupsByMonth('toma-leche');

      this.openDateGroupsCambioPanal =
        this.getDefaultOpenDateGroupsByMonth('cambio-panal');

      this.openDateGroupsMedicamentos =
        this.getDefaultOpenDateGroupsByMonth('medicamento');

        this.openDateGroupsSuenos =
  this.getDefaultOpenDateGroupsByMonth('sueno');
    }
  }

  private filtrarActividadesConFiltros(filters: ActivityFilters): ActivityFamilia[] {
  const filtros = this.normalizarFiltros(filters);

  return this.activities
    .filter(activity => this.cumpleFiltroFecha(activity, filtros))
    .filter(activity => this.cumpleFiltroHora(activity, filtros))
    .filter(activity => this.cumpleFiltroTipoLeche(activity, filtros))
    .filter(activity => this.cumpleFiltroOnzas(activity, filtros))
    .filter(activity => this.cumpleFiltroTipoPanal(activity, filtros))
    .filter(activity => this.cumpleFiltroMedicamento(activity, filtros))
    .filter(activity => this.cumpleFiltroSueno(activity, filtros));
}

private cumpleFiltroMedicamento(
  activity: ActivityFamilia,
  filters: ActivityFilters
): boolean {
  if (activity.type !== 'medicamento') {
    return true;
  }

  const medicamento = activity as any;

  if (
    filters.medicamentoId &&
    medicamento.medicamentoId !== filters.medicamentoId
  ) {
    return false;
  }

  const dosisGotas = Number(medicamento.dosisGotas || 0);

  if (
    filters.dosisGotasMin !== null &&
    filters.dosisGotasMin !== undefined &&
    dosisGotas < Number(filters.dosisGotasMin)
  ) {
    return false;
  }

  if (
    filters.dosisGotasMax !== null &&
    filters.dosisGotasMax !== undefined &&
    dosisGotas > Number(filters.dosisGotasMax)
  ) {
    return false;
  }

  return true;
}

  private cumpleFiltroSueno(
  activity: ActivityFamilia,
  filters: ActivityFilters
): boolean {
  if (activity.type !== 'sueno') {
    return true;
  }

  const sueno = activity as any;

  if (filters.estadoSueno === 'en-curso' && sueno.fin) {
    return false;
  }

  if (filters.estadoSueno === 'finalizados' && !sueno.fin) {
    return false;
  }

  const duracion = Number(sueno.duracionMinutos || 0);

  if (
    filters.duracionSuenoMin !== null &&
    filters.duracionSuenoMin !== undefined &&
    duracion < filters.duracionSuenoMin
  ) {
    return false;
  }

  if (
    filters.duracionSuenoMax !== null &&
    filters.duracionSuenoMax !== undefined &&
    duracion > filters.duracionSuenoMax
  ) {
    return false;
  }

  return true;
}

  private cumpleFiltroFecha(
    activity: ActivityFamilia,
    filters: ActivityFilters
  ): boolean {
    if (filters.rangoFecha === 'todos') {
      return true;
    }

    const fechaActividad = new Date(activity.time);
    fechaActividad.setHours(0, 0, 0, 0);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (filters.rangoFecha === 'hoy') {
      return this.isSameDay(fechaActividad, hoy);
    }

    if (filters.rangoFecha === 'ayer') {
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);

      return this.isSameDay(fechaActividad, ayer);
    }

    if (filters.rangoFecha === '7dias') {
      const fechaInicio = new Date(hoy);
      fechaInicio.setDate(fechaInicio.getDate() - 6);

      return fechaActividad >= fechaInicio && fechaActividad <= hoy;
    }

    if (filters.rangoFecha === '30dias') {
      const fechaInicio = new Date(hoy);
      fechaInicio.setDate(fechaInicio.getDate() - 29);

      return fechaActividad >= fechaInicio && fechaActividad <= hoy;
    }

    if (filters.rangoFecha === 'personalizado') {
      if (filters.fechaDesde) {
        const desde = this.getDateFromInput(filters.fechaDesde);

        if (fechaActividad < desde) {
          return false;
        }
      }

      if (filters.fechaHasta) {
        const hasta = this.getDateFromInput(filters.fechaHasta);

        if (fechaActividad > hasta) {
          return false;
        }
      }
    }

    return true;
  }

  private cumpleFiltroHora(
    activity: ActivityFamilia,
    filters: ActivityFilters
  ): boolean {
    if (!filters.horaDesde && !filters.horaHasta) {
      return true;
    }

    const fechaActividad = new Date(activity.time);

    const horaActividad =
      `${String(fechaActividad.getHours()).padStart(2, '0')}:${String(fechaActividad.getMinutes()).padStart(2, '0')}`;

    if (filters.horaDesde && horaActividad < filters.horaDesde) {
      return false;
    }

    if (filters.horaHasta && horaActividad > filters.horaHasta) {
      return false;
    }

    return true;
  }

  private cumpleFiltroTipoLeche(
    activity: ActivityFamilia,
    filters: ActivityFilters
  ): boolean {
    if (activity.type !== 'toma-leche') {
      return true;
    }

    if (filters.tipoLeche === 'todas') {
      return true;
    }

    const esMaterna = !!(activity as any).esLecheMaterna;

    if (filters.tipoLeche === 'materna') {
      return esMaterna;
    }

    if (filters.tipoLeche === 'formula') {
      return !esMaterna;
    }

    return true;
  }

  private cumpleFiltroOnzas(
    activity: ActivityFamilia,
    filters: ActivityFilters
  ): boolean {
    if (activity.type !== 'toma-leche') {
      return true;
    }

    const cantidadOnzas = Number((activity as any).cantidadOnzas || 0);

    if (
      filters.onzasMin !== null &&
      filters.onzasMin !== undefined &&
      cantidadOnzas < Number(filters.onzasMin)
    ) {
      return false;
    }

    if (
      filters.onzasMax !== null &&
      filters.onzasMax !== undefined &&
      cantidadOnzas > Number(filters.onzasMax)
    ) {
      return false;
    }

    return true;
  }

  private cumpleFiltroTipoPanal(
    activity: ActivityFamilia,
    filters: ActivityFilters
  ): boolean {
    if (activity.type !== 'cambio-panal') {
      return true;
    }

    if (filters.tipoPanal === 'todos') {
      return true;
    }

    const tieneHeces = !!(activity as any).tieneHeces;

    if (filters.tipoPanal === 'popo') {
      return tieneHeces;
    }

    if (filters.tipoPanal === 'pipi') {
      return !tieneHeces;
    }

    return true;
  }

  private getDateFromInput(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);

    return date;
  }

  private clonarFiltros(filters: ActivityFilters): ActivityFilters {
    return {
      ...filters
    };
  }

  private normalizarFiltros(filters: ActivityFilters): ActivityFilters {
    const filtrosNormalizados = this.clonarFiltros(filters);

    if (filtrosNormalizados.rangoFecha !== 'personalizado') {
      filtrosNormalizados.fechaDesde = '';
      filtrosNormalizados.fechaHasta = '';
    }

    const onzasMin = filtrosNormalizados.onzasMin as any;
    const onzasMax = filtrosNormalizados.onzasMax as any;

    filtrosNormalizados.onzasMin =
      onzasMin !== null && onzasMin !== undefined && onzasMin !== ''
        ? Number(onzasMin)
        : null;

    filtrosNormalizados.onzasMax =
      onzasMax !== null && onzasMax !== undefined && onzasMax !== ''
        ? Number(onzasMax)
        : null;

        filtrosNormalizados.onzasMin =
    filtrosNormalizados.onzasMin !== null &&
    filtrosNormalizados.onzasMin !== undefined &&
    filtrosNormalizados.onzasMin !== ('' as any)
      ? Number(filtrosNormalizados.onzasMin)
      : null;

  filtrosNormalizados.onzasMax =
    filtrosNormalizados.onzasMax !== null &&
    filtrosNormalizados.onzasMax !== undefined &&
    filtrosNormalizados.onzasMax !== ('' as any)
      ? Number(filtrosNormalizados.onzasMax)
      : null;

  filtrosNormalizados.dosisGotasMin =
    filtrosNormalizados.dosisGotasMin !== null &&
    filtrosNormalizados.dosisGotasMin !== undefined &&
    filtrosNormalizados.dosisGotasMin !== ('' as any)
      ? Number(filtrosNormalizados.dosisGotasMin)
      : null;

  filtrosNormalizados.dosisGotasMax =
    filtrosNormalizados.dosisGotasMax !== null &&
    filtrosNormalizados.dosisGotasMax !== undefined &&
    filtrosNormalizados.dosisGotasMax !== ('' as any)
      ? Number(filtrosNormalizados.dosisGotasMax)
      : null;

  filtrosNormalizados.duracionSuenoMin =
    filtrosNormalizados.duracionSuenoMin !== null &&
    filtrosNormalizados.duracionSuenoMin !== undefined &&
    filtrosNormalizados.duracionSuenoMin !== ('' as any)
      ? Number(filtrosNormalizados.duracionSuenoMin)
      : null;

  filtrosNormalizados.duracionSuenoMax =
    filtrosNormalizados.duracionSuenoMax !== null &&
    filtrosNormalizados.duracionSuenoMax !== undefined &&
    filtrosNormalizados.duracionSuenoMax !== ('' as any)
      ? Number(filtrosNormalizados.duracionSuenoMax)
      : null;

    return filtrosNormalizados;
  }

  private obtenerResumenFiltros(activities: ActivityFamilia[]): ResumenFiltros {
    return {
      total: activities.length,
      tomas: activities.filter(a => a.type === 'toma-leche').length,
      panales: activities.filter(a => a.type === 'cambio-panal').length,
      medicamentos: activities.filter(a => a.type === 'medicamento').length,
      suenos: activities.filter(a => a.type === 'sueno').length
    };
  }

  private contarFiltrosActivos(filters: ActivityFilters): number {
    let cantidad = 0;

    if (filters.rangoFecha !== 'todos') {
      cantidad++;
    }

    if (filters.horaDesde || filters.horaHasta) {
      cantidad++;
    }

    if (filters.tipoLeche !== 'todas') {
      cantidad++;
    }

    if (filters.onzasMin !== null && filters.onzasMin !== undefined) {
      cantidad++;
    }

    if (filters.onzasMax !== null && filters.onzasMax !== undefined) {
      cantidad++;
    }

    if (filters.tipoPanal !== 'todos') {
      cantidad++;
    }

    if (filters.estadoSueno !== 'todos') {
  cantidad++;
}

if (filters.duracionSuenoMin !== null && filters.duracionSuenoMin !== undefined) {
  cantidad++;
}

if (filters.duracionSuenoMax !== null && filters.duracionSuenoMax !== undefined) {
  cantidad++;
}

    return cantidad;
  }

  abrirModalEstadisticas() {
    this.calcularEstadisticas();
    this.showModalEstadisticas = true;
  }

  cerrarModalEstadisticas() {
    this.showModalEstadisticas = false;
  }

  private calcularEstadisticas() {
    const fechaFin = new Date();
    fechaFin.setHours(0, 0, 0, 0);

    const fechaInicio = new Date(fechaFin);
    fechaInicio.setDate(fechaInicio.getDate() - 30);

    const actividadesUltimoMes = this.activities.filter(activity => {
      const fechaActividad = new Date(activity.time);
      return fechaActividad >= fechaInicio && fechaActividad < fechaFin;
    });

    const tomas = actividadesUltimoMes.filter(a => a.type === 'toma-leche');
    const panales = actividadesUltimoMes.filter(a => a.type === 'cambio-panal');
    const medicamentos = actividadesUltimoMes.filter(a => a.type === 'medicamento');

    const totalOnzas = tomas.reduce((total, toma) => {
      return total + Number((toma as any).cantidadOnzas || 0);
    }, 0);

    const totalFormula = tomas
      .filter(toma => !(toma as any).esLecheMaterna)
      .reduce((total, toma) => {
        return total + Number((toma as any).cantidadOnzas || 0);
      }, 0);

    const totalMaterna = tomas
      .filter(toma => (toma as any).esLecheMaterna)
      .reduce((total, toma) => {
        return total + Number((toma as any).cantidadOnzas || 0);
      }, 0);

    const totalPopo = panales
      .filter(panal => (panal as any).tieneHeces)
      .length;

    const totalPipi = panales
      .filter(panal => !(panal as any).tieneHeces)
      .length;

    const diasConActividad =
      this.obtenerCantidadDiasConActividad(actividadesUltimoMes);

    const diasParaPromedio = diasConActividad > 0
      ? diasConActividad
      : 1;

      const suenos = actividadesUltimoMes.filter(a => a.type === 'sueno');

const suenosFinalizados = suenos.filter(sueno => !!(sueno as any).fin);
const suenosEnCurso = suenos.filter(sueno => !(sueno as any).fin).length;

const totalMinutosSueno = suenosFinalizados.reduce((total, sueno) => {
  return total + Number((sueno as any).duracionMinutos || 0);
}, 0);

const promedioSuenoMinutos = suenosFinalizados.length > 0
  ? Math.round(totalMinutosSueno / suenosFinalizados.length)
  : 0;

const suenoMasLargoMinutos = suenosFinalizados.reduce((max, sueno) => {
  return Math.max(max, Number((sueno as any).duracionMinutos || 0));
}, 0);

    this.estadisticas = {
      promedioOnzasPorDia: Number((totalOnzas / diasParaPromedio).toFixed(1)),
      totalFormula: Number(totalFormula.toFixed(1)),
      totalMaterna: Number(totalMaterna.toFixed(1)),
      totalTomas: tomas.length,
      totalPanales: panales.length,
      totalPopo,
      totalPipi,
      totalMedicamentos: medicamentos.length,
      promedioPanalesPorDia: Number((panales.length / diasParaPromedio).toFixed(1)),
      totalSuenos: suenos.length,
totalMinutosSueno,
totalSuenoTexto: this.formatearDuracion(totalMinutosSueno),
promedioSuenoTexto: this.formatearDuracion(promedioSuenoMinutos),
suenoMasLargoTexto: this.formatearDuracion(suenoMasLargoMinutos),
suenosEnCurso
    };
  }

  private obtenerCantidadDiasConActividad(activities: ActivityFamilia[]): number {
    const dias = new Set<string>();

    activities.forEach(activity => {
      const date = new Date(activity.time);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      dias.add(`${year}-${month}-${day}`);
    });

    return dias.size;
  }

  getActivityTitle(activity: ActivityFamilia): string {
    if (activity.type === 'toma-leche') {
      return 'Toma de leche';
    }

    if (activity.type === 'cambio-panal') {
      return (activity as any).tieneHeces
        ? 'Cambio de pañal con popó'
        : 'Cambio de pañal';
    }

    if (activity.type === 'medicamento') {
      return 'Medicamento';
    }

    return 'Actividad';
  }

  getActivityDescription(activity: ActivityFamilia): string {
    if (activity.type === 'toma-leche') {
      const cantidad = Number((activity as any).cantidadOnzas || 0);
      const tipo = (activity as any).esLecheMaterna ? 'Materna' : 'Fórmula';

      return `${cantidad} oz · ${tipo}`;
    }

    if (activity.type === 'cambio-panal') {
      return (activity as any).tieneHeces ? 'Con popó' : 'Solo pipí';
    }

    if (activity.type === 'medicamento') {
      const nombre = (activity as any).nombreMedicamento || 'Medicamento';
      const gotas = Number((activity as any).dosisGotas || 0);
      const observaciones = (activity as any).observaciones || '';

      return observaciones
        ? `${nombre} · ${gotas} gotas · ${observaciones}`
        : `${nombre} · ${gotas} gotas`;
    }

    return '';
  }

  getActivityIcon(activity: ActivityFamilia): string {
    if (activity.type === 'toma-leche') {
      return 'water';
    }

    if (activity.type === 'cambio-panal') {
      return 'leaf';
    }

    if (activity.type === 'medicamento') {
      return 'medical';
    }

    return 'checkmark-circle';
  }

  trackByYear(index: number, grupoAnio: ActivityYearGroup): string {
    return grupoAnio.year;
  }

  trackByMonth(index: number, grupoMes: ActivityMonthGroup): string {
    return grupoMes.monthKey;
  }

  trackByDate(index: number, grupoFecha: ActivityDateGroup): string {
    return grupoFecha.fecha;
  }

  trackByActivity(index: number, activity: ActivityFamilia): string {
    return activity.id;
  }

  tieneMedicamentosRegistrados(): boolean {
    return this.medicamentosDisponibles && this.medicamentosDisponibles.length > 0;
  }

  async finalizarSuenoDesdeListado(activity: ActivityFamilia) {
  try {
    await this.activityFamiliaService.finalizarSueno(activity.id, new Date());
    await this.loadActivities();
  } catch (error: any) {
    const alert = await this.alertController.create({
      header: 'No se pudo finalizar',
      message: error?.message || 'No se pudo finalizar el sueño.',
      buttons: ['Aceptar']
    });

    await alert.present();
  }
}

formatearDuracion(minutos: number): string {
  minutos = Number(minutos || 0);

  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;

  if (horas <= 0) {
    return `${mins} min`;
  }

  if (mins <= 0) {
    return `${horas} h`;
  }

  return `${horas} h ${mins} min`;
}
}