// Interfaces para actividades del bebé

export type ActivityType = 'toma-leche' | 'cambio-panal';

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

export type Activity = TomaLecheActivity | CambioPanalActivity;
