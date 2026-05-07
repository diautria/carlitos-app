import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonAvatar, IonLabel, IonItem, IonList, IonIcon, IonBadge, IonProgressBar, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { people, time, medical, chevronForward, water } from 'ionicons/icons';
import { BebeService } from '../services/bebe.service';
import { Bebe } from '../models/bebe.model';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../models/activity.model';
import { ConfiguracionService } from '../services/configuracion.service';
import { personOutline } from 'ionicons/icons';

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
    IonIcon
  ],
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {
  private bebeService = inject(BebeService);
  private activityService = inject(ActivityService);
  private configuracionService = inject(ConfiguracionService);
  
  bebes: Bebe[] = [];
  actividadesRecientes: Activity[] = [];
  actividadesHoy: Activity[] = [];
  onzasTomadasHoy = 0;
  onzasDiariasObjetivo = 24;
  porcentajeOnzas = 0;
  progresoOnzas = 0;

  async ngOnInit() {
   addIcons({ people, time, medical, chevronForward, personOutline });

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
    await this.cargarDatosBebe();
    await this.cargarActividadesDeHoy();
    await this.cargarProgresoOnzas();
  }

  private async cargarActividadesDeHoy() {
    this.actividadesRecientes = (await this.activityService.getByDay(new Date()))
      .sort((a, b) => {
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      });
  }

  getTituloActividad(actividad: Activity): string {
    if (actividad.type === 'toma-leche') {
      return 'Toma de leche';
    }

    if (actividad.type === 'cambio-panal') {
      return 'Cambio de pañal';
    }

    return 'Actividad';
  }

  getDescripcionActividad(actividad: Activity): string {
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
    this.onzasDiariasObjetivo =
      await this.configuracionService.obtenerOnzasDiariasObjetivo();

    const actividadesHoy = await this.activityService.getByDay(new Date());

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
    const bebe = await this.configuracionService.obtenerBebePrincipal();

    this.bebes = [bebe];
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

private generarMensajeActividadesDelDia(activities: Activity[]): string {
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
}
