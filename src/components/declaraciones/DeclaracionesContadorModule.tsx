import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCheck, AlertCircle, Clock } from "lucide-react";
import DeclaracionesContadorTable from "./DeclaracionesContadorTable";
import type { DeclaracionResponse } from "@/types/declaracion";

const DeclaracionesContadorModule: React.FC = () => {
  const [declaraciones, setDeclaraciones] = useState<DeclaracionResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estadísticas
  const [stats, setStats] = useState({
    creado: 0,
    enProceso: 0,
    declarado: 0,
    proximasAVencer: 0,
  });

  // Función para cargar declaraciones y actualizar estadísticas
  const fetchDeclaraciones = async () => {
    console.log('Ejecutando fetchDeclaraciones en DeclaracionesContadorModule...');
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8099/api/v1/declaraciones/mis-clientes/ultimas-declaraciones",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar las declaraciones");
      }

      const data: DeclaracionResponse[] = await response.json();
      setDeclaraciones(data);

      // Calcular estadísticas
      const creado = data.filter(d => d.estado.toUpperCase() === "CREADO").length;
      const enProceso = data.filter(d => d.estado.toUpperCase() === "EN_PROCESO").length;
      const declarado = data.filter(d => d.estado.toUpperCase() === "DECLARADO").length;
      
      // Calcular próximas a vencer (en los próximos 7 días)
      const hoy = new Date();
      const enUnaSemana = new Date();
      enUnaSemana.setDate(hoy.getDate() + 7);
      
      const proximasAVencer = data.filter(d => {
        const fechaLimite = new Date(d.fechaLimite);
        return (
          fechaLimite > hoy && 
          fechaLimite <= enUnaSemana && 
          d.estado.toUpperCase() !== "DECLARADO"
        );
      }).length;

      setStats({
        creado,
        enProceso,
        declarado,
        proximasAVencer
      });
    } catch (error) {
      console.error("Error al cargar declaraciones:", error);
      setError("Error al cargar las declaraciones");
    } finally {
      setLoading(false);
    }
  };

  // Cargar declaraciones al montar el componente
  useEffect(() => {
    fetchDeclaraciones();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando declaraciones...</p>
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
      <h1 className="text-2xl font-bold mb-6">Declaraciones de Clientes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Creado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.creado}</div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Proceso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.enProceso}</div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Declarado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.declarado}</div>
              <div className="p-2 bg-green-100 rounded-full">
                <FileCheck className="h-5 w-5 text-green-600" />
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
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="creado">Creado</TabsTrigger>
          <TabsTrigger value="enProceso">En Proceso</TabsTrigger>
          <TabsTrigger value="declarado">Declarado</TabsTrigger>
        </TabsList>

        <TabsContent value="todas">
          <DeclaracionesContadorTable 
            declaraciones={declaraciones} 
            onDataUpdated={fetchDeclaraciones} 
          />
        </TabsContent>

        <TabsContent value="creado">
          <DeclaracionesContadorTable
            declaraciones={declaraciones.filter(
              (d) => d.estado.toUpperCase() === "CREADO"
            )}
            onDataUpdated={fetchDeclaraciones}
          />
        </TabsContent>

        <TabsContent value="enProceso">
          <DeclaracionesContadorTable
            declaraciones={declaraciones.filter(
              (d) => d.estado.toUpperCase() === "EN_PROCESO"
            )}
            onDataUpdated={fetchDeclaraciones}
          />
        </TabsContent>

        <TabsContent value="declarado">
          <DeclaracionesContadorTable
            declaraciones={declaraciones.filter(
              (d) => d.estado.toUpperCase() === "DECLARADO"
            )}
            onDataUpdated={fetchDeclaraciones}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeclaracionesContadorModule;
