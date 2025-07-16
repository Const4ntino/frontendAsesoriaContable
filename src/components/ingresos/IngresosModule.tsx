import React, { useEffect, useState } from "react";
import IngresosTable from "./IngresosTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileText, TrendingUp, TrendingDown, PieChart, Repeat, Scale } from "lucide-react";

interface ClienteInfo {
  id: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
  regimen: string;
  tipoCliente: string;
}

interface MetricasNRUS {
  totalMesActual: any; // BigDecimal del backend
  totalMesAnterior: any; // BigDecimal del backend
  variacionPorcentual: any; // BigDecimal del backend
  cantidadComprobantes: number;
}

interface MetricasAvanzadas {
  totalMesActual: any; // BigDecimal del backend
  totalMesAnterior: any; // BigDecimal del backend
  ingresosPorTipoTributario: Record<string, any>; // Map con valores por tipo tributario
  ingresosRecurrentes: Array<{descripcion: string, monto: number, frecuencia: number}>;
  balanceMensual: any; // BigDecimal del backend
}

const IngresosModule: React.FC = () => {
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(""); // Mantenemos setError para usarlo en los catch
  const [metricas, setMetricas] = useState<MetricasNRUS | null>(null);
  const [metricasAvanzadas, setMetricasAvanzadas] = useState<MetricasAvanzadas | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
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
        
        // Obtener métricas según el régimen del cliente
        if (data.regimen === "NRUS") {
          fetchMetricasNRUS();
        } else {
          fetchMetricasAvanzadas();
        }
      } catch (err) {
        console.error("Error al obtener información del cliente:", err);
        setError("No se pudo cargar la información del cliente");
      } finally {
        setLoading(false);
      }
    };
    
    fetchClienteInfo();
  }, [refreshTrigger]); // Añadir refreshTrigger como dependencia
  
  // Obtener métricas específicas para clientes NRUS
  const fetchMetricasNRUS = async () => {
    setLoadingMetricas(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8099/api/v1/ingresos/mis-ingresos/metricas", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al obtener métricas");
      const data = await response.json();
      setMetricas(data);
    } catch (err) {
      console.error("Error al obtener métricas NRUS:", err);
    } finally {
      setLoadingMetricas(false);
    }
  };
  
  // Obtener métricas avanzadas para otros regímenes
  const fetchMetricasAvanzadas = async () => {
    setLoadingMetricas(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8099/api/v1/ingresos/mis-ingresos/metricas-avanzadas", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al obtener métricas avanzadas");
      const data = await response.json();
      setMetricasAvanzadas(data);
    } catch (err) {
      console.error("Error al obtener métricas avanzadas:", err);
    } finally {
      setLoadingMetricas(false);
    }
  };
  
  // Verificar si el cliente es de régimen NRUS
  const isNRUS = clienteInfo?.regimen === "NRUS";
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Ingresos</h1>
        <p className="text-muted-foreground">
          Administra tus ingresos y comprobantes para un mejor control financiero.
        </p>
      </div>
      
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <div className="animate-pulse h-20"></div>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Tarjeta de Total de Ingresos para todos los clientes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-500" />
                Total de Ingresos del Mes Actual
              </CardTitle>
              <CardDescription>Monto total registrado</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMetricas ? (
                <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
              ) : isNRUS && metricas ? (
                <>
                  <div className="text-2xl font-bold">
                    S/ {parseFloat(metricas.totalMesActual).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {parseFloat(metricas.variacionPorcentual) > 0 ? "+" : ""}
                    {parseFloat(metricas.variacionPorcentual).toFixed(1)}% desde el mes pasado
                  </p>
                </>
              ) : metricasAvanzadas ? (
                <>
                  <div className="text-2xl font-bold">
                    S/ {parseFloat(metricasAvanzadas.totalMesActual).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metricasAvanzadas.totalMesAnterior > 0 ? 
                      `${((parseFloat(metricasAvanzadas.totalMesActual) / parseFloat(metricasAvanzadas.totalMesAnterior) - 1) * 100).toFixed(1)}%` : 
                      metricasAvanzadas.totalMesActual > 0 ? '+100%' : '0%'} desde el mes pasado
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">S/ 0.00</div>
                  <p className="text-xs text-muted-foreground">
                    +0% desde el mes pasado
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Mostrar tarjetas específicas según el régimen */}
          {isNRUS ? (
            // Tarjetas específicas para NRUS
            <>
              {/* Tarjeta de Total Mes Anterior */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Total Mes Anterior
                  </CardTitle>
                  <CardDescription>Ingresos previos</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMetricas ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="text-2xl font-bold">
                        S/ {metricas?.totalMesAnterior ? parseFloat(metricas.totalMesAnterior).toFixed(2) : "0.00"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Historial de ingresos</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tarjeta de Comprobantes Emitidos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-500" />
                    Comprobantes Emitidos
                  </CardTitle>
                  <CardDescription>Documentos registrados</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMetricas ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {metricas?.cantidadComprobantes || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Este mes</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            // Tarjetas para otros regímenes (RER, RG, RMT)
            <>
              {/* Tarjeta de Total Mes Anterior */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Total Mes Anterior
                  </CardTitle>
                  <CardDescription>Ingresos previos</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMetricas ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                  ) : (
                    <div className="text-2xl font-bold">
                      S/ {metricasAvanzadas?.totalMesAnterior ? parseFloat(metricasAvanzadas.totalMesAnterior).toFixed(2) : "0.00"}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tarjeta de Balance Mensual */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-blue-500" />
                    Balance Mensual
                  </CardTitle>
                  <CardDescription>Ingresos - Egresos</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMetricas ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className={`text-2xl font-bold ${parseFloat(metricasAvanzadas?.balanceMensual || "0") >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        S/ {metricasAvanzadas?.balanceMensual ? parseFloat(metricasAvanzadas.balanceMensual).toFixed(2) : "0.00"}
                      </div>
                      {parseFloat(metricasAvanzadas?.balanceMensual || "0") >= 0 ? 
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><TrendingUp className="h-3 w-3 mr-1" />Positivo</Badge> : 
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><TrendingDown className="h-3 w-3 mr-1" />Negativo</Badge>
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tarjeta de Distribución por Tipo Tributario */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-indigo-500" />
                    Por Tipo Tributario
                  </CardTitle>
                  <CardDescription>Distribución tributaria</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMetricas ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {metricasAvanzadas?.ingresosPorTipoTributario ? (
                        Object.entries(metricasAvanzadas.ingresosPorTipoTributario).map(([tipo, monto]) => {
                          let badgeColor = "";
                          switch(tipo) {
                            case "GRAVADA":
                              badgeColor = "bg-blue-100 text-blue-800 hover:bg-blue-100";
                              break;
                            case "EXONERADA":
                              badgeColor = "bg-green-100 text-green-800 hover:bg-green-100";
                              break;
                            case "INAFECTA":
                              badgeColor = "bg-amber-100 text-amber-800 hover:bg-amber-100";
                              break;
                            default:
                              badgeColor = "bg-gray-100 text-gray-800 hover:bg-gray-100";
                          }
                          return (
                            <Badge key={tipo} className={badgeColor}>
                              {tipo}: S/ {parseFloat(monto as string).toFixed(2)}
                            </Badge>
                          );
                        })
                      ) : (
                        <div className="text-sm text-muted-foreground">No hay datos disponibles</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tarjeta de Ingresos Recurrentes */}
              {metricasAvanzadas?.ingresosRecurrentes && metricasAvanzadas.ingresosRecurrentes.length > 0 && (
                <Card className="col-span-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Repeat className="h-5 w-5 text-purple-500" />
                      Ingresos Recurrentes
                    </CardTitle>
                    <CardDescription>Ingresos que se repiten con frecuencia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {metricasAvanzadas.ingresosRecurrentes.map((ingreso, index) => (
                        <div key={index} className="border rounded-md p-4 border-blue-200">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium text-gray-500">{ingreso.descripcion}</div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {ingreso.frecuencia} veces
                            </Badge>
                          </div>
                          <div className="text-xl font-bold mt-2">S/ {ingreso.monto.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          

        </div>
      )}
      
      <IngresosTable 
        clienteRegimen={clienteInfo?.regimen || ""} 
        onDataChange={refreshMetricas} 
      />
    </div>
  );
};

export default IngresosModule;
