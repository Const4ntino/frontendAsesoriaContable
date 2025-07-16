import type { Cliente } from "./cliente";
import type { DeclaracionResponse } from "./declaracion";

export type EstadoObligacion = 
  | "PENDIENTE"
  | "PAGADA"
  | "PAGADA_CON_RETRASO"
  | "VENCIDA"
  | "NO_DISPONIBLE"
  | "POR_VALIDAR"
  | "POR_CONFIRMAR";

export interface ObligacionResponse {
  id: number;
  declaracion: DeclaracionResponse;
  cliente: Cliente;
  tipo: string;
  periodo?: string; // LocalDate en formato ISO (campo antiguo)
  periodoTributario: string; // LocalDate en formato ISO (campo actual del backend)
  monto: number;
  fechaLimite: string; // LocalDate en formato ISO
  estado: EstadoObligacion;
  observaciones: string;
  fechaCreacion: string; // LocalDateTime en formato ISO
  fechaActualizacion: string; // LocalDateTime en formato ISO
}
