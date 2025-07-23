import React, { useEffect, useState } from "react";
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
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, RefreshCw, X, Eye, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { debounce } from "lodash";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface AlertaClienteResponse {
  id: number;
  idCliente: number;
  descripcion: string;
  estado: "ACTIVO" | "VISTO" | "RESUELTO";
  tipo: string;
  fechaCreacion: string;
  fechaExpiracion: string;
}

interface AlertasTableProps {
  onDataChange?: () => void;
}

const AlertasTable: React.FC<AlertasTableProps> = ({ onDataChange }) => {
  const [alertas, setAlertas] = useState<AlertaClienteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estado para el modal de confirmación
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertaToAction, setAlertaToAction] = useState<{id: number, action: "marcar-visto" | "marcar-resuelto"} | null>(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("activas");
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchAlertas = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:8099/api/v1/alertas-cliente/mis-alertas", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al obtener alertas");
      const data = await response.json();
      setAlertas(data);
    } catch (err) {
      setError("No se pudo cargar la lista de alertas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar con debounce
  const debouncedSearch = React.useCallback(
    debounce(() => {
      setCurrentPage(1); // Resetear a la primera página al buscar
    }, 500),
    [searchTerm, tipoFilter]
  );

  useEffect(() => {
    fetchAlertas();
  }, []);

  useEffect(() => {
    debouncedSearch();
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, tipoFilter, debouncedSearch]);

  // Marcar alerta como vista
  const handleMarcarVisto = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8099/api/v1/alertas-cliente/${id}/marcar-visto`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) throw new Error("Error al marcar la alerta como vista");
      
      // Actualizar la lista de alertas
      fetchAlertas();
      if (onDataChange) onDataChange();
      
    } catch (err) {
      console.error("Error al marcar la alerta como vista:", err);
      setError("No se pudo marcar la alerta como vista");
    }
  };

  // Marcar alerta como resuelta
  const handleMarcarResuelto = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8099/api/v1/alertas-cliente/${id}/marcar-resuelto`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) throw new Error("Error al marcar la alerta como resuelta");
      
      // Actualizar la lista de alertas
      fetchAlertas();
      if (onDataChange) onDataChange();
      
    } catch (err) {
      console.error("Error al marcar la alerta como resuelta:", err);
      setError("No se pudo marcar la alerta como resuelta");
    }
  };

  // Abrir modal de confirmación
  const handleConfirmAction = (id: number, action: "marcar-visto" | "marcar-resuelto") => {
    setAlertaToAction({ id, action });
    setConfirmModalOpen(true);
  };

  // Cancelar acción
  const handleCancelAction = () => {
    setConfirmModalOpen(false);
    setAlertaToAction(null);
  };

  // Ejecutar acción después de confirmación
  const handleConfirmedAction = async () => {
    if (!alertaToAction) return;
    
    if (alertaToAction.action === "marcar-visto") {
      await handleMarcarVisto(alertaToAction.id);
    } else if (alertaToAction.action === "marcar-resuelto") {
      await handleMarcarResuelto(alertaToAction.id);
    }
    
    setConfirmModalOpen(false);
    setAlertaToAction(null);
  };

  // Refrescar datos
  const handleRefresh = () => {
    fetchAlertas();
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setTipoFilter("");
    setCurrentPage(1);
  };

  // Formatear fecha para mostrar
  const formatFecha = (fechaStr: string) => {
    try {
      const fecha = parseISO(fechaStr);
      return format(fecha, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch (e) {
      return fechaStr;
    }
  };

  // Obtener color de badge según tipo de alerta
  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "DECLARACION_EN_PROCESO":
      case "DECLARACION_POR_VENCER":
      case "OBLIGACION_POR_VENCER":
        return "bg-amber-100 text-amber-800";
      case "DECLARACION_VENCIDA":
      case "OBLIGACION_VENCIDA":
        return "bg-red-100 text-red-800";
      case "NUEVA_OBLIGACION":
        return "bg-blue-100 text-blue-800";
      case "DECLARACION_COMPLETADA":
      case "OBLIGACION_RESUELTA":
        return "bg-green-100 text-green-800";
      case "PAGO_EN_PROCESO":
        return "bg-purple-100 text-purple-800";
      case "PAGO_RECHAZADO":
        return "bg-red-100 text-red-800";
      case "PAGO_ACEPTADO":
      case "PAGO_VALIDADO":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Esta función se eliminó porque no se estaba utilizando

  // Formatear tipo de alerta para mostrar
  const formatTipoAlerta = (tipo: string) => {
    return tipo.replace(/_/g, " ");
  };

  // Filtrar alertas según la pestaña activa, búsqueda y filtros
  const filteredAlertas = alertas.filter(alerta => {
    // Filtrar por estado según la pestaña activa
    if (activeTab === "activas" && alerta.estado !== "ACTIVO") return false;
    if (activeTab === "vistas" && alerta.estado !== "VISTO") return false;
    
    // Filtrar por término de búsqueda
    if (searchTerm && !alerta.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtrar por tipo
    if (tipoFilter && tipoFilter !== "todos" && alerta.tipo !== tipoFilter) {
      return false;
    }
    
    return true;
  });

  // Calcular paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAlertas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAlertas.length / itemsPerPage);

  // Obtener tipos únicos para el filtro
  const tiposUnicos = Array.from(new Set(alertas.map(alerta => alerta.tipo)));

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="activas" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Alertas Activas
              </TabsTrigger>
              <TabsTrigger value="vistas" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Alertas Vistas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="activas">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex flex-1 items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar por descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchTerm("")}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Limpiar búsqueda</span>
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select value={tipoFilter} onValueChange={setTipoFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los tipos</SelectItem>
                        {tiposUnicos.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>
                            {formatTipoAlerta(tipo)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="icon" onClick={handleClearFilters}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Limpiar filtros</span>
                    </Button>
                    
                    <Button variant="outline" size="icon" onClick={handleRefresh}>
                      <RefreshCw className="h-4 w-4" />
                      <span className="sr-only">Refrescar</span>
                    </Button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500 py-4">{error}</div>
                ) : filteredAlertas.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No hay alertas activas</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No tienes alertas activas en este momento.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="w-[40%]">Descripción</TableHead>
                            <TableHead>Fecha Creación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentItems.map((alerta) => (
                            <TableRow key={alerta.id}>
                              <TableCell>
                                <Badge className={getTipoBadgeColor(alerta.tipo)}>
                                  {formatTipoAlerta(alerta.tipo)}
                                </Badge>
                              </TableCell>
                              <TableCell>{alerta.descripcion}</TableCell>
                              <TableCell>{formatFecha(alerta.fechaCreacion)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1"
                                    onClick={() => handleConfirmAction(alerta.id, "marcar-visto")}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Marcar como visto</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1"
                                    onClick={() => handleConfirmAction(alerta.id, "marcar-resuelto")}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    <span>Marcar como resuelto</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {totalPages > 1 && (
                      <Pagination className="mt-4">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPages }).map((_, i) => {
                            const page = i + 1;
                            
                            // Mostrar primera página, última página y páginas alrededor de la actual
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    isActive={page === currentPage}
                                    onClick={() => setCurrentPage(page)}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            
                            // Mostrar elipsis para páginas omitidas
                            if (
                              (page === 2 && currentPage > 3) ||
                              (page === totalPages - 1 && currentPage < totalPages - 2)
                            ) {
                              return (
                                <PaginationItem key={page}>
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
              </div>
            </TabsContent>
            
            <TabsContent value="vistas">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex flex-1 items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar por descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchTerm("")}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Limpiar búsqueda</span>
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select value={tipoFilter} onValueChange={setTipoFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los tipos</SelectItem>
                        {tiposUnicos.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>
                            {formatTipoAlerta(tipo)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="icon" onClick={handleClearFilters}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Limpiar filtros</span>
                    </Button>
                    
                    <Button variant="outline" size="icon" onClick={handleRefresh}>
                      <RefreshCw className="h-4 w-4" />
                      <span className="sr-only">Refrescar</span>
                    </Button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500 py-4">{error}</div>
                ) : filteredAlertas.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No hay alertas vistas</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No tienes alertas marcadas como vistas en este momento.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="w-[40%]">Descripción</TableHead>
                            <TableHead>Fecha Creación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentItems.map((alerta) => (
                            <TableRow key={alerta.id}>
                              <TableCell>
                                <Badge className={getTipoBadgeColor(alerta.tipo)}>
                                  {formatTipoAlerta(alerta.tipo)}
                                </Badge>
                              </TableCell>
                              <TableCell>{alerta.descripcion}</TableCell>
                              <TableCell>{formatFecha(alerta.fechaCreacion)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1"
                                  onClick={() => handleConfirmAction(alerta.id, "marcar-resuelto")}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span>Marcar como resuelto</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {totalPages > 1 && (
                      <Pagination className="mt-4">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPages }).map((_, i) => {
                            const page = i + 1;
                            
                            // Mostrar primera página, última página y páginas alrededor de la actual
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    isActive={page === currentPage}
                                    onClick={() => setCurrentPage(page)}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            
                            // Mostrar elipsis para páginas omitidas
                            if (
                              (page === 2 && currentPage > 3) ||
                              (page === totalPages - 1 && currentPage < totalPages - 2)
                            ) {
                              return (
                                <PaginationItem key={page}>
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
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de confirmación */}
      {confirmModalOpen && alertaToAction && (
        <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {alertaToAction.action === "marcar-visto" 
                  ? "Confirmar marcar como visto" 
                  : "Confirmar marcar como resuelto"}
              </DialogTitle>
              <DialogDescription>
                {alertaToAction.action === "marcar-visto"
                  ? "¿Estás seguro de que deseas marcar esta alerta como vista? Podrás resolverla más tarde."
                  : "¿Estás seguro de que deseas marcar esta alerta como resuelta? Esta acción no se puede deshacer."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelAction}>Cancelar</Button>
              <Button 
                variant={alertaToAction.action === "marcar-resuelto" ? "default" : "secondary"}
                onClick={handleConfirmedAction}
              >
                {alertaToAction.action === "marcar-visto" ? "Marcar como visto" : "Marcar como resuelto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AlertasTable;
