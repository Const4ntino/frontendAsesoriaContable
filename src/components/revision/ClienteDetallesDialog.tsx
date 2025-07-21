import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../ui/pagination";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Search, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

// Interfaces
interface UsuarioResponse {
  id: number;
  username: string;
  nombres: string;
  apellidos: string;
}

interface ContadorResponse {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email: string;
  especialidad: string;
  nroColegiatura: string;
  usuario: UsuarioResponse | null;
  numeroClientes: number;
}

interface ClienteResponse {
  id: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
  email: string;
  telefono: string;
  tipoRuc: string;
  regimen: string;
  tipoCliente: string;
  usuario: UsuarioResponse | null;
  contador: ContadorResponse | null;
}

interface IngresoResponse {
  id: number;
  descripcion: string;
  fecha: string;
  monto: number;
  montoIgv: number;
  nroComprobante: string;
  tipoTributario: string;
}

interface EgresoResponse {
  id: number;
  descripcion: string;
  fecha: string;
  monto: number;
  montoIgv: number;
  nroComprobante: string;
  tipoTributario: string;
}

interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

interface ClienteDetallesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteResponse | null;
}

const ClienteDetallesDialog: React.FC<ClienteDetallesDialogProps> = ({
  isOpen,
  onClose,
  cliente,
}) => {
  // Estados para ingresos
  const [ingresos, setIngresos] = useState<PageResponse<IngresoResponse> | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sortBy, setSortBy] = useState<string>("fecha");
  const [sortDir, setSortDir] = useState<string>("DESC");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Estados para filtros de ingresos
  const [montoMinimo, setMontoMinimo] = useState<string>("");
  const [montoMaximo, setMontoMaximo] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  const [mes, setMes] = useState<string>("todos");
  const [anio, setAnio] = useState<string>("todos");
  const [tipoTributario, setTipoTributario] = useState<string>("todos");
  const [descripcion, setDescripcion] = useState<string>("");
  const [nroComprobante, setNroComprobante] = useState<string>("");
  
  // Estados para egresos
  const [egresos, setEgresos] = useState<PageResponse<EgresoResponse> | null>(null);
  const [currentPageEgresos, setCurrentPageEgresos] = useState<number>(0);
  const [pageSizeEgresos, setPageSizeEgresos] = useState<number>(5);
  const [sortByEgresos, setSortByEgresos] = useState<string>("fecha");
  const [sortDirEgresos, setSortDirEgresos] = useState<string>("DESC");
  const [loadingEgresos, setLoadingEgresos] = useState<boolean>(false);
  const [errorEgresos, setErrorEgresos] = useState<string>("");
  
  // Estados para filtros de egresos
  const [montoMinimoEgresos, setMontoMinimoEgresos] = useState<string>("");
  const [montoMaximoEgresos, setMontoMaximoEgresos] = useState<string>("");
  const [fechaInicioEgresos, setFechaInicioEgresos] = useState<Date | undefined>(undefined);
  const [fechaFinEgresos, setFechaFinEgresos] = useState<Date | undefined>(undefined);
  const [mesEgresos, setMesEgresos] = useState<string>("todos");
  const [anioEgresos, setAnioEgresos] = useState<string>("todos");
  const [tipoTributarioEgresos, setTipoTributarioEgresos] = useState<string>("todos");
  const [descripcionEgresos, setDescripcionEgresos] = useState<string>("");
  const [nroComprobanteEgresos, setNroComprobanteEgresos] = useState<string>("");

  // Datos para filtros
  const meses = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Cargar ingresos cuando se abre el diálogo y cuando cambian los filtros
  useEffect(() => {
    if (isOpen && cliente) {
      fetchIngresos();
    }
  }, [isOpen, cliente, currentPage, pageSize, sortBy, sortDir]);
  
  // Cargar egresos cuando se abre el diálogo y cuando cambian los filtros
  useEffect(() => {
    if (isOpen && cliente) {
      fetchEgresos();
    }
  }, [isOpen, cliente, currentPageEgresos, pageSizeEgresos, sortByEgresos, sortDirEgresos]);

  // Función para obtener los ingresos filtrados
  const fetchIngresos = async () => {
    if (!cliente) return;
    
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Construir URL con filtros
      let url = `http://localhost:8099/api/v1/ingresos/cliente/${cliente.id}/filtrar?page=${currentPage}&size=${pageSize}&sort=${sortBy},${sortDir}`;
      
      if (montoMinimo) url += `&montoMinimo=${montoMinimo}`;
      if (montoMaximo) url += `&montoMaximo=${montoMaximo}`;
      if (fechaInicio) url += `&fechaInicio=${format(fechaInicio, "yyyy-MM-dd")}`;
      if (fechaFin) url += `&fechaFin=${format(fechaFin, "yyyy-MM-dd")}`;
      if (mes && mes !== "todos") url += `&mes=${mes}`;
      if (anio && anio !== "todos") url += `&anio=${anio}`;
      if (tipoTributario && tipoTributario !== "todos") url += `&tipoTributario=${tipoTributario}`;
      if (descripcion) url += `&descripcion=${encodeURIComponent(descripcion)}`;
      if (nroComprobante) url += `&nroComprobante=${encodeURIComponent(nroComprobante)}`;

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Error al cargar ingresos: ${response.status}`);
      }
      
      const data = await response.json();
      setIngresos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };
  
  // Función para obtener los egresos filtrados
  const fetchEgresos = async () => {
    if (!cliente) return;
    
    setLoadingEgresos(true);
    setErrorEgresos("");
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Construir URL con filtros
      let url = `http://localhost:8099/api/v1/egresos/cliente/${cliente.id}/filtrar?page=${currentPageEgresos}&size=${pageSizeEgresos}&sort=${sortByEgresos},${sortDirEgresos}`;
      
      if (montoMinimoEgresos) url += `&montoMinimo=${montoMinimoEgresos}`;
      if (montoMaximoEgresos) url += `&montoMaximo=${montoMaximoEgresos}`;
      if (fechaInicioEgresos) url += `&fechaInicio=${format(fechaInicioEgresos, "yyyy-MM-dd")}`;
      if (fechaFinEgresos) url += `&fechaFin=${format(fechaFinEgresos, "yyyy-MM-dd")}`;
      if (mesEgresos && mesEgresos !== "todos") url += `&mes=${mesEgresos}`;
      if (anioEgresos && anioEgresos !== "todos") url += `&anio=${anioEgresos}`;
      if (tipoTributarioEgresos && tipoTributarioEgresos !== "todos") url += `&tipoTributario=${tipoTributarioEgresos}`;
      if (descripcionEgresos) url += `&descripcion=${encodeURIComponent(descripcionEgresos)}`;
      if (nroComprobanteEgresos) url += `&nroComprobante=${encodeURIComponent(nroComprobanteEgresos)}`;

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Error al cargar egresos: ${response.status}`);
      }
      
      const data = await response.json();
      setEgresos(data);
    } catch (err) {
      setErrorEgresos(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingEgresos(false);
    }
  };

  // Función para aplicar filtros de ingresos
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchIngresos();
  };

  // Función para reiniciar filtros de ingresos
  const handleClearFilters = () => {
    setMontoMinimo("");
    setMontoMaximo("");
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setMes("todos");
    setAnio("todos");
    setTipoTributario("todos");
    setDescripcion("");
    setNroComprobante("");
    setCurrentPage(0);
  };

  // Función para manejar el cambio de página de ingresos
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Función para manejar el cambio de tamaño de página de ingresos
  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size));
    setCurrentPage(0);
  };

  // Función para manejar el cambio de ordenamiento de ingresos
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortDir("ASC");
    }
  };
  
  // Función para aplicar filtros de egresos
  const handleApplyFiltersEgresos = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPageEgresos(0);
    fetchEgresos();
  };

  // Función para reiniciar filtros de egresos
  const handleClearFiltersEgresos = () => {
    setMontoMinimoEgresos("");
    setMontoMaximoEgresos("");
    setFechaInicioEgresos(undefined);
    setFechaFinEgresos(undefined);
    setMesEgresos("todos");
    setAnioEgresos("todos");
    setTipoTributarioEgresos("todos");
    setDescripcionEgresos("");
    setNroComprobanteEgresos("");
    setCurrentPageEgresos(0);
  };

  // Función para manejar el cambio de página de egresos
  const handlePageChangeEgresos = (page: number) => {
    setCurrentPageEgresos(page);
  };

  // Función para manejar el cambio de tamaño de página de egresos
  const handlePageSizeChangeEgresos = (size: string) => {
    setPageSizeEgresos(parseInt(size));
    setCurrentPageEgresos(0);
  };

  // Función para manejar el cambio de ordenamiento de egresos
  const handleSortChangeEgresos = (field: string) => {
    if (sortByEgresos === field) {
      setSortDirEgresos(sortDirEgresos === "ASC" ? "DESC" : "ASC");
    } else {
      setSortByEgresos(field);
      setSortDirEgresos("ASC");
    }
  };

  // Función para renderizar los indicadores de paginación de ingresos
  const renderPagination = () => {
    if (!ingresos || ingresos.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Mostrando {ingresos.content.length} de {ingresos.totalElements} resultados
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="5 por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 por página</SelectItem>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                className={cn(currentPage === 0 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {Array.from({ length: ingresos.totalPages }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={currentPage === i}
                  onClick={() => handlePageChange(i)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(ingresos.totalPages - 1, currentPage + 1))}
                className={cn(currentPage === ingresos.totalPages - 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };
  
  // Función para renderizar los indicadores de paginación de egresos
  const renderPaginationEgresos = () => {
    if (!egresos || egresos.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Mostrando {egresos.content.length} de {egresos.totalElements} resultados
          </span>
          <Select
            value={pageSizeEgresos.toString()}
            onValueChange={handlePageSizeChangeEgresos}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="5 por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 por página</SelectItem>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChangeEgresos(Math.max(0, currentPageEgresos - 1))}
                className={cn(currentPageEgresos === 0 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {Array.from({ length: egresos.totalPages }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={currentPageEgresos === i}
                  onClick={() => handlePageChangeEgresos(i)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChangeEgresos(Math.min(egresos.totalPages - 1, currentPageEgresos + 1))}
                className={cn(currentPageEgresos === egresos.totalPages - 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  // Función para renderizar estado de carga de ingresos
  const renderLoading = () => (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Cargando ingresos...</span>
        </div>
      </TableCell>
    </TableRow>
  );

  // Función para renderizar mensaje de error de ingresos
  const renderError = () => (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8 text-red-500">
        <div className="flex justify-center items-center">
          <span>Error: {error}</span>
        </div>
      </TableCell>
    </TableRow>
  );

  // Función para renderizar mensaje de no hay datos de ingresos
  const renderNoData = () => (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
        No se encontraron ingresos con los filtros seleccionados
      </TableCell>
    </TableRow>
  );
  
  // Función para renderizar estado de carga de egresos
  const renderLoadingEgresos = () => (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Cargando egresos...</span>
        </div>
      </TableCell>
    </TableRow>
  );

  // Función para renderizar mensaje de error de egresos
  const renderErrorEgresos = () => (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8 text-red-500">
        <div className="flex justify-center items-center">
          <span>Error: {errorEgresos}</span>
        </div>
      </TableCell>
    </TableRow>
  );

  // Función para renderizar mensaje de no hay datos de egresos
  const renderNoDataEgresos = () => (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
        No se encontraron egresos con los filtros seleccionados
      </TableCell>
    </TableRow>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Detalles de {cliente?.nombres} {cliente?.apellidos}
          </DialogTitle>
          <DialogDescription>
            Consulta los ingresos y egresos registrados para este cliente
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ingresos" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
            <TabsTrigger value="egresos">Egresos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ingresos" className="space-y-4">
            <div className="space-y-4">
              <form onSubmit={handleApplyFilters}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Filtro por monto */}
                  <div className="space-y-2">
                    <Label>Monto</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Mínimo"
                        value={montoMinimo}
                        onChange={(e) => setMontoMinimo(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Máximo"
                        value={montoMaximo}
                        onChange={(e) => setMontoMaximo(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Filtro por descripción */}
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Input
                      id="descripcion"
                      placeholder="Buscar por descripción"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                    />
                  </div>

                  {/* Filtro por número de comprobante */}
                  <div className="space-y-2">
                    <Label htmlFor="nroComprobante">Nº Comprobante</Label>
                    <Input
                      id="nroComprobante"
                      placeholder="Buscar por Nº comprobante"
                      value={nroComprobante}
                      onChange={(e) => setNroComprobante(e.target.value)}
                    />
                  </div>

                  {/* Filtro por rango de fechas */}
                  <div className="space-y-2">
                    <Label>Rango de fechas</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !fechaInicio && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fechaInicio ? format(fechaInicio, "dd/MM/yyyy", { locale: es }) : "Fecha inicio"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={fechaInicio}
                            onSelect={setFechaInicio}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !fechaFin && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fechaFin ? format(fechaFin, "dd/MM/yyyy", { locale: es }) : "Fecha fin"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={fechaFin}
                            onSelect={setFechaFin}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Filtro por periodo (mes y año) */}
                  <div className="space-y-2">
                    <Label>Periodo</Label>
                    <div className="flex gap-2">
                      <Select value={mes} onValueChange={setMes}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {meses.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={anio} onValueChange={setAnio}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Filtro por tipo tributario */}
                  <div className="space-y-2">
                    <Label htmlFor="tipoTributario">Tipo Tributario</Label>
                    <Select value={tipoTributario} onValueChange={setTipoTributario}>
                      <SelectTrigger className="w-full" id="tipoTributario">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="GRAVADA">GRAVADA</SelectItem>
                        <SelectItem value="EXONERADA">EXONERADA</SelectItem>
                        <SelectItem value="INAFECTA">INAFECTA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleClearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Limpiar filtros
                  </Button>
                  <Button type="submit">
                    <Search className="mr-2 h-4 w-4" />
                    Aplicar filtros
                  </Button>
                </div>
              </form>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="w-[15%] cursor-pointer"
                        onClick={() => handleSortChange("fecha")}
                      >
                        Fecha {sortBy === "fecha" && (sortDir === "ASC" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="w-[30%] cursor-pointer"
                        onClick={() => handleSortChange("descripcion")}
                      >
                        Descripción {sortBy === "descripcion" && (sortDir === "ASC" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="w-[15%] cursor-pointer"
                        onClick={() => handleSortChange("nroComprobante")}
                      >
                        Nº Comprobante {sortBy === "nroComprobante" && (sortDir === "ASC" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="w-[15%] cursor-pointer"
                        onClick={() => handleSortChange("tipoTributario")}
                      >
                        Tipo {sortBy === "tipoTributario" && (sortDir === "ASC" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="w-[12.5%] text-right cursor-pointer"
                        onClick={() => handleSortChange("monto")}
                      >
                        Monto {sortBy === "monto" && (sortDir === "ASC" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="w-[12.5%] text-right cursor-pointer"
                        onClick={() => handleSortChange("montoIgv")}
                      >
                        IGV {sortBy === "montoIgv" && (sortDir === "ASC" ? "↑" : "↓")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      renderLoading()
                    ) : error ? (
                      renderError()
                    ) : ingresos && ingresos.content.length > 0 ? (
                      ingresos.content.map((ingreso) => (
                        <TableRow key={ingreso.id}>
                          <TableCell>
                            {new Date(ingreso.fecha).toLocaleDateString("es-ES")}
                          </TableCell>
                          <TableCell>{ingreso.descripcion}</TableCell>
                          <TableCell>{ingreso.nroComprobante}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                ingreso.tipoTributario === "GRAVADA" 
                                  ? "bg-blue-50 text-blue-600" 
                                  : ingreso.tipoTributario === "EXONERADA" 
                                    ? "bg-green-50 text-green-600" 
                                    : "bg-purple-50 text-purple-600"
                              }
                            >
                              {ingreso.tipoTributario}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            S/ {ingreso.monto.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            S/ {ingreso.montoIgv.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      renderNoData()
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {renderPagination()}
            </div>
          </TabsContent>
          
          <TabsContent value="egresos" className="space-y-4">
            <div className="space-y-4">
              <form onSubmit={handleApplyFiltersEgresos}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Filtro por monto */}
                  <div className="space-y-2">
                    <Label>Monto</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Mínimo"
                        value={montoMinimoEgresos}
                        onChange={(e) => setMontoMinimoEgresos(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Máximo"
                        value={montoMaximoEgresos}
                        onChange={(e) => setMontoMaximoEgresos(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Filtro por descripción */}
                  <div className="space-y-2">
                    <Label htmlFor="descripcionEgresos">Descripción</Label>
                    <Input
                      id="descripcionEgresos"
                      placeholder="Buscar por descripción"
                      value={descripcionEgresos}
                      onChange={(e) => setDescripcionEgresos(e.target.value)}
                    />
                  </div>

                  {/* Filtro por número de comprobante */}
                  <div className="space-y-2">
                    <Label htmlFor="nroComprobanteEgresos">Nº Comprobante</Label>
                    <Input
                      id="nroComprobanteEgresos"
                      placeholder="Buscar por Nº comprobante"
                      value={nroComprobanteEgresos}
                      onChange={(e) => setNroComprobanteEgresos(e.target.value)}
                    />
                  </div>

                  {/* Filtro por rango de fechas */}
                  <div className="space-y-2">
                    <Label>Rango de fechas</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !fechaInicioEgresos && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fechaInicioEgresos ? format(fechaInicioEgresos, "dd/MM/yyyy", { locale: es }) : "Fecha inicio"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={fechaInicioEgresos}
                            onSelect={setFechaInicioEgresos}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !fechaFinEgresos && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fechaFinEgresos ? format(fechaFinEgresos, "dd/MM/yyyy", { locale: es }) : "Fecha fin"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={fechaFinEgresos}
                            onSelect={setFechaFinEgresos}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Filtro por periodo (mes y año) */}
                  <div className="space-y-2">
                    <Label>Periodo</Label>
                    <div className="flex gap-2">
                      <Select value={mesEgresos} onValueChange={setMesEgresos}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {meses.map((mes) => (
                            <SelectItem key={mes.value} value={mes.value}>
                              {mes.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={anioEgresos} onValueChange={setAnioEgresos}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Filtro por tipo tributario */}
                  <div className="space-y-2">
                    <Label htmlFor="tipoTributarioEgresos">Tipo tributario</Label>
                    <Select value={tipoTributarioEgresos} onValueChange={setTipoTributarioEgresos}>
                      <SelectTrigger id="tipoTributarioEgresos">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="GRAVADA">GRAVADA</SelectItem>
                        <SelectItem value="EXONERADA">EXONERADA</SelectItem>
                        <SelectItem value="INAFECTA">INAFECTA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearFiltersEgresos}
                    className="flex items-center"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Limpiar filtros
                  </Button>
                  <Button type="submit" className="flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    Aplicar filtros
                  </Button>
                </div>
              </form>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="w-[15%] cursor-pointer"
                        onClick={() => handleSortChangeEgresos("fecha")}
                      >
                        Fecha {sortByEgresos === "fecha" && (sortDirEgresos === "ASC" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="w-[30%] cursor-pointer"
                        onClick={() => handleSortChangeEgresos("descripcion")}
                      >
                        Descripción {sortByEgresos === "descripcion" && (sortDirEgresos === "ASC" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="w-[15%] cursor-pointer"
                        onClick={() => handleSortChangeEgresos("nroComprobante")}
                      >
                        Nº Comprobante {sortByEgresos === "nroComprobante" && (sortDirEgresos === "ASC" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="w-[15%] cursor-pointer"
                        onClick={() => handleSortChangeEgresos("tipoTributario")}
                      >
                        Tipo {sortByEgresos === "tipoTributario" && (sortDirEgresos === "ASC" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="w-[12.5%] text-right cursor-pointer"
                        onClick={() => handleSortChangeEgresos("monto")}
                      >
                        Monto {sortByEgresos === "monto" && (sortDirEgresos === "ASC" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="w-[12.5%] text-right cursor-pointer"
                        onClick={() => handleSortChangeEgresos("montoIgv")}
                      >
                        IGV {sortByEgresos === "montoIgv" && (sortDirEgresos === "ASC" ? "↑" : "↓")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingEgresos ? (
                      renderLoadingEgresos()
                    ) : errorEgresos ? (
                      renderErrorEgresos()
                    ) : egresos && egresos.content.length > 0 ? (
                      egresos.content.map((egreso) => (
                        <TableRow key={egreso.id}>
                          <TableCell>
                            {new Date(egreso.fecha).toLocaleDateString("es-ES")}
                          </TableCell>
                          <TableCell>{egreso.descripcion}</TableCell>
                          <TableCell>{egreso.nroComprobante}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                egreso.tipoTributario === "GRAVADA" 
                                  ? "bg-blue-50 text-blue-600" 
                                  : egreso.tipoTributario === "EXONERADA" 
                                    ? "bg-green-50 text-green-600" 
                                    : "bg-purple-50 text-purple-600"
                              }
                            >
                              {egreso.tipoTributario}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            S/ {egreso.monto.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            S/ {egreso.montoIgv.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      renderNoDataEgresos()
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {renderPaginationEgresos()}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteDetallesDialog;