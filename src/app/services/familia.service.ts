import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FamiliaService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  async crearFamilia(nombre: string): Promise<string> {
    const usuario = this.auth.currentUser;

    if (!usuario) {
      throw new Error('No hay usuario autenticado');
    }

    const familiaRef = doc(collection(this.firestore, 'familias'));
    const familiaId = familiaRef.id;

    const codigoInvitacion = this.generarCodigoInvitacion();

    await setDoc(familiaRef, {
      id: familiaId,
      nombre,
      creadoPorUid: usuario.uid,
      plan: 'gratis',
      codigoInvitacion,
      codigoInvitacionActivo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const miembroRef = doc(
      this.firestore,
      `familias/${familiaId}/miembros/${usuario.uid}`
    );

    await setDoc(miembroRef, {
      uid: usuario.uid,
      email: usuario.email || '',
      nombre: usuario.displayName || '',
      photoURL: usuario.photoURL || '',
      rol: 'admin',
      estado: 'activo',
      agregadoPorUid: usuario.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);

    await setDoc(
  usuarioRef,
  {
    uid: usuario.uid,
    email: usuario.email || '',
    nombre: usuario.displayName || '',
    photoURL: usuario.photoURL || '',
    familiaActivaId: familiaId,
    updatedAt: serverTimestamp()
  },
  { merge: true }
);

    return familiaId;
  }

  private generarCodigoInvitacion(): string {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo = 'FAM-';

    for (let i = 0; i < 5; i++) {
      codigo += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length)
      );
    }

    return codigo;
  }
}