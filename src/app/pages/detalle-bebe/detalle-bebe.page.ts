import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonAvatar,
  IonLabel,
  IonItem,
  IonList,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonButton,
  IonModal,
  IonInput,
  IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  people,
  time,
  medical,
  chevronBack,
  restaurant,
  moon,
  water,
  shield,
  calendar,
  personOutline
} from 'ionicons/icons';

import { ConfiguracionService } from '../../services/configuracion.service';
import { Bebe, Actividad } from '../../models/bebe.model';

@Component({
  selector: 'app-detalle-bebe',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonAvatar,
    IonLabel,
    IonItem,
    IonList,
    IonIcon,
    IonBackButton,
    IonButtons,
    IonButton,
    IonModal,
    IonTextarea
  ],
  templateUrl: './detalle-bebe.page.html',
  styleUrls: ['./detalle-bebe.page.scss']
})
export class DetalleBebePage implements OnInit {
  private configuracionService = inject(ConfiguracionService);

  bebe: Bebe | undefined;
  actividades: Actividad[] = [];
  showModalNota = false;
  nuevaNota = '';

  async ngOnInit() {
    addIcons({
      people,
      time,
      medical,
      chevronBack,
      restaurant,
      moon,
      water,
      shield,
      calendar,
      personOutline
    });

    await this.cargarBebe();
  }

  async ionViewWillEnter() {
    await this.cargarBebe();
  }

  private async cargarBebe() {
    this.bebe = await this.configuracionService.obtenerBebePrincipal();

    /**
     * Por ahora dejamos actividades vacío porque las actividades reales
     * las estás manejando con ActivityService en Tab 2.
     * Si querés, después podemos mostrar acá las actividades reales del día.
     */
    this.actividades = [];
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
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  abrirModalNota() {
  this.nuevaNota = '';
  this.showModalNota = true;
}

cerrarModalNota() {
  this.showModalNota = false;
}

async guardarNota() {
  const nota = this.nuevaNota.trim();

  if (!nota || !this.bebe) {
    return;
  }

  this.bebe = {
    ...this.bebe,
    notas: [
      ...(this.bebe.notas || []),
      nota
    ]
  };

  await this.configuracionService.guardarBebePrincipal(this.bebe);

  this.nuevaNota = '';
  this.showModalNota = false;
}
}