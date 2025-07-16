export interface DeclaracionResponse {
  id: number;
  cliente?: {
    id: number;
    nombres: string;
    apellidos: string;
    rucDni: string;
    email: string;
    telefono: string;
    tipoRuc: string;
    tipoCliente: string;
    tipoEmpresa?: string;
    direccion?: string;
  };
  periodoTributario: string;
  tipo: string;
  estadoCliente: string;
  estadoContador: string;
  fechaLimite: string;
  urlConstanciaDeclaracion: string;
  urlConstanciaSunat: string;
  urlConstanciaPago: string;
  totalIngresos: number;
  totalEgresos: number;
  utilidadEstimada: number;
  igvVentas: number;
  igvCompras: number;
  irEstimado: number;
  totalPagarDeclaracion: number;
  estado: string;
}
