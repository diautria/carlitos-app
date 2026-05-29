import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { AlimentoFamilia, CategoriaAlimento } from '../models/alimento-familia.model';

@Injectable({
  providedIn: 'root'
})
export class AlimentoFamiliaService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private alimentosBase: Array<{ nombre: string; categoria: CategoriaAlimento }> = [
    { nombre: 'Boniato', categoria: 'verdura' },
    { nombre: 'Calabaza', categoria: 'verdura' },
    { nombre: 'Zanahoria', categoria: 'verdura' },
    { nombre: 'Papa', categoria: 'verdura' },
    { nombre: 'Platano', categoria: 'fruta' },
    { nombre: 'Manzana', categoria: 'fruta' },
    { nombre: 'Pera', categoria: 'fruta' },
    { nombre: 'Arroz', categoria: 'cereal' },
    { nombre: 'Avena', categoria: 'cereal' },
    { nombre: 'Pollo', categoria: 'proteina' },
    { nombre: 'Carne', categoria: 'proteina' },
    { nombre: 'Huevo', categoria: 'proteina' },
    { nombre: 'Yogur natural', categoria: 'lacteo' },
    { nombre: 'Aceite de oliva', categoria: 'grasa' }
  ];

  async obtenerAlimentosFamiliaActual(): Promise<AlimentoFamilia[]> {
    const contexto = await this.obtenerContextoActivo();
    const alimentosRef = collection(
      this.firestore,
      `familias/${contexto.familiaId}/alimentos`
    );
    let snapshot = await getDocs(alimentosRef);

    if (snapshot.empty) {
      await this.sembrarAlimentosBase(contexto.familiaId, contexto.uid);
      snapshot = await getDocs(alimentosRef);
    }

    return snapshot.docs
      .map(docSnap => ({
        ...(docSnap.data() as AlimentoFamilia),
        id: docSnap.id
      }))
      .filter(alimento => alimento.activo !== false)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async crearAlimentosPorNombres(nombres: string[]): Promise<AlimentoFamilia[]> {
    const alimentosActuales = await this.obtenerAlimentosFamiliaActual();
    const resultado: AlimentoFamilia[] = [];

    for (const nombre of nombres) {
      const nombreNormalizado = nombre.trim();

      if (!nombreNormalizado) {
        continue;
      }

      const existente = alimentosActuales.find(
        alimento => this.normalizarNombre(alimento.nombre) === this.normalizarNombre(nombreNormalizado)
      );

      if (existente) {
        resultado.push(existente);
        continue;
      }

      const creado = await this.crearAlimento(nombreNormalizado);
      alimentosActuales.push(creado);
      resultado.push(creado);
    }

    return resultado;
  }

  async crearAlimento(nombre: string, categoria: CategoriaAlimento = 'otro'): Promise<AlimentoFamilia> {
    const contexto = await this.obtenerContextoActivo();
    const alimentoRef = doc(
      collection(this.firestore, `familias/${contexto.familiaId}/alimentos`)
    );
    const alimento: AlimentoFamilia = {
      id: alimentoRef.id,
      familiaId: contexto.familiaId,
      nombre: nombre.trim(),
      categoria,
      activo: true,
      creadoPorUid: contexto.uid,
      vecesUsado: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(alimentoRef, alimento);

    return {
      ...alimento,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async desactivarAlimento(alimentoId: string): Promise<void> {
    const contexto = await this.obtenerContextoActivo();
    const alimentoRef = doc(
      this.firestore,
      `familias/${contexto.familiaId}/alimentos/${alimentoId}`
    );

    await updateDoc(alimentoRef, {
      activo: false,
      updatedAt: serverTimestamp()
    });
  }

  async marcarAlimentosUsados(nombres: string[]): Promise<void> {
    const alimentos = await this.crearAlimentosPorNombres(nombres);
    const contexto = await this.obtenerContextoActivo();
    const ahora = new Date().toISOString();

    await Promise.all(
      alimentos.map(alimento => {
        const alimentoRef = doc(
          this.firestore,
          `familias/${contexto.familiaId}/alimentos/${alimento.id}`
        );

        return updateDoc(alimentoRef, {
          vecesUsado: Number(alimento.vecesUsado || 0) + 1,
          ultimaVezUsado: ahora,
          updatedAt: serverTimestamp()
        });
      })
    );
  }

  private async sembrarAlimentosBase(familiaId: string, uid: string): Promise<void> {
    await Promise.all(
      this.alimentosBase.map(alimentoBase => {
        const alimentoRef = doc(collection(this.firestore, `familias/${familiaId}/alimentos`));

        return setDoc(alimentoRef, {
          id: alimentoRef.id,
          familiaId,
          nombre: alimentoBase.nombre,
          categoria: alimentoBase.categoria,
          activo: true,
          creadoPorUid: uid,
          vecesUsado: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      })
    );
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

  private async obtenerContextoActivo(): Promise<{ uid: string; familiaId: string }> {
    const usuario = await this.obtenerUsuarioActual();
    const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);
    const usuarioSnap = await getDoc(usuarioRef);

    if (!usuarioSnap.exists()) {
      throw new Error('No existe el documento del usuario');
    }

    const familiaId = usuarioSnap.data()['familiaActivaId'];

    if (!familiaId) {
      throw new Error('El usuario no tiene familia activa');
    }

    return {
      uid: usuario.uid,
      familiaId
    };
  }

  private normalizarNombre(nombre: string): string {
    return nombre.trim().toLowerCase();
  }
}
