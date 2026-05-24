import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { ActivityFamilia } from '../models/activity-familia.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityFamiliaService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private async obtenerUsuarioActual() {
    const usuarioActual = this.auth.currentUser;

    if (usuarioActual) {
      return usuarioActual;
    }

    const usuarioFirebase = await firstValueFrom(user(this.auth));

    if (!usuarioFirebase) {
      throw new Error('No hay usuario autenticado');
    }

    return usuarioFirebase;
  }

  private async obtenerContextoActivo(): Promise<{
    uid: string;
    familiaId: string;
    bebeId: string;
  }> {
    const usuario = await this.obtenerUsuarioActual();

    const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);
    const usuarioSnap = await getDoc(usuarioRef);

    if (!usuarioSnap.exists()) {
      throw new Error('No existe el documento del usuario');
    }

    const data = usuarioSnap.data();

    const familiaId = data['familiaActivaId'];
    const bebeId = data['bebeActivoId'];

    if (!familiaId) {
      throw new Error('El usuario no tiene familia activa');
    }

    if (!bebeId) {
      throw new Error('Seleccioná un bebé antes de registrar actividades');
    }

    return {
      uid: usuario.uid,
      familiaId,
      bebeId
    };
  }

  async getAll(): Promise<ActivityFamilia[]> {
    const { familiaId, bebeId } = await this.obtenerContextoActivo();

    const actividadesRef = collection(
      this.firestore,
      `familias/${familiaId}/bebes/${bebeId}/actividades`
    );

    const q = query(actividadesRef, orderBy('time', 'desc'));
    const snapshot = await getDocs(q);

    return this.mapActivities(snapshot.docs);
  }

  async add(activity: ActivityFamilia): Promise<ActivityFamilia> {
    const { uid, familiaId, bebeId } = await this.obtenerContextoActivo();

    const actividadRef = doc(
      collection(
        this.firestore,
        `familias/${familiaId}/bebes/${bebeId}/actividades`
      )
    );

    const actividadAGuardar: ActivityFamilia = {
      ...activity,
      id: actividadRef.id,
      familiaId,
      bebeId,
      creadoPorUid: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } as ActivityFamilia;

    await setDoc(actividadRef, actividadAGuardar);

    return {
      ...actividadAGuardar,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as ActivityFamilia;
  }

  async update(activity: ActivityFamilia): Promise<void> {
    const { familiaId, bebeId } = await this.obtenerContextoActivo();

    if (!activity.id) {
      throw new Error('La actividad no tiene id');
    }

    const actividadRef = doc(
      this.firestore,
      `familias/${familiaId}/bebes/${bebeId}/actividades/${activity.id}`
    );

    await updateDoc(actividadRef, {
      ...activity,
      updatedAt: serverTimestamp()
    });
  }

  async delete(id: string): Promise<void> {
    const { familiaId, bebeId } = await this.obtenerContextoActivo();

    const actividadRef = doc(
      this.firestore,
      `familias/${familiaId}/bebes/${bebeId}/actividades/${id}`
    );

    await deleteDoc(actividadRef);
  }

  async getByDay(date: Date): Promise<ActivityFamilia[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return this.getByDateRange(start, end);
  }

  async getByDateRange(
    start: Date,
    end: Date
  ): Promise<ActivityFamilia[]> {
    const { familiaId, bebeId } = await this.obtenerContextoActivo();

    const actividadesRef = collection(
      this.firestore,
      `familias/${familiaId}/bebes/${bebeId}/actividades`
    );

    const q = query(
      actividadesRef,
      where('time', '>=', this.getLocalDateTimeKey(start)),
      where('time', '<', this.getLocalDateTimeKey(end)),
      orderBy('time', 'desc')
    );

    const snapshot = await getDocs(q);

    return this.mapActivities(snapshot.docs);
  }

  async getByCategory(type: string, date: Date): Promise<ActivityFamilia[]> {
    const dayActs = await this.getByDay(date);
    return dayActs.filter(a => a.type === type);
  }

  private getLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getActivityDateKey(value: string): string {
    if (value.includes('T')) {
      return value.split('T')[0];
    }

    const date = new Date(value);

    return this.getLocalDateKey(date);
  }

  async getAllByBebeId(bebeId: string): Promise<ActivityFamilia[]> {
  const contexto = await this.obtenerContextoActivo();

  const actividadesRef = collection(
    this.firestore,
    `familias/${contexto.familiaId}/bebes/${bebeId}/actividades`
  );

  const snapshot = await getDocs(actividadesRef);

  return snapshot.docs
    .map(docSnap => ({
      ...(docSnap.data() as ActivityFamilia),
      id: docSnap.id
    }))
    .sort((a, b) => b.time.localeCompare(a.time));
}

async obtenerSuenoActivo(): Promise<ActivityFamilia | null> {
  const { familiaId, bebeId } = await this.obtenerContextoActivo();

  const actividadesRef = collection(
    this.firestore,
    `familias/${familiaId}/bebes/${bebeId}/actividades`
  );

  const q = query(
    actividadesRef,
    where('type', '==', 'sueno'),
    where('fin', '==', null),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];

  return {
    ...(docSnap.data() as ActivityFamilia),
    id: docSnap.id
  };
}

async iniciarSueno(fechaInicio: Date = new Date()): Promise<void> {
  const suenoActivo = await this.obtenerSuenoActivo();

  if (suenoActivo) {
    throw new Error('Ya hay un sueño en curso. Primero debes finalizarlo.');
  }

  const inicioIso = fechaInicio.toISOString();

  const actividad: any = {
    id: '',
    type: 'sueno',
    time: inicioIso,
    inicio: inicioIso,
    fin: null,
    duracionMinutos: 0,
    observaciones: ''
  };

  await this.add(actividad);
}

async finalizarSueno(suenoId: string, fechaFin: Date = new Date()): Promise<void> {
  const { familiaId, bebeId } = await this.obtenerContextoActivo();

  const suenoRef = doc(
    this.firestore,
    `familias/${familiaId}/bebes/${bebeId}/actividades/${suenoId}`
  );

  const suenoSnap = await getDoc(suenoRef);

  if (!suenoSnap.exists()) {
    throw new Error('No se encontró el sueño activo.');
  }

  const sueno = {
    ...(suenoSnap.data() as ActivityFamilia),
    id: suenoSnap.id
  };

  if (sueno.type !== 'sueno') {
    throw new Error('No se encontrÃ³ el sueÃ±o activo.');
  }

  const inicio = new Date((sueno as any).inicio || sueno.time);
  const fin = fechaFin;

  if (fin <= inicio) {
    throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
  }

  const duracionMinutos = Math.round(
    (fin.getTime() - inicio.getTime()) / 60000
  );

  await this.update({
    ...(sueno as any),
    fin: fin.toISOString(),
    duracionMinutos
  });
}

async agregarSuenoManual(
  inicio: Date,
  fin: Date | null,
  observaciones: string = ''
): Promise<void> {
  const suenoActivo = await this.obtenerSuenoActivo();

  if (suenoActivo && !fin) {
    throw new Error('Ya hay un sueño en curso. Primero debes finalizarlo.');
  }

  if (fin && fin <= inicio) {
    throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
  }

  const duracionMinutos = fin
    ? Math.round((fin.getTime() - inicio.getTime()) / 60000)
    : 0;

  const actividad: any = {
    id: '',
    type: 'sueno',
    time: inicio.toISOString(),
    inicio: inicio.toISOString(),
    fin: fin ? fin.toISOString() : null,
    duracionMinutos,
    observaciones: observaciones?.trim() || ''
  };

  await this.add(actividad);
}

/**
 * Obtiene actividades de los últimos N meses.
 * Útil para lazy loading de histórico.
 */
async getLastMonths(months: number = 3): Promise<ActivityFamilia[]> {
  const { familiaId, bebeId } = await this.obtenerContextoActivo();
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  cutoffDate.setDate(1);
  cutoffDate.setHours(0, 0, 0, 0);

  const actividadesRef = collection(
    this.firestore,
    `familias/${familiaId}/bebes/${bebeId}/actividades`
  );

  const q = query(
    actividadesRef,
    where('time', '>=', this.getLocalDateTimeKey(cutoffDate)),
    orderBy('time', 'desc')
  );

  const snapshot = await getDocs(q);

  return this.mapActivities(snapshot.docs);
}

/**
 * Obtiene actividades hasta una fecha específica (hacia atrás).
 * Usado para cargar períodos anteriores de forma progresiva.
 */
async getActivitiesBeforeDate(beforeDate: Date, maxResults: number = 500): Promise<ActivityFamilia[]> {
  const { familiaId, bebeId } = await this.obtenerContextoActivo();

  const actividadesRef = collection(
    this.firestore,
    `familias/${familiaId}/bebes/${bebeId}/actividades`
  );

  const q = query(
    actividadesRef,
    where('time', '<', this.getLocalDateTimeKey(beforeDate)),
    orderBy('time', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);

  return this.mapActivities(snapshot.docs);
}

/**
 * Obtiene el mes más antiguo registrado en las actividades.
 */
async getOldestActivityDate(): Promise<Date | null> {
  const { familiaId, bebeId } = await this.obtenerContextoActivo();

  const actividadesRef = collection(
    this.firestore,
    `familias/${familiaId}/bebes/${bebeId}/actividades`
  );

  const q = query(actividadesRef, orderBy('time', 'asc'), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const oldest = snapshot.docs[0].data() as ActivityFamilia;
  return new Date(oldest.time);
}

private getLocalDateTimeKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

private mapActivities(
  docs: Array<{ id: string; data: () => unknown }>
): ActivityFamilia[] {
  return docs.map(docSnap => ({
    ...(docSnap.data() as ActivityFamilia),
    id: docSnap.id
  }));
}
}
