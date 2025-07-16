import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import PagoClienteModal from "./PagoClienteModal";
import type { ObligacionResponse } from "@/types/obligacion";

interface ObligacionesClienteTableProps {
  obligaciones: ObligacionResponse[];
  filtroEstado: string | null;
  onDataUpdated?: () => void;
}

const ObligacionesClienteTable: React.FC<ObligacionesClienteTableProps> = ({ obligaciones, filtroEstado, onDataUpdated }) => {
  const [filteredObligaciones, setFilteredObligaciones] = useState<ObligacionResponse[]>([]);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Estados para el modal de pago
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [selectedObligacion, setSelectedObligacion] = useState<ObligacionResponse | null>(null);

  // Filtrar obligaciones según el estado seleccionado en las pestañas
  useEffect(() => {
    let result = [...obligaciones];
    
    // Aplicar filtro de estado si está seleccionado
    if (filtroEstado === "pendiente") {
      result = result.filter(
        (obligacion) => 
          obligacion.estado === "PENDIENTE" || 
          obligacion.estado === "VENCIDA"
      );
    }
    
    setFilteredObligaciones(result);
    setCurrentPage(1); // Resetear a la primera página cuando cambian los filtros
  }, [obligaciones, filtroEstado]);

  // Calcular índices para paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredObligaciones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredObligaciones.length / itemsPerPage);

  // Función para obtener el badge de estado
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PAGADA":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            PAGADA
          </Badge>
        );
      case "PENDIENTE":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            PENDIENTE
          </Badge>
        );
      case "VENCIDA":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            VENCIDA
          </Badge>
        );
      case "POR_VALIDAR":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            POR VALIDAR
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {estado}
          </Badge>
        );
    }
  };
  
  // Función para abrir el modal de pago
  const handleOpenPagoModal = (obligacion: ObligacionResponse) => {
    setSelectedObligacion(obligacion);
    setIsPagoModalOpen(true);
  };
  
  // Función para cerrar el modal de pago
  const handleClosePagoModal = () => {
    setIsPagoModalOpen(false);
    setSelectedObligacion(null);
  };
  
  // Función que se ejecuta cuando el pago es exitoso
  const handlePagoSuccess = () => {
    if (onDataUpdated) {
      onDataUpdated();
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabla de obligaciones */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Periodo Tributario</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Fecha Límite</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Observaciones</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map((obligacion) => (
            <TableRow key={obligacion.id}>
              <TableCell>{obligacion.tipo}</TableCell>
              <TableCell>
                {format(
                  new Date(`${obligacion.periodoTributario}T12:00:00`),
                  "MMMM yyyy",
                  { locale: es }
                )}
              </TableCell>
              <TableCell>S/ {obligacion.monto.toFixed(2)}</TableCell>
              <TableCell>{format(new Date(obligacion.fechaLimite), "dd/MM/yyyy")}</TableCell>
              <TableCell>{getEstadoBadge(obligacion.estado)}</TableCell>
              <TableCell>{obligacion.observaciones || "-"}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleOpenPagoModal(obligacion)}
                  disabled={obligacion.estado !== "PENDIENTE" && obligacion.estado !== "VENCIDA"}
                >
                  <Upload className="h-4 w-4" />
                  Subir Pago
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Paginación */}
      {filteredObligaciones.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredObligaciones.length)} de {filteredObligaciones.length} obligaciones
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Página {currentPage} de {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Modal para subir pago */}
      <PagoClienteModal
        obligacion={selectedObligacion}
        isOpen={isPagoModalOpen}
        onClose={handleClosePagoModal}
        onSuccess={handlePagoSuccess}
      />
    </div>
  );
};

export default ObligacionesClienteTable;
