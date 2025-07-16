import React, { useEffect, useState } from "react";
import EgresoModal from "./EgresoModal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  PaginationPrevious
} from "@/components/ui/pagination";
import { Search, Plus, RefreshCw, X, FileText, Edit, Trash2, Eye } from "lucide-react";
import { debounce } from "lodash";
import { format } from "date-fns";

interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
}

interface EgresoResponse {
  id: number;
  cliente: Cliente;
  monto: number;
  montoIgv: number;
  fecha: string;
  descripcion: string;
  nroComprobante: string;
  urlComprobante: string;
  tipoContabilidad: string;
  tipoTributario: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface EgresosTableProps {
  clienteRegimen: string;
  onDataChange?: () => void;
}

const EgresosTable: React.FC<EgresosTableProps> = ({ clienteRegimen, onDataChange }) => {
  // Verificar si el cliente es de régimen NRUS
  const isNRUS = clienteRegimen === "NRUS";
  const [egresos, setEgresos] = useState<EgresoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [egresoEditar, setEgresoEditar] = useState<EgresoResponse | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoTributarioFilter, setTipoTributarioFilter] = useState<string>("todos");
  const [tipoContabilidadFilter, setTipoContabilidadFilter] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<string>("fecha");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Estado para el modal de confirmación de eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [egresoIdToDelete, setEgresoIdToDelete] = useState<number | null>(null);

  // Estado para el modal de visualización de comprobante
  const [comprobanteModalOpen, setComprobanteModalOpen] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState("");

  const fetchEgresos = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      
      // Construir URL con parámetros de filtro
      const params = new URLSearchParams();
      if (searchTerm) params.append("searchTerm", searchTerm);
      if (tipoTributarioFilter && tipoTributarioFilter !== "todos") params.append("tipoTributario", tipoTributarioFilter);
      if (tipoContabilidadFilter && tipoContabilidadFilter !== "todos") params.append("tipoContabilidad", tipoContabilidadFilter);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);
      
      const response = await fetch(`http://localhost:8099/api/v1/egresos/mis-egresos?${params}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al obtener egresos");
      const data = await response.json();
      setEgresos(data);
    } catch (err) {
      setError("No se pudo cargar la lista de egresos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar con debounce
  const debouncedSearch = React.useCallback(
    debounce(() => {
      fetchEgresos();
      setCurrentPage(1); // Resetear a la primera página al buscar
    }, 500),
    [searchTerm, tipoTributarioFilter, tipoContabilidadFilter, sortBy, sortOrder]
  );

  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [searchTerm, tipoTributarioFilter, tipoContabilidadFilter, sortBy, sortOrder, debouncedSearch]);

  useEffect(() => {
    // Cargar egresos al inicio
    fetchEgresos();
  }, []);

  const handleAgregar = () => {
    setEgresoEditar(null);
    setModalOpen(true);
  };

  const handleEditar = (egreso: EgresoResponse) => {
    setEgresoEditar(egreso);
    setModalOpen(true);
  };

  // Abrir modal de confirmación de eliminación
  const handleConfirmDelete = (id: number) => {
    setEgresoIdToDelete(id);
    setDeleteModalOpen(true);
  };
  
  // Cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setEgresoIdToDelete(null);
  };
  
  // Eliminar egreso después de confirmación
  const handleEliminar = async () => {
    if (egresoIdToDelete === null) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8099/api/v1/egresos/mis-egresos/${egresoIdToDelete}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al eliminar el egreso");
      
      // Actualizar la lista de egresos
      fetchEgresos();
      
      // Notificar al componente padre para actualizar métricas
      if (onDataChange) {
        onDataChange();
      }
      
      // Cerrar modal de confirmación
      setDeleteModalOpen(false);
      setEgresoIdToDelete(null);
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert("No se pudo eliminar el egreso");
    }
  };

  // Abrir modal para ver comprobante
  const handleVerComprobante = (url: string) => {
    if (url) {
      setComprobanteUrl(url);
      setComprobanteModalOpen(true);
    }
  };

  const handleCloseModal = (dataChanged: boolean = false) => {
    setEgresoEditar(null);
    setModalOpen(false);
    
    // Si hubo cambios en los datos, actualizar la lista y notificar al padre
    if (dataChanged) {
      fetchEgresos();
      if (onDataChange) {
        onDataChange();
      }
    }
  };
  
  const handleRefresh = () => {
    fetchEgresos();
    // Notificar al componente padre para actualizar métricas
    if (onDataChange) {
      onDataChange();
    }
  };
  
  const handleClearFilters = () => {
    setSearchTerm("");
    if (!isNRUS) {
      setTipoTributarioFilter("todos");
    }
    setTipoContabilidadFilter("todos");
    setSortBy("fecha");
    setSortOrder("desc");
    setCurrentPage(1);
    fetchEgresos();
  };

  // Calcular egresos paginados
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEgresos = egresos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(egresos.length / itemsPerPage);

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

  // Obtener color de badge según tipo contabilidad
  const getTipoContabilidadBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "GASTO":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "COSTO":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Lista de Egresos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por descripción o comprobante..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                title="Refrescar"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
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
              <Select
                value={tipoContabilidadFilter}
                onValueChange={setTipoContabilidadFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo Contabilidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="GASTO">Gasto</SelectItem>
                  <SelectItem value="COSTO">Costo</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearFilters}
                title="Limpiar filtros"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleAgregar}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Egreso
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
              {error}
            </div>
          ) : egresos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay egresos registrados.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead className="text-center">Contabilidad</TableHead>
                    {!isNRUS && <TableHead className="text-center">Tipo</TableHead>}
                    <TableHead className="text-right">Monto</TableHead>
                    {!isNRUS && <TableHead className="text-right">IGV</TableHead>}
                    <TableHead className="text-center w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentEgresos.map((egreso) => (
                    <TableRow key={egreso.id}>
                      <TableCell className="font-medium">
                        {format(new Date(`${egreso.fecha}T12:00:00`), "yyyy/MM/dd")}
                      </TableCell>
                      <TableCell>
                        {egreso.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="max-w-[150px] truncate" title={egreso.nroComprobante || "No especificado"}>
                            {egreso.nroComprobante || <span className="text-gray-400 italic">No especificado</span>}
                          </span>
                          {egreso.urlComprobante && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVerComprobante(`http://localhost:8099${egreso.urlComprobante}`)}
                              title="Ver comprobante"
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getTipoContabilidadBadgeColor(egreso.tipoContabilidad)} variant="outline">
                          {egreso.tipoContabilidad}
                        </Badge>
                      </TableCell>
                      {!isNRUS && (
                        <TableCell className="text-center">
                          <Badge className={getTipoTributarioBadgeColor(egreso.tipoTributario)} variant="outline">
                            {egreso.tipoTributario}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-right font-medium">
                        {formatMonto(egreso.monto)}
                      </TableCell>
                      {!isNRUS && (
                        <TableCell className="text-right">
                          {formatMonto(egreso.montoIgv)}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditar(egreso)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleConfirmDelete(egreso.id)}
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
          )}

          {/* Paginación */}
          {egresos.length > 0 && (
            <div className="flex justify-center mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {pageNumbers.map(number => (
                    <PaginationItem key={number}>
                      <PaginationLink
                        onClick={() => setCurrentPage(number)}
                        isActive={currentPage === number}
                        className="cursor-pointer"
                      >
                        {number}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de edición/creación de egreso */}
      <EgresoModal
        open={modalOpen}
        onClose={handleCloseModal}
        egreso={egresoEditar}
        onSaved={() => {
          fetchEgresos();
          if (onDataChange) {
            onDataChange();
          }
        }}
        clienteRegimen={clienteRegimen}
      />
      
      {/* Modal de confirmación para eliminar */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este egreso? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminar}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para visualizar el comprobante */}
      {comprobanteModalOpen && (
        <Dialog open={comprobanteModalOpen} onOpenChange={setComprobanteModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Visualización de Comprobante</DialogTitle>
              <DialogDescription>
                Documento adjunto al registro de egreso
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto h-[500px] w-full flex items-center justify-center bg-gray-100">
              {comprobanteUrl && (
                <img 
                  src={comprobanteUrl} 
                  alt="Comprobante de egreso" 
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
              <Button variant="outline" onClick={() => setComprobanteModalOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EgresosTable;
