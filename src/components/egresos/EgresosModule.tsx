import React, { useEffect, useState } from "react";
import EgresosTable from "./EgresosTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, DollarSign, Scale, PieChart, TrendingUp, TrendingDown } from "lucide-react";

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
  egresosPorTipoContabilidad: Record<string, any>; // Map<String, BigDecimal> del backend
  balanceMensual: any; // BigDecimal del backend
  egresosRecurrentes?: Array<{descripcion: string, monto: number, frecuencia: number}>;
}

interface MetricasAvanzadas {
  totalMesActual: any; // BigDecimal del backend
  totalMesAnterior: any; // BigDecimal del backend
  egresosPorTipoContabilidad: Record<string, any>; // Map<String, BigDecimal> del backend
  egresosPorTipoTributario: Record<string, any>; // Map<String, BigDecimal> del backend
  balanceMensual: any; // BigDecimal del backend
  egresosRecurrentes?: Array<{descripcion: string, monto: number, frecuencia: number}>;
}

const EgresosModule: React.FC = () => {
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(""); // Mantenemos setError para usarlo en los catch
  const [metricas, setMetricas] = useState<MetricasNRUS | null>(null);
  const [metricasAvanzadas, setMetricasAvanzadas] = useState<MetricasAvanzadas | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  // Estado para controlar la recarga de datos
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Función para recargar las métricas
  const refreshMetricas = () => {
    // Incrementar el contador para activar el efecto
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
          // Para regímenes RER, RG, RMT
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
      const response = await fetch("http://localhost:8099/api/v1/egresos/mis-egresos/metricas", {
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
  
  // Obtener métricas avanzadas para otros regímenes (RER, RG, RMT)
  const fetchMetricasAvanzadas = async () => {
    setLoadingMetricas(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8099/api/v1/egresos/mis-egresos/metricas-avanzadas", {
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
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Egresos</h1>
        <p className="text-muted-foreground">
          Administra tus egresos y comprobantes para un mejor control financiero.
        </p>
      </div>
      
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <div className="animate-pulse h-20"></div>
          </Card>
        </div>
      ) : (
        <>
          {/* Métricas para NRUS - Todo en una sola fila */}
          {isNRUS && metricas ? (
            <div className="grid grid-cols-1 gap-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Total de Egresos */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-red-500" />
                      Total de Egresos del Mes Actual
                    </CardTitle>
                    <CardDescription>Monto total registrado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      S/ {parseFloat(metricas.totalMesActual).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metricas.totalMesAnterior > 0 ? 
                        `${((parseFloat(metricas.totalMesActual) / parseFloat(metricas.totalMesAnterior) - 1) * 100).toFixed(1)}%` : 
                        metricas.totalMesActual > 0 && parseFloat(metricas.totalMesAnterior) === 0 ? '+100%' : '0%'} desde el mes pasado
                    </p>
                  </CardContent>
                </Card>
                
                {/* Total Mes Anterior */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-orange-500" />
                      Total Mes Anterior
                    </CardTitle>
                    <CardDescription>Egresos previos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-1">
                      <div className="text-2xl font-bold">
                        S/ {metricas?.totalMesAnterior ? parseFloat(metricas.totalMesAnterior).toFixed(2) : "0.00"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Historial de egresos</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Balance Mensual */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-blue-500" />
                      Balance Mensual
                    </CardTitle>
                    <CardDescription>Ingresos - Egresos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className={`text-2xl font-bold ${parseFloat(metricas.balanceMensual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        S/ {parseFloat(metricas.balanceMensual).toFixed(2)}
                      </div>
                      {parseFloat(metricas.balanceMensual) >= 0 ? 
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><TrendingUp className="h-3 w-3 mr-1" />Positivo</Badge> : 
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><TrendingDown className="h-3 w-3 mr-1" />Negativo</Badge>
                      }
                    </div>
                  </CardContent>
                </Card>
                
                {/* Egresos por Tipo de Contabilidad */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-500" />
                      Por Categoría
                    </CardTitle>
                    <CardDescription>Distribución de gastos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(metricas.egresosPorTipoContabilidad).map(([tipo, monto]) => {
                        let badgeClass = "";
                        if (tipo === "ADMINISTRATIVA") badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-200";
                        else if (tipo === "COSTO_VENTA") badgeClass = "bg-green-100 text-green-800 hover:bg-green-200";
                        else if (tipo === "GASTO_VENTA") badgeClass = "bg-amber-100 text-amber-800 hover:bg-amber-200";
                        else badgeClass = "bg-purple-100 text-purple-800 hover:bg-purple-200";
                        
                        return (
                          <Badge key={tipo} className={badgeClass}>
                            {tipo}: S/ {parseFloat(monto).toFixed(2)}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
          
          {/* Métricas avanzadas para otros regímenes */}
          {!isNRUS && metricasAvanzadas ? (
            <>
              {/* Primera fila: Total Actual, Mes Anterior y Balance */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {/* Total de Egresos del Mes Actual */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-red-500" />
                      Total de Egresos del Mes Actual
                    </CardTitle>
                    <CardDescription>Monto total registrado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMetricas ? (
                      <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                    ) : (
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
                    )}
                  </CardContent>
                </Card>
                
                {/* Total de Egresos del Mes Anterior */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-orange-500" />
                      Total de Egresos del Mes Anterior
                    </CardTitle>
                    <CardDescription>Monto previo registrado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMetricas ? (
                      <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                    ) : (
                      <div className="text-2xl font-bold">
                        S/ {parseFloat(metricasAvanzadas.totalMesAnterior).toFixed(2)}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Balance Mensual */}
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
                        <div className={`text-2xl font-bold ${parseFloat(metricasAvanzadas.balanceMensual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          S/ {parseFloat(metricasAvanzadas.balanceMensual).toFixed(2)}
                        </div>
                        {parseFloat(metricasAvanzadas.balanceMensual) >= 0 ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><TrendingUp className="h-3 w-3 mr-1" />Positivo</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><TrendingDown className="h-3 w-3 mr-1" />Negativo</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Segunda fila: Distribución por Tipo Tributario y otros */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Distribución por Tipo Tributario */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-500" />
                      Por Tipo Tributario
                    </CardTitle>
                    <CardDescription>Distribución tributaria</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMetricas ? (
                      <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(metricasAvanzadas.egresosPorTipoTributario).map(([tipo, monto]) => {
                          let badgeClass = "";
                          if (tipo === "GRAVADA") badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-200";
                          else if (tipo === "EXONERADA") badgeClass = "bg-green-100 text-green-800 hover:bg-green-200";
                          else if (tipo === "INAFECTA") badgeClass = "bg-amber-100 text-amber-800 hover:bg-amber-200";
                          
                          return (
                            <Badge key={tipo} className={badgeClass}>
                              {tipo}: S/ {parseFloat(monto).toFixed(2)}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Distribución por Tipo Contabilidad */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-purple-500" />
                      Por Tipo de Contabilidad
                    </CardTitle>
                    <CardDescription>Distribución de gastos por categoría</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMetricas ? (
                      <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(metricasAvanzadas.egresosPorTipoContabilidad).map(([tipo, monto]) => {
                          const isGasto = tipo === "GASTO";
                          return (
                            <div key={tipo} className={`border rounded-md p-4 ${isGasto ? 'border-orange-200' : 'border-blue-200'}`}>
                              <div className="flex justify-between items-center">
                                <div className="text-sm font-medium text-gray-500">{tipo}</div>
                                <Badge className={isGasto ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}>
                                  {isGasto ? 'Operativo' : 'Productivo'}
                                </Badge>
                              </div>
                              <div className="text-xl font-bold mt-2">S/ {parseFloat(monto).toFixed(2)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
          
          {/* Estado de carga para cualquier régimen */}
          {!isNRUS && !metricasAvanzadas && !loading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Sin datos disponibles</CardTitle>
                  <CardDescription>No se encontraron métricas</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Registra egresos para ver métricas</p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      
      <EgresosTable 
        clienteRegimen={clienteInfo?.regimen || ""} 
        onDataChange={refreshMetricas} 
      />
    </div>
  );
};

export default EgresosModule;
