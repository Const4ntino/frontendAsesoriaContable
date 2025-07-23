import React, { useEffect, useState } from "react";
import AlertasTable from "./AlertasTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface ClienteInfo {
  id: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
  regimen: string;
  tipoCliente: string;
}

interface AlertaMetricas {
  totalActivas: number;
  totalVistas: number;
  totalResueltas: number;
  porTipo: Record<string, number>;
}

const AlertasModule: React.FC = () => {
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metricas, setMetricas] = useState<AlertaMetricas | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshMetricas = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Obtener información del cliente
  useEffect(() => {
    const fetchClienteInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8099/api/clientes/encontrarme", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error("Error al obtener información del cliente");
        const data = await response.json();
        setClienteInfo(data);
        
        // Solo continuar si el cliente no es NRUS
        if (data.regimen !== "NRUS") {
          fetchAlertasMetricas();
        }
      } catch (err) {
        console.error("Error al obtener información del cliente:", err);
        setError("No se pudo cargar la información del cliente");
      } finally {
        setLoading(false);
      }
    };
    
    fetchClienteInfo();
  }, [refreshTrigger]);
  
  // Obtener métricas de alertas
  const fetchAlertasMetricas = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8099/api/v1/alertas-cliente/mis-alertas", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al obtener alertas");
      const alertas = await response.json();
      
      // Calcular métricas
      const metricas: AlertaMetricas = {
        totalActivas: alertas.filter((a: any) => a.estado === "ACTIVO").length,
        totalVistas: alertas.filter((a: any) => a.estado === "VISTO").length,
        totalResueltas: alertas.filter((a: any) => a.estado === "RESUELTO").length,
        porTipo: {}
      };
      
      // Contar por tipo
      alertas.forEach((alerta: any) => {
        if (!metricas.porTipo[alerta.tipo]) {
          metricas.porTipo[alerta.tipo] = 0;
        }
        metricas.porTipo[alerta.tipo]++;
      });
      
      setMetricas(metricas);
    } catch (err) {
      console.error("Error al obtener métricas de alertas:", err);
    }
  };

  // Función para obtener el color del badge según el tipo de alerta
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
  
  // Si el cliente es NRUS, no mostrar este módulo
  if (clienteInfo && clienteInfo.regimen === "NRUS") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Alertas no disponibles</CardTitle>
            <CardDescription>
              El módulo de alertas no está disponible para clientes del régimen NRUS.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Alertas y Notificaciones</h2>
      <p className="text-muted-foreground">
        Gestiona tus alertas y notificaciones importantes relacionadas con declaraciones, obligaciones y pagos.
      </p>
      
      {loading ? (
        <div className="space-y-4">
          <div className="animate-pulse h-32 bg-gray-200 rounded-md"></div>
          <div className="animate-pulse h-64 bg-gray-200 rounded-md"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">{error}</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Tarjeta de Alertas Activas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alertas Activas
              </CardTitle>
              <CardDescription>Requieren tu atención</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metricas?.totalActivas || 0}</div>
              {metricas?.totalActivas === 0 && (
                <p className="text-sm text-muted-foreground mt-2">No tienes alertas activas en este momento.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Tarjeta de Alertas Vistas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Alertas Vistas
              </CardTitle>
              <CardDescription>Pendientes de resolver</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metricas?.totalVistas || 0}</div>
            </CardContent>
          </Card>
          
          {/* Tarjeta de Alertas Resueltas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Alertas Resueltas
              </CardTitle>
              <CardDescription>Completadas recientemente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metricas?.totalResueltas || 0}</div>
            </CardContent>
          </Card>
          
          {/* Tarjeta de Distribución por Tipo */}
          {metricas && Object.keys(metricas.porTipo).length > 0 && (
            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-indigo-500" />
                  Distribución por Tipo
                </CardTitle>
                <CardDescription>Tipos de alertas en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(metricas.porTipo).map(([tipo, cantidad]) => (
                    <Badge key={tipo} className={getTipoBadgeColor(tipo)}>
                      {tipo.replace(/_/g, " ")}: {cantidad}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      <AlertasTable onDataChange={refreshMetricas} />
    </div>
  );
};

export default AlertasModule;
