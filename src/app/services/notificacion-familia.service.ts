import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FamiliaMiembrosService } from './familia-miembros.service';
import { ActivityFamilia } from '../models/activity-familia.model';

export interface RecordatorioFamilia {
  recordatorioId: string;
  notificationId: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  fechaNotificacion: Date;
  bebeId?: string;
  medicamentoId?: string;
}

const NOTIFICATION_SMALL_ICON = 'ic_notification_c';
const NOTIFICATION_LARGE_ICON = 'ic_notification_large';

@Injectable({
  providedIn: 'root'
})
export class NotificacionFamiliaService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private familiaMiembrosService = inject(FamiliaMiembrosService);

  private notificacionesBase = 5000;
  private ultimaNotificacionId = 0;
  private unsubscribe?: () => void;
  private unsubscribeRecordatorios?: () => void;

  async notificarFamilia(
    actividad: ActivityFamilia,
    nombreBebe: string,
    tipo: string
  ): Promise<void> {
    try {
      const usuario = await this.obtenerUsuarioActual();
      const familiaId = await this.obtenerFamiliaActivaId(usuario.uid);
      const miembros = await this.familiaMiembrosService.obtenerMiembrosFamiliaActiva();

      const notificacionesRef = collection(
        this.firestore,
        `familias/${familiaId}/notificaciones`
      );

      const mensaje = this.obtenerMensajeActividad(actividad, nombreBebe, tipo);

      await Promise.all(miembros.map(miembro => addDoc(notificacionesRef, {
        tipo,
        titulo: `Actualizacion de ${nombreBebe}`,
        mensaje,
        bebeId: actividad.bebeId,
        actividadId: actividad.id,
        usuarioId: usuario.uid,
        destinatarioUid: miembro.uid,
        createdAt: serverTimestamp()
      })));
    } catch (error) {
      console.error('Error notificando a la familia:', error);
    }
  }

  async iniciarEscuchaNotificaciones(): Promise<void> {
    try {
      const usuario = await this.obtenerUsuarioActual();
      const familiaId = await this.obtenerFamiliaActivaId(usuario.uid);

      this.iniciarEscuchaNotificacionesInstantaneas(familiaId, usuario.uid);
      this.iniciarEscuchaRecordatoriosFamilia(familiaId, usuario.uid);
    } catch (error) {
      console.error('Error iniciando escucha de notificaciones:', error);
    }
  }

  detenerEscuchaNotificaciones(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }

    if (this.unsubscribeRecordatorios) {
      this.unsubscribeRecordatorios();
      this.unsubscribeRecordatorios = undefined;
    }
  }

  async programarRecordatorioFamilia(
    recordatorio: RecordatorioFamilia
  ): Promise<void> {
    try {
      const usuario = await this.obtenerUsuarioActual();
      const familiaId = await this.obtenerFamiliaActivaId(usuario.uid);
      const miembros = await this.familiaMiembrosService.obtenerMiembrosFamiliaActiva();

      const recordatoriosRef = collection(
        this.firestore,
        `familias/${familiaId}/recordatorios`
      );

      await Promise.all(miembros.map(miembro => setDoc(
        doc(recordatoriosRef, `${recordatorio.recordatorioId}_${miembro.uid}`),
        {
          ...recordatorio,
          fechaNotificacion: recordatorio.fechaNotificacion.toISOString(),
          destinatarioUid: miembro.uid,
          usuarioId: usuario.uid,
          updatedAt: serverTimestamp()
        }
      )));
    } catch (error) {
      console.error('Error programando recordatorio familiar:', error);
    }
  }

  async cancelarRecordatorioFamilia(recordatorioId: string): Promise<void> {
    try {
      const usuario = await this.obtenerUsuarioActual();
      const familiaId = await this.obtenerFamiliaActivaId(usuario.uid);

      const recordatoriosRef = collection(
        this.firestore,
        `familias/${familiaId}/recordatorios`
      );

      const q = query(
        recordatoriosRef,
        where('recordatorioId', '==', recordatorioId)
      );

      const snapshot = await getDocs(q);

      await Promise.all(snapshot.docs.map(docSnap => deleteDoc(docSnap.ref)));
    } catch (error) {
      console.error('Error cancelando recordatorio familiar:', error);
    }
  }

  async cancelarRecordatoriosFamiliaPorPrefijo(
    recordatorioIdPrefix: string
  ): Promise<void> {
    try {
      const usuario = await this.obtenerUsuarioActual();
      const familiaId = await this.obtenerFamiliaActivaId(usuario.uid);

      const recordatoriosRef = collection(
        this.firestore,
        `familias/${familiaId}/recordatorios`
      );

      const snapshot = await getDocs(recordatoriosRef);
      const docsACancelar = snapshot.docs.filter(docSnap => {
        const recordatorio = docSnap.data() as any;
        return String(recordatorio.recordatorioId || '').startsWith(
          recordatorioIdPrefix
        );
      });

      await Promise.all(docsACancelar.map(docSnap => deleteDoc(docSnap.ref)));
    } catch (error) {
      console.error('Error cancelando recordatorios familiares:', error);
    }
  }

  private iniciarEscuchaNotificacionesInstantaneas(
    familiaId: string,
    uid: string
  ): void {
    const notificacionesRef = collection(
      this.firestore,
      `familias/${familiaId}/notificaciones`
    );

    const q = query(
      notificacionesRef,
      where('destinatarioUid', '==', uid)
    );

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== 'added') {
          continue;
        }

        const notificacion = change.doc.data() as any;

        if (notificacion.usuarioId !== uid) {
          await this.mostrarNotificacionLocal(notificacion);
        }

        await deleteDoc(change.doc.ref);
      }
    });
  }

  private iniciarEscuchaRecordatoriosFamilia(
    familiaId: string,
    uid: string
  ): void {
    const recordatoriosRef = collection(
      this.firestore,
      `familias/${familiaId}/recordatorios`
    );

    const q = query(
      recordatoriosRef,
      where('destinatarioUid', '==', uid)
    );

    if (this.unsubscribeRecordatorios) {
      this.unsubscribeRecordatorios();
    }

    this.unsubscribeRecordatorios = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const recordatorio = change.doc.data() as any;

        if (change.type === 'removed') {
          await this.cancelarNotificacionLocal(recordatorio.notificationId);
          continue;
        }

        await this.programarNotificacionLocal(recordatorio);
      }
    });
  }

  private async mostrarNotificacionLocal(notificacion: any): Promise<void> {
    try {
      const permisoOk = await this.asegurarPermiso();

      if (!permisoOk) {
        return;
      }

      const notificationId = this.notificacionesBase + (++this.ultimaNotificacionId);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: notificacion.titulo,
            body: notificacion.mensaje,
            smallIcon: NOTIFICATION_SMALL_ICON,
            largeIcon: NOTIFICATION_LARGE_ICON,
            schedule: {
              at: new Date(Date.now() + 500),
              allowWhileIdle: true
            },
            extra: {
              bebeId: notificacion.bebeId,
              tipo: notificacion.tipo
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error mostrando notificacion local:', error);
    }
  }

  private async programarNotificacionLocal(recordatorio: any): Promise<void> {
    try {
      const fechaNotificacion = new Date(recordatorio.fechaNotificacion);

      if (
        !recordatorio.notificationId ||
        Number.isNaN(fechaNotificacion.getTime()) ||
        fechaNotificacion <= new Date()
      ) {
        return;
      }

      const permisoOk = await this.asegurarPermiso();

      if (!permisoOk) {
        return;
      }

      await this.cancelarNotificacionLocal(recordatorio.notificationId);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: recordatorio.notificationId,
            title: recordatorio.titulo,
            body: recordatorio.mensaje,
            smallIcon: NOTIFICATION_SMALL_ICON,
            largeIcon: NOTIFICATION_LARGE_ICON,
            schedule: {
              at: fechaNotificacion,
              allowWhileIdle: true
            },
            extra: {
              bebeId: recordatorio.bebeId,
              medicamentoId: recordatorio.medicamentoId,
              tipo: recordatorio.tipo
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error programando notificacion local familiar:', error);
    }
  }

  private async cancelarNotificacionLocal(notificationId: number): Promise<void> {
    await LocalNotifications.cancel({
      notifications: [
        { id: notificationId }
      ]
    });
  }

  private async asegurarPermiso(): Promise<boolean> {
    const permiso = await LocalNotifications.checkPermissions();

    if (permiso.display === 'granted') {
      return true;
    }

    const permisoSolicitado = await LocalNotifications.requestPermissions();

    return permisoSolicitado.display === 'granted';
  }

  private obtenerMensajeActividad(
    actividad: ActivityFamilia,
    nombreBebe: string,
    tipo: string
  ): string {
    if (tipo === 'toma-leche') {
      const tomaActividad = actividad as any;

      return tomaActividad.esLecheMaterna
        ? `Toma de leche materna registrada para ${nombreBebe}`
        : `Toma de leche de formula registrada para ${nombreBebe}`;
    }

    if (tipo === 'cambio-panal') {
      return `Cambio de panal registrado para ${nombreBebe}`;
    }

    if (tipo === 'medicamento') {
      const medActividad = actividad as any;

      return `Medicamento ${medActividad.nombreMedicamento} administrado a ${nombreBebe}`;
    }

    if (tipo === 'sueno') {
      return `Sueno registrado para ${nombreBebe}`;
    }

    return `Nueva actividad registrada para ${nombreBebe}`;
  }

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

  private async obtenerFamiliaActivaId(uid: string): Promise<string> {
    const usuarioRef = doc(this.firestore, `usuarios/${uid}`);
    const usuarioSnap = await getDoc(usuarioRef);

    if (!usuarioSnap.exists()) {
      throw new Error('No existe el documento del usuario');
    }

    const data = usuarioSnap.data();
    const familiaActivaId = data['familiaActivaId'];

    if (!familiaActivaId) {
      throw new Error('El usuario no tiene familia activa');
    }

    return familiaActivaId;
  }
}
