export type RolFamilia = 'admin' | 'miembro';
export type EstadoMiembroFamilia = 'activo' | 'inactivo';

export interface FamiliaMiembro {
  uid: string;
  nombre: string;
  email: string;
  photoURL?: string;
  rol: RolFamilia;
  estado: EstadoMiembroFamilia;
  agregadoPorUid?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface FamiliaResumen {
  id: string;
  nombre: string;
  codigoInvitacion: string;
  codigoInvitacionActivo?: boolean;
  creadoPorUid: string;
  plan?: string;
  createdAt: any;
  updatedAt?: any;
}