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
  updateDoc,
  deleteField
} from '@angular/fire/firestore';
import { Observable, from, firstValueFrom } from 'rxjs';
import {
  BebeFamilia,
  CrearBebeFamiliaRequest
} from '../models/bebe-familia.model';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL
} from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class BebeFamiliaService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private storage = inject(Storage);

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

  private async obtenerFamiliaActivaId(): Promise<string> {
    const usuario = await this.obtenerUsuarioActual();

    const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);
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

  obtenerBebes(): Observable<BebeFamilia[]> {
    return from(this.obtenerBebesAsync());
  }

  private async obtenerBebesAsync(): Promise<BebeFamilia[]> {
    const familiaId = await this.obtenerFamiliaActivaId();

    console.log('BebeFamiliaService - leyendo bebés de familia:', familiaId);

    const bebesRef = collection(
      this.firestore,
      `familias/${familiaId}/bebes`
    );

    const snapshot = await getDocs(bebesRef);

    const bebes = snapshot.docs.map(docSnap => {
      const data = docSnap.data() as BebeFamilia;

      return {
        ...data,
        id: docSnap.id
      };
    });

    console.log('BebeFamiliaService - bebés leídos con getDocs:', bebes);

    return bebes.filter(b => b.activo !== false);
  }

  async crearBebe(request: CrearBebeFamiliaRequest): Promise<string> {
    const usuario = await this.obtenerUsuarioActual();

    const familiaId = await this.obtenerFamiliaActivaId();

    const bebesRef = collection(
      this.firestore,
      `familias/${familiaId}/bebes`
    );

    const bebeRef = doc(bebesRef);

    const bebe: any = {
      id: bebeRef.id,
      familiaId,
      nombre: request.nombre.trim(),
      fechaNacimiento: request.fechaNacimiento,
      fotoUrl: request.fotoUrl || '',
      proximaVacuna: request.proximaVacuna || '',
      notas: request.notas || [],
      activo: true,
      creadoPorUid: usuario.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (
      request.peso !== undefined &&
      request.peso !== null &&
      String(request.peso).trim() !== '' &&
      !Number.isNaN(Number(request.peso))
    ) {
      bebe.peso = Number(request.peso);
    }

    if (
      request.altura !== undefined &&
      request.altura !== null &&
      String(request.altura).trim() !== '' &&
      !Number.isNaN(Number(request.altura))
    ) {
      bebe.altura = Number(request.altura);
    }

    console.log(
      'BebeFamiliaService - guardando bebé en ruta:',
      `familias/${familiaId}/bebes/${bebeRef.id}`
    );

    console.log('BebeFamiliaService - objeto bebé:', bebe);

    await setDoc(bebeRef, bebe);

    console.log('BebeFamiliaService - bebé guardado OK');

    return bebeRef.id;
  }

  async actualizarBebe(
    bebeId: string,
    cambios: Partial<CrearBebeFamiliaRequest>
  ): Promise<void> {
    if (!bebeId) {
      throw new Error('Debe indicar el id del bebé');
    }

    const familiaId = await this.obtenerFamiliaActivaId();

    const bebeRef = doc(
      this.firestore,
      `familias/${familiaId}/bebes/${bebeId}`
    );

    const cambiosFirestore: any = {
      updatedAt: serverTimestamp()
    };

    if (cambios.nombre !== undefined) {
      cambiosFirestore.nombre = cambios.nombre.trim();
    }

    if (cambios.fechaNacimiento !== undefined) {
      cambiosFirestore.fechaNacimiento = cambios.fechaNacimiento;
    }

    if (cambios.fotoUrl !== undefined) {
      cambiosFirestore.fotoUrl = cambios.fotoUrl || '';
    }

    if (cambios.proximaVacuna !== undefined) {
      cambiosFirestore.proximaVacuna = cambios.proximaVacuna || '';
    }

    if (cambios.notas !== undefined) {
      cambiosFirestore.notas = cambios.notas || [];
    }

    if (
      cambios.peso !== undefined &&
      cambios.peso !== null &&
      String(cambios.peso).trim() !== '' &&
      !Number.isNaN(Number(cambios.peso))
    ) {
      cambiosFirestore.peso = Number(cambios.peso);
    }

    if (
      cambios.altura !== undefined &&
      cambios.altura !== null &&
      String(cambios.altura).trim() !== '' &&
      !Number.isNaN(Number(cambios.altura))
    ) {
      cambiosFirestore.altura = Number(cambios.altura);
    }

    console.log('BebeFamiliaService - actualizando bebé:', cambiosFirestore);

    await updateDoc(bebeRef, cambiosFirestore);
  }

  async eliminarBebeLogico(bebeId: string): Promise<void> {
  if (!bebeId) {
    throw new Error('Debe indicar el id del bebé');
  }

  const familiaId = await this.obtenerFamiliaActivaId();

  const bebeRef = doc(
    this.firestore,
    `familias/${familiaId}/bebes/${bebeId}`
  );

  await updateDoc(bebeRef, {
    activo: false,
    updatedAt: serverTimestamp()
  });
}

  private async subirFotoBebe(
  familiaId: string,
  bebeId: string,
  file: File
): Promise<string> {
  const extension = file.name.split('.').pop() || 'jpg';

  const ruta = `familias/${familiaId}/bebes/${bebeId}/foto.${extension}`;

  const storageRef = ref(this.storage, ruta);

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}

async crearBebeConFoto(
  request: CrearBebeFamiliaRequest,
  foto?: File
): Promise<string> {
  const familiaId = await this.obtenerFamiliaActivaId();

  const requestSinBase64: CrearBebeFamiliaRequest = {
    ...request,
    fotoUrl: ''
  };

  const bebeId = await this.crearBebe(requestSinBase64);

  if (foto) {
    const fotoUrl = await this.subirFotoBebe(familiaId, bebeId, foto);

    await this.actualizarBebe(bebeId, {
      fotoUrl
    });
  }

  return bebeId;
}

async actualizarBebeConFoto(
  bebeId: string,
  request: Partial<CrearBebeFamiliaRequest>,
  foto?: File
): Promise<void> {
  const familiaId = await this.obtenerFamiliaActivaId();

  const requestSinBase64: Partial<CrearBebeFamiliaRequest> = {
    ...request
  };

  if (foto) {
    requestSinBase64.fotoUrl = '';
  }

  await this.actualizarBebe(bebeId, requestSinBase64);

  if (foto) {
    const fotoUrl = await this.subirFotoBebe(familiaId, bebeId, foto);

    await this.actualizarBebe(bebeId, {
      fotoUrl
    });
  }
}

async seleccionarBebeActivo(bebeId: string): Promise<void> {
  const usuario = await this.obtenerUsuarioActual();

  const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);

  await updateDoc(usuarioRef, {
    bebeActivoId: bebeId,
    updatedAt: serverTimestamp()
  });
}

async obtenerBebeActivoId(): Promise<string | null> {
  const usuario = await this.obtenerUsuarioActual();

  const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);
  const usuarioSnap = await getDoc(usuarioRef);

  if (!usuarioSnap.exists()) {
    return null;
  }

  const data = usuarioSnap.data();

  return data['bebeActivoId'] || null;
}

async limpiarBebeActivo(): Promise<void> {
  const usuario = await this.obtenerUsuarioActual();

  const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);

  await updateDoc(usuarioRef, {
    bebeActivoId: deleteField(),
    updatedAt: serverTimestamp()
  });
}

async obtenerConfiguracionBebeActivo(): Promise<{
  bebeId: string;
  nombre: string;
  tiempoEntreTomasHoras: number;
  onzasDiariasObjetivo: number;
}> {
  const familiaId = await this.obtenerFamiliaActivaId();
  const usuario = await this.obtenerUsuarioActual();

  const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);
  const usuarioSnap = await getDoc(usuarioRef);

  if (!usuarioSnap.exists()) {
    throw new Error('No existe el documento del usuario');
  }

  const usuarioData = usuarioSnap.data();
  const bebeActivoId = usuarioData['bebeActivoId'];

  if (!bebeActivoId) {
    throw new Error('Seleccioná un bebé antes de configurar.');
  }

  const bebeRef = doc(
    this.firestore,
    `familias/${familiaId}/bebes/${bebeActivoId}`
  );

  const bebeSnap = await getDoc(bebeRef);

  if (!bebeSnap.exists()) {
    throw new Error('No existe el bebé activo.');
  }

  const bebeData = bebeSnap.data();

  return {
    bebeId: bebeActivoId,
    nombre: bebeData['nombre'] || '',
    tiempoEntreTomasHoras: Number(bebeData['tiempoEntreTomasHoras'] || 3),
    onzasDiariasObjetivo: Number(bebeData['onzasDiariasObjetivo'] || 24)
  };
}

async guardarConfiguracionBebeActivo(configuracion: {
  tiempoEntreTomasHoras: number;
  onzasDiariasObjetivo: number;
}): Promise<void> {
  const familiaId = await this.obtenerFamiliaActivaId();
  const usuario = await this.obtenerUsuarioActual();

  const usuarioRef = doc(this.firestore, `usuarios/${usuario.uid}`);
  const usuarioSnap = await getDoc(usuarioRef);

  if (!usuarioSnap.exists()) {
    throw new Error('No existe el documento del usuario');
  }

  const usuarioData = usuarioSnap.data();
  const bebeActivoId = usuarioData['bebeActivoId'];

  if (!bebeActivoId) {
    throw new Error('Seleccioná un bebé antes de configurar.');
  }

  const bebeRef = doc(
    this.firestore,
    `familias/${familiaId}/bebes/${bebeActivoId}`
  );

  await updateDoc(bebeRef, {
    tiempoEntreTomasHoras: configuracion.tiempoEntreTomasHoras,
    onzasDiariasObjetivo: configuracion.onzasDiariasObjetivo,
    updatedAt: serverTimestamp()
  });
}

async obtenerBebesFamiliaActual(): Promise<BebeFamilia[]> {
  const familiaId = await this.obtenerFamiliaActivaId();

  const bebesRef = collection(
    this.firestore,
    `familias/${familiaId}/bebes`
  );

  const snapshot = await getDocs(bebesRef);

  const bebes = snapshot.docs.map(docSnap => {
    const data = docSnap.data() as BebeFamilia;

    return {
      ...data,
      id: docSnap.id
    };
  });

  return bebes.filter(b => b.activo !== false);
}

async obtenerBebePorIdAsync(bebeId: string): Promise<BebeFamilia | null> {
  const familiaId = await this.obtenerFamiliaActivaId();

  const bebeRef = doc(
    this.firestore,
    `familias/${familiaId}/bebes/${bebeId}`
  );

  const bebeSnap = await getDoc(bebeRef);

  if (!bebeSnap.exists()) {
    return null;
  }

  const data = bebeSnap.data() as BebeFamilia;

  return {
    ...data,
    id: bebeSnap.id
  };
}
}