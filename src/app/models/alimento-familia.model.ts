export type CategoriaAlimento =
  | 'fruta'
  | 'verdura'
  | 'cereal'
  | 'proteina'
  | 'legumbre'
  | 'lacteo'
  | 'grasa'
  | 'otro';

export interface AlimentoFamilia {
  id: string;
  familiaId: string;
  nombre: string;
  categoria: CategoriaAlimento;
  activo: boolean;
  creadoPorUid: string;
  vecesUsado?: number;
  ultimaVezUsado?: string;
  createdAt: any;
  updatedAt?: any;
}
