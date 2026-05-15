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
  IonTextarea,
  IonInput,
  IonToggle
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
  close,
  medicalOutline,
  waterOutline,
  timeOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

import { BebeFamiliaService } from '../../services/bebe-familia.service';
import { BebeFamilia, MedicamentoBebe } from '../../models/bebe-familia.model';
import { NotificacionMedicamentosService } from '../../services/notificacion-medicamentos.service';
import { ActivityFamiliaService } from 'src/app/services/activity-familia.service';
import { AlertController } from '@ionic/angular';

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
    IonTextarea,
    IonInput,
    IonToggle
  ],
  templateUrl: './detalle-bebe.page.html',
  styleUrls: ['./detalle-bebe.page.scss']
})
export class DetalleBebePage implements OnInit {
  private route = inject(ActivatedRoute);
  private bebeFamiliaService = inject(BebeFamiliaService);
  private notificacionMedicamentosService = inject(NotificacionMedicamentosService);
private alertController = inject(AlertController);
private activityFamiliaService = inject(ActivityFamiliaService);

  bebe: BebeFamilia | null = null;

  showModalNota = false;
  nuevaNota = '';
  indiceNotaEditando: number | null = null;

  showModalMedicamento = false;
  indiceMedicamentoEditando: number | null = null;
  medicamentoForm: MedicamentoBebe = this.crearMedicamentoVacio();

  erroresMedicamento = {
    nombre: '',
    dosisGotas: '',
    horarioFrecuencia: ''
  };

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
      close,
      medicalOutline,
      waterOutline,
      timeOutline,
      checkmarkCircleOutline
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

  private crearMedicamentoVacio(): MedicamentoBebe {
    return {
      id: crypto.randomUUID(),
      nombre: '',
      dosisGotas: 0,
      frecuenciaHoras: undefined,
      horario: '',
      observaciones: '',
      activo: true
    };
  }

  abrirModalMedicamento() {
    this.indiceMedicamentoEditando = null;
    this.medicamentoForm = this.crearMedicamentoVacio();
    this.limpiarErroresMedicamento();
    this.showModalMedicamento = true;
  }

  abrirModalEditarMedicamento(index: number, medicamento: MedicamentoBebe) {
    this.indiceMedicamentoEditando = index;

    this.medicamentoForm = {
      ...medicamento
    };

    this.limpiarErroresMedicamento();
    this.showModalMedicamento = true;
  }

  cerrarModalMedicamento() {
    this.showModalMedicamento = false;
    this.indiceMedicamentoEditando = null;
    this.medicamentoForm = this.crearMedicamentoVacio();
    this.limpiarErroresMedicamento();
  }

  private limpiarErroresMedicamento() {
    this.erroresMedicamento = {
      nombre: '',
      dosisGotas: '',
      horarioFrecuencia: ''
    };
  }

  private validarMedicamento(): boolean {
    this.limpiarErroresMedicamento();

    let esValido = true;

    const nombre = this.medicamentoForm.nombre?.trim();

    if (!nombre) {
      this.erroresMedicamento.nombre = 'El nombre del medicamento es obligatorio.';
      esValido = false;
    }

    if (
      !this.medicamentoForm.dosisGotas ||
      Number(this.medicamentoForm.dosisGotas) <= 0
    ) {
      this.erroresMedicamento.dosisGotas = 'La dosis en gotas es obligatoria.';
      esValido = false;
    }

    const tieneFrecuencia =
      this.medicamentoForm.frecuenciaHoras !== undefined &&
      this.medicamentoForm.frecuenciaHoras !== null &&
      String(this.medicamentoForm.frecuenciaHoras).trim() !== '' &&
      Number(this.medicamentoForm.frecuenciaHoras) > 0;

    const tieneHorario =
      !!this.medicamentoForm.horario &&
      this.medicamentoForm.horario.trim() !== '';

    if (!tieneFrecuencia && !tieneHorario) {
      this.erroresMedicamento.horarioFrecuencia =
        'Debes indicar una hora fija o cada cuántas horas debe tomarlo.';
      esValido = false;
    }

    return esValido;
  }

  async guardarMedicamento() {
    if (!this.bebe) {
      return;
    }

    if (!this.validarMedicamento()) {
      return;
    }

    const nombre = this.medicamentoForm.nombre.trim();
    const medicamentosActuales = [...(this.bebe.medicamentos || [])];

    const medicamentoGuardar: MedicamentoBebe = {
      ...this.medicamentoForm,
      nombre,
      dosisGotas: Number(this.medicamentoForm.dosisGotas),
      frecuenciaHoras:
        this.medicamentoForm.frecuenciaHoras !== undefined &&
        this.medicamentoForm.frecuenciaHoras !== null &&
        String(this.medicamentoForm.frecuenciaHoras).trim() !== ''
          ? Number(this.medicamentoForm.frecuenciaHoras)
          : undefined,
      horario: this.medicamentoForm.horario || '',
      observaciones: this.medicamentoForm.observaciones?.trim() || '',
      activo: !!this.medicamentoForm.activo
    };

    if (this.indiceMedicamentoEditando !== null) {
      medicamentosActuales[this.indiceMedicamentoEditando] = medicamentoGuardar;
    } else {
      medicamentosActuales.push(medicamentoGuardar);
    }

    await this.bebeFamiliaService.actualizarBebe(this.bebe.id, {
      medicamentos: medicamentosActuales
    });

    this.bebe = {
      ...this.bebe,
      medicamentos: medicamentosActuales
    };

    await this.programarNotificacionesMedicamentos();

    this.cerrarModalMedicamento();
  }

  async eliminarMedicamento(index: number) {
  if (!this.bebe) {
    return;
  }

  const medicamentosActuales = [...(this.bebe.medicamentos || [])];
  const medicamento = medicamentosActuales[index];

  if (!medicamento) {
    return;
  }

  const tieneActividades =
    await this.medicamentoTieneActividadesRegistradas(medicamento.id);

  if (tieneActividades) {
    const alert = await this.alertController.create({
      header: 'No se puede eliminar',
      message:
        'Este medicamento ya tiene actividades registradas. Para no perder el historial, solo puedes desactivarlo.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Desactivar',
          role: 'destructive',
          handler: async () => {
            await this.cambiarEstadoMedicamento(index, false);
          }
        }
      ]
    });

    await alert.present();
    return;
  }

  const alert = await this.alertController.create({
    header: 'Eliminar medicamento',
    message: `¿Confirmas eliminar "${medicamento.nombre}"?`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          medicamentosActuales.splice(index, 1);

          await this.bebeFamiliaService.actualizarBebe(this.bebe!.id, {
            medicamentos: medicamentosActuales
          });

          this.bebe = {
            ...this.bebe!,
            medicamentos: medicamentosActuales
          };

          await this.notificacionMedicamentosService.cancelarNotificacionMedicamento(
            medicamento.id
          );

          await this.programarNotificacionesMedicamentos();
        }
      }
    ]
  });

  await alert.present();
}

  async cambiarEstadoMedicamento(index: number, activo: boolean) {
    if (!this.bebe) {
      return;
    }

    const medicamentosActuales = [...(this.bebe.medicamentos || [])];

    medicamentosActuales[index] = {
      ...medicamentosActuales[index],
      activo
    };

    await this.bebeFamiliaService.actualizarBebe(this.bebe.id, {
      medicamentos: medicamentosActuales
    });

    this.bebe = {
      ...this.bebe,
      medicamentos: medicamentosActuales
    };

    await this.programarNotificacionesMedicamentos();
  }

  private async programarNotificacionesMedicamentos() {
    if (!this.bebe) {
      return;
    }

    await this.notificacionMedicamentosService.programarNotificacionesMedicamentos(
      this.bebe.id,
      this.bebe.nombre,
      this.bebe.medicamentos || []
    );
  }

  obtenerTextoFrecuencia(medicamento: MedicamentoBebe): string {
    if (medicamento.frecuenciaHoras && medicamento.frecuenciaHoras > 0) {
      return `Cada ${medicamento.frecuenciaHoras} horas`;
    }

    if (medicamento.horario) {
      return `A las ${medicamento.horario}`;
    }

    return 'Sin horario definido';
  }

  private async medicamentoTieneActividadesRegistradas(
  medicamentoId: string
): Promise<boolean> {
  const actividades = await this.activityFamiliaService.getAll();

  return actividades.some(activity => {
    return activity.type === 'medicamento' &&
      (activity as any).medicamentoId === medicamentoId;
  });
}
}