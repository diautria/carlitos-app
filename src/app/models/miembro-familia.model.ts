export type RolFamilia = 'admin' | 'miembro' | 'solo-lectura';

export interface MiembroFamilia {
  uid: string;
  email: string;
  nombre?: string;
  photoURL?: string;

  rol: RolFamilia;
  estado: 'activo' | 'pendiente' | 'bloqueado';

  agregadoPorUid?: string;
  createdAt: any;
  updatedAt?: any;
}