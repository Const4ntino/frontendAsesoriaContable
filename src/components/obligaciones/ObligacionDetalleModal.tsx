import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getBadgeVariantByEstadoObligacion } from "@/lib/utils";
import type { ObligacionResponse } from "@/types/obligacion";
import { AlertCircle, Calendar, CreditCard, FileText, User } from "lucide-react";

interface ObligacionDetalleModalProps {
  obligacion: ObligacionResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const ObligacionDetalleModal: React.FC<ObligacionDetalleModalProps> = ({
  obligacion,
  isOpen,
  onClose,
}) => {
  if (!obligacion) return null;

  // Función para formatear el periodo tributario
  const formatPeriodo = (periodo: string | undefined) => {
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
        
        return `${monthNames[month]} de ${year}`;
      }
      
      return periodo;
    } catch (error) {
      console.error("Error al formatear periodo:", error);
      return periodo;
    }
  };

  // Función para determinar si una obligación está próxima a vencer (en los próximos 7 días)
  const isProximaAVencer = () => {
    if (!obligacion.fechaLimite) return false;
    const fechaLimite = new Date(obligacion.fechaLimite);
    const hoy = new Date();
    const diasDiferencia = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diasDiferencia > 0 && diasDiferencia <= 7;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Detalle de Obligación
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Información del cliente */}
          <div className="bg-zinc-50 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-zinc-500 mb-2 flex items-center gap-1">
              <User className="h-4 w-4" /> Cliente
            </h3>
            <p className="text-base font-medium">
              {obligacion.cliente.nombres} {obligacion.cliente.apellidos}
            </p>
            <p className="text-sm text-zinc-600">
              {obligacion.cliente.rucDni}
            </p>
          </div>

          {/* Información de la obligación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-1 flex items-center gap-1">
                <FileText className="h-4 w-4" /> Tipo
              </h3>
              <p className="text-base">{obligacion.tipo}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Periodo
              </h3>
              <p className="text-base">{formatPeriodo(obligacion.periodoTributario)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Fecha Límite
              </h3>
              <p className="text-base">
                {formatDate(obligacion.fechaLimite)}
                {isProximaAVencer() && (
                  <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                    <AlertCircle className="h-3 w-3 mr-1" /> Próxima a vencer
                  </Badge>
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-1 flex items-center gap-1">
                <CreditCard className="h-4 w-4" /> Monto
              </h3>
              <p className="text-base font-medium">{formatCurrency(obligacion.monto)}</p>
            </div>
          </div>

          {/* Estado */}
          <div>
            <h3 className="text-sm font-medium text-zinc-500 mb-1">Estado</h3>
            <Badge variant={getBadgeVariantByEstadoObligacion(obligacion.estado)}>
              {obligacion.estado}
            </Badge>
          </div>

          {/* Observaciones */}
          {obligacion.observaciones && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-1">Observaciones</h3>
              <p className="text-sm bg-zinc-50 p-2 rounded border border-zinc-200">
                {obligacion.observaciones}
              </p>
            </div>
          )}

          {/* Información de la declaración relacionada si existe */}
          {obligacion.declaracion && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-700 mb-2">Declaración Relacionada</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-zinc-500">Periodo:</span>{" "}
                  <span className="font-medium">{obligacion.declaracion.periodoTributario}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Tipo:</span>{" "}
                  <span className="font-medium">{obligacion.declaracion.tipo}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Estado:</span>{" "}
                  <Badge variant="outline" className="text-xs">
                    {obligacion.declaracion.estado}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ObligacionDetalleModal;
