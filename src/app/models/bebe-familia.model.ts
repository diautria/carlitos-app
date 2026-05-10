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
}

export interface CrearBebeFamiliaRequest {
  nombre: string;
  fechaNacimiento: string;
  peso?: number;
  altura?: number;
  fotoUrl?: string;
  proximaVacuna?: string;
  notas?: string[];
}