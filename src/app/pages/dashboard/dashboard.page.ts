import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonAvatar, IonLabel, IonItem, IonList, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { people, time, medical, chevronForward } from 'ionicons/icons';
import { BebeService } from '../../services/bebe.service';
import { Bebe, Actividad } from '../../models/bebe.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
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
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  private bebeService = inject(BebeService);
  
  bebes: Bebe[] = [];
  actividadesRecientes: Actividad[] = [];

  ngOnInit() {
    addIcons({ people, time, medical, chevronForward });
    
    this.bebeService.getBebes().subscribe(bebes => {
      this.bebes = bebes;
    });

    this.actividadesRecientes = this.bebeService.getActividadesRecientes(5);
  }

  getIconoTipo(tipo: string): string {
    const iconos: Record<string, string> = {
      alimentacion: 'restaurant',
      sueno: 'moon',
      cambio: 'water',
      medicamento: 'medical',
      vaccine: 'shield'
    };
    return iconos[tipo] || 'ellipse';
  }

  getColorTipo(tipo: string): string {
    const colores: Record<string, string> = {
      alimentacion: 'success',
      sueno: 'primary',
      cambio: 'warning',
      medicamento: 'danger',
      vaccine: 'medium'
    };
    return colores[tipo] || 'medium';
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
}