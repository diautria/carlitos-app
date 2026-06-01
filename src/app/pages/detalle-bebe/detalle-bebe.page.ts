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
  IonToggle,
  IonAccordion,
  IonAccordionGroup,
  IonSpinner,
  IonCard,
  IonCardContent
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  calendar,
  personOutline,
  fitness,
  resize,
  documentText,
  addCircle,
  addCircleOutline,
  createOutline,
  trashOutline,
  close,
  medicalOutline,
  waterOutline,
  timeOutline,
  checkmarkCircleOutline,
  fitnessOutline,
  resizeOutline,
  calendarOutline,
  barChart,
  barChartOutline,
  chevronForwardOutline,
  statsChartOutline
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
    IonToggle,
    IonAccordion,
    IonAccordionGroup,
    IonSpinner,
    IonCard,
    IonCardContent
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
  cargandoDetalle = true;
  edadMeses = 0;
  seccionesAbiertas: string[] = [];
  private cargandoBebe = false;

  showModalNota = false;
  nuevaNota = '';
  indiceNotaEditando: number | null = null;
  notaTocada = false;
  guardandoNota = false;

  showModalMedicamento = false;
  indiceMedicamentoEditando: number | null = null;
  medicamentoForm: MedicamentoBebe = this.crearMedicamentoVacio();
  guardandoMedicamento = false;

  erroresMedicamento = {
    nombre: '',
    dosisGotas: '',
    horarioFrecuencia: ''
  };

  camposMedicamentoTocados = {
    nombre: false,
    dosisGotas: false,
    horarioFrecuencia: false
  };

  async ngOnInit() {
    addIcons({
      calendar,
      personOutline,
      fitness,
      resize,
      documentText,
      addCircle,
      addCircleOutline,
      createOutline,
      trashOutline,
      close,
      medicalOutline,
      waterOutline,
      timeOutline,
      checkmarkCircleOutline,
      fitnessOutline,
      resizeOutline,
      calendarOutline,
      barChart,
      barChartOutline,
      chevronForwardOutline,
      statsChartOutline
    });

  }

  async ionViewWillEnter() {
    await this.cargarBebe();
  }

  private async cargarBebe() {
    if (this.cargandoBebe) {
      return;
    }

    this.cargandoBebe = true;
    this.cargandoDetalle = true;

    const bebeId = this.route.snapshot.paramMap.get('id');

    if (!bebeId) {
      this.bebe = null;
      this.edadMeses = 0;
      this.cargandoDetalle = false;
      this.cargandoBebe = false;
      return;
    }

    try {
      this.bebe = await this.bebeFamiliaService.obtenerBebePorIdAsync(bebeId);
      this.edadMeses = this.bebe
        ? this.calcularEdadMeses(this.bebe.fechaNacimiento)
        : 0;
    } finally {
      this.cargandoDetalle = false;
      this.cargandoBebe = false;
    }
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

  abrirModalNota() {
    this.nuevaNota = '';
    this.indiceNotaEditando = null;
    this.notaTocada = false;
    this.showModalNota = true;
  }

  cerrarModalNota() {
    this.showModalNota = false;
    this.nuevaNota = '';
    this.indiceNotaEditando = null;
    this.notaTocada = false;
    this.guardandoNota = false;
  }

  trackByMedicamentoId(_index: number, medicamento: MedicamentoBebe): string {
    return medicamento.id;
  }

  trackByNota(_index: number, nota: string): string {
    return nota;
  }

  abrirModalEditarNota(index: number, nota: string) {
    this.indiceNotaEditando = index;
    this.nuevaNota = nota;
    this.notaTocada = false;
    this.showModalNota = true;
  }

  marcarNotaTocada() {
    this.notaTocada = true;
  }

  get notaRequerida(): boolean {
    return !this.nuevaNota.trim();
  }

  get puedeGuardarNota(): boolean {
    return !this.notaRequerida && !!this.bebe && !this.guardandoNota;
  }

  async guardarNota() {
    if (this.guardandoNota) {
      return;
    }

    const nota = this.nuevaNota.trim();

    if (!nota || !this.bebe) {
      this.notaTocada = true;
      return;
    }

    this.guardandoNota = true;

    try {
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
    } finally {
      this.guardandoNota = false;
    }
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
      dosisGotas: undefined as unknown as number,
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
    this.resetCamposMedicamentoTocados();
    this.showModalMedicamento = true;
  }

  abrirModalEditarMedicamento(index: number, medicamento: MedicamentoBebe) {
    this.indiceMedicamentoEditando = index;

    this.medicamentoForm = {
      ...medicamento
    };

    this.limpiarErroresMedicamento();
    this.resetCamposMedicamentoTocados();
    this.showModalMedicamento = true;
  }

  cerrarModalMedicamento() {
    this.showModalMedicamento = false;
    this.indiceMedicamentoEditando = null;
    this.medicamentoForm = this.crearMedicamentoVacio();
    this.limpiarErroresMedicamento();
    this.resetCamposMedicamentoTocados();
    this.guardandoMedicamento = false;
  }

  private limpiarErroresMedicamento() {
    this.erroresMedicamento = {
      nombre: '',
      dosisGotas: '',
      horarioFrecuencia: ''
    };
  }

  marcarCampoMedicamentoTocado(campo: keyof DetalleBebePage['camposMedicamentoTocados']) {
    this.camposMedicamentoTocados = {
      ...this.camposMedicamentoTocados,
      [campo]: true
    };
  }

  private resetCamposMedicamentoTocados() {
    this.camposMedicamentoTocados = {
      nombre: false,
      dosisGotas: false,
      horarioFrecuencia: false
    };
  }

  private marcarCamposMedicamentoTocados() {
    this.camposMedicamentoTocados = {
      nombre: true,
      dosisGotas: true,
      horarioFrecuencia: true
    };
  }

  private campoNumericoVacio(valor: unknown): boolean {
    return valor === undefined || valor === null || String(valor).trim() === '';
  }

  private esNumeroPositivo(valor: unknown): boolean {
    if (this.campoNumericoVacio(valor)) {
      return false;
    }

    return Number(valor) > 0;
  }

  get medicamentoNombreRequerido(): boolean {
    return !this.medicamentoForm.nombre?.trim();
  }

  get medicamentoDosisRequerida(): boolean {
    return this.campoNumericoVacio(this.medicamentoForm.dosisGotas);
  }

  get medicamentoDosisInvalida(): boolean {
    return (
      !this.medicamentoDosisRequerida &&
      !this.esNumeroPositivo(this.medicamentoForm.dosisGotas)
    );
  }

  get medicamentoFrecuenciaInvalida(): boolean {
    return (
      !this.campoNumericoVacio(this.medicamentoForm.frecuenciaHoras) &&
      !this.esNumeroPositivo(this.medicamentoForm.frecuenciaHoras)
    );
  }

  get medicamentoHorarioFrecuenciaRequerido(): boolean {
    return (
      !this.esNumeroPositivo(this.medicamentoForm.frecuenciaHoras) &&
      !this.medicamentoForm.horario?.trim()
    );
  }

  get puedeGuardarMedicamento(): boolean {
    return (
      !this.medicamentoNombreRequerido &&
      !this.medicamentoDosisRequerida &&
      !this.medicamentoDosisInvalida &&
      !this.medicamentoFrecuenciaInvalida &&
      !this.medicamentoHorarioFrecuenciaRequerido &&
      !this.guardandoMedicamento
    );
  }

  private validarMedicamento(): boolean {
    this.limpiarErroresMedicamento();

    let esValido = true;

    if (this.medicamentoNombreRequerido) {
      this.erroresMedicamento.nombre = 'El nombre del medicamento es obligatorio.';
      esValido = false;
    }

    if (this.medicamentoDosisRequerida) {
      this.erroresMedicamento.dosisGotas = 'La dosis en gotas es obligatoria.';
      esValido = false;
    }

    if (this.medicamentoDosisInvalida) {
      this.erroresMedicamento.dosisGotas = 'La dosis debe ser mayor a 0.';
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

    if (this.medicamentoHorarioFrecuenciaRequerido) {
      this.erroresMedicamento.horarioFrecuencia =
        'Indicá cada cuántas horas o un horario fijo.';
      esValido = false;
    }

    if (this.medicamentoFrecuenciaInvalida) {
      this.erroresMedicamento.horarioFrecuencia =
        'La frecuencia debe ser mayor a 0.';
      esValido = false;
    }

    if (!esValido) {
      this.marcarCamposMedicamentoTocados();
    }

    return esValido;
  }

  async guardarMedicamento() {
    if (this.guardandoMedicamento) {
      return;
    }

    if (!this.bebe) {
      return;
    }

    if (!this.validarMedicamento()) {
      return;
    }

    this.guardandoMedicamento = true;

    try {
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
    } finally {
      this.guardandoMedicamento = false;
    }
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

    const actividades = await this.activityFamiliaService.getAllByBebeId(
      this.bebe.id
    );

    await this.notificacionMedicamentosService.programarNotificacionesMedicamentos(
      this.bebe.id,
      this.bebe.nombre,
      this.bebe.medicamentos || [],
      actividades
    );
  }

  obtenerTextoFrecuencia(medicamento: any): string {
  const frecuenciaHoras = Number(medicamento.frecuenciaHoras || 0);
  const horario = medicamento.horario;

  if (frecuenciaHoras > 0 && horario) {
    return `Cada ${frecuenciaHoras} h desde las ${horario}`;
  }

  if (frecuenciaHoras > 0) {
    return `Cada ${frecuenciaHoras} h`;
  }

  if (horario) {
    return `Horario fijo: ${horario}`;
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
