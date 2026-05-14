import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonDatetimeButton
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
  timeOutline
} from 'ionicons/icons';

import { ActivityFamiliaService } from '../services/activity-familia.service';
import {
  ActivityFamilia,
  ActivityFamiliaType
} from '../models/activity-familia.model';

import { NotificacionTomasService } from '../services/notificacion-tomas.service';

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
}

interface ResumenFiltros {
  total: number;
  tomas: number;
  panales: number;
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
    IonDatetimeButton
  ]
})
export class Tab2Page implements OnInit {
  activities: ActivityFamilia[] = [];
  filteredActivities: ActivityFamilia[] = [];

  loading = false;
  primeraCarga = true;

  selectedTab: 'toma-leche' | 'cambio-panal' = 'toma-leche';

  groupedTomasLeche: ActivityYearGroup[] = [];
  groupedCambiosPanal: ActivityYearGroup[] = [];

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
    panales: 0
  };

  openGroupsTomaLeche: string[] = [];
  openGroupsCambioPanal: string[] = [];

  openMonthGroupsTomaLeche: Record<string, string[]> = {};
  openMonthGroupsCambioPanal: Record<string, string[]> = {};

  openDateGroupsTomaLeche: Record<string, string[]> = {};
  openDateGroupsCambioPanal: Record<string, string[]> = {};

  estadisticas = {
    promedioOnzasPorDia: 0,
    totalFormula: 0,
    totalMaterna: 0,
    totalTomas: 0,
    totalPanales: 0,
    totalPopo: 0,
    totalPipi: 0,
    promedioPanalesPorDia: 0
  };

  constructor(
    private activityFamiliaService: ActivityFamiliaService,
    private alertController: AlertController,
    private notificacionTomasService: NotificacionTomasService
  ) {
    addIcons({
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
      timeOutline
    });
  }

  async ngOnInit() {
    await this.loadActivities();
  }

  async ionViewWillEnter() {
    await this.loadActivities();
  }

  async loadActivities() {
    if (this.primeraCarga) {
      this.loading = true;
    }

    try {
      const gruposTomaActuales = [...this.openGroupsTomaLeche];
      const gruposPanalActuales = [...this.openGroupsCambioPanal];

      const mesesTomaActuales = { ...this.openMonthGroupsTomaLeche };
      const mesesPanalActuales = { ...this.openMonthGroupsCambioPanal };

      const fechasTomaActuales = { ...this.openDateGroupsTomaLeche };
      const fechasPanalActuales = { ...this.openDateGroupsCambioPanal };

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

      this.openMonthGroupsTomaLeche = Object.keys(mesesTomaActuales).length
        ? mesesTomaActuales
        : this.getDefaultOpenMonthGroupsByYear('toma-leche');

      this.openMonthGroupsCambioPanal = Object.keys(mesesPanalActuales).length
        ? mesesPanalActuales
        : this.getDefaultOpenMonthGroupsByYear('cambio-panal');

      this.openDateGroupsTomaLeche = Object.keys(fechasTomaActuales).length
        ? fechasTomaActuales
        : this.getDefaultOpenDateGroupsByMonth('toma-leche');

      this.openDateGroupsCambioPanal = Object.keys(fechasPanalActuales).length
        ? fechasPanalActuales
        : this.getDefaultOpenDateGroupsByMonth('cambio-panal');

      await this.notificacionTomasService.programarNotificacionProximaToma(
        this.activities
      );
    } catch (error: any) {
      console.error('Error cargando actividades', error);

      this.activities = [];
      this.filteredActivities = [];
      this.groupedTomasLeche = [];
      this.groupedCambiosPanal = [];

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

    this.openDateGroupsCambioPanal = {
      ...this.openDateGroupsCambioPanal,
      [monthKey]: values
    };
  }

  getOpenDateGroups(type: ActivityFamiliaType, monthKey: string): string[] {
    if (type === 'toma-leche') {
      return this.openDateGroupsTomaLeche[monthKey] || [];
    }

    return this.openDateGroupsCambioPanal[monthKey] || [];
  }

  getDefaultOpenDateGroupsByMonth(
    type: ActivityFamiliaType
  ): Record<string, string[]> {
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentDay = String(new Date().getDate()).padStart(2, '0');

    const currentMonthKey = `${currentYear}-${currentMonth}`;
    const todayKey = `${currentYear}-${currentMonth}-${currentDay}`;

    const grupos = type === 'toma-leche'
      ? this.groupedTomasLeche
      : this.groupedCambiosPanal;

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

    return {
      ...base,
      tieneHeces: false
    };
  }

  openAddModal() {
    this.isEdit = false;
    this.formType = 'toma-leche';
    this.form = this.getEmptyForm('toma-leche');
    this.showModal = true;
  }

  openEditModal(activity: ActivityFamilia) {
    this.isEdit = true;
    this.formType = activity.type;
    this.form = { ...activity };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onModalDismiss() {
    this.showModal = false;
  }

  async saveActivity() {
    try {
      if (!this.form.id) {
        this.form.id = '';
        this.form.createdAt = new Date().toISOString();

        await this.activityFamiliaService.add(this.form);
      } else {
        this.form.updatedAt = new Date().toISOString();

        await this.activityFamiliaService.update(this.form);
      }

      this.closeModal();
      await this.loadActivities();
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
    this.selectedTab = event.detail.value as 'toma-leche' | 'cambio-panal';
  }

  onYearAccordionChange(type: ActivityFamiliaType, event: any) {
    const value = event.detail.value || [];
    const values = Array.isArray(value) ? value : [value];

    if (type === 'toma-leche') {
      this.openGroupsTomaLeche = values;
      return;
    }

    this.openGroupsCambioPanal = values;
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

    this.openMonthGroupsCambioPanal = {
      ...this.openMonthGroupsCambioPanal,
      [year]: values
    };
  }

  getOpenMonthGroups(type: ActivityFamiliaType, year: string): string[] {
    if (type === 'toma-leche') {
      return this.openMonthGroupsTomaLeche[year] || [];
    }

    return this.openMonthGroupsCambioPanal[year] || [];
  }

  getDefaultOpenGroups(type: ActivityFamiliaType): string[] {
    const currentYear = new Date().getFullYear().toString();

    const grupos = type === 'toma-leche'
      ? this.groupedTomasLeche
      : this.groupedCambiosPanal;

    const grupoAnioActual = grupos.find(g => g.year === currentYear);

    return grupoAnioActual ? [grupoAnioActual.year] : [];
  }

  getDefaultOpenMonthGroupsByYear(type: ActivityFamiliaType): Record<string, string[]> {
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentMonthKey = `${currentYear}-${currentMonth}`;

    const grupos = type === 'toma-leche'
      ? this.groupedTomasLeche
      : this.groupedCambiosPanal;

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
      tipoPanal: 'todos'
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

    this.resumenFiltros = this.obtenerResumenFiltros(this.filteredActivities);

    if (resetAcordeones) {
      this.openGroupsTomaLeche = this.getDefaultOpenGroups('toma-leche');
      this.openGroupsCambioPanal = this.getDefaultOpenGroups('cambio-panal');

      this.openMonthGroupsTomaLeche =
        this.getDefaultOpenMonthGroupsByYear('toma-leche');

      this.openMonthGroupsCambioPanal =
        this.getDefaultOpenMonthGroupsByYear('cambio-panal');

      this.openDateGroupsTomaLeche =
        this.getDefaultOpenDateGroupsByMonth('toma-leche');

      this.openDateGroupsCambioPanal =
        this.getDefaultOpenDateGroupsByMonth('cambio-panal');
    }
  }

  private filtrarActividadesConFiltros(filters: ActivityFilters): ActivityFamilia[] {
    const filtros = this.normalizarFiltros(filters);

    return this.activities
      .filter(activity => this.cumpleFiltroFecha(activity, filtros))
      .filter(activity => this.cumpleFiltroHora(activity, filtros))
      .filter(activity => this.cumpleFiltroTipoLeche(activity, filtros))
      .filter(activity => this.cumpleFiltroOnzas(activity, filtros))
      .filter(activity => this.cumpleFiltroTipoPanal(activity, filtros));
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

    return filtrosNormalizados;
  }

  private obtenerResumenFiltros(activities: ActivityFamilia[]): ResumenFiltros {
    return {
      total: activities.length,
      tomas: activities.filter(a => a.type === 'toma-leche').length,
      panales: activities.filter(a => a.type === 'cambio-panal').length
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

    this.estadisticas = {
      promedioOnzasPorDia: Number((totalOnzas / diasParaPromedio).toFixed(1)),
      totalFormula: Number(totalFormula.toFixed(1)),
      totalMaterna: Number(totalMaterna.toFixed(1)),
      totalTomas: tomas.length,
      totalPanales: panales.length,
      totalPopo,
      totalPipi,
      promedioPanalesPorDia: Number((panales.length / diasParaPromedio).toFixed(1))
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
}