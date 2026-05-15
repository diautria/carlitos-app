export type ActivityType =
  | 'toma-leche'
  | 'cambio-panal'
  | 'medicamento'
  | 'sueno';

export interface BaseActivity {
  id: string;
  type: ActivityType;
  time: string;
  createdAt: string;
  updatedAt?: string;
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

export interface SuenoActivity extends BaseActivity {
  type: 'sueno';
  inicio: string;
  fin: string | null;
  duracionMinutos: number;
  observaciones?: string;
}

export type Activity =
  | TomaLecheActivity
  | CambioPanalActivity
  | MedicamentoActivity
  | SuenoActivity;