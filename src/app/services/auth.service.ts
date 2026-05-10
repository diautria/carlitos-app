import { Injectable, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  user,
  User
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface UsuarioApp {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  familiaActivaId?: string;
  createdAt?: any;
  updatedAt?: any;
  ultimoAcceso?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  usuario$: Observable<User | null> = user(this.auth);

  async loginConGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();

    const credencial = await signInWithPopup(this.auth, provider);
    const usuario = credencial.user;

    await this.crearOActualizarUsuario(usuario);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  private async crearOActualizarUsuario(usuario: User): Promise<void> {
    const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);

    const usuarioApp: UsuarioApp = {
      uid: usuario.uid,
      email: usuario.email || '',
      displayName: usuario.displayName || '',
      photoURL: usuario.photoURL || '',
      updatedAt: serverTimestamp(),
      ultimoAcceso: serverTimestamp()
    };

    await setDoc(usuarioRef, usuarioApp, { merge: true });
  }
}