import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign } from "lucide-react";
import PagosTable from "./PagosTable";

// Tipo para los datos de resumen
interface ResumenPagos {
  totalPagos: number;
  montoTotal: number;
  pagosMes: number;
  montoMes: number;
}

const PagosModule: React.FC = () => {
  const [resumen, setResumen] = useState<ResumenPagos>({
    totalPagos: 0,
    montoTotal: 0,
    pagosMes: 0,
    montoMes: 0,
  });

  // Obtener datos de resumen al cargar el componente
  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8099/api/v1/pagos/mis-pagos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener los pagos");
        }

        const data = await response.json();
        
        // Calcular resumen de pagos
        const montoTotal = data.reduce((sum: number, pago: any) => sum + pago.montoPagado, 0);
        
        // Filtrar pagos del mes actual
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const pagosMes = data.filter((pago: any) => {
          const pagoDate = new Date(pago.fechaPago);
          return pagoDate.getMonth() === currentMonth && pagoDate.getFullYear() === currentYear;
        });
        
        const montoMes = pagosMes.reduce((sum: number, pago: any) => sum + pago.montoPagado, 0);
        
        setResumen({
          totalPagos: data.length,
          montoTotal,
          pagosMes: pagosMes.length,
          montoMes,
        });
      } catch (err: any) {
        console.error("Error al cargar resumen de pagos:", err);
      }
    };

    fetchResumen();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pagos</h2>
        <p className="text-muted-foreground">
          Gestiona y visualiza todos tus pagos realizados
        </p>
      </div>

      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos los pagos</TabsTrigger>
          <TabsTrigger value="recientes">Pagos recientes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pagos
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resumen.totalPagos}</div>
                <p className="text-xs text-muted-foreground">
                  Pagos realizados
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
                <div className="text-2xl font-bold">
                  S/ {resumen.montoTotal.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Suma de todos los pagos
                </p>
              </CardContent>
            </Card>

          </div>
          
          <PagosTable />
        </TabsContent>
        
        <TabsContent value="recientes" className="space-y-4">
          <PagosTable filtroRecientes={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PagosModule;
