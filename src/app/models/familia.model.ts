export type PlanFamilia = 'gratis' | 'premium' | 'admin';

export interface Familia {
  id: string;
  nombre: string;

  creadoPorUid: string;
  plan: PlanFamilia;

  codigoInvitacion?: string;
  codigoInvitacionActivo: boolean;

  createdAt: any;
  updatedAt?: any;
}