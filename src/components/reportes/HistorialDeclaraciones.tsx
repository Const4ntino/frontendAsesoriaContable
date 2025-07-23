import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Chart } from "./Chart";

interface Declaracion {
  id: number;
  periodo: string;
  fechaPresentacion: string;
  estado: string;
}

interface HistorialDeclaracionesProps {
  declaraciones: Declaracion[];
}

const HistorialDeclaraciones: React.FC<HistorialDeclaracionesProps> = ({ declaraciones }) => {
  // Función para formatear fechas
  const formatFecha = (fechaStr: string): string => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para obtener el color del badge según el estado
  const getBadgeVariant = (estado: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado.toUpperCase()) {
      case "PRESENTADA":
        return "default";
      case "PENDIENTE":
        return "secondary";
      case "VENCIDA":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Preparar datos para el gráfico de estados
  const estadosCount = declaraciones.reduce<Record<string, number>>((acc, decl) => {
    if (!acc[decl.estado]) {
      acc[decl.estado] = 0;
    }
    acc[decl.estado]++;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(estadosCount),
    datasets: [
      {
        data: Object.values(estadosCount),
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',  // Verde para PRESENTADA
          'rgba(249, 115, 22, 0.6)',  // Naranja para PENDIENTE
          'rgba(239, 68, 68, 0.6)',   // Rojo para VENCIDA
          'rgba(156, 163, 175, 0.6)'  // Gris para otros
        ],
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
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Historial de Declaraciones</CardTitle>
          </CardHeader>
          <CardContent>
            {declaraciones.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Fecha Presentación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declaraciones.map((declaracion) => (
                    <TableRow key={declaracion.id}>
                      <TableCell className="font-medium">{declaracion.periodo}</TableCell>
                      <TableCell>
                        {declaracion.fechaPresentacion ? formatFecha(declaracion.fechaPresentacion) : "No presentada"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(declaracion.estado)}>
                          {declaracion.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No hay declaraciones registradas para este período
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Declaraciones</CardTitle>
          </CardHeader>
          <CardContent>
            {declaraciones.length > 0 ? (
              <div className="h-60">
                <Chart
                  type="pie"
                  data={chartData}
                  options={chartOptions}
                />
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No hay datos para mostrar
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Declaraciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600 font-medium">Presentadas</p>
              <p className="text-3xl font-bold text-green-700">
                {declaraciones.filter(d => d.estado.toUpperCase() === "PRESENTADA").length}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-sm text-orange-600 font-medium">Pendientes</p>
              <p className="text-3xl font-bold text-orange-700">
                {declaraciones.filter(d => d.estado.toUpperCase() === "PENDIENTE").length}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600 font-medium">Vencidas</p>
              <p className="text-3xl font-bold text-red-700">
                {declaraciones.filter(d => d.estado.toUpperCase() === "VENCIDA").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { HistorialDeclaraciones };
