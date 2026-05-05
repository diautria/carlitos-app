export interface Bebe {
  id: number;
  nombre: string;
  fechaNacimiento: string;
  edad: number;
  peso: number;
  altura: number;
  foto: string;
  ultimaAlimentacion: string;
  proximaVacuna: string;
  notas: string[];
}

export interface Actividad {
  id: number;
  tipo: 'alimentacion' | 'sueno' | 'cambio' | 'medicamento' | 'vacuna';
  titulo: string;
  descripcion: string;
  fecha: Date;
  bebeId: number;
}  