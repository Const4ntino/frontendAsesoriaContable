import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Clock, CheckCircle, Filter, Calendar } from "lucide-react";
import ObligacionesContadorTable from "./ObligacionesContadorTable";
import type { ObligacionResponse } from "@/types/obligacion";
import { Button } from "@/components/ui/button";

const ObligacionesContadorModule: React.FC = () => {
  const [obligaciones, setObligaciones] = useState<ObligacionResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    estado: "",
    orden: "DESC" as "ASC" | "DESC"
  });

  // Estadísticas
  const [stats, setStats] = useState({
    pendientes: 0,
    pagadas: 0,
    vencidas: 0,
    proximasAVencer: 0,
  });
  
  // Ya no es necesaria la función debounce para el nombre de cliente

  const fetchObligaciones = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Construir URL con parámetros de filtro
      let url = "http://localhost:8099/api/v1/obligaciones/mis-clientes/obligaciones";
      const params = new URLSearchParams();
      
      // Solo agregar el filtro de estado si no es "TODOS"
      if (filtros.estado && filtros.estado !== "TODOS") params.append("estado", filtros.estado);
      params.append("orden", filtros.orden);
      
      const urlWithParams = `${url}?${params.toString()}`;
      console.log("Fetching obligaciones:", urlWithParams);
      
      const response = await fetch(urlWithParams, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las obligaciones");
      }

      const data = await response.json();
      console.log("Datos recibidos del backend:", data);
      
      // Verificar la estructura de los datos
      if (Array.isArray(data)) {
        console.log("Primer elemento:", data[0]);
        // Verificar si existe periodoTributario en los datos
        if (data[0] && data[0].periodoTributario) {
          console.log("periodoTributario encontrado:", data[0].periodoTributario);
        } else {
          console.log("periodoTributario NO encontrado en la respuesta");
          console.log("Propiedades disponibles:", Object.keys(data[0] || {}));
        }
      }
      
      setObligaciones(data as ObligacionResponse[]);

        // Calcular estadísticas
        const pendientes = data.filter((d: ObligacionResponse) => d.estado === "PENDIENTE").length;
        const pagadas = data.filter((d: ObligacionResponse) => d.estado === "PAGADA").length;
        const vencidas = data.filter((d: ObligacionResponse) => d.estado === "VENCIDA").length;
        
        // Calcular próximas a vencer (en los próximos 7 días)
        const proximasAVencer = data.filter(
          (d: ObligacionResponse) => {
            const fechaLimite = new Date(d.fechaLimite);
            const hoy = new Date();
            const enUnaSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            return d.estado === "PENDIENTE" && fechaLimite > hoy && fechaLimite < enUnaSemana;
          }
        ).length;

        setStats({
          pendientes,
          pagadas,
          vencidas,
          proximasAVencer,
        });
      } catch (err) {
        console.error("Error:", err);
        setError("Error al cargar las obligaciones. Intente nuevamente más tarde.");
      } finally {
        setLoading(false);
      }
    }, [filtros]);

  useEffect(() => {
    fetchObligaciones();
  }, [fetchObligaciones]);
  
  // Función para resetear filtros
  const handleResetFilters = () => {
    // Resetear todos los filtros a sus valores iniciales
    setFiltros({
      estado: "",
      orden: "DESC"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando obligaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <AlertCircle className="h-12 w-12 mx-auto" />
          <p className="mt-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Obligaciones de Clientes</h1>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleResetFilters}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Limpiar filtros
          </Button>
        </div>
      </div>
      
      {/* Se eliminaron los filtros del cuadro rojo */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.pendientes}</div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.pagadas}</div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.vencidas}</div>
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximas a vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.proximasAVencer}</div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="pagadas">Pagadas</TabsTrigger>
          <TabsTrigger value="vencidas">Vencidas</TabsTrigger>
          <TabsTrigger value="proximas">Próximas a vencer</TabsTrigger>
        </TabsList>

        <TabsContent value="todas">
          <ObligacionesContadorTable 
            obligaciones={obligaciones}
            orden={filtros.orden}
            onOrdenChange={(value) => setFiltros(prev => ({ ...prev, orden: value }))}
            onDataUpdated={fetchObligaciones}
          />
        </TabsContent>

        <TabsContent value="pendientes">
          <ObligacionesContadorTable
            obligaciones={obligaciones.filter(
              (o) => o.estado === "PENDIENTE"
            )}
            orden={filtros.orden}
            onOrdenChange={(value) => setFiltros(prev => ({ ...prev, orden: value }))}
            onDataUpdated={fetchObligaciones}
          />
        </TabsContent>

        <TabsContent value="pagadas">
          <ObligacionesContadorTable
            obligaciones={obligaciones.filter(
              (o) => o.estado === "PAGADA" || o.estado === "PAGADA_CON_RETRASO"
            )}
            orden={filtros.orden}
            onOrdenChange={(value) => setFiltros(prev => ({ ...prev, orden: value as "ASC" | "DESC" }))}
            onDataUpdated={fetchObligaciones}
          />
        </TabsContent>

        <TabsContent value="vencidas">
          <ObligacionesContadorTable
            obligaciones={obligaciones.filter(
              (o) => o.estado === "VENCIDA"
            )}
            onDataUpdated={fetchObligaciones}
          />
        </TabsContent>

        <TabsContent value="proximas">
          {/* Próximas a vencer (en los próximos 7 días) */}
          <ObligacionesContadorTable
            obligaciones={obligaciones.filter((o) => {
              const hoy = new Date();
              const enUnaSemana = new Date();
              enUnaSemana.setDate(hoy.getDate() + 7);
              const fechaLimite = new Date(o.fechaLimite);
              return fechaLimite > hoy && fechaLimite <= enUnaSemana && o.estado === "PENDIENTE";
            })}
            onDataUpdated={fetchObligaciones}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ObligacionesContadorModule;
