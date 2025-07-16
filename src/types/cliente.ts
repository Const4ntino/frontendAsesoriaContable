// Definición de Usuario directamente aquí para evitar dependencias circulares
export interface Usuario {
  id: number;
  username: string;
  email: string;
  rol: string;
  activo: boolean;
}

export interface Contador {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email: string;
  usuario: Usuario;
}

export interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
  email: string;
  telefono: string;
  tipoRuc: string;
  regimen: "RER" | "RG" | "RMT" | "NRUS";
  tipoCliente: "PERSONA_NATURAL" | "PERSONA_JURIDICA";
  usuario: Usuario;
  contador: Contador;
  fechaRegistro: string;
  fechaActualizacion?: string;
  tipoEmpresa?: string;
  direccion?: string;
}

export interface Documento {
  id: number;
  numero: string;
  descripcion?: string;
  fecha: string;
  tipo: string;
  monto: number;
}

export interface ClienteConMetricas {
  cliente: Cliente;
  totalIngresosMesActual: number;
  totalEgresosMesActual: number;
  utilidadMesActual: number;
  totalIngresosMesAnterior?: number;
  totalEgresosMesAnterior?: number;
  documentosRecientes?: Documento[];
}
