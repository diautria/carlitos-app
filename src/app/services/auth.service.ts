import { Injectable, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
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
import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

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
    let usuario: User;

    if (Capacitor.isNativePlatform()) {
      usuario = await this.loginGoogleAndroid();
    } else {
      usuario = await this.loginGoogleWeb();
    }

    await this.crearOActualizarUsuario(usuario);
  }

  private async loginGoogleWeb(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const credencial = await signInWithPopup(this.auth, provider);
    return credencial.user;
  }

private googleInicializado = false;

private async loginGoogleAndroid(): Promise<User> {
  if (!this.googleInicializado) {
    await GoogleSignIn.initialize({
      clientId: '568462090252-v4ve4c29j81khfvfjj007pnvs6i6s1ik.apps.googleusercontent.com'
    });

    this.googleInicializado = true;
  }

  const resultado = await GoogleSignIn.signIn();

  const idToken = resultado.idToken;

  if (!idToken) {
    throw new Error('Google no devolvió idToken.');
  }

  const credential = GoogleAuthProvider.credential(idToken);

  const credencialFirebase = await signInWithCredential(
    this.auth,
    credential
  );

  return credencialFirebase.user;
}

  async logout(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleSignIn.signOut();
      } catch {}
    }

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