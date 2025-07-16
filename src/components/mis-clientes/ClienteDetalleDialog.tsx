import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Clock
} from "lucide-react";
import type { ClienteConMetricas } from "@/types/cliente";

interface ClienteDetalleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteConMetricas | null;
  tipoCliente: "PERSONA_NATURAL" | "PERSONA_JURIDICA";
  clienteMetricas?: any; // Datos de métricas del endpoint
}

const ClienteDetalleDialog: React.FC<ClienteDetalleDialogProps> = ({
  isOpen,
  onClose,
  cliente,
  tipoCliente,
  clienteMetricas,
}) => {
  if (!cliente) return null;

  // Función para formatear montos en soles
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "S/ 0.00";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Función para formatear periodos en formato YYYY-MM
  const formatPeriodoYYYYMM = (periodo: string) => {
    try {
      if (periodo && periodo.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = periodo.split('-');
        const monthNumber = parseInt(month, 10);
        const monthNames = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        const monthName = monthNames[monthNumber - 1];
        return `${monthName} de ${year}`;
      }
      return "Periodo no válido";
    } catch (error) {
      console.error("Error al formatear periodo:", error);
      return "Periodo no válido";
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    if (!dateString) return "No disponible";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
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

  // Obtener el nombre a mostrar según el tipo de cliente
  const getNombreCliente = () => {
    if (tipoCliente === "PERSONA_NATURAL") {
      return `${cliente.cliente.nombres} ${cliente.cliente.apellidos}`;
    } else {
      // Para personas jurídicas, el nombre está en el campo 'nombres'
      return cliente.cliente.nombres;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {tipoCliente === "PERSONA_NATURAL" ? (
              <User className="h-5 w-5 text-primary" />
            ) : (
              <Building2 className="h-5 w-5 text-primary" />
            )}
            {getNombreCliente()}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getRegimenBadgeColor(cliente.cliente.regimen)}>
                {cliente.cliente.regimen}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {cliente.cliente.rucDni}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="informacion" className="w-full mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="informacion">Información</TabsTrigger>
            <TabsTrigger value="financiero">Datos Financieros</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          {/* Tab de Información Personal/Empresarial */}
          <TabsContent value="informacion" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información de Contacto */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Información de Contacto</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      <span className="break-all">{cliente.cliente.telefono || "No registrado"}</span>
                    </div>
                    <div className="flex gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      <span className="break-all">{cliente.cliente.email || "No registrado"}</span>
                    </div>
                    <div className="flex gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      <span className="break-words">Cliente desde: {formatDate(cliente.cliente.fechaRegistro)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información Adicional */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Información Adicional</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      <span className="break-words">Última actualización: {formatDate(cliente.cliente.fechaActualizacion || cliente.cliente.fechaRegistro)}</span>
                    </div>
                    {tipoCliente === "PERSONA_JURIDICA" && (
                      <div className="flex gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        <span className="break-words">Tipo de empresa: {cliente.cliente.tipoEmpresa || "No especificado"}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      <span className="break-words">Dirección: {cliente.cliente.direccion || "No registrada"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab de Datos Financieros */}
          <TabsContent value="financiero" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resumen Financiero Actual */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Resumen Mes Actual</h3>
                  {clienteMetricas ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>Ingresos:</span>
                        </div>
                        <span className="font-medium">{formatCurrency(clienteMetricas.ingresosMesActual || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span>Egresos:</span>
                        </div>
                        <span className="font-medium">{formatCurrency(clienteMetricas.egresosMesActual || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Utilidad:</span>
                        </div>
                        <span className={`font-bold ${(clienteMetricas.utilidadMesActual || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(clienteMetricas.utilidadMesActual || 0)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Periodo: {clienteMetricas.periodoActual ? formatPeriodoYYYYMM(clienteMetricas.periodoActual) : 'No disponible'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>Ingresos:</span>
                        </div>
                        <span className="font-medium">{formatCurrency(cliente.totalIngresosMesActual)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span>Egresos:</span>
                        </div>
                        <span className="font-medium">{formatCurrency(cliente.totalEgresosMesActual)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Utilidad:</span>
                        </div>
                        <span className={`font-bold ${cliente.utilidadMesActual >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(cliente.utilidadMesActual)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histórico Financiero */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Histórico Financiero</h3>
                  {clienteMetricas ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>Ingresos mes anterior:</span>
                        </div>
                        <span className="font-medium">{formatCurrency(clienteMetricas.ingresosMesAnterior || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span>Egresos mes anterior:</span>
                        </div>
                        <span className="font-medium">{formatCurrency(clienteMetricas.egresosMesAnterior || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Utilidad mes anterior:</span>
                        </div>
                        <span className={`font-bold ${(clienteMetricas.utilidadMesAnterior || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(clienteMetricas.utilidadMesAnterior || 0)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Periodo: {clienteMetricas.periodoAnterior ? formatPeriodoYYYYMM(clienteMetricas.periodoAnterior) : 'No disponible'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>Ingresos mes anterior:</span>
                        </div>
                        <span className="font-medium">{formatCurrency(cliente.totalIngresosMesAnterior || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span>Egresos mes anterior:</span>
                        </div>
                        <span className="font-medium">{formatCurrency(cliente.totalEgresosMesAnterior || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Utilidad mes anterior:</span>
                        </div>
                        <span className={`font-bold ${((cliente.totalIngresosMesAnterior || 0) - (cliente.totalEgresosMesAnterior || 0)) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency((cliente.totalIngresosMesAnterior || 0) - (cliente.totalEgresosMesAnterior || 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab de Documentos */}
          <TabsContent value="documentos" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Documentos Recientes</h3>
                {cliente.documentosRecientes && cliente.documentosRecientes.length > 0 ? (
                  <div className="space-y-3">
                    {cliente.documentosRecientes.map((doc, index) => (
                      <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{doc.descripcion || `Documento #${doc.numero}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{formatDate(doc.fecha)}</span>
                          <Badge variant="outline" className="bg-blue-50">
                            {doc.tipo}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No hay documentos recientes disponibles
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteDetalleDialog;
