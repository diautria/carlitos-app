import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendar,
  personOutline,
  fitness,
  resize,
  documentText,
  addCircleOutline,
  createOutline,
  trashOutline,
  close
} from 'ionicons/icons';

import { BebeFamiliaService } from '../../services/bebe-familia.service';
import { BebeFamilia } from '../../models/bebe-familia.model';

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
  private route = inject(ActivatedRoute);
  private bebeFamiliaService = inject(BebeFamiliaService);

  bebe: BebeFamilia | null = null;

  showModalNota = false;
  nuevaNota = '';
  indiceNotaEditando: number | null = null;

  async ngOnInit() {
    addIcons({
      calendar,
      personOutline,
      fitness,
      resize,
      documentText,
      addCircleOutline,
      createOutline,
      trashOutline,
      close
    });

    await this.cargarBebe();
  }

  async ionViewWillEnter() {
    await this.cargarBebe();
  }

  private async cargarBebe() {
    const bebeId = this.route.snapshot.paramMap.get('id');

    if (!bebeId) {
      this.bebe = null;
      return;
    }

    this.bebe = await this.bebeFamiliaService.obtenerBebePorIdAsync(bebeId);
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

  abrirModalNota() {
    this.nuevaNota = '';
    this.indiceNotaEditando = null;
    this.showModalNota = true;
  }

  cerrarModalNota() {
    this.showModalNota = false;
    this.nuevaNota = '';
    this.indiceNotaEditando = null;
  }

  abrirModalEditarNota(index: number, nota: string) {
    this.indiceNotaEditando = index;
    this.nuevaNota = nota;
    this.showModalNota = true;
  }

  async guardarNota() {
    const nota = this.nuevaNota.trim();

    if (!nota || !this.bebe) {
      return;
    }

    const notasActuales = [...(this.bebe.notas || [])];

    if (this.indiceNotaEditando !== null) {
      notasActuales[this.indiceNotaEditando] = nota;
    } else {
      notasActuales.push(nota);
    }

    await this.bebeFamiliaService.actualizarBebe(this.bebe.id, {
      notas: notasActuales
    });

    this.bebe = {
      ...this.bebe,
      notas: notasActuales
    };

    this.cerrarModalNota();
  }

  async eliminarNota(index: number) {
    if (!this.bebe) {
      return;
    }

    const notasActuales = [...(this.bebe.notas || [])];

    notasActuales.splice(index, 1);

    await this.bebeFamiliaService.actualizarBebe(this.bebe.id, {
      notas: notasActuales
    });

    this.bebe = {
      ...this.bebe,
      notas: notasActuales
    };
  }
}