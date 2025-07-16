import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  Clock,
  CheckCircle,
  Eye,
  CreditCard,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ObligacionResponse, EstadoObligacion } from "@/types/obligacion";
import { formatCurrency } from "@/lib/utils";
import ObligacionDetalleModal from "./ObligacionDetalleModal";
import PagoContadorModal from "./PagoContadorModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ObligacionesContadorTableProps {
  obligaciones: ObligacionResponse[];
  orden?: "ASC" | "DESC";
  onOrdenChange?: (value: "ASC" | "DESC") => void;
  onDataUpdated?: () => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, variant = "ghost", disabled = false }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className="h-8 w-8"
            onClick={onClick}
            disabled={disabled}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ObligacionesContadorTable: React.FC<ObligacionesContadorTableProps> = ({
  obligaciones,
  orden = "DESC",
  onOrdenChange,
  onDataUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedObligacion, setSelectedObligacion] = useState<ObligacionResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [selectedObligacionPago, setSelectedObligacionPago] = useState<ObligacionResponse | null>(null);
  const itemsPerPage = 5;
  
  // Funciones para manejar las acciones de los botones
  const handleVerDetalles = (obligacion: ObligacionResponse) => {
    console.log(`Ver detalles de obligación ${obligacion.id}`);
    setSelectedObligacion(obligacion);
    setIsModalOpen(true);
  };

  const handleGenerarPago = (obligacion: ObligacionResponse) => {
    console.log(`Generar pago para obligación ${obligacion.id}`);
    setSelectedObligacionPago(obligacion);
    setIsPagoModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleClosePagoModal = () => {
    setIsPagoModalOpen(false);
  };

  const handlePagoSuccess = () => {
    console.log('Pago registrado exitosamente');
    // Recargar los datos para actualizar la tabla
    if (onDataUpdated) {
      onDataUpdated();
    }
  };

  // Filtrar obligaciones por término de búsqueda interno (adicional a los filtros del módulo principal)
  const filteredObligaciones = obligaciones
    .filter((obligacion) => {
      const searchTermLower = searchTerm.toLowerCase();
      if (searchTerm.trim() === "") return true;
      return (
        obligacion.tipo.toLowerCase().includes(searchTermLower) ||
        obligacion.estado.toLowerCase().includes(searchTermLower) ||
        obligacion.cliente.nombres.toLowerCase().includes(searchTermLower) ||
        (obligacion.cliente.apellidos && obligacion.cliente.apellidos.toLowerCase().includes(searchTermLower)) ||
        obligacion.cliente.rucDni.toLowerCase().includes(searchTermLower)
      );
    })
    // Ordenar por fecha según el valor de orden
    .sort((a, b) => {
      const dateA = new Date(a.fechaLimite).getTime();
      const dateB = new Date(b.fechaLimite).getTime();
      return orden === "ASC" ? dateA - dateB : dateB - dateA;
    });

  // Calcular paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredObligaciones.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredObligaciones.length / itemsPerPage);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Formatear periodo tributario
  const formatPeriodo = (periodo: string | undefined) => {
    console.log("Valor de periodo recibido:", periodo);
    
    // Verificar si periodo es undefined o null
    if (!periodo) {
      return "-";
    }
    
    try {
      // Extraer el año y mes directamente del string YYYY-MM-DD
      if (periodo.match(/^\d{4}-\d{2}(-\d{2})?$/)) {
        // Dividir la fecha en partes
        const parts = periodo.split('-');
        const year = parts[0];
        const month = parseInt(parts[1], 10);
        
        // Array de nombres de meses en español
        const monthNames = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        
        // Restar 1 porque los meses en JavaScript son 0-indexed
        const monthName = monthNames[month - 1];
        console.log(`Periodo formateado: ${monthName} de ${year}`);
        return `${monthName} de ${year}`;
      }
      
      // Si no coincide con el formato esperado, intentamos con el formato de fecha completo
      const date = new Date(periodo);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        
        const monthNames = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        
        const resultado = `${monthNames[month]} de ${year}`;
        console.log(`Periodo formateado desde fecha: ${resultado}`);
        return resultado;
      }
      
      console.log("No se pudo formatear el periodo, devolviendo original:", periodo);
      return periodo;
    } catch (error) {
      console.error("Error al formatear periodo:", error);
      return periodo;
    }
  };

  // Obtener color del badge según el estado
  const getEstadoBadgeColor = (estado: EstadoObligacion) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "PAGADA":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "PAGADA_CON_RETRASO":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "VENCIDA":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "NO_DISPONIBLE":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Obtener icono según el estado
  const getEstadoIcon = (estado: EstadoObligacion) => {
    switch (estado) {
      case "PENDIENTE":
        return <Clock className="h-4 w-4" />;
      case "PAGADA":
        return <CheckCircle className="h-4 w-4" />;
      case "PAGADA_CON_RETRASO":
        return <CheckCircle className="h-4 w-4" />;
      case "VENCIDA":
        return <AlertCircle className="h-4 w-4" />;
      case "NO_DISPONIBLE":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full">
      {/* Modal de detalles */}
      <ObligacionDetalleModal 
        obligacion={selectedObligacion} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
      
      {/* Modal de pago */}
      <PagoContadorModal
        obligacion={selectedObligacionPago}
        isOpen={isPagoModalOpen}
        onClose={handleClosePagoModal}
        onSuccess={handlePagoSuccess}
      />
      
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por Nombre o Ruc"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Resetear la paginación cuando cambia la búsqueda
            }}
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="orden" className="text-sm whitespace-nowrap">Ordenar por fecha</Label>
            <Select 
              value={orden} 
              onValueChange={(value) => onOrdenChange && onOrdenChange(value as "ASC" | "DESC")}
            >
              <SelectTrigger id="orden" className="w-[180px]">
                <SelectValue placeholder="Descendente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESC">Más recientes primero</SelectItem>
                <SelectItem value="ASC">Más antiguas primero</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {obligaciones.length} obligaciones
          </div>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha Límite</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((obligacion) => (
                <TableRow key={obligacion.id}>
                  <TableCell className="font-medium">
                    {obligacion.cliente ? 
                      (obligacion.cliente.tipoCliente === "PERSONA_NATURAL" ? 
                        `${obligacion.cliente.nombres} ${obligacion.cliente.apellidos}` : 
                        obligacion.cliente.nombres) : 
                      `Cliente #${obligacion.id}`
                    }
                    <div className="text-xs text-muted-foreground">
                      {obligacion.cliente.rucDni}
                    </div>
                  </TableCell>
                  <TableCell>{formatPeriodo(obligacion.periodoTributario)}</TableCell>
                  <TableCell>{obligacion.tipo}</TableCell>
                  <TableCell>{formatDate(obligacion.fechaLimite)}</TableCell>
                  <TableCell>{formatCurrency(obligacion.monto)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 ${getEstadoBadgeColor(
                        obligacion.estado
                      )}`}
                    >
                      {getEstadoIcon(obligacion.estado)}
                      {obligacion.estado.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <ActionButton
                        icon={<Eye className="h-4 w-4" />}
                        label="Ver detalles"
                        onClick={() => handleVerDetalles(obligacion)}
                      />
                      <ActionButton
                        icon={<CreditCard className="h-4 w-4" />}
                        label="Generar pago"
                        onClick={() => handleGenerarPago(obligacion)}
                        variant="outline"
                        disabled={obligacion.estado === "POR_CONFIRMAR" || obligacion.estado === "PAGADA"}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No se encontraron obligaciones
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {filteredObligaciones.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {indexOfFirstItem + 1} a{" "}
            {Math.min(indexOfLastItem, filteredObligaciones.length)} de{" "}
            {filteredObligaciones.length} obligaciones
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
      
      {/* Modal de detalles */}
      <ObligacionDetalleModal 
        obligacion={selectedObligacion} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
      
      {/* Modal de pago */}
      <PagoContadorModal 
        obligacion={selectedObligacionPago} 
        isOpen={isPagoModalOpen} 
        onClose={handleClosePagoModal} 
        onSuccess={handlePagoSuccess} 
      />
    </div>
  );
};

// Memorizamos el componente para evitar renderizados innecesarios cuando los filtros cambian
export default React.memo(ObligacionesContadorTable);
