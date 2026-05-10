export type ActivityFamiliaType = 'toma-leche' | 'cambio-panal';

export interface BaseActivityFamilia {
  id: string;
  type: ActivityFamiliaType;
  time: string;
  createdAt: any;
  updatedAt?: any;

  familiaId: string;
  bebeId: string;
  creadoPorUid: string;
}

export interface TomaLecheFamiliaActivity extends BaseActivityFamilia {
  type: 'toma-leche';
  cantidadOnzas: number;
  esLecheMaterna: boolean;
}

export interface CambioPanalFamiliaActivity extends BaseActivityFamilia {
  type: 'cambio-panal';
  tieneHeces: boolean;
}

export type ActivityFamilia =
  | TomaLecheFamiliaActivity
  | CambioPanalFamiliaActivity;