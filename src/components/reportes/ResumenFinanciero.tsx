import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Chart } from "./Chart";

interface ResumenFinancieroProps {
  resumenFinanciero: {
    totalIngresos: number;
    totalEgresos: number;
    balanceNeto: number;
    variacionIngresos: number;
    variacionEgresos: number;
  };
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(value);
};

const ResumenFinanciero: React.FC<ResumenFinancieroProps> = ({ resumenFinanciero }) => {
  // Datos para el gráfico de barras
  const chartData = {
    labels: ['Ingresos', 'Egresos', 'Balance Neto'],
    datasets: [
      {
        label: 'Monto (S/)',
        data: [
          resumenFinanciero.totalIngresos,
          resumenFinanciero.totalEgresos,
          resumenFinanciero.balanceNeto
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',  // Verde para ingresos
          'rgba(239, 68, 68, 0.6)',  // Rojo para egresos
          resumenFinanciero.balanceNeto >= 0 
            ? 'rgba(59, 130, 246, 0.6)'  // Azul para balance positivo
            : 'rgba(249, 115, 22, 0.6)'  // Naranja para balance negativo
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          resumenFinanciero.balanceNeto >= 0 ? 'rgb(59, 130, 246)' : 'rgb(249, 115, 22)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'S/ ' + value.toLocaleString('es-PE');
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return formatCurrency(context.raw);
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{formatCurrency(resumenFinanciero.totalIngresos)}</div>
              <div className={`flex items-center ${resumenFinanciero.variacionIngresos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {resumenFinanciero.variacionIngresos >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(resumenFinanciero.variacionIngresos)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Comparado con el período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{formatCurrency(resumenFinanciero.totalEgresos)}</div>
              <div className={`flex items-center ${resumenFinanciero.variacionEgresos <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {resumenFinanciero.variacionEgresos <= 0 ? (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(resumenFinanciero.variacionEgresos)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Comparado con el período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Balance Neto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl font-bold ${resumenFinanciero.balanceNeto >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(resumenFinanciero.balanceNeto)}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Ingresos - Egresos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Chart
              type="bar"
              data={chartData}
              options={chartOptions}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { ResumenFinanciero };
