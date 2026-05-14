// Interfaces para actividades del bebé

export type ActivityType = 'toma-leche' | 'cambio-panal'  | 'medicamento';

export interface BaseActivity {
  id: string;
  type: ActivityType;
  time: string; // ISO string
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface TomaLecheActivity extends BaseActivity {
  type: 'toma-leche';
  cantidadOnzas: number;
  esLecheMaterna: boolean;
}

export interface CambioPanalActivity extends BaseActivity {
  type: 'cambio-panal';
  tieneHeces: boolean;
}

export interface MedicamentoActivity extends BaseActivity {
  type: 'medicamento';
  medicamentoId?: string;
  nombreMedicamento: string;
  dosisGotas: number;
  observaciones?: string;
}

export type Activity = TomaLecheActivity | CambioPanalActivity | MedicamentoActivity;
