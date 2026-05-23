import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  leaf,
  leafOutline,
  medical,
  medicalOutline,
  moon,
  moonOutline,
  statsChartOutline,
  water,
  waterOutline
} from 'ionicons/icons';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import {
  ActivityFamilia,
  CambioPanalFamiliaActivity,
  SuenoFamiliaActivity,
  TomaLecheFamiliaActivity
} from '../../models/activity-familia.model';
import { ActivityFamiliaService } from '../../services/activity-familia.service';
import { BebeFamiliaService } from '../../services/bebe-familia.service';

interface LecheDia {
  label: string;
  materna: number;
  formula: number;
  total: number;
}

interface SuenoDia {
  label: string;
  dia: number;
  noche: number;
}

interface MedicamentoDia {
  label: string;
  medicamentos: Record<string, number>;
}

interface DistribucionActividad {
  label: string;
  value: number;
  color: string;
}

Chart.register(...registerables);

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonProgressBar,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonText
  ],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss']
})
export class EstadisticasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('distribucionChart') distribucionCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('lecheChart') lecheCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('panalesChart') panalesCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('suenoChart') suenoCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('medicamentosChart') medicamentosCanvas?: ElementRef<HTMLCanvasElement>;

  private activityFamiliaService = inject(ActivityFamiliaService);
  private bebeFamiliaService = inject(BebeFamiliaService);
  private charts: Chart[] = [];
  private viewReady = false;

  segmento = 'resumen';
  nombreBebe = 'Carlitos';
  cargando = true;
  mensajeError = '';
  activities: ActivityFamilia[] = [];

  resumenDiario = {
    lecheHoy: { actual: 0, objetivo: 24 },
    panalesHoy: 0,
    medicamentosHoy: 0,
    suenoHoy: 0
  };

  lecheUltimos7: LecheDia[] = [];
  suenoUltimos7: SuenoDia[] = [];
  medicamentosUltimos7: MedicamentoDia[] = [];
  panalesUltimos7 = { limpios: 0, conHeces: 0, total: 0 };
  distribucionActividades: DistribucionActividad[] = [];

  ngOnInit() {
    addIcons({
      water,
      waterOutline,
      leaf,
      leafOutline,
      medical,
      medicalOutline,
      moon,
      moonOutline,
      statsChartOutline
    });
    void this.cargarDatos();
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.renderizarGraficasActivas();
  }

  ngOnDestroy() {
    this.destruirGraficas();
  }

  async cargarDatos() {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const [activities, configuracion] = await Promise.all([
        this.activityFamiliaService.getAll(),
        this.bebeFamiliaService.obtenerConfiguracionBebeActivo()
      ]);

      this.activities = activities;
      this.nombreBebe = configuracion.nombre || 'Carlitos';
      this.resumenDiario.lecheHoy.objetivo = Number(configuracion.onzasDiariasObjetivo || 24);

      this.calcularResumenDiario();
      this.prepararGraficas();
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      this.mensajeError = 'No pudimos cargar las estadísticas. Intenta nuevamente.';
    } finally {
      this.cargando = false;
      this.renderizarGraficasActivas();
    }
  }

  onSegmentoChange() {
    this.renderizarGraficasActivas();
  }

  getPorcentajeLecheHoy(): number {
    const objetivo = Number(this.resumenDiario.lecheHoy.objetivo || 0);

    if (objetivo <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((this.resumenDiario.lecheHoy.actual / objetivo) * 100));
  }

  getProgresoLecheHoy(): number {
    return this.getPorcentajeLecheHoy() / 100;
  }

  formatearSueno(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    return `${horas}h ${mins}m`;
  }

  private renderizarGraficasActivas() {
    if (!this.viewReady || this.cargando || this.mensajeError) {
      return;
    }

    window.setTimeout(() => {
      this.destruirGraficas();

      if (this.segmento === 'resumen' && this.distribucionCanvas) {
        this.crearChart(this.distribucionCanvas, this.getDistribucionConfig());
      }

      if (this.segmento === 'leche' && this.lecheCanvas) {
        this.crearChart(this.lecheCanvas, this.getLecheConfig());
      }

      if (this.segmento === 'panales' && this.panalesCanvas) {
        this.crearChart(this.panalesCanvas, this.getPanalesConfig());
      }

      if (this.segmento === 'sueno' && this.suenoCanvas) {
        this.crearChart(this.suenoCanvas, this.getSuenoConfig());
      }

      if (this.segmento === 'medicamentos' && this.medicamentosCanvas) {
        this.crearChart(this.medicamentosCanvas, this.getMedicamentosConfig());
      }
    });
  }

  private crearChart(canvas: ElementRef<HTMLCanvasElement>, config: ChartConfiguration) {
    this.charts.push(new Chart(canvas.nativeElement, config));
  }

  private destruirGraficas() {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  private getBaseOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            color: '#475467',
            font: { weight: 700 }
          }
        },
        tooltip: {
          backgroundColor: '#111827',
          padding: 12,
          cornerRadius: 12,
          titleFont: { weight: 800 },
          bodyFont: { weight: 600 }
        }
      }
    };
  }

  private getLecheConfig(): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels: this.lecheUltimos7.map(dia => dia.label),
        datasets: [
          {
            label: 'Materna',
            data: this.lecheUltimos7.map(dia => dia.materna),
            backgroundColor: '#ff8fa3',
            borderRadius: 4,
            borderSkipped: false,
            categoryPercentage: 0.72,
            barPercentage: 0.78
          },
          {
            label: 'Fórmula',
            data: this.lecheUltimos7.map(dia => dia.formula),
            backgroundColor: '#6c63ff',
            borderRadius: 4,
            borderSkipped: false,
            categoryPercentage: 0.72,
            barPercentage: 0.78
          }
        ]
      },
      options: {
        ...this.getBaseOptions(),
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#667085', font: { weight: 700 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(102, 112, 133, 0.14)' },
            ticks: { color: '#667085' }
          }
        }
      }
    };
  }

  private getSuenoConfig(): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels: this.suenoUltimos7.map(dia => dia.label),
        datasets: [
          {
            label: 'Día',
            data: this.suenoUltimos7.map(dia => dia.dia),
            backgroundColor: '#8aadff',
            borderRadius: 4,
            borderSkipped: false,
            stack: 'sueno'
          },
          {
            label: 'Noche',
            data: this.suenoUltimos7.map(dia => dia.noche),
            backgroundColor: '#1048c2',
            borderRadius: 4,
            borderSkipped: false,
            stack: 'sueno'
          }
        ]
      },
      options: {
        ...this.getBaseOptions(),
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#667085', font: { weight: 700 } }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: 'rgba(102, 112, 133, 0.14)' },
            ticks: { color: '#667085' }
          }
        }
      }
    };
  }

  private getPanalesConfig(): ChartConfiguration<'doughnut'> {
    return {
      type: 'doughnut',
      data: {
        labels: ['Sin heces', 'Con heces'],
        datasets: [
          {
            data: [this.panalesUltimos7.limpios, this.panalesUltimos7.conHeces],
            backgroundColor: ['#7ed6a5', '#ffd97d'],
            borderColor: '#ffffff',
            borderWidth: 4,
            hoverOffset: 8
          }
        ]
      },
      options: {
        ...this.getBaseOptions(),
        cutout: '64%'
      }
    };
  }

  private getMedicamentosConfig(): ChartConfiguration<'bar'> {
    const nombresMedicamentos = this.obtenerNombresMedicamentosUltimos7();

    return {
      type: 'bar',
      data: {
        labels: this.medicamentosUltimos7.map(dia => dia.label),
        datasets: nombresMedicamentos.map((nombre, index) => ({
          label: nombre,
          data: this.medicamentosUltimos7.map(dia => dia.medicamentos[nombre] || 0),
          backgroundColor: this.obtenerColorMedicamento(index),
          borderRadius: 4,
          borderSkipped: false,
          stack: 'medicamentos',
          categoryPercentage: 0.72,
          barPercentage: 0.78
        }))
      },
      options: {
        ...this.getBaseOptions(),
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#667085', font: { weight: 700 } }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: 'rgba(102, 112, 133, 0.14)' },
            ticks: {
              color: '#667085',
              precision: 0
            }
          }
        }
      }
    };
  }

  private getDistribucionConfig(): ChartConfiguration<'doughnut'> {
    return {
      type: 'doughnut',
      data: {
        labels: this.distribucionActividades.map(item => item.label),
        datasets: [
          {
            data: this.distribucionActividades.map(item => item.value),
            backgroundColor: this.distribucionActividades.map(item => item.color),
            borderColor: '#ffffff',
            borderWidth: 4,
            hoverOffset: 8
          }
        ]
      },
      options: {
        ...this.getBaseOptions(),
        cutout: '62%'
      }
    };
  }

  private calcularResumenDiario() {
    const hoy = new Date();
    const actividadesHoy = this.activities.filter(activity => this.esMismoDia(activity.time, hoy));

    this.resumenDiario.lecheHoy.actual = actividadesHoy
      .filter((activity): activity is TomaLecheFamiliaActivity => activity.type === 'toma-leche')
      .reduce((sum, activity) => sum + Number(activity.cantidadOnzas || 0), 0);

    this.resumenDiario.panalesHoy = actividadesHoy.filter(
      activity => activity.type === 'cambio-panal'
    ).length;

    this.resumenDiario.medicamentosHoy = actividadesHoy.filter(
      activity => activity.type === 'medicamento'
    ).length;

    this.resumenDiario.suenoHoy = actividadesHoy
      .filter((activity): activity is SuenoFamiliaActivity => activity.type === 'sueno')
      .reduce((sum, activity) => sum + Number(activity.duracionMinutos || 0), 0);
  }

  private prepararGraficas() {
    this.lecheUltimos7 = this.obtenerLecheLast7Days();
    this.suenoUltimos7 = this.obtenerSuenoLast7Days();
    this.medicamentosUltimos7 = this.obtenerMedicamentosLast7Days();
    this.panalesUltimos7 = this.obtenerPanalesLast7Days();
    this.distribucionActividades = this.obtenerDistribucionActividades();
  }

  private obtenerLecheLast7Days(): LecheDia[] {
    const dias: LecheDia[] = [];

    for (let i = 6; i >= 0; i--) {
      const fecha = this.obtenerFechaDiasAtras(i);
      const tomasDelDia = this.activities.filter(
        (activity): activity is TomaLecheFamiliaActivity => {
          return activity.type === 'toma-leche' && this.esMismoDia(activity.time, fecha);
        }
      );

      const materna = tomasDelDia
        .filter(activity => activity.esLecheMaterna)
        .reduce((sum, activity) => sum + Number(activity.cantidadOnzas || 0), 0);

      const formula = tomasDelDia
        .filter(activity => !activity.esLecheMaterna)
        .reduce((sum, activity) => sum + Number(activity.cantidadOnzas || 0), 0);

      dias.push({
        label: this.formatearDiaSemana(fecha),
        materna,
        formula,
        total: materna + formula
      });
    }

    return dias;
  }

  private obtenerSuenoLast7Days(): SuenoDia[] {
    const dias: SuenoDia[] = [];

    for (let i = 6; i >= 0; i--) {
      const fecha = this.obtenerFechaDiasAtras(i);
      const minutos = this.obtenerMinutosSuenoPorPeriodo(fecha);

      dias.push({
        label: this.formatearDiaSemana(fecha),
        dia: Math.round((minutos.dia / 60) * 10) / 10,
        noche: Math.round((minutos.noche / 60) * 10) / 10
      });
    }

    return dias;
  }

  private obtenerMinutosSuenoPorPeriodo(fecha: Date): { dia: number; noche: number } {
    const inicioDiaCalendario = new Date(fecha);
    inicioDiaCalendario.setHours(0, 0, 0, 0);

    const finDiaCalendario = new Date(inicioDiaCalendario);
    finDiaCalendario.setDate(finDiaCalendario.getDate() + 1);

    const inicioPeriodoDia = new Date(inicioDiaCalendario);
    inicioPeriodoDia.setHours(8, 0, 0, 0);

    const finPeriodoDia = new Date(inicioDiaCalendario);
    finPeriodoDia.setHours(22, 0, 0, 0);

    let minutosDia = 0;
    let minutosTotales = 0;

    this.activities
      .filter((activity): activity is SuenoFamiliaActivity => activity.type === 'sueno')
      .forEach(sueno => {
        const inicioSueno = this.parseFecha(sueno.inicio || sueno.time);
        const finSueno = sueno.fin
          ? this.parseFecha(sueno.fin)
          : new Date(inicioSueno.getTime() + Number(sueno.duracionMinutos || 0) * 60000);

        if (finSueno <= inicioSueno) {
          return;
        }

        const minutosEnDia = this.obtenerMinutosSolapados(
          inicioSueno,
          finSueno,
          inicioDiaCalendario,
          finDiaCalendario
        );

        const minutosEnPeriodoDia = this.obtenerMinutosSolapados(
          inicioSueno,
          finSueno,
          inicioPeriodoDia,
          finPeriodoDia
        );

        minutosTotales += minutosEnDia;
        minutosDia += minutosEnPeriodoDia;
      });

    return {
      dia: minutosDia,
      noche: Math.max(0, minutosTotales - minutosDia)
    };
  }

  private obtenerMinutosSolapados(
    inicio: Date,
    fin: Date,
    rangoInicio: Date,
    rangoFin: Date
  ): number {
    const inicioSolapado = Math.max(inicio.getTime(), rangoInicio.getTime());
    const finSolapado = Math.min(fin.getTime(), rangoFin.getTime());

    if (finSolapado <= inicioSolapado) {
      return 0;
    }

    return Math.round((finSolapado - inicioSolapado) / 60000);
  }

  private obtenerPanalesLast7Days() {
    const hace7Dias = this.obtenerFechaDiasAtras(7);
    let limpios = 0;
    let conHeces = 0;

    const panales = this.activities.filter(
      (activity): activity is CambioPanalFamiliaActivity => {
        return activity.type === 'cambio-panal' && this.parseFecha(activity.time) >= hace7Dias;
      }
    );

    panales.forEach(panal => {
      if (panal.tieneHeces) {
        conHeces++;
      } else {
        limpios++;
      }
    });

    return {
      limpios,
      conHeces,
      total: limpios + conHeces
    };
  }

  private obtenerMedicamentosLast7Days(): MedicamentoDia[] {
    const dias: MedicamentoDia[] = [];

    for (let i = 6; i >= 0; i--) {
      const fecha = this.obtenerFechaDiasAtras(i);
      const medicamentos: Record<string, number> = {};

      this.activities.filter(activity => {
        return activity.type === 'medicamento' && this.esMismoDia(activity.time, fecha);
      }).forEach(activity => {
        const nombre = (activity as any).nombreMedicamento || 'Medicamento';
        medicamentos[nombre] = (medicamentos[nombre] || 0) + 1;
      });

      dias.push({
        label: this.formatearDiaSemana(fecha),
        medicamentos
      });
    }

    return dias;
  }

  private obtenerNombresMedicamentosUltimos7(): string[] {
    const nombres = new Set<string>();

    this.medicamentosUltimos7.forEach(dia => {
      Object.keys(dia.medicamentos).forEach(nombre => nombres.add(nombre));
    });

    return Array.from(nombres);
  }

  private obtenerColorMedicamento(index: number): string {
    const colores = [
      '#81769b',
      '#a186be',
      '#6f86d6',
      '#9d7f64',
      '#b86f8c',
      '#679b91'
    ];

    return colores[index % colores.length];
  }

  private obtenerDistribucionActividades(): DistribucionActividad[] {
    const hace7Dias = this.obtenerFechaDiasAtras(7);
    const actividades = this.activities.filter(activity => this.parseFecha(activity.time) >= hace7Dias);

    const conteos = {
      leche: 0,
      panales: 0,
      sueno: 0,
      medicamentos: 0
    };

    actividades.forEach(activity => {
      switch (activity.type) {
        case 'toma-leche':
          conteos.leche++;
          break;
        case 'cambio-panal':
          conteos.panales++;
          break;
        case 'sueno':
          conteos.sueno++;
          break;
        case 'medicamento':
          conteos.medicamentos++;
          break;
      }
    });

    return [
      { label: 'Leche', value: conteos.leche, color: '#ff8fa3' },
      { label: 'Pañales', value: conteos.panales, color: '#7ed6a5' },
      { label: 'Sueño', value: conteos.sueno, color: '#1048c2' },
      { label: 'Medicamentos', value: conteos.medicamentos, color: '#81769b' }
    ];
  }

  private obtenerFechaDiasAtras(dias: number): Date {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    fecha.setHours(0, 0, 0, 0);

    return fecha;
  }

  private formatearDiaSemana(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', { weekday: 'short' });
  }

  private esMismoDia(value: string, fecha: Date): boolean {
    const activityDate = this.parseFecha(value);

    return (
      activityDate.getFullYear() === fecha.getFullYear() &&
      activityDate.getMonth() === fecha.getMonth() &&
      activityDate.getDate() === fecha.getDate()
    );
  }

  private parseFecha(value: string): Date {
    return new Date(value);
  }
}
