export interface Usuario {
  id: number;
  username: string;
  nombres: string;
  apellidos: string;
  rol: string;
  estado: boolean;
}

export interface Contador {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  // Otros campos del contador si existen
}

export interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
  email: string;
  telefono: string;
  tipoCliente: string;
  regimen: string;
  tipoRuc: string;
  usuario: Usuario;
  contador?: Contador;
}

export interface Declaracion {
  id: number;
  // Otros campos de la declaración
}

export interface Obligacion {
  id: number;
  estado: string;
  fechaActualizacion: string;
  fechaCreacion: string;
  fechaLimite: string;
  monto: number;
  observaciones: string;
  periodoTributario: string;
  tipo: string;
  declaracion: Declaracion;
  cliente: Cliente;
}

export interface PagoResponse {
  id: number;
  montoPagado: number;
  fechaPago: string;
  medioPago: string;
  urlVoucher: string;
  estado: string;
  pagadoPor: string;
  comentarioContador: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  obligacion: Obligacion;
  // Campos para compatibilidad con código existente
  clienteNombre?: string;
  clienteRucDni?: string;
}

// Tipo para los datos de resumen
export interface ResumenPagos {
  totalPagos: number;
  montoPagosTotal: number;
  pagosPorValidar: number;
  montoPagosPorValidar: number;
}
