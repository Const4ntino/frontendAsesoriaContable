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
import { Eye, DollarSign } from "lucide-react";
import type { ClienteConMetricas } from "@/types/cliente";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger, 
} from "@/components/ui/tooltip";
import ClienteDetalleDialog from "./ClienteDetalleDialog";
import ClienteDetallesDialog from "../revision/ClienteDetallesDialog";

interface ClientesTableProps {
  clientes: ClienteConMetricas[];
  tipoCliente: "PERSONA_NATURAL" | "PERSONA_JURIDICA";
}

const ClientesTable: React.FC<ClientesTableProps> = ({ clientes, tipoCliente }) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteConMetricas | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [clienteMetricas, setClienteMetricas] = useState<any>(null);
  const [clienteDetallesSeleccionado, setClienteDetallesSeleccionado] = useState<any>(null);
  const [detallesDialogoAbierto, setDetallesDialogoAbierto] = useState(false);

  const abrirDialogoDetalles = async (cliente: ClienteConMetricas) => {
    setClienteSeleccionado(cliente);
    
    try {
      // Obtener métricas actualizadas del cliente
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8099/api/clientes/metricas/ingresos-egresos/actual-pasado?clienteId=${cliente.cliente.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener métricas: ${response.status}`);
      }
      
      const data = await response.json();
      setClienteMetricas(data);
    } catch (error) {
      console.error('Error al obtener métricas del cliente:', error);
      alert('No se pudieron cargar las métricas actualizadas del cliente');
    }
    
    setDialogoAbierto(true);
  };

  const cerrarDialogoDetalles = () => {
    setDialogoAbierto(false);
  };

  const abrirDetallesIngresos = (cliente: ClienteConMetricas) => {
    // Convertir el cliente al formato esperado por ClienteDetallesDialog
    const clienteFormateado = {
      id: cliente.cliente.id,
      nombres: cliente.cliente.nombres,
      apellidos: cliente.cliente.apellidos,
      rucDni: cliente.cliente.rucDni,
      email: cliente.cliente.email,
      telefono: cliente.cliente.telefono,
      tipoRuc: cliente.cliente.tipoRuc,
      regimen: cliente.cliente.regimen,
      tipoCliente: cliente.cliente.tipoCliente,
      usuario: cliente.cliente.usuario,
      contador: cliente.cliente.contador
    };
    
    setClienteDetallesSeleccionado(clienteFormateado);
    setDetallesDialogoAbierto(true);
  };
  
  const cerrarDetallesIngresos = () => {
    setDetallesDialogoAbierto(false);
  };
  // Función para formatear montos en soles
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Función para obtener color de badge según régimen
  const getRegimenBadgeColor = (regimen: string) => {
    switch (regimen) {
      case "RER":
        return "bg-blue-100 text-blue-800";
      case "RG":
        return "bg-purple-100 text-purple-800";
      case "RMT":
        return "bg-green-100 text-green-800";
      case "NRUS":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para obtener el color de la utilidad (positivo = verde, negativo = rojo)
  const getUtilidadColor = (utilidad: number) => {
    return utilidad >= 0 ? "text-green-600" : "text-red-600";
  };

  // Obtener el nombre a mostrar según el tipo de cliente
  const getNombreCliente = (cliente: ClienteConMetricas) => {
    if (tipoCliente === "PERSONA_NATURAL") {
      return `${cliente.cliente.nombres} ${cliente.cliente.apellidos}`;
    } else {
      // Para personas jurídicas, el nombre está en el campo 'nombres'
      return cliente.cliente.nombres;
    }
  };

  return (
    <div className="relative overflow-x-auto">
      {clientes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No hay clientes {tipoCliente === "PERSONA_NATURAL" ? "personas naturales" : "personas jurídicas"} para mostrar</p>
        </div>
      ) : (
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">
                {tipoCliente === "PERSONA_NATURAL" ? "Nombre completo" : "Razón social"}
              </TableHead>
              <TableHead className="font-semibold">RUC/DNI</TableHead>
              <TableHead className="font-semibold">Régimen</TableHead>
              <TableHead className="font-semibold text-right">Ingresos del mes</TableHead>
              <TableHead className="font-semibold text-right">Egresos del mes</TableHead>
              <TableHead className="font-semibold text-right">Utilidad</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow key={cliente.cliente.id}>
                <TableCell className="font-medium">
                  {getNombreCliente(cliente)}
                </TableCell>
                <TableCell>{cliente.cliente.rucDni}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getRegimenBadgeColor(cliente.cliente.regimen)}>
                    {cliente.cliente.regimen}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(cliente.totalIngresosMesActual)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(cliente.totalEgresosMesActual)}
                </TableCell>
                <TableCell className={`text-right font-medium ${getUtilidadColor(cliente.utilidadMesActual)}`}>
                  {formatCurrency(cliente.utilidadMesActual)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => abrirDialogoDetalles(cliente)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver detalles</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => abrirDetallesIngresos(cliente)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver ingresos y egresos</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {/* Diálogo de detalles del cliente */}
      <ClienteDetalleDialog
        isOpen={dialogoAbierto}
        onClose={cerrarDialogoDetalles}
        cliente={clienteSeleccionado}
        tipoCliente={tipoCliente}
        clienteMetricas={clienteMetricas}
      />
      
      {/* Diálogo de ingresos y egresos */}
      <ClienteDetallesDialog
        isOpen={detallesDialogoAbierto}
        onClose={cerrarDetallesIngresos}
        cliente={clienteDetallesSeleccionado}
      />
    </div>
  );
};

export default ClientesTable;
