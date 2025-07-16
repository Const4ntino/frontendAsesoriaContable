import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ObligacionesClienteTable from "./ObligacionesClienteTable";

// Tipo para los datos de resumen
interface ResumenObligaciones {
  totalObligaciones: number;
  montoTotal: number;
  obligacionesPendientes: number;
  montoPendiente: number;
}

const ObligacionesClienteModule: React.FC = () => {
  const [resumen, setResumen] = useState<ResumenObligaciones>({
    totalObligaciones: 0,
    montoTotal: 0,
    obligacionesPendientes: 0,
    montoPendiente: 0,
  });
  
  // Estados para filtros
  const [mesFilter, setMesFilter] = useState<string>("");
  const [montoFilter, setMontoFilter] = useState<string>("");
  const [ordenFilter, setOrdenFilter] = useState<string>("DESC");
  const [obligaciones, setObligaciones] = useState<any[]>([]);

  // Función para cargar las obligaciones
  const fetchObligaciones = async () => {
    try {
      // Construir URL con parámetros de filtro
      let url = "http://localhost:8099/api/v1/obligaciones/mis-obligaciones?";
      
      if (mesFilter && mesFilter !== "todos") {
        url += `mes=${mesFilter}&`;
      }
      
      if (montoFilter && !isNaN(parseFloat(montoFilter))) {
        url += `montoMaximo=${montoFilter}&`;
      }
      
      url += `ordenFechaLimite=${ordenFilter}`;
      
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener las obligaciones");
      }

      const data = await response.json();
      setObligaciones(data);
      
      // Calcular resumen de obligaciones
      const montoTotal = data.reduce((sum: number, obligacion: any) => sum + obligacion.monto, 0);
      
      // Filtrar obligaciones pendientes
      const obligacionesPendientes = data.filter((obligacion: any) => 
        obligacion.estado === "PENDIENTE" || obligacion.estado === "VENCIDA"
      );
      
      const montoPendiente = obligacionesPendientes.reduce(
        (sum: number, obligacion: any) => sum + obligacion.monto, 
        0
      );
      
      setResumen({
        totalObligaciones: data.length,
        montoTotal,
        obligacionesPendientes: obligacionesPendientes.length,
        montoPendiente,
      });
    } catch (err: any) {
      console.error("Error al cargar obligaciones:", err);
    }
  };

  // Obtener datos de obligaciones al cargar el componente o cambiar filtros
  useEffect(() => {
    fetchObligaciones();
  }, [mesFilter, montoFilter, ordenFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Obligaciones</h1>
        <p className="text-muted-foreground">
          Gestiona y visualiza todas tus obligaciones tributarias
        </p>
      </div>

      <Tabs defaultValue="todas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todas">Todas las obligaciones</TabsTrigger>
          <TabsTrigger value="pendientes">Obligaciones pendientes</TabsTrigger>
        </TabsList>
        
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="w-full md:w-[180px]">
            <Select
              value={mesFilter}
              onValueChange={setMesFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los meses</SelectItem>
                <SelectItem value="1">Enero</SelectItem>
                <SelectItem value="2">Febrero</SelectItem>
                <SelectItem value="3">Marzo</SelectItem>
                <SelectItem value="4">Abril</SelectItem>
                <SelectItem value="5">Mayo</SelectItem>
                <SelectItem value="6">Junio</SelectItem>
                <SelectItem value="7">Julio</SelectItem>
                <SelectItem value="8">Agosto</SelectItem>
                <SelectItem value="9">Septiembre</SelectItem>
                <SelectItem value="10">Octubre</SelectItem>
                <SelectItem value="11">Noviembre</SelectItem>
                <SelectItem value="12">Diciembre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-[180px]">
            <Input
              type="number"
              placeholder="Monto máximo"
              value={montoFilter}
              onChange={(e) => setMontoFilter(e.target.value)}
              className="w-full"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="w-full md:w-[180px]">
            <Select
              value={ordenFilter}
              onValueChange={setOrdenFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESC">Más recientes</SelectItem>
                <SelectItem value="ASC">Más antiguos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Obligaciones
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumen.totalObligaciones}</div>
              <p className="text-xs text-muted-foreground">
                Obligaciones registradas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monto Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S/ {resumen.montoTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Suma de todas las obligaciones
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Obligaciones Pendientes
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumen.obligacionesPendientes}</div>
              <p className="text-xs text-muted-foreground">
                Obligaciones por pagar
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monto Pendiente
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S/ {resumen.montoPendiente.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Total por pagar
              </p>
            </CardContent>
          </Card>
        </div>

        <TabsContent value="todas" className="space-y-4">
          <ObligacionesClienteTable 
            obligaciones={obligaciones} 
            filtroEstado={null} 
            onDataUpdated={fetchObligaciones}
          />
        </TabsContent>
        
        <TabsContent value="pendientes" className="space-y-4">
          <ObligacionesClienteTable 
            obligaciones={obligaciones} 
            filtroEstado="pendiente" 
            onDataUpdated={fetchObligaciones}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ObligacionesClienteModule;
