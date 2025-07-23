import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  BitacoraFiltros,
  BitacoraItem,
  BitacoraResponse,
} from "@/types/bitacora";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown, Loader2, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BitacoraTableProps {
  filtros: BitacoraFiltros;
  onFiltrosChange: (filtros: Partial<BitacoraFiltros>) => void;
}

const BitacoraTable: React.FC<BitacoraTableProps> = ({
  filtros,
  onFiltrosChange,
}) => {
  const [bitacoraData, setBitacoraData] = useState<BitacoraResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BitacoraItem | null>(null);

  const fetchBitacora = async () => {
    setLoading(true);
    setError(null);

    try {
      // Construir la URL con los parámetros de filtro
      const params = new URLSearchParams();
      
      if (filtros.searchTerm) params.append("searchTerm", filtros.searchTerm);
      if (filtros.modulo) params.append("modulo", filtros.modulo);
      if (filtros.accion) params.append("accion", filtros.accion);
      if (filtros.fechaDesde) params.append("fechaDesde", filtros.fechaDesde);
      if (filtros.fechaHasta) params.append("fechaHasta", filtros.fechaHasta);
      
      params.append("page", filtros.page.toString());
      params.append("size", filtros.size.toString());
      params.append("sortBy", filtros.sortBy);
      params.append("sortDir", filtros.sortDir);

      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8099/api/v1/bitacora?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener datos de bitácora");
      }

      const data: BitacoraResponse = await response.json();
      setBitacoraData(data);
    } catch (err) {
      console.error("Error fetching bitacora:", err);
      setError("Error al cargar los datos de bitácora. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBitacora();
  }, [filtros]);

  const handleSort = (column: string) => {
    onFiltrosChange({
      sortBy: column,
      sortDir: filtros.sortBy === column && filtros.sortDir === "ASC" ? "DESC" : "ASC",
    });
  };

  const handlePageChange = (newPage: number) => {
    onFiltrosChange({ page: newPage });
  };

  const getAccionBadgeVariant = (accion: string): "default" | "destructive" | "outline" | "secondary" => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      CREAR: "secondary",
      ACTUALIZAR: "secondary",
      ELIMINAR: "destructive",
      ASIGNAR_CONTADOR: "secondary",
      DESASIGNAR_CONTADOR: "secondary",
      LOGIN: "secondary",
      REGISTRO_CLIENTE: "secondary",
      NOTIFICAR_CONTADOR: "secondary",
      MARCAR_EN_PROCESO: "secondary",
      MARCAR_DECLARADO: "secondary",
      SUBIR_COMPROBANTE: "secondary",
    };
    return variants[accion] || "default";
  };

  const formatFecha = (fechaStr: string | undefined) => {
    if (!fechaStr) return "";
    try {
      const fecha = parseISO(fechaStr);
      return format(fecha, "dd/MM/yyyy HH:mm:ss", { locale: es });
    } catch (error) {
      return fechaStr || "";
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("usuario.username")}
              >
                <div className="flex items-center">
                  Usuario
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Rol</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("modulo")}
              >
                <div className="flex items-center">
                  Módulo
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("accion")}
              >
                <div className="flex items-center">
                  Acción
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("fechaMovimiento")}
              >
                <div className="flex items-center">
                  Fecha
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Mostrar esqueletos durante la carga
              Array.from({ length: filtros.size }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : bitacoraData && bitacoraData.content.length > 0 ? (
              bitacoraData.content.map((item: BitacoraItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.usuario.username}
                    <div className="text-xs text-gray-500">
                      {item.usuario.nombres} {item.usuario.apellidos}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.rol}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-gray-100 text-gray-800 border-gray-200"
                    >
                      {item.modulo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getAccionBadgeVariant(item.accion)}>
                      {item.accion.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.descripcion.length > 50 
                      ? `${item.descripcion.substring(0, 50)}...` 
                      : item.descripcion}
                  </TableCell>
                  <TableCell>{formatFecha(item.fechaMovimiento)}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver detalles</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No se encontraron registros en la bitácora
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {bitacoraData && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {bitacoraData.numberOfElements} de {bitacoraData.totalElements} registros
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(bitacoraData.number - 1)}
              disabled={bitacoraData.first || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <div className="text-sm">
              Página {bitacoraData.number + 1} de {bitacoraData.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(bitacoraData.number + 1)}
              disabled={bitacoraData.last || loading}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Indicador de carga */}
      {loading && (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}

      {/* Diálogo para mostrar detalles */}
      <Dialog 
        open={!!selectedItem} 
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Detalles del registro de bitácora</DialogTitle>
            <DialogDescription>
              Información completa del movimiento registrado en el sistema
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Usuario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nombre de usuario</p>
                      <p>{selectedItem.usuario.username}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Rol</p>
                      <Badge variant="outline">{selectedItem.rol}</Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500">Nombre completo</p>
                      <p>{selectedItem.usuario.nombres} {selectedItem.usuario.apellidos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalles del Movimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Módulo</p>
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-800 border-gray-200 mt-1"
                      >
                        {selectedItem.modulo}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Acción</p>
                      <Badge 
                        variant={getAccionBadgeVariant(selectedItem.accion)}
                        className="mt-1"
                      >
                        {selectedItem.accion.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500">Fecha y hora</p>
                      <p>{formatFecha(selectedItem.fechaMovimiento)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500">Descripción</p>
                      <p className="whitespace-pre-wrap">{selectedItem.descripcion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedItem(null)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BitacoraTable;
