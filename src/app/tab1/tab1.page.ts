import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonAvatar, IonLabel, IonItem, IonList, IonIcon, IonProgressBar, IonButton,
  IonModal,
  IonInput,
  IonButtons,
  IonText,
  IonSpinner,
  IonAlert
 } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { people, time, medical, chevronForward, water, logoWhatsapp,documentText, addCircleOutline } from 'ionicons/icons';
import { personOutline, trashOutline, close  } from 'ionicons/icons';
import { BebeFamiliaService } from '../services/bebe-familia.service';
import { BebeFamilia, CrearBebeFamiliaRequest } from '../models/bebe-familia.model';
import { addOutline, createOutline, moonOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { ActivityFamilia } from '../models/activity-familia.model';
import { ActivityFamiliaService } from '../services/activity-familia.service';
import { NotificacionVacunasService } from '../services/notificacion-vacunas.service';
import { NotificacionSuenosService } from '../services/notificacion-suenos.service';
import { Router } from '@angular/router';
import { FamiliaMiembrosService } from '../services/familia-miembros.service';
import { ModalController } from '@ionic/angular/standalone';
import { ActividadFormModalComponent } from '../components/actividad-form-modal/actividad-form-modal.component';
import { Subscription } from 'rxjs';
import { ActividadEventosService } from '../services/actividad-eventos.service';

type BebeVista = BebeFamilia & {
  edadMeses: number;
};

type ActividadVista = ActivityFamilia & {
  icono: string;
  color: string;
  titulo: string;
  descripcion: string;
};

@Component({
  selector: 'app-tab1',
  standalone: true,
  imports: [IonButton, IonProgressBar, 
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonAvatar,
    IonLabel,
    IonItem,
    IonList,
    IonIcon,
    FormsModule,
    IonAlert,
IonModal,
IonInput,
IonButtons,
IonText,
IonSpinner,
  ],
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {
  private activityFamiliaService = inject(ActivityFamiliaService);
  private bebeFamiliaService = inject(BebeFamiliaService);
private notificacionVacunasService = inject(NotificacionVacunasService);
private notificacionSuenosService = inject(NotificacionSuenosService);
private router = inject(Router);

bebes: BebeFamilia[] = [];
bebesVista: BebeVista[] = [];
bebeActivoId = '';  
actividadesRecientes: ActivityFamilia[] = [];
actividadesRecientesVista: ActividadVista[] = [];
showModalBebe = false;
guardandoBebe = false;
mensajeBebe = '';
bebeEditandoId = '';
fotoSeleccionada?: File;
showEliminarBebeAlert = false;
cargandoTab1 = true;
bebeAEliminar: BebeFamilia | null = null;
private familiaMiembrosService = inject(FamiliaMiembrosService);
esAdminFamilia = false;
bebeForm: CrearBebeFamiliaRequest = this.crearFormBebeVacio();
  actividadesHoy: ActivityFamilia[] = [];
  onzasTomadasHoy = 0;
  onzasDiariasObjetivo = 24;
  porcentajeOnzas = 0;
  progresoOnzas = 0;
suenoActivo: ActivityFamilia | null = null;
duracionSuenoActivoTexto = '';
private intervaloSuenoActivo?: ReturnType<typeof setInterval>;
private bebesSubscription?: Subscription;
private actividadGuardadaSubscription?: Subscription;
private cargandoVistaInicial = false;
private vistaInicialCargada = false;
private modalController = inject(ModalController);
private actividadEventosService = inject(ActividadEventosService);

  async ngOnInit() {
   addIcons({ people, time, medical, chevronForward, personOutline, addOutline, trashOutline, close, createOutline, documentText, moonOutline   });
   this.actividadGuardadaSubscription =
     this.actividadEventosService.actividadGuardada$.subscribe(async activity => {
       await this.refrescarActividadGuardada(activity || undefined);
     });
  }

getIconoActividad(actividad: any): string {
  if (actividad.type === 'toma-leche') {
    return actividad.esLecheMaterna ? 'heart' : 'flask';
  }

  if (actividad.type === 'cambio-panal') {
    return 'leaf';
  }

  if (actividad.type === 'medicamento') {
    return 'medical';
  }

   if (actividad.type === 'sueno') {
    return 'moon-outline';
  }

  return 'ellipse';
}

  getColorActividad(actividad: any): string {
  if (actividad.type === 'toma-leche') {
    return actividad.esLecheMaterna ? 'danger' : 'primary';
  }

  if (actividad.type === 'cambio-panal') {
    return actividad.tieneHeces ? 'warning' : 'success';
  }

  if (actividad.type === 'medicamento') {
    return 'medicamento';
  }

  if (actividad.type === 'sueno') {
    return actividad.fin ? 'sueno' : 'warning';
  }

  return 'medium';
}

  formatearFecha(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    
    if (horas < 1) return 'Hace unos minutos';
    if (horas < 24) return `Hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias}d`;
  }

  async ionViewWillEnter() {
    await this.cargarVistaInicialTab1();
  }

  ngOnDestroy() {
    this.bebesSubscription?.unsubscribe();
    this.actividadGuardadaSubscription?.unsubscribe();
    this.limpiarIntervaloSuenoActivo();
  }

private async cargarVistaInicialTab1() {
  if (this.cargandoVistaInicial) {
    return;
  }

  this.cargandoVistaInicial = true;
  this.cargandoTab1 = !this.vistaInicialCargada;

  try {
    await this.cargarDatosBebe();

    await Promise.all([
      this.cargarPermisosFamilia(),
      this.cargarActividadesYProgresoDeHoy(),
      this.cargarSuenoActivo()
    ]);

    this.vistaInicialCargada = true;
  } finally {
    this.cargandoTab1 = false;
    this.cargandoVistaInicial = false;
  }
}

  private async cargarActividadesDeHoy() {
  try {
    this.actualizarActividadesRecientes(
      await this.activityFamiliaService.getByDay(new Date())
    );
  } catch (error) {
    console.error('Error cargando actividades recientes del bebé activo', error);
    this.actividadesRecientes = [];
    this.actividadesRecientesVista = [];
  }
}

  getTituloActividad(actividad: ActivityFamilia): string {
    if (actividad.type === 'toma-leche') {
      return 'Toma de leche';
    }

    if (actividad.type === 'cambio-panal') {
      return 'Cambio de pañal';
    }

    if (actividad.type === 'medicamento') {
      return 'Medicamento';
    }

    if (actividad.type === 'sueno') {
    return (actividad as any).fin ? 'Sueño' : 'Sueño en curso';
  }

    return 'Actividad';
  }

  getDescripcionActividad(actividad: ActivityFamilia): string {
    if (actividad.type === 'toma-leche') {
      const tipoLeche = actividad.esLecheMaterna ? 'materna' : 'fórmula';
      return `${actividad.cantidadOnzas} oz - Leche ${tipoLeche}`;
    }

    if (actividad.type === 'cambio-panal') {
      return actividad.tieneHeces ? 'Con popó' : 'Solo pipí';
    }

    if (actividad.type === 'medicamento') {
      return `${actividad.dosisGotas} gotas - ${actividad.nombreMedicamento}`;
    }

    if (actividad.type === 'sueno') {
    const sueno = actividad as any;

    if (!sueno.fin) {
      return `Durmiendo desde ${new Date(sueno.inicio || sueno.time).toLocaleTimeString('es-UY', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`;
    }

    return `Duró ${this.formatearDuracion(Number(sueno.duracionMinutos || 0))}`;
  }

    return '';
  }

  private async cargarProgresoOnzas(actividadesDelDia?: ActivityFamilia[]) {
  try {
    const config =
      await this.bebeFamiliaService.obtenerConfiguracionBebeActivo();

    this.onzasDiariasObjetivo = config.onzasDiariasObjetivo;
  } catch (error) {
    console.error('Error cargando meta de onzas del bebé activo', error);
    this.onzasDiariasObjetivo = 24;
  }

  let actividadesHoy: ActivityFamilia[] = [];

  if (actividadesDelDia) {
    actividadesHoy = actividadesDelDia;
  } else {
    try {
      actividadesHoy = await this.activityFamiliaService.getByDay(new Date());
    } catch (error) {
      console.error('Error cargando progreso de onzas del bebé activo', error);
      actividadesHoy = [];
    }
  }

  this.actividadesHoy = actividadesHoy;

  this.onzasTomadasHoy = actividadesHoy
    .filter(a => a.type === 'toma-leche')
    .reduce((total, actividad) => {
      return total + Number((actividad as any).cantidadOnzas || 0);
    }, 0);

  if (!this.onzasDiariasObjetivo || this.onzasDiariasObjetivo <= 0) {
    this.porcentajeOnzas = 0;
    this.progresoOnzas = 0;
    return;
  }

  this.porcentajeOnzas = Math.min(
    100,
    Math.round((this.onzasTomadasHoy / this.onzasDiariasObjetivo) * 100)
  );

  this.progresoOnzas = Math.min(
    1,
    this.onzasTomadasHoy / this.onzasDiariasObjetivo
  );
}

private async cargarActividadesYProgresoDeHoy() {
  let actividadesHoy: ActivityFamilia[] = [];

  try {
    actividadesHoy = await this.activityFamiliaService.getByDay(new Date());
  } catch (error) {
    console.error('Error cargando actividades del bebé activo', error);
  }

  this.actualizarActividadesRecientes(actividadesHoy);
  await this.cargarProgresoOnzas(actividadesHoy);
}

  get onzasRestantes(): number {
  const restantes = this.onzasDiariasObjetivo - this.onzasTomadasHoy;

  return Number(Math.max(restantes, 0).toFixed(1));
}

  private async cargarDatosBebe() {
  try {
    this.bebeActivoId =
      (await this.bebeFamiliaService.obtenerBebeActivoId()) || '';

    this.bebesSubscription?.unsubscribe();
    await new Promise<void>(resolve => {
      let primeraCargaPendiente = true;
      const finalizarPrimeraCarga = () => {
        if (!primeraCargaPendiente) {
          return;
        }

        primeraCargaPendiente = false;
        resolve();
      };

      this.bebesSubscription = this.bebeFamiliaService.obtenerBebes().subscribe({
        next: async bebes => {
          try {
            this.bebes = bebes || [];
            this.actualizarBebesVista();

            if (!this.bebeActivoId && this.bebes.length > 0) {
              await this.seleccionarBebe(this.bebes[0]);
            }
          } finally {
            finalizarPrimeraCarga();
          }
        },
        error: error => {
          console.error('Error cargando bebés de la familia', error);
          this.bebes = [];
          this.bebesVista = [];
          finalizarPrimeraCarga();
        }
      });
    });
  } catch (error) {
    console.error('Error cargando datos de bebés', error);
    this.bebes = [];
    this.bebesVista = [];
  }
}
  compartirActividadesDelDiaPorWhatsapp() {
  const actividadesHoy = this.actividadesRecientes;

  if (!actividadesHoy.length) {
    console.log('No hay actividades registradas hoy para compartir.');
    return;
  }

  const mensaje = this.generarMensajeActividadesDelDia(actividadesHoy);
  const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

  window.open(url, '_blank');
}

private generarMensajeActividadesDelDia(activities: ActivityFamilia[]): string {
  const fecha = new Date().toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const tomas = activities.filter(a => a.type === 'toma-leche');
  const panales = activities.filter(a => a.type === 'cambio-panal');
  const medicamentos = activities.filter(a => a.type === 'medicamento');
  const suenos = activities.filter(a => a.type === 'sueno');

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

  const totalPopo = panales.filter(panal => (panal as any).tieneHeces).length;
  const totalPipi = panales.filter(panal => !(panal as any).tieneHeces).length;

  const totalMinutosSueno = suenos.reduce((total, sueno) => {
    return total + this.obtenerDuracionSuenoMinutos(sueno);
  }, 0);

  const lineas: string[] = [];

  lineas.push(`Actividades del bebé - ${fecha}`);
  lineas.push('');
  lineas.push('Resumen:');
  lineas.push(`- Tomas: ${tomas.length}`);
  lineas.push(`- Total leche: ${totalOnzas} oz`);
  lineas.push(`- Fórmula: ${totalFormula} oz`);
  lineas.push(`- Materna: ${totalMaterna} oz`);
  lineas.push(`- Pañales: ${panales.length}`);
  lineas.push(`- Con popó: ${totalPopo}`);
  lineas.push(`- Solo pipí: ${totalPipi}`);
  lineas.push(`- Medicamentos: ${medicamentos.length}`);
  lineas.push(`- Sueños: ${suenos.length}`);

  if (totalMinutosSueno > 0) {
    lineas.push(`- Tiempo dormido: ${this.formatearMinutosSueno(totalMinutosSueno)}`);
  }

  lineas.push('');
  lineas.push('Detalle:');

  activities
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach(activity => {
      const hora = new Date(activity.time).toLocaleTimeString('es-UY', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      if (activity.type === 'toma-leche') {
        const cantidad = Number((activity as any).cantidadOnzas || 0);
        const tipoLeche = (activity as any).esLecheMaterna ? 'materna' : 'fórmula';

        lineas.push(`- ${hora} · Toma de leche · ${cantidad} oz · ${tipoLeche}`);
      }

      if (activity.type === 'cambio-panal') {
        const tipoPanal = (activity as any).tieneHeces ? 'con popó' : 'solo pipí';

        lineas.push(`- ${hora} · Cambio de pañal · ${tipoPanal}`);
      }

      if (activity.type === 'medicamento') {
        const nombreMedicamento =
          (activity as any).nombreMedicamento ||
          (activity as any).medicamentoNombre ||
          'Medicamento';

        const dosis =
          (activity as any).dosisGotas ??
          (activity as any).dosis ??
          null;

        const observaciones = (activity as any).observaciones;

        let linea = `- ${hora} · Medicamento · ${nombreMedicamento}`;

        if (dosis !== null && dosis !== undefined && dosis !== '') {
          linea += ` · ${dosis} gotas`;
        }

        if (observaciones) {
          linea += ` · ${observaciones}`;
        }

        lineas.push(linea);
      }

      if (activity.type === 'sueno') {
        const horaInicio = this.obtenerHoraSuenoInicio(activity);
        const horaFin = this.obtenerHoraSuenoFin(activity);
        const duracionMinutos = this.obtenerDuracionSuenoMinutos(activity);

        let linea = `- ${hora} · Sueño`;

        if (horaInicio && horaFin) {
          linea += ` · ${horaInicio} a ${horaFin}`;
        } else if (horaInicio) {
          linea += ` · inició ${horaInicio}`;
        }

        if (duracionMinutos > 0) {
          linea += ` · ${this.formatearMinutosSueno(duracionMinutos)}`;
        } else {
          linea += ` · en curso`;
        }

        lineas.push(linea);
      }
    });

  return lineas.join('\n');
}

private obtenerDuracionSuenoMinutos(activity: ActivityFamilia): number {
  const duracionDirecta =
    (activity as any).duracionMinutos ??
    (activity as any).minutosDormidos ??
    null;

  if (duracionDirecta !== null && duracionDirecta !== undefined) {
    return Number(duracionDirecta || 0);
  }

  const inicioRaw =
    (activity as any).horaInicio ||
    (activity as any).inicio ||
    (activity as any).fechaInicio ||
    activity.time;

  const finRaw =
    (activity as any).horaFin ||
    (activity as any).fin ||
    (activity as any).fechaFin;

  if (!inicioRaw || !finRaw) {
    return 0;
  }

  const inicio = new Date(inicioRaw);
  const fin = new Date(finRaw);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return 0;
  }

  const minutos = Math.floor((fin.getTime() - inicio.getTime()) / 60000);

  return minutos > 0 ? minutos : 0;
}

private obtenerHoraSuenoInicio(activity: ActivityFamilia): string {
  const inicioRaw =
    (activity as any).horaInicio ||
    (activity as any).inicio ||
    (activity as any).fechaInicio ||
    activity.time;

  return this.formatearHoraActividad(inicioRaw);
}

private obtenerHoraSuenoFin(activity: ActivityFamilia): string {
  const finRaw =
    (activity as any).horaFin ||
    (activity as any).fin ||
    (activity as any).fechaFin;

  if (!finRaw) {
    return '';
  }

  return this.formatearHoraActividad(finRaw);
}

private formatearHoraActividad(fechaRaw: string): string {
  if (!fechaRaw) {
    return '';
  }

  const fecha = new Date(fechaRaw);

  if (isNaN(fecha.getTime())) {
    return '';
  }

  return fecha.toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

private formatearMinutosSueno(totalMinutos: number): string {
  const minutos = Number(totalMinutos || 0);

  if (minutos <= 0) {
    return '0 min';
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (horas > 0 && minutosRestantes > 0) {
    return `${horas} h ${minutosRestantes} min`;
  }

  if (horas > 0) {
    return `${horas} h`;
  }

  return `${minutosRestantes} min`;
}

async seleccionarBebe(bebe: BebeFamilia) {
  try {
    await this.bebeFamiliaService.seleccionarBebeActivo(bebe.id);
    this.bebeActivoId = bebe.id;

    // Más adelante, cuando las actividades estén en Firebase,
    // acá recargaremos actividades del bebé seleccionado.
    await this.cargarActividadesYProgresoDeHoy();
    await this.cargarSuenoActivo();
  } catch (error) {
    console.error('Error seleccionando bebé activo', error);
  }
}

esBebeActivo(bebe: BebeFamilia): boolean {
  return this.bebeActivoId === bebe.id;
}

calcularEdadMeses(fechaNacimiento: string): number {
  if (!fechaNacimiento) {
    return 0;
  }

  const nacimiento = this.crearFechaLocal(fechaNacimiento);
  const hoy = new Date();

  let meses =
    (hoy.getFullYear() - nacimiento.getFullYear()) * 12 +
    (hoy.getMonth() - nacimiento.getMonth());

  if (hoy.getDate() < nacimiento.getDate()) {
    meses--;
  }

  return Math.max(meses, 0);
}

private crearFechaLocal(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);

  if (!anio || !mes || !dia) {
    return new Date(fecha);
  }

  return new Date(anio, mes - 1, dia);
}
private crearFormBebeVacio(): CrearBebeFamiliaRequest {
  return {
    nombre: '',
    fechaNacimiento: '',
    fotoUrl: '',
    proximaVacuna: '',
    notas: []
  };
}

abrirModalNuevoBebe() {
  if (!this.esAdminFamilia) {
    return;
  }
  this.bebeEditandoId = '';
  this.fotoSeleccionada = undefined;
  this.mensajeBebe = '';
  this.bebeForm = this.crearFormBebeVacio();
  this.showModalBebe = true;
}

cerrarModalBebe() {
  this.showModalBebe = false;
  this.guardandoBebe = false;
  this.mensajeBebe = '';
}

async guardarBebe() {
  const nombre = this.bebeForm.nombre?.trim();

  if (!nombre) {
    this.mensajeBebe = 'Ingresá el nombre del bebé.';
    return;
  }

  if (!this.bebeForm.fechaNacimiento) {
    this.mensajeBebe = 'Ingresá la fecha de nacimiento.';
    return;
  }

  this.guardandoBebe = true;
  this.mensajeBebe = '';

  try {
    const request: CrearBebeFamiliaRequest = {
      nombre,
      fechaNacimiento: this.bebeForm.fechaNacimiento,
      fotoUrl: this.fotoSeleccionada ? '' : (this.bebeForm.fotoUrl || ''),
      proximaVacuna: this.bebeForm.proximaVacuna || '',
      notas: this.bebeForm.notas || []
    };

    if (
      this.bebeForm.peso !== undefined &&
      this.bebeForm.peso !== null &&
      String(this.bebeForm.peso).trim() !== ''
    ) {
      request.peso = Number(this.bebeForm.peso);
    }

    if (
      this.bebeForm.altura !== undefined &&
      this.bebeForm.altura !== null &&
      String(this.bebeForm.altura).trim() !== ''
    ) {
      request.altura = Number(this.bebeForm.altura);
    }

    let bebeId = this.bebeEditandoId;

    if (bebeId) {
      await this.bebeFamiliaService.actualizarBebeConFoto(
        bebeId,
        request,
        this.fotoSeleccionada
      );
    } else {
      bebeId = await this.bebeFamiliaService.crearBebeConFoto(
        request,
        this.fotoSeleccionada
      );

      await this.bebeFamiliaService.seleccionarBebeActivo(bebeId);
      this.bebeActivoId = bebeId;
    }

    if (bebeId) {
      const bebeParaNotificacion: BebeFamilia = {
        id: bebeId,
        familiaId: '',
        nombre: request.nombre,
        fechaNacimiento: request.fechaNacimiento,
        peso: request.peso,
        altura: request.altura,
        fotoUrl: request.fotoUrl || '',
        proximaVacuna: request.proximaVacuna || '',
        notas: request.notas || [],
        activo: true,
        creadoPorUid: '',
        createdAt: null,
        updatedAt: null
      };

      await this.notificacionVacunasService.programarNotificacionProximaVacuna(
        bebeParaNotificacion
      );
    }

    this.fotoSeleccionada = undefined;
    this.bebeEditandoId = '';
    this.bebeForm = this.crearFormBebeVacio();
    this.showModalBebe = false;
    this.mensajeBebe = '';

    await this.cargarDatosBebe();
  } catch (error: any) {
    console.error('Error guardando bebé', error);
    this.mensajeBebe = error?.message || 'No se pudo guardar el bebé.';
  } finally {
    this.guardandoBebe = false;
  }
}

onFotoSeleccionada(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    this.mensajeBebe = 'Seleccioná un archivo de imagen válido.';
    input.value = '';
    return;
  }

  this.fotoSeleccionada = file;

  const reader = new FileReader();

  reader.onload = () => {
    this.bebeForm = {
      ...this.bebeForm,
      fotoUrl: reader.result as string
    };
  };

  reader.readAsDataURL(file);

  input.value = '';
}

quitarFotoBebe() {
  this.fotoSeleccionada = undefined;

  this.bebeForm = {
    ...this.bebeForm,
    fotoUrl: ''
  };
}

eliminarBebe(event: Event, bebe: BebeFamilia) {
  event.stopPropagation();

  if (!this.esAdminFamilia) {
    return;
  }

  this.bebeAEliminar = bebe;
  this.showEliminarBebeAlert = true;
}

async confirmarEliminarBebe() {
  if (!this.bebeAEliminar) {
    return;
  }

  const bebe = this.bebeAEliminar;

  try {
    await this.bebeFamiliaService.eliminarBebeLogico(bebe.id);

    if (this.bebeActivoId === bebe.id) {
      await this.bebeFamiliaService.limpiarBebeActivo();
      this.bebeActivoId = '';
    }

    this.bebeAEliminar = null;
    this.showEliminarBebeAlert = false;

    await this.cargarDatosBebe();
  } catch (error) {
    console.error('Error eliminando bebé', error);
    this.bebeAEliminar = null;
    this.showEliminarBebeAlert = false;
  }
}

cancelarEliminarBebe() {
  this.bebeAEliminar = null;
  this.showEliminarBebeAlert = false;
}

editarBebe(event: Event, bebe: BebeFamilia) {
  event.stopPropagation();

  if (!this.esAdminFamilia) {
    return;
  }

  this.bebeEditandoId = bebe.id;
  this.fotoSeleccionada = undefined;
  this.mensajeBebe = '';

  this.bebeForm = {
    nombre: bebe.nombre,
    fechaNacimiento: bebe.fechaNacimiento,
    peso: bebe.peso,
    altura: bebe.altura,
    fotoUrl: bebe.fotoUrl || '',
    proximaVacuna: bebe.proximaVacuna || '',
    notas: bebe.notas || []
  };

  this.showModalBebe = true;
}

verDetalleBebe(event: Event, bebe: BebeFamilia) {
  event.stopPropagation();

  this.router.navigate(['/detalle', bebe.id]);
}

private async cargarPermisosFamilia() {
  try {
    this.esAdminFamilia = await this.familiaMiembrosService.esUsuarioAdmin();
  } catch (error) {
    console.error('Error cargando permisos de familia', error);
    this.esAdminFamilia = false;
  }
}

private async cargarSuenoActivo() {
  try {
    this.suenoActivo = await this.activityFamiliaService.obtenerSuenoActivo();
    this.actualizarDuracionSuenoActivo();

    this.limpiarIntervaloSuenoActivo();

    if (this.suenoActivo) {
      this.intervaloSuenoActivo = setInterval(() => {
        this.actualizarDuracionSuenoActivo();
      }, 60000);
    }
  } catch (error) {
    console.error('Error cargando sueño activo', error);
    this.suenoActivo = null;
    this.duracionSuenoActivoTexto = '';
    this.limpiarIntervaloSuenoActivo();
  }
}

private limpiarIntervaloSuenoActivo() {
  if (!this.intervaloSuenoActivo) {
    return;
  }

  clearInterval(this.intervaloSuenoActivo);
  this.intervaloSuenoActivo = undefined;
}

private actualizarDuracionSuenoActivo() {
  if (!this.suenoActivo) {
    this.duracionSuenoActivoTexto = '';
    return;
  }

  const inicio = new Date((this.suenoActivo as any).inicio || this.suenoActivo.time);
  const ahora = new Date();

  const minutos = Math.max(
    0,
    Math.round((ahora.getTime() - inicio.getTime()) / 60000)
  );

  this.duracionSuenoActivoTexto = this.formatearDuracion(minutos);
}

formatearDuracion(minutos: number): string {
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

async iniciarSuenoRapido() {
  try {
    await this.activityFamiliaService.iniciarSueno(new Date());

    const actividadesHoy = await this.activityFamiliaService.getByDay(new Date());
    this.actualizarActividadesRecientes(actividadesHoy);
    await this.cargarProgresoOnzas(actividadesHoy);
    await this.cargarSuenoActivo();
    void this.notificacionSuenosService.programarProximoSuenoBebeActivo(
      actividadesHoy
    );
  } catch (error: any) {
    alert(error?.message || 'No se pudo iniciar el sueño.');
  }
}

async finalizarSuenoActivo() {
  if (!this.suenoActivo) {
    return;
  }

  try {
    await this.activityFamiliaService.finalizarSueno(
      this.suenoActivo.id,
      new Date()
    );

    const actividadesHoy = await this.activityFamiliaService.getByDay(new Date());
    this.actualizarActividadesRecientes(actividadesHoy);
    await this.cargarProgresoOnzas(actividadesHoy);
    await this.cargarSuenoActivo();
    void this.notificacionSuenosService.programarProximoSuenoBebeActivo(
      actividadesHoy
    );
  } catch (error: any) {
    alert(error?.message || 'No se pudo finalizar el sueño.');
  }
}

async abrirModalAgregarActividad() {
  const modal = await this.modalController.create({
    component: ActividadFormModalComponent,
    cssClass: 'custom-modal',
    componentProps: {
      modo: 'crear',
      tipoInicial: 'toma-leche'
    }
  });

  await modal.present();

  await modal.onDidDismiss();
}

private async refrescarActividadGuardada(
  activity?: ActivityFamilia
): Promise<void> {
  if (activity) {
    this.actualizarActividadEnMemoria(activity);
    this.actualizarProgresoOnzasDesdeActividades();
  }

  await Promise.all([
    this.cargarActividadesYProgresoDeHoy(),
    this.cargarSuenoActivo()
  ]);

  if ((this as any).cargarResumenSueno) {
    await (this as any).cargarResumenSueno();
  }
}

trackByBebeId(_index: number, bebe: BebeFamilia): string {
  return bebe.id;
}

trackByActividadId(_index: number, actividad: ActivityFamilia): string {
  return actividad.id;
}

private actualizarBebesVista() {
  this.bebesVista = this.bebes.map(bebe => ({
    ...bebe,
    edadMeses: this.calcularEdadMeses(bebe.fechaNacimiento)
  }));
}

private actualizarActividadesRecientes(actividades: ActivityFamilia[]) {
  this.actividadesRecientes = (actividades || [])
    .slice()
    .sort((a, b) => {
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

  this.actividadesRecientesVista = this.actividadesRecientes.map(actividad => ({
    ...actividad,
    icono: this.getIconoActividad(actividad),
    color: this.getColorActividad(actividad),
    titulo: this.getTituloActividad(actividad),
    descripcion: this.getDescripcionActividad(actividad)
  }));
}

private actualizarActividadEnMemoria(activity: ActivityFamilia): void {
  if (!activity?.id) {
    return;
  }

  const index = this.actividadesRecientes.findIndex(
    item => item.id === activity.id
  );

  if (index >= 0) {
    this.actividadesRecientes = [
      ...this.actividadesRecientes.slice(0, index),
      activity,
      ...this.actividadesRecientes.slice(index + 1)
    ];
  } else {
    this.actividadesRecientes = [
      activity,
      ...this.actividadesRecientes
    ];
  }

  this.actualizarActividadesRecientes(this.actividadesRecientes);

  if (activity.type === 'sueno' && !(activity as any).fin) {
    this.suenoActivo = activity;
    this.actualizarDuracionSuenoActivo();
  }
}

private actualizarProgresoOnzasDesdeActividades(): void {
  this.actividadesHoy = this.actividadesRecientes;

  this.onzasTomadasHoy = this.actividadesHoy
    .filter(a => a.type === 'toma-leche')
    .reduce((total, actividad) => {
      return total + Number((actividad as any).cantidadOnzas || 0);
    }, 0);

  if (!this.onzasDiariasObjetivo || this.onzasDiariasObjetivo <= 0) {
    this.porcentajeOnzas = 0;
    this.progresoOnzas = 0;
    return;
  }

  this.porcentajeOnzas = Math.min(
    100,
    Math.round((this.onzasTomadasHoy / this.onzasDiariasObjetivo) * 100)
  );

  this.progresoOnzas = Math.min(
    1,
    this.onzasTomadasHoy / this.onzasDiariasObjetivo
  );
}
}
