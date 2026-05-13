import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonAvatar, IonLabel, IonItem, IonList, IonIcon, IonBadge, IonProgressBar, IonButton,
  IonModal,
  IonInput,
  IonButtons,
  IonNote,
  IonText,
  IonSpinner,
  IonAlert
 } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { people, time, medical, chevronForward, water, logoWhatsapp,documentText } from 'ionicons/icons';
import { personOutline, trashOutline, close  } from 'ionicons/icons';
import { BebeFamiliaService } from '../services/bebe-familia.service';
import { BebeFamilia, CrearBebeFamiliaRequest } from '../models/bebe-familia.model';
import { addOutline, createOutline, documentTextOutline  } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { ActivityFamilia } from '../models/activity-familia.model';
import { ActivityFamiliaService } from '../services/activity-familia.service';
import { NotificacionVacunasService } from '../services/notificacion-vacunas.service';
import { Router } from '@angular/router';
import { FamiliaMiembrosService } from '../services/familia-miembros.service';

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
IonNote,
IonText,
IonSpinner,
  ],
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {
  private activityFamiliaService = inject(ActivityFamiliaService);
  private bebeFamiliaService = inject(BebeFamiliaService);
private notificacionVacunasService = inject(NotificacionVacunasService);
private router = inject(Router);

bebes: BebeFamilia[] = [];
bebeActivoId = '';  
actividadesRecientes: ActivityFamilia[] = [];
showModalBebe = false;
guardandoBebe = false;
mensajeBebe = '';
bebeEditandoId = '';
fotoSeleccionada?: File;
showEliminarBebeAlert = false;
bebeAEliminar: BebeFamilia | null = null;
private familiaMiembrosService = inject(FamiliaMiembrosService);
esAdminFamilia = false;
bebeForm: CrearBebeFamiliaRequest = this.crearFormBebeVacio();
  actividadesHoy: ActivityFamilia[] = [];
  onzasTomadasHoy = 0;
  onzasDiariasObjetivo = 24;
  porcentajeOnzas = 0;
  progresoOnzas = 0;

  async ngOnInit() {
   addIcons({ people, time, medical, chevronForward, personOutline, addOutline, trashOutline, close, createOutline, documentText  });

    await this.cargarDatosBebe();

    await this.cargarActividadesDeHoy();
    await this.cargarProgresoOnzas();
  }

getIconoActividad(actividad: any): string {
  if (actividad.type === 'toma-leche') {
    return actividad.esLecheMaterna ? 'heart' : 'flask';
  }

  if (actividad.type === 'cambio-panal') {
    return 'leaf';
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
      await this.cargarPermisosFamilia();
    await this.cargarDatosBebe();
    await this.cargarActividadesDeHoy();
    await this.cargarProgresoOnzas();
  }

  private async cargarActividadesDeHoy() {
  try {
    this.actividadesRecientes = (await this.activityFamiliaService.getByDay(new Date()))
      .sort((a, b) => {
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      });
  } catch (error) {
    console.error('Error cargando actividades recientes del bebé activo', error);
    this.actividadesRecientes = [];
  }
}

  getTituloActividad(actividad: ActivityFamilia): string {
    if (actividad.type === 'toma-leche') {
      return 'Toma de leche';
    }

    if (actividad.type === 'cambio-panal') {
      return 'Cambio de pañal';
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

    return '';
  }

  private async cargarProgresoOnzas() {
  try {
    const config =
      await this.bebeFamiliaService.obtenerConfiguracionBebeActivo();

    this.onzasDiariasObjetivo = config.onzasDiariasObjetivo;
  } catch (error) {
    console.error('Error cargando meta de onzas del bebé activo', error);
    this.onzasDiariasObjetivo = 24;
  }

  let actividadesHoy: ActivityFamilia[] = [];

  try {
    actividadesHoy = await this.activityFamiliaService.getByDay(new Date());
  } catch (error) {
    console.error('Error cargando progreso de onzas del bebé activo', error);
    actividadesHoy = [];
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

  get onzasRestantes(): number {
  const restantes = this.onzasDiariasObjetivo - this.onzasTomadasHoy;

  return Number(Math.max(restantes, 0).toFixed(1));
}

  private async cargarDatosBebe() {
  try {
    this.bebeActivoId =
      (await this.bebeFamiliaService.obtenerBebeActivoId()) || '';

    this.bebeFamiliaService.obtenerBebes().subscribe({
      next: async bebes => {
        this.bebes = bebes || [];

        if (!this.bebeActivoId && this.bebes.length > 0) {
          await this.seleccionarBebe(this.bebes[0]);
        }
      },
      error: error => {
        console.error('Error cargando bebés de la familia', error);
        this.bebes = [];
      }
    });
  } catch (error) {
    console.error('Error cargando datos de bebés', error);
    this.bebes = [];
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
  lineas.push('');
  lineas.push('Detalle:');

  activities
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
    });

  return lineas.join('\n');
}

async seleccionarBebe(bebe: BebeFamilia) {
  try {
    await this.bebeFamiliaService.seleccionarBebeActivo(bebe.id);
    this.bebeActivoId = bebe.id;

    // Más adelante, cuando las actividades estén en Firebase,
    // acá recargaremos actividades del bebé seleccionado.
    await this.cargarActividadesDeHoy();
    await this.cargarProgresoOnzas();
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

  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  let meses =
    (hoy.getFullYear() - nacimiento.getFullYear()) * 12 +
    (hoy.getMonth() - nacimiento.getMonth());

  if (hoy.getDate() < nacimiento.getDate()) {
    meses--;
  }

  return Math.max(meses, 0);
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
}
