export type ActivityFamiliaType =
  | 'toma-leche'
  | 'cambio-panal'
  | 'medicamento'
  | 'sueno';

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

export interface MedicamentoFamiliaActivity extends BaseActivityFamilia {
  type: 'medicamento';
  medicamentoId: string;
  nombreMedicamento: string;
  dosisGotas: number;
  observaciones?: string;
}

export interface SuenoFamiliaActivity extends BaseActivityFamilia {
  type: 'sueno';

  /**
   * Inicio del sueño.
   * Normalmente será igual que time.
   */
  inicio: string;

  /**
   * Fin del sueño.
   * Si está null, significa que el bebé sigue durmiendo.
   */
  fin: string | null;

  /**
   * Duración en minutos.
   * Se calcula cuando se registra el fin.
   */
  duracionMinutos: number;

  observaciones?: string;
}

export type ActivityFamilia =
  | TomaLecheFamiliaActivity
  | CambioPanalFamiliaActivity
  | MedicamentoFamiliaActivity
  | SuenoFamiliaActivity;