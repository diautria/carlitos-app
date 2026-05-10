import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { FamiliaMiembro } from '../models/familia-miembro.model';

@Injectable({
  providedIn: 'root'
})
export class FamiliaMiembrosService {
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

  async obtenerFamiliaActivaId(): Promise<string> {
    const usuario = await this.obtenerUsuarioActual();

    const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);
    const usuarioSnap = await getDoc(usuarioRef);

    if (!usuarioSnap.exists()) {
      throw new Error('No existe el documento del usuario.');
    }

    const data = usuarioSnap.data();
    const familiaId = data['familiaActivaId'];

    if (!familiaId) {
      throw new Error('No tenés una familia activa.');
    }

    return familiaId;
  }

  async obtenerMiembrosFamiliaActiva(): Promise<FamiliaMiembro[]> {
    const familiaId = await this.obtenerFamiliaActivaId();

    const miembrosRef = collection(
      this.firestore,
      `familias/${familiaId}/miembros`
    );

    const snapshot = await getDocs(miembrosRef);

    return snapshot.docs
      .map(docSnap => ({
        ...(docSnap.data() as FamiliaMiembro),
        uid: docSnap.id
      }))
      .filter(m => (m as any).estado === 'activo' || (m as any).estado === undefined)
      .sort((a, b) => {
        if (a.rol === 'admin' && b.rol !== 'admin') return -1;
        if (a.rol !== 'admin' && b.rol === 'admin') return 1;
        return a.nombre.localeCompare(b.nombre);
      });
  }

  async obtenerCodigoInvitacionFamiliaActiva(): Promise<string> {
    const familiaId = await this.obtenerFamiliaActivaId();

    const familiaRef = doc(this.firestore, `familias/${familiaId}`);
    const familiaSnap = await getDoc(familiaRef);

    if (!familiaSnap.exists()) {
      throw new Error('No existe la familia.');
    }

    const data = familiaSnap.data();

    if (data['codigoInvitacion']) {
      return data['codigoInvitacion'];
    }

    const codigo = this.generarCodigoInvitacion();

    await updateDoc(familiaRef, {
      codigoInvitacion: codigo,
      updatedAt: serverTimestamp()
    });

    return codigo;
  }

  async regenerarCodigoInvitacion(): Promise<string> {
    await this.validarUsuarioAdmin();

    const familiaId = await this.obtenerFamiliaActivaId();
    const codigo = this.generarCodigoInvitacion();

    const familiaRef = doc(this.firestore, `familias/${familiaId}`);

    await updateDoc(familiaRef, {
      codigoInvitacion: codigo,
      updatedAt: serverTimestamp()
    });

    return codigo;
  }

  async unirseAFamiliaConCodigo(codigo: string): Promise<void> {
    const usuario = await this.obtenerUsuarioActual();

    const codigoNormalizado = codigo.trim().toUpperCase();

    if (!codigoNormalizado) {
      throw new Error('Ingresá un código válido.');
    }

    const familiasRef = collection(this.firestore, 'familias');

    const q = query(
  familiasRef,
  where('codigoInvitacion', '==', codigoNormalizado),
  where('codigoInvitacionActivo', '==', true)
);

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('No existe una familia con ese código.');
    }

    const familiaDoc = snapshot.docs[0];
    const familiaId = familiaDoc.id;

    const miembroRef = doc(
      this.firestore,
      `familias/${familiaId}/miembros/${usuario.uid}`
    );

    await setDoc(
  miembroRef,
  {
    uid: usuario.uid,
    email: usuario.email || '',
    nombre: usuario.displayName || usuario.email || 'Miembro',
    photoURL: usuario.photoURL || '',
    rol: 'miembro',
    estado: 'activo',
    agregadoPorUid: usuario.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  { merge: true }
);

    const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);

    await setDoc(
  usuarioRef,
  {
    uid: usuario.uid,
    nombre: usuario.displayName || usuario.email || 'Usuario',
    email: usuario.email || '',
    photoURL: usuario.photoURL || '',
    familiaActivaId: familiaId,
    bebeActivoId: '',
    updatedAt: serverTimestamp()
  },
  { merge: true }
);
  }

  async quitarMiembro(uid: string): Promise<void> {
    await this.validarUsuarioAdmin();

    const usuario = await this.obtenerUsuarioActual();

    if (usuario.uid === uid) {
      throw new Error('No podés quitarte a vos mismo de la familia.');
    }

    const familiaId = await this.obtenerFamiliaActivaId();

    const miembroRef = doc(
      this.firestore,
      `familias/${familiaId}/miembros/${uid}`
    );

    await updateDoc(miembroRef, {
  estado: 'inactivo',
  updatedAt: serverTimestamp()
});

    const usuarioRef = doc(this.firestore, `usuarios/${uid}`);
    const usuarioSnap = await getDoc(usuarioRef);

    if (usuarioSnap.exists()) {
      const data = usuarioSnap.data();

      if (data['familiaActivaId'] === familiaId) {
        await updateDoc(usuarioRef, {
          familiaActivaId: '',
          bebeActivoId: '',
          updatedAt: serverTimestamp()
        });
      }
    }
  }

  async cambiarRolMiembro(uid: string, rol: 'admin' | 'miembro'): Promise<void> {
    await this.validarUsuarioAdmin();

    const familiaId = await this.obtenerFamiliaActivaId();

    const miembroRef = doc(
      this.firestore,
      `familias/${familiaId}/miembros/${uid}`
    );

    await updateDoc(miembroRef, {
      rol,
      updatedAt: serverTimestamp()
    });
  }

  async esUsuarioAdmin(): Promise<boolean> {
    const usuario = await this.obtenerUsuarioActual();
    const familiaId = await this.obtenerFamiliaActivaId();

    const miembroRef = doc(
      this.firestore,
      `familias/${familiaId}/miembros/${usuario.uid}`
    );

    const miembroSnap = await getDoc(miembroRef);

    if (!miembroSnap.exists()) {
      return false;
    }

    const data = miembroSnap.data();

    return data['rol'] === 'admin' && data['estado'] === 'activo';
  }

  private async validarUsuarioAdmin(): Promise<void> {
    const esAdmin = await this.esUsuarioAdmin();

    if (!esAdmin) {
      throw new Error('Solo un administrador puede realizar esta acción.');
    }
  }

  private generarCodigoInvitacion(): string {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo = '';

    for (let i = 0; i < 6; i++) {
      codigo += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length)
      );
    }

    return codigo;
  }
}