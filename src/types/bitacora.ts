export interface Usuario {
  id: number;
  username: string;
  nombres: string;
  apellidos: string;
  rol: string;
  estado: boolean;
}

export type ModuloBitacora = 
  | "CLIENTE"
  | "CONTADOR"
  | "USUARIO"
  | "DECLARACION"
  | "OBLIGACION"
  | "PAGO"
  | "INGRESO"
  | "EGRESO"
  | "ALERTA"
  | "AUTH";

export type AccionBitacora = 
  | "CREAR"
  | "ACTUALIZAR"
  | "ELIMINAR"
  | "ASIGNAR_CONTADOR"
  | "DESASIGNAR_CONTADOR"
  | "LOGIN"
  | "REGISTRO_CLIENTE"
  | "NOTIFICAR_CONTADOR"
  | "MARCAR_EN_PROCESO"
  | "MARCAR_DECLARADO"
  | "SUBIR_COMPROBANTE";

export type RolUsuario = 
  | "ADMINISTRADOR"
  | "CLIENTE"
  | "CONTADOR";

export interface BitacoraItem {
  id: number;
  usuario: Usuario;
  rol: RolUsuario;
  modulo: ModuloBitacora;
  accion: AccionBitacora;
  descripcion: string;
  fechaMovimiento: string;
}

export interface BitacoraFiltros {
  searchTerm?: string;
  modulo?: ModuloBitacora;
  accion?: AccionBitacora;
  fechaDesde?: string;
  fechaHasta?: string;
  page: number;
  size: number;
  sortBy: string;
  sortDir: 'ASC' | 'DESC';
}

export interface PageInfo {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface BitacoraResponse {
  content: BitacoraItem[];
  pageable: PageInfo;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
