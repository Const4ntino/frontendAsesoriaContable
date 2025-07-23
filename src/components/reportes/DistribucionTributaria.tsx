import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Chart } from "./Chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface DistribucionTributariaProps {
  distribucionIngresos: {
    tipoTributario: string;
    monto: number;
  }[];
  distribucionEgresos: {
    tipoTributario: string;
    monto: number;
    tipoContabilidad: string;
  }[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(value);
};

const DistribucionTributaria: React.FC<DistribucionTributariaProps> = ({ 
  distribucionIngresos, 
  distribucionEgresos 
}) => {
  // Estado para rastrear el tab activo de egresos
  const [activeEgresosTab, setActiveEgresosTab] = useState<string>("tributario");
  // Colores para los gráficos
  const coloresTributarios = {
    'GRAVADA': 'rgba(59, 130, 246, 0.6)', // Azul
    'EXONERADA': 'rgba(16, 185, 129, 0.6)', // Verde
    'INAFECTA': 'rgba(245, 158, 11, 0.6)', // Amarillo
    'NO_GRAVADA': 'rgba(139, 92, 246, 0.6)', // Púrpura
    'OTROS': 'rgba(156, 163, 175, 0.6)', // Gris
  };

  const coloresContabilidad = {
    'COSTO': 'rgba(239, 68, 68, 0.6)', // Rojo
    'GASTO': 'rgba(249, 115, 22, 0.6)', // Naranja
    'INVERSION': 'rgba(16, 185, 129, 0.6)', // Verde
    'OTROS': 'rgba(156, 163, 175, 0.6)', // Gris
  };

  // Preparar datos para el gráfico de ingresos
  const ingresosData = {
    labels: distribucionIngresos.map(item => item.tipoTributario),
    datasets: [
      {
        data: distribucionIngresos.map(item => item.monto),
        backgroundColor: distribucionIngresos.map(item => 
          coloresTributarios[item.tipoTributario as keyof typeof coloresTributarios] || coloresTributarios.OTROS
        ),
        borderColor: 'white',
        borderWidth: 2,
      }
    ]
  };

  // Filtrar egresos por tipo tributario (solo los que tienen tipoTributario no vacío)
  const egresosTributario = distribucionEgresos.filter(item => item.tipoTributario !== "");

  // Preparar datos para el gráfico de egresos por tipo tributario
  const egresosTributarioData = {
    labels: egresosTributario.map(item => item.tipoTributario),
    datasets: [
      {
        data: egresosTributario.map(item => item.monto),
        backgroundColor: egresosTributario.map(item => 
          coloresTributarios[item.tipoTributario as keyof typeof coloresTributarios] || coloresTributarios.OTROS
        ),
        borderColor: 'white',
        borderWidth: 2,
      }
    ]
  };

  // Filtrar egresos por tipo de contabilidad (solo los que tienen tipoContabilidad no vacío)
  const egresosContabilidad = distribucionEgresos
    .filter(item => item.tipoContabilidad !== "")
    .reduce<Record<string, number>>((acc, item) => {
      if (!acc[item.tipoContabilidad]) {
        acc[item.tipoContabilidad] = 0;
      }
      acc[item.tipoContabilidad] += item.monto;
      return acc;
    }, {});

  // Preparar datos para el gráfico de egresos por tipo de contabilidad
  const egresosContabilidadData = {
    labels: Object.keys(egresosContabilidad),
    datasets: [
      {
        data: Object.values(egresosContabilidad),
        backgroundColor: Object.keys(egresosContabilidad).map(tipo => 
          coloresContabilidad[tipo as keyof typeof coloresContabilidad] || coloresContabilidad.OTROS
        ),
        borderColor: 'white',
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Chart
                type="doughnut"
                data={ingresosData}
                options={chartOptions}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tributario" onValueChange={setActiveEgresosTab}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="tributario">Por Tipo Tributario</TabsTrigger>
                <TabsTrigger value="contabilidad">Por Contabilidad</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tributario" className="h-64">
                <Chart
                  type="doughnut"
                  data={egresosTributarioData}
                  options={chartOptions}
                />
              </TabsContent>
              
              <TabsContent value="contabilidad" className="h-64">
                <Chart
                  type="doughnut"
                  data={egresosContabilidadData}
                  options={chartOptions}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Distribución</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Ingresos por Tipo Tributario</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-right py-2">Monto</th>
                    <th className="text-right py-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {distribucionIngresos.map((item, index) => {
                    const total = distribucionIngresos.reduce((sum, i) => sum + i.monto, 0);
                    const porcentaje = total > 0 ? Math.round((item.monto / total) * 100) : 0;
                    
                    return (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.tipoTributario}</td>
                        <td className="text-right py-2">{formatCurrency(item.monto)}</td>
                        <td className="text-right py-2">{porcentaje}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">
                {activeEgresosTab === "tributario" ? "Egresos por Tipo Tributario" : "Egresos por Tipo Contabilidad"}
              </h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-right py-2">Monto</th>
                    <th className="text-right py-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {activeEgresosTab === "tributario" ? (
                    // Mostrar datos por tipo tributario
                    egresosTributario.map((item, index) => {
                      const total = egresosTributario.reduce((sum, i) => sum + i.monto, 0);
                      const porcentaje = total > 0 ? Math.round((item.monto / total) * 100) : 0;
                      
                      return (
                        <tr key={index} className="border-b">
                          <td className="py-2">{item.tipoTributario}</td>
                          <td className="text-right py-2">{formatCurrency(item.monto)}</td>
                          <td className="text-right py-2">{porcentaje}%</td>
                        </tr>
                      );
                    })
                  ) : (
                    // Mostrar datos por tipo contabilidad
                    Object.entries(egresosContabilidad).map(([tipo, monto], index) => {
                      const total = Object.values(egresosContabilidad).reduce((sum, val) => sum + val, 0);
                      const porcentaje = total > 0 ? Math.round((monto / total) * 100) : 0;
                      
                      return (
                        <tr key={index} className="border-b">
                          <td className="py-2">{tipo}</td>
                          <td className="text-right py-2">{formatCurrency(monto)}</td>
                          <td className="text-right py-2">{porcentaje}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { DistribucionTributaria };
