export interface BebeFamilia {
  id: string;
  familiaId: string;

  nombre: string;
  fechaNacimiento: string;

  peso?: number;
  altura?: number;
  fotoUrl?: string;

  proximaVacuna?: string;
  notas?: string[];

  activo: boolean;

  creadoPorUid: string;
  createdAt: any;
  updatedAt?: any;

  medicamentos?: MedicamentoBebe[];
  tiempoEntreTomasHoras?: number;
  tiempoEntreSuenosHoras?: number;
  onzasDiariasObjetivo?: number;
}

export interface CrearBebeFamiliaRequest {
  nombre: string;
  fechaNacimiento: string;
  peso?: number;
  altura?: number;
  fotoUrl?: string;
  proximaVacuna?: string;
  notas?: string[];
  medicamentos?: MedicamentoBebe[];
}

export interface MedicamentoBebe {
  id: string;
  nombre: string;
  dosisGotas: number;
  frecuenciaHoras?: number;
  horario?: string;
  observaciones?: string;
  activo: boolean;
}
