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
  IonCardContent
} from '@ionic/angular/standalone';

import { ActivityService } from '../services/activity.service';
import { Activity, ActivityType } from '../models/activity.model';
import { NotificacionTomasService } from '../services/notificacion-tomas.service';

interface ActivityDateGroup {
  fecha: string;
  activities: Activity[];
}

interface ActivityMonthGroup {
  monthKey: string;
  monthName: string;
  activities: Activity[];
  dateGroups: ActivityDateGroup[];
}

interface ActivityYearGroup {
  year: string;
  months: ActivityMonthGroup[];
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
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
    IonCardContent
  ]
})
export class Tab2Page implements OnInit {
  activities: Activity[] = [];
  loading = false;

  selectedTab: 'toma-leche' | 'cambio-panal' = 'toma-leche';

  groupedTomasLeche: ActivityYearGroup[] = [];
  groupedCambiosPanal: ActivityYearGroup[] = [];

  showModal = false;
  isEdit = false;
  formType: ActivityType = 'toma-leche';
  form: any = this.getEmptyForm('toma-leche');

  openGroupsTomaLeche: string[] = [];
  openGroupsCambioPanal: string[] = [];

  openMonthGroupsTomaLeche: Record<string, string[]> = {};
  openMonthGroupsCambioPanal: Record<string, string[]> = {};

  showModalEstadisticas = false;

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
    private activityService: ActivityService,
    private alertController: AlertController,
    private notificacionTomasService: NotificacionTomasService
  ) {}

  async ngOnInit() {
    await this.loadActivities();
  }

  async ionViewWillEnter() {
    await this.loadActivities();
  }

  async loadActivities() {
    this.loading = true;

    const gruposTomaActuales = [...this.openGroupsTomaLeche];
    const gruposPanalActuales = [...this.openGroupsCambioPanal];

    const mesesTomaActuales = { ...this.openMonthGroupsTomaLeche };
    const mesesPanalActuales = { ...this.openMonthGroupsCambioPanal };

    this.activities = (await this.activityService.getAll())
      .sort((a, b) => b.time.localeCompare(a.time));

    this.groupedTomasLeche = this.getGroupedActivitiesByType('toma-leche');
    this.groupedCambiosPanal = this.getGroupedActivitiesByType('cambio-panal');

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

    await this.notificacionTomasService.programarNotificacionProximaToma(
      this.activities
    );

    this.loading = false;
  }

  getEmptyForm(type: ActivityType) {
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

  openEditModal(activity: Activity) {
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
    if (!this.form.id) {
      this.form.id = Date.now().toString();
      this.form.createdAt = new Date().toISOString();

      await this.activityService.add(this.form);
    } else {
      this.form.updatedAt = new Date().toISOString();

      await this.activityService.update(this.form);
    }

    this.closeModal();
    await this.loadActivities();
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
            await this.activityService.delete(id);
            await this.loadActivities();
          }
        }
      ]
    });

    await alert.present();
  }

  onTypeChange(type: ActivityType) {
    this.formType = type;
    this.form = this.getEmptyForm(type);
  }

  onTabChange(event: any) {
    this.selectedTab = event.detail.value as 'toma-leche' | 'cambio-panal';
  }

  onYearAccordionChange(type: ActivityType, event: any) {
    const value = event.detail.value || [];
    const values = Array.isArray(value) ? value : [value];

    if (type === 'toma-leche') {
      this.openGroupsTomaLeche = values;
      return;
    }

    this.openGroupsCambioPanal = values;
  }

  onMonthAccordionChange(type: ActivityType, year: string, event: any) {
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

  getOpenMonthGroups(type: ActivityType, year: string): string[] {
    if (type === 'toma-leche') {
      return this.openMonthGroupsTomaLeche[year] || [];
    }

    return this.openMonthGroupsCambioPanal[year] || [];
  }

  getDefaultOpenGroups(type: ActivityType): string[] {
    const currentYear = new Date().getFullYear().toString();

    const grupos = type === 'toma-leche'
      ? this.groupedTomasLeche
      : this.groupedCambiosPanal;

    const grupoAnioActual = grupos.find(g => g.year === currentYear);

    return grupoAnioActual ? [grupoAnioActual.year] : [];
  }

  getDefaultOpenMonthGroupsByYear(type: ActivityType): Record<string, string[]> {
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

  getGroupedActivitiesByType(type: ActivityType): ActivityYearGroup[] {
    const activitiesByType = this.activities.filter(a => a.type === type);

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
    }, {} as Record<string, Record<string, Activity[]>>);

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

  getActivitiesGroupedByDate(activities: Activity[]): ActivityDateGroup[] {
    const groups = activities.reduce((acc, activity) => {
      const fecha = this.getDateKey(activity.time);

      if (!acc[fecha]) {
        acc[fecha] = [];
      }

      acc[fecha].push(activity);

      return acc;
    }, {} as Record<string, Activity[]>);

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

  abrirModalEstadisticas() {
    this.calcularEstadisticas();
    this.showModalEstadisticas = true;
  }

  cerrarModalEstadisticas() {
    this.showModalEstadisticas = false;
  }

  private calcularEstadisticas() {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);

    const actividadesUltimoMes = this.activities.filter(activity => {
      const fechaActividad = new Date(activity.time);
      return fechaActividad >= fechaLimite;
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

  private obtenerCantidadDiasConActividad(activities: Activity[]): number {
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

  trackByActivity(index: number, activity: Activity): string {
    return activity.id;
  }
}