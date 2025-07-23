import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle, Eye, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AlertasContadorTable from "./AlertasContadorTable";

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

interface AlertasMetricas {
  totalActivas: number;
  totalVistas: number;
  totalResueltas: number;
  porTipo: Record<TipoAlertaContador, number>;
}

const AlertasContadorModule: React.FC = () => {
  // No usamos contadorInfo en la UI, pero lo mantenemos para referencia futura
  // const [contadorInfo, setContadorInfo] = useState<ContadorInfo | null>(null);
  const [metricas, setMetricas] = useState<AlertasMetricas>({
    totalActivas: 0,
    totalVistas: 0,
    totalResueltas: 0,
    porTipo: {} as Record<TipoAlertaContador, number>,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener métricas de alertas del contador
  useEffect(() => {
    const fetchAlertasInfo = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        // Obtener alertas del contador
        const alertasResponse = await fetch("http://localhost:8099/api/v1/alertas-contador/mis-alertas", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!alertasResponse.ok) {
          throw new Error("Error al obtener alertas del contador");
        }
        
        // Calcular métricas
        const alertasData = await alertasResponse.json();
        
        // Verificar que alertasData sea un array
        if (!Array.isArray(alertasData)) {
          throw new Error("El formato de datos de alertas no es válido");
        }
        
        const alertas: AlertaContadorResponse[] = alertasData;
        const activas = alertas.filter((a) => a.estado === "ACTIVO").length;
        const vistas = alertas.filter((a) => a.estado === "VISTO").length;
        const resueltas = alertas.filter((a) => a.estado === "RESUELTO").length;
        
        // Calcular distribución por tipo
        const porTipo = {} as Record<TipoAlertaContador, number>;
        alertas.forEach((alerta) => {
          if (!porTipo[alerta.tipo]) {
            porTipo[alerta.tipo] = 0;
          }
          porTipo[alerta.tipo]++;
        });
        
        setMetricas({
          totalActivas: activas,
          totalVistas: vistas,
          totalResueltas: resueltas,
          porTipo,
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, intente nuevamente.");
        setLoading(false);
      }
    };

    fetchAlertasInfo();
  }, []);

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

  // Obtener color de badge según tipo de alerta
  const getTipoAlertaBadgeColor = (tipo: string): string => {
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

  if (loading) {
    return <div className="p-4">Cargando información...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Alertas y Notificaciones</h2>
        <p className="text-muted-foreground">
          Gestiona tus alertas y notificaciones como contador
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <Bell className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.totalActivas}</div>
            <p className="text-xs text-muted-foreground">
              Alertas que requieren tu atención
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Vistas</CardTitle>
            <Eye className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.totalVistas}</div>
            <p className="text-xs text-muted-foreground">
              Alertas que has revisado pero no resuelto
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Resueltas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.totalResueltas}</div>
            <p className="text-xs text-muted-foreground">
              Alertas que has marcado como resueltas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución por tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metricas.porTipo).map(([tipo, cantidad]) => (
              <Badge
                key={tipo}
                className={`${getTipoAlertaBadgeColor(tipo)} flex items-center gap-1`}
              >
                <AlertTriangle className="h-3 w-3" />
                {formatTipoAlerta(tipo)}: {cantidad}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de alertas */}
      <AlertasContadorTable />
    </div>
  );
};

export default AlertasContadorModule;
