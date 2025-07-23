import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Search,
  RefreshCw,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import axios from "axios"; - No se usa
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Interfaces
interface AlertaContadorResponse {
  id: number;
  idContador: number;
  descripcion: string;
  estado: "ACTIVO" | "VISTO" | "RESUELTO";
  tipo: TipoAlertaContador;
  fechaCreacion: string;
  fechaExpiracion: string | null;
}

type TipoAlertaContador =
  | "DECLARACION_EN_PROCESO"
  | "DECLARACION_POR_VENCER"
  | "OBLIGACION_POR_VENCER"
  | "DECLARACION_VENCIDA"
  | "OBLIGACION_VENCIDA"
  | "NUEVA_OBLIGACION"
  | "DECLARACION_COMPLETADA"
  | "OBLIGACION_RESUELTA"
  | "PAGO_POR_VALIDAR"
  | "PAGO_RECHAZADO"
  | "PAGO_ACEPTADO";

const AlertasContadorTable: React.FC = () => {
  const [alertas, setAlertas] = useState<AlertaContadorResponse[]>([]);
  const [filteredAlertas, setFilteredAlertas] = useState<AlertaContadorResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("TODOS");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<string>("activas");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogAction, setDialogAction] = useState<"visto" | "resuelto">("visto");
  const [selectedAlertaId, setSelectedAlertaId] = useState<number | null>(null);

  // Cargar alertas
  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      console.log("Obteniendo alertas del contador...");
      const response = await fetch("http://localhost:8099/api/v1/alertas-contador/mis-alertas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error(`Error al cargar alertas: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Datos recibidos del backend:", data);
      
      // Verificar que data sea un array
      if (!Array.isArray(data)) {
        throw new Error("El formato de datos de alertas no es válido");
      }
      
      setAlertas(data);
      // También actualizar las alertas filtradas inicialmente
      setFilteredAlertas(data.filter(alerta => activeTab === "activas" ? alerta.estado === "ACTIVO" : alerta.estado === "VISTO"));
      console.log("Alertas guardadas en estado:", data);
      setLoading(false);
    } catch (err) {
      console.error("Error al cargar alertas:", err);
      setError("Error al cargar las alertas. Por favor, intente nuevamente.");
      setLoading(false);
    }
  };

  // Cargar alertas al montar el componente
  useEffect(() => {
    console.log("Componente AlertasContadorTable montado, cargando alertas...");
    fetchAlertas();
  }, []);

  // Filtrar alertas cuando cambian los filtros
  useEffect(() => {
    console.log("Filtrando alertas. Total alertas:", alertas.length);
    console.log("Alertas originales:", alertas);
    console.log("Tab activa:", activeTab);
    
    // Crear una copia de las alertas para filtrar
    let filtered = [...alertas];
    console.log("Copia de alertas para filtrar:", filtered);

    // Filtrar por estado según la pestaña activa
    if (activeTab === "activas") {
      // Mostrar alertas con estado ACTIVO
      filtered = filtered.filter((alerta) => alerta.estado === "ACTIVO");
      console.log("Alertas con estado ACTIVO:", filtered);
    } else if (activeTab === "vistas") {
      // Mostrar alertas con estado VISTO
      filtered = filtered.filter((alerta) => alerta.estado === "VISTO");
      console.log("Alertas con estado VISTO:", filtered);
    }

    // Filtrar por tipo si no es "TODOS"
    if (tipoFiltro !== "TODOS") {
      filtered = filtered.filter((alerta) => alerta.tipo === tipoFiltro);
      console.log(`Alertas filtradas por tipo ${tipoFiltro}:`, filtered.length);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (alerta) =>
          alerta.descripcion.toLowerCase().includes(term) ||
          alerta.tipo.toLowerCase().includes(term)
      );
      console.log(`Alertas filtradas por búsqueda "${searchTerm}":`, filtered.length);
    }

    console.log("Alertas filtradas finales:", filtered);
    setFilteredAlertas(filtered);
    setCurrentPage(1); // Resetear a la primera página cuando cambian los filtros
  }, [alertas, searchTerm, tipoFiltro, activeTab]);

  // Marcar alerta como vista
  const marcarComoVisto = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8099/api/v1/alertas-contador/${id}/marcar-visto`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`Error al marcar alerta como vista: ${response.status}`);
      }
      
      await fetchAlertas(); // Recargar alertas
      return true;
    } catch (err) {
      console.error("Error al marcar alerta como vista:", err);
      setError("Error al marcar la alerta como vista. Por favor, intente nuevamente.");
      return false;
    }
  };

  // Marcar alerta como resuelta
  const marcarComoResuelto = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8099/api/v1/alertas-contador/${id}/marcar-resuelto`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`Error al marcar alerta como resuelta: ${response.status}`);
      }
      
      await fetchAlertas(); // Recargar alertas
      return true;
    } catch (err) {
      console.error("Error al marcar alerta como resuelta:", err);
      setError("Error al marcar la alerta como resuelta. Por favor, intente nuevamente.");
      return false;
    }
  };

  // Abrir diálogo de confirmación
  const openConfirmDialog = (id: number, action: "visto" | "resuelto") => {
    setSelectedAlertaId(id);
    setDialogAction(action);
    setDialogOpen(true);
  };

  // Confirmar acción
  const confirmAction = async () => {
    if (selectedAlertaId) {
      if (dialogAction === "visto") {
        await marcarComoVisto(selectedAlertaId);
      } else {
        await marcarComoResuelto(selectedAlertaId);
      }
      setDialogOpen(false);
    }
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAlertas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAlertas.length / itemsPerPage);
  
  console.log("Elementos actuales a mostrar:", currentItems);
  console.log(`Página ${currentPage} de ${totalPages}, mostrando ${currentItems.length} elementos`);

  // Cambiar página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  // Obtener color de badge según tipo de alerta
  const getTipoAlertaBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "DECLARACION_EN_PROCESO":
      case "DECLARACION_POR_VENCER":
      case "OBLIGACION_POR_VENCER":
        return "bg-amber-100 text-amber-800";
      case "DECLARACION_VENCIDA":
      case "OBLIGACION_VENCIDA":
      case "PAGO_RECHAZADO":
        return "bg-red-100 text-red-800";
      case "NUEVA_OBLIGACION":
      case "PAGO_POR_VALIDAR":
        return "bg-blue-100 text-blue-800";
      case "DECLARACION_COMPLETADA":
      case "OBLIGACION_RESUELTA":
      case "PAGO_ACEPTADO":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Formatear tipo de alerta para mostrar
  const formatTipoAlerta = (tipo: string): string => {
    switch (tipo) {
      case "DECLARACION_EN_PROCESO":
        return "Declaración en proceso";
      case "DECLARACION_POR_VENCER":
        return "Declaración por vencer";
      case "OBLIGACION_POR_VENCER":
        return "Obligación por vencer";
      case "DECLARACION_VENCIDA":
        return "Declaración vencida";
      case "OBLIGACION_VENCIDA":
        return "Obligación vencida";
      case "NUEVA_OBLIGACION":
        return "Nueva obligación";
      case "DECLARACION_COMPLETADA":
        return "Declaración completada";
      case "OBLIGACION_RESUELTA":
        return "Obligación resuelta";
      case "PAGO_POR_VALIDAR":
        return "Pago por validar";
      case "PAGO_RECHAZADO":
        return "Pago rechazado";
      case "PAGO_ACEPTADO":
        return "Pago aceptado";
      default:
        return tipo;
    }
  };

  return (
    <>
      <Tabs
        defaultValue="activas"
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="activas">Alertas Activas</TabsTrigger>
            <TabsTrigger value="vistas">Alertas Vistas</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlertas}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex items-center relative flex-1">
            <Search className="absolute left-2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar alertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select
              value={tipoFiltro}
              onValueChange={setTipoFiltro}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los tipos</SelectItem>
                <SelectItem value="DECLARACION_EN_PROCESO">Declaración en proceso</SelectItem>
                <SelectItem value="DECLARACION_POR_VENCER">Declaración por vencer</SelectItem>
                <SelectItem value="OBLIGACION_POR_VENCER">Obligación por vencer</SelectItem>
                <SelectItem value="DECLARACION_VENCIDA">Declaración vencida</SelectItem>
                <SelectItem value="OBLIGACION_VENCIDA">Obligación vencida</SelectItem>
                <SelectItem value="NUEVA_OBLIGACION">Nueva obligación</SelectItem>
                <SelectItem value="DECLARACION_COMPLETADA">Declaración completada</SelectItem>
                <SelectItem value="OBLIGACION_RESUELTA">Obligación resuelta</SelectItem>
                <SelectItem value="PAGO_POR_VALIDAR">Pago por validar</SelectItem>
                <SelectItem value="PAGO_RECHAZADO">Pago rechazado</SelectItem>
                <SelectItem value="PAGO_ACEPTADO">Pago aceptado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contenido de pestañas */}
        <TabsContent value="activas" className="mt-0">
          {loading ? (
            <div className="text-center py-4">Cargando alertas...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : filteredAlertas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay alertas activas para mostrar
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-[300px]">Descripción</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.length > 0 ? (
                      currentItems.map((alerta) => (
                        <TableRow key={alerta.id}>
                          <TableCell>
                            <Badge className={getTipoAlertaBadgeColor(alerta.tipo)}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {formatTipoAlerta(alerta.tipo)}
                            </Badge>
                          </TableCell>
                          <TableCell>{alerta.descripcion}</TableCell>
                          <TableCell>{formatDate(alerta.fechaCreacion)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openConfirmDialog(alerta.id, "visto")}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Marcar como visto
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openConfirmDialog(alerta.id, "resuelto")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Resolver
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          No hay alertas para mostrar en esta página
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <Button
                        key={index}
                        variant={currentPage === index + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => paginate(index + 1)}
                      >
                        {index + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="vistas" className="mt-0">
          {loading ? (
            <div className="text-center py-4">Cargando alertas...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : filteredAlertas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay alertas vistas para mostrar
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-[300px]">Descripción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((alerta) => (
                    <TableRow key={alerta.id}>
                      <TableCell>
                        <Badge className={getTipoAlertaBadgeColor(alerta.tipo)}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {formatTipoAlerta(alerta.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell>{alerta.descripcion}</TableCell>
                      <TableCell>{formatDate(alerta.fechaCreacion)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openConfirmDialog(alerta.id, "resuelto")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <Button
                        key={index}
                        variant={currentPage === index + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => paginate(index + 1)}
                      >
                        {index + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "visto"
                ? "Marcar alerta como vista"
                : "Resolver alerta"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "visto"
                ? "¿Estás seguro de que deseas marcar esta alerta como vista?"
                : "¿Estás seguro de que deseas marcar esta alerta como resuelta? Esta acción no se puede deshacer."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmAction}>
              {dialogAction === "visto" ? "Marcar como visto" : "Resolver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Exportación por defecto
export default AlertasContadorTable;
