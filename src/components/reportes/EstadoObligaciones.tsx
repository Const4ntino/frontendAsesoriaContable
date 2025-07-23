import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Chart } from "./Chart";
import { CalendarIcon } from "lucide-react";

interface Obligacion {
  id: number;
  concepto: string;
  fechaLimite: string;
  monto: number;
  estado: string;
}

interface EstadoObligacionesProps {
  obligaciones: Obligacion[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(value);
};

const EstadoObligaciones: React.FC<EstadoObligacionesProps> = ({ obligaciones }) => {
  // Función para formatear fechas
  const formatFecha = (fechaStr: string): string => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para calcular los días restantes hasta la fecha límite
  const calcularDiasRestantes = (fechaLimite: string): number => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(fechaLimite);
    const diferencia = limite.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  };

  // Función para obtener el color del badge según el estado
  const getBadgeVariant = (estado: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado.toUpperCase()) {
      case "PAGADA":
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
  const estadosCount = obligaciones.reduce<Record<string, number>>((acc, obl) => {
    if (!acc[obl.estado]) {
      acc[obl.estado] = 0;
    }
    acc[obl.estado]++;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(estadosCount),
    datasets: [
      {
        data: Object.values(estadosCount),
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',  // Verde para PAGADA
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

  // Calcular el total de obligaciones pendientes
  const totalPendiente = obligaciones
    .filter(obl => obl.estado.toUpperCase() === "PENDIENTE")
    .reduce((sum, obl) => sum + obl.monto, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Próximas Obligaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {obligaciones.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Fecha Límite</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Días Restantes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obligaciones.map((obligacion) => {
                    const diasRestantes = calcularDiasRestantes(obligacion.fechaLimite);
                    
                    return (
                      <TableRow key={obligacion.id}>
                        <TableCell className="font-medium">{obligacion.concepto}</TableCell>
                        <TableCell>{formatFecha(obligacion.fechaLimite)}</TableCell>
                        <TableCell>{formatCurrency(obligacion.monto)}</TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(obligacion.estado)}>
                            {obligacion.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {obligacion.estado.toUpperCase() === "PENDIENTE" ? (
                            <div className={`flex items-center ${
                              diasRestantes <= 3 ? 'text-red-600' : 
                              diasRestantes <= 7 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              <span>{diasRestantes} días</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No hay obligaciones registradas para este período
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Obligaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {obligaciones.length > 0 ? (
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
          <CardTitle>Resumen de Obligaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600 font-medium">Pagadas</p>
              <p className="text-3xl font-bold text-green-700">
                {obligaciones.filter(o => o.estado.toUpperCase() === "PAGADA").length}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-sm text-orange-600 font-medium">Pendientes</p>
              <p className="text-3xl font-bold text-orange-700">
                {obligaciones.filter(o => o.estado.toUpperCase() === "PENDIENTE").length}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600 font-medium">Vencidas</p>
              <p className="text-3xl font-bold text-red-700">
                {obligaciones.filter(o => o.estado.toUpperCase() === "VENCIDA").length}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600 font-medium">Total Pendiente</p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(totalPendiente)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { EstadoObligaciones };
