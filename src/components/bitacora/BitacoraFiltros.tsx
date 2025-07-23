import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import type { 
  BitacoraFiltros as BitacoraFiltrosType, 
  ModuloBitacora, 
  AccionBitacora 
} from "@/types/bitacora";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BitacoraFiltrosProps {
  filtros: BitacoraFiltrosType;
  onFiltrosChange: (filtros: Partial<BitacoraFiltrosType>) => void;
}

const BitacoraFiltros: React.FC<BitacoraFiltrosProps> = ({ filtros, onFiltrosChange }) => {
  const [searchTerm, setSearchTerm] = React.useState(filtros.searchTerm || "");
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltrosChange({ searchTerm });
  };

  const handleReset = () => {
    setSearchTerm("");
    onFiltrosChange({
      searchTerm: undefined,
      modulo: undefined,
      accion: undefined,
      fechaDesde: undefined,
      fechaHasta: undefined,
      page: 0,
      sortBy: "fechaMovimiento",
      sortDir: "DESC"
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Buscar por nombre de usuario..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button type="submit">Buscar</Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          <X className="h-4 w-4 mr-2" />
          Limpiar
        </Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Selector de Módulo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Módulo</label>
          <Select
            value={filtros.modulo || "TODOS"}
            onValueChange={(value) => 
              onFiltrosChange({ modulo: value === "TODOS" ? undefined : value as ModuloBitacora })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los módulos</SelectItem>
              {[
                "CLIENTE",
                "CONTADOR",
                "USUARIO",
                "DECLARACION",
                "OBLIGACION",
                "PAGO",
                "INGRESO",
                "EGRESO",
                "ALERTA",
                "AUTH"
              ].map((modulo) => (
                <SelectItem key={modulo} value={modulo}>
                  {modulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selector de Acción */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Acción</label>
          <Select
            value={filtros.accion || "TODAS"}
            onValueChange={(value) => 
              onFiltrosChange({ accion: value === "TODAS" ? undefined : value as AccionBitacora })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas las acciones</SelectItem>
              {[
                "CREAR",
                "ACTUALIZAR",
                "ELIMINAR",
                "ASIGNAR_CONTADOR",
                "DESASIGNAR_CONTADOR",
                "LOGIN",
                "REGISTRO_CLIENTE",
                "NOTIFICAR_CONTADOR",
                "MARCAR_EN_PROCESO",
                "MARCAR_DECLARADO",
                "SUBIR_COMPROBANTE"
              ].map((accion) => (
                <SelectItem key={accion} value={accion}>
                  {accion.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selector de Fecha Desde */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha Desde</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filtros.fechaDesde && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filtros.fechaDesde ? (
                  format(new Date(filtros.fechaDesde), "PPP", { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined}
                onSelect={(date) => 
                  onFiltrosChange({ 
                    fechaDesde: date ? format(date, "yyyy-MM-dd") : undefined 
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Selector de Fecha Hasta */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha Hasta</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filtros.fechaHasta && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filtros.fechaHasta ? (
                  format(new Date(filtros.fechaHasta), "PPP", { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined}
                onSelect={(date) => 
                  onFiltrosChange({ 
                    fechaHasta: date ? format(date, "yyyy-MM-dd") : undefined 
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default BitacoraFiltros;
