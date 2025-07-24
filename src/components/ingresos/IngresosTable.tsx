import React, { useEffect, useState } from "react";
import IngresoModal from "./IngresoModal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { Plus, RefreshCw, X, FileText, Edit, Trash2, Eye, ArrowUpDown } from "lucide-react";
import { debounce } from "lodash";
import { format } from "date-fns";

interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
}

interface IngresoResponse {
  id: number;
  cliente: Cliente;
  monto: number;
  montoIgv: number;
  fecha: string;
  descripcion: string;
  nroComprobante: string;
  urlComprobante: string;
  tipoTributario: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface IngresosTableProps {
  clienteRegimen: string;
  onDataChange?: () => void;
}

const IngresosTable: React.FC<IngresosTableProps> = ({ clienteRegimen, onDataChange }) => {
  // Verificar si el cliente es de régimen NRUS
  const isNRUS = clienteRegimen === "NRUS";
  const [ingresos, setIngresos] = useState<IngresoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [ingresoEditar, setIngresoEditar] = useState<IngresoResponse | null>(null);
  
  // Estado para el modal de confirmación de eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ingresoIdToDelete, setIngresoIdToDelete] = useState<number | null>(null);
  
  // Estado para el modal de visualización de comprobante
  const [viewComprobanteModalOpen, setViewComprobanteModalOpen] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  
  // Estados para filtros y ordenamiento
  const [tipoTributarioFilter, setTipoTributarioFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("fecha");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  
  // Estados para filtros de mes y año
  const [mesFilter, setMesFilter] = useState<string>("all_months");
  const [anioFilter, setAnioFilter] = useState<string>("all_years");
  
  // Opciones para los filtros de mes
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
    { value: "12", label: "Diciembre" }
  ];
  
  // Opciones para los filtros de año (últimos 5 años)
  const anios = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Almacenamos todos los ingresos sin filtrar
  const [allIngresos, setAllIngresos] = useState<IngresoResponse[]>([]);

  const fetchIngresos = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      
      // Construir URL con parámetros de filtro (solo mes y año que se procesan en el backend)
      const params = new URLSearchParams();
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);
      
      // Añadir filtros de mes y año
      if (mesFilter && mesFilter !== "all_months") params.append("mes", mesFilter);
      if (anioFilter && anioFilter !== "all_years") params.append("anio", anioFilter);
      
      const response = await fetch(`http://localhost:8099/api/v1/ingresos/mis-ingresos?${params}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al obtener ingresos");
      const data = await response.json();
      
      // Guardamos todos los ingresos sin filtrar
      setAllIngresos(data);
      
      // Aplicamos filtros en el frontend
      applyFrontendFilters(data);
    } catch (err) {
      setError("No se pudo cargar la lista de ingresos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para aplicar filtros en el frontend
  const applyFrontendFilters = (data: IngresoResponse[]) => {
    let filteredData = [...data];
    
    // Filtrar por tipo tributario si está seleccionado
    if (tipoTributarioFilter && tipoTributarioFilter !== "todos") {
      filteredData = filteredData.filter(ingreso => ingreso.tipoTributario === tipoTributarioFilter);
    }
    
    setIngresos(filteredData);
  };

  // Función para buscar con debounce
  const debouncedSearch = React.useCallback(
    debounce(() => {
      fetchIngresos();
      setCurrentPage(1); // Resetear a la primera página al buscar
    }, 500),
    [mesFilter, anioFilter, sortBy, sortOrder]
  );
  
  // Aplicar filtros de frontend cuando cambian los valores de los filtros
  useEffect(() => {
    if (allIngresos.length > 0) {
      applyFrontendFilters(allIngresos);
    }
  }, [tipoTributarioFilter]);

  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [tipoTributarioFilter, mesFilter, anioFilter, sortBy, sortOrder, debouncedSearch]);

  useEffect(() => {
    // Cargar ingresos al inicio
    fetchIngresos();
  }, []);

  const handleAgregar = () => {
    setIngresoEditar(null);
    setModalOpen(true);
  };

  const handleEditar = (ingreso: IngresoResponse) => {
    setIngresoEditar(ingreso);
    setModalOpen(true);
  };

  // Abrir modal de confirmación de eliminación
  const handleConfirmDelete = (id: number) => {
    setIngresoIdToDelete(id);
    setDeleteModalOpen(true);
  };
  
  // Cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setIngresoIdToDelete(null);
  };
  
  // Eliminar ingreso después de confirmación
  const handleEliminar = async () => {
    if (ingresoIdToDelete === null) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8099/api/v1/ingresos/mis-ingresos/${ingresoIdToDelete}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al eliminar el ingreso");
      
      // Actualizar la lista de ingresos
      fetchIngresos();
      
      // Notificar al componente padre para actualizar métricas
      if (onDataChange) {
        onDataChange();
      }
      
      // Cerrar modal de confirmación
      setDeleteModalOpen(false);
      setIngresoIdToDelete(null);
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert("No se pudo eliminar el ingreso");
    }
  };

  const handleCloseModal = (dataChanged: boolean = false) => {
    setIngresoEditar(null);
    setModalOpen(false);
    
    // Si hubo cambios en los datos, actualizar la lista y notificar al padre
    if (dataChanged) {
      fetchIngresos();
      if (onDataChange) {
        onDataChange();
      }
    }
  };
  
  const handleRefresh = () => {
    fetchIngresos();
  };
  
  const handleClearFilters = () => {
    setTipoTributarioFilter("todos");
    setMesFilter("all_months");
    setAnioFilter("all_years");
    setSortBy("fecha");
    setSortOrder("desc");
    setCurrentPage(1);
    
    // Al limpiar los filtros, necesitamos volver a cargar los datos del backend
    // y luego mostrar todos los ingresos sin filtrar
    fetchIngresos();
    
    // Si ya tenemos datos cargados, mostramos todos sin filtros
    if (allIngresos.length > 0) {
      setIngresos(allIngresos);
    }
  };
  
  // Función para cambiar el orden de la tabla
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  // Calcular ingresos paginados
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentIngresos = ingresos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(ingresos.length / itemsPerPage);

  // Generar array de páginas para la paginación
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Formatear monto para mostrar
  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(monto);
  };

  // Nota: La función de formateo de fecha se maneja directamente en el renderizado

  // Obtener color de badge según tipo tributario
  const getTipoTributarioBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "GRAVADA":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "EXONERADA":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "INAFECTA":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold">Mis Ingresos</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualizar
            </Button>
            <Button onClick={handleAgregar} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Ingreso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              {/* Filtro de Mes */}
              <Select
                value={mesFilter}
                onValueChange={setMesFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_months">Todos los meses</SelectItem>
                  {meses.map(mes => (
                    <SelectItem key={mes.value} value={mes.value}>{mes.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Filtro de Año */}
              <Select
                value={anioFilter}
                onValueChange={setAnioFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_years">Todos los años</SelectItem>
                  {anios.map(anio => (
                    <SelectItem key={anio.value} value={anio.value}>{anio.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Filtro de Tipo Tributario */}
              {!isNRUS && (
                <Select
                  value={tipoTributarioFilter}
                  onValueChange={setTipoTributarioFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo Tributario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="GRAVADA">Gravada</SelectItem>
                    <SelectItem value="EXONERADA">Exonerada</SelectItem>
                    <SelectItem value="INAFECTA">Inafecta</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {/* Botón para aplicar filtros de periodo */}
              <Button variant="outline" onClick={fetchIngresos}>
                Aplicar Filtros de Periodo
              </Button>
              
              {/* Botón para limpiar filtros */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearFilters}
                title="Limpiar filtros"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">Cargando ingresos...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : ingresos.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No hay ingresos registrados</p>
              <Button onClick={handleAgregar} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-1" />
                Registrar mi primer ingreso
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">
                        <div className="flex items-center cursor-pointer" onClick={toggleSortOrder}>
                          Fecha
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                          <span className="sr-only">Ordenar por fecha {sortOrder === "asc" ? "ascendente" : "descendente"}</span>
                        </div>
                      </TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Comprobante</TableHead>
                      {!isNRUS && <TableHead className="text-center">Tipo</TableHead>}
                      <TableHead className="text-right">Monto</TableHead>
                      {!isNRUS && <TableHead className="text-right">IGV</TableHead>}
                      <TableHead className="text-center w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentIngresos.map((ingreso) => (
                      <TableRow key={ingreso.id}>
                        <TableCell className="font-medium">
                          {format(new Date(`${ingreso.fecha}T12:00:00`), "yyyy/MM/dd")}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={ingreso.descripcion || "Sin descripción"}>
                            {ingreso.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{ingreso.nroComprobante || <span className="text-gray-400 italic">No especificado</span>}</span>
                            {ingreso.urlComprobante && (
                              <Button
                                onClick={() => {
                                  setComprobanteUrl(`http://localhost:8099${ingreso.urlComprobante}`);
                                  setViewComprobanteModalOpen(true);
                                }}
                                size="icon"
                                variant="ghost"
                                title="Ver comprobante"
                              >
                                <Eye className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        {!isNRUS && (
                          <TableCell className="text-center">
                            <Badge className={getTipoTributarioBadgeColor(ingreso.tipoTributario)} variant="outline">
                              {ingreso.tipoTributario}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-right font-medium">
                          {formatMonto(ingreso.monto)}
                        </TableCell>
                        {!isNRUS && (
                          <TableCell className="text-right">
                            {formatMonto(ingreso.montoIgv)}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              onClick={() => handleEditar(ingreso)}
                              size="icon"
                              variant="ghost"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleConfirmDelete(ingreso.id)}
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {pageNumbers.map(number => {
                      // Mostrar siempre la primera página, la última y las páginas cercanas a la actual
                      if (
                        number === 1 || 
                        number === totalPages || 
                        (number >= currentPage - 1 && number <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={number}>
                            <PaginationLink
                              onClick={() => setCurrentPage(number)}
                              isActive={currentPage === number}
                            >
                              {number}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      
                      // Mostrar elipsis para páginas omitidas
                      if (number === 2 && currentPage > 3) {
                        return (
                          <PaginationItem key="ellipsis-start">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      
                      if (number === totalPages - 1 && currentPage < totalPages - 2) {
                        return (
                          <PaginationItem key="ellipsis-end">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <IngresoModal 
          open={modalOpen} 
          onClose={handleCloseModal} 
          ingreso={ingresoEditar}
          onSaved={() => {
            fetchIngresos();
            if (onDataChange) {
              onDataChange();
            }
          }}
          clienteRegimen={clienteRegimen}
        />
      )}
      
      {deleteModalOpen && (
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar este ingreso? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelDelete}>Cancelar</Button>
              <Button variant="destructive" onClick={handleEliminar}>Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para visualizar el comprobante */}
      {viewComprobanteModalOpen && (
        <Dialog open={viewComprobanteModalOpen} onOpenChange={setViewComprobanteModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Visualización de Comprobante</DialogTitle>
              <DialogDescription>
                Documento adjunto al registro de ingreso
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto h-[500px] w-full flex items-center justify-center bg-gray-100">
              {comprobanteUrl && (
                <img 
                  src={comprobanteUrl} 
                  alt="Comprobante de ingreso" 
                  className="max-w-full max-h-full object-contain" 
                  onError={(e) => {
                    // Si falla la carga como imagen, intentar con iframe para PDFs
                    const target = e.target as HTMLImageElement;
                    const container = target.parentElement;
                    if (container) {
                      const iframe = document.createElement('iframe');
                      iframe.src = comprobanteUrl;
                      iframe.className = 'w-full h-full border-0';
                      iframe.title = 'Visualización del comprobante';
                      container.innerHTML = '';
                      container.appendChild(iframe);
                    }
                  }}
                />
              )}
            </div>
            <DialogFooter className="flex justify-between items-center">
              <a 
                href={comprobanteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <FileText className="h-4 w-4 mr-1" />
                Abrir en nueva pestaña
              </a>
              <Button 
                onClick={() => setViewComprobanteModalOpen(false)}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default IngresosTable;
