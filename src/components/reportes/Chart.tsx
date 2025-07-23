import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  data: any;
  options?: any;
  height?: number | string;
}

const Chart: React.FC<ChartProps> = ({
  type,
  data,
  options = {},
  height = '100%',
}) => {
  // Función para determinar colores de las celdas en gráficos de pie/doughnut
  const getColors = (index: number) => {
    const colors = [
      '#3b82f6', // Azul
      '#10b981', // Verde
      '#f59e0b', // Amarillo
      '#ef4444', // Rojo
      '#8b5cf6', // Púrpura
      '#ec4899', // Rosa
      '#6366f1', // Índigo
      '#14b8a6', // Verde azulado
      '#f97316', // Naranja
      '#64748b', // Gris azulado
    ];
    return colors[index % colors.length];
  };

  // Renderizar el gráfico según el tipo
  const renderChart = () => {
    // Aplicamos opciones personalizadas según el tipo de gráfico
    const customOptions = options || {};
    
    switch (type) {
      case 'line':
        return (
          <LineChart 
            data={data.labels.map((label: string, index: number) => {
              const dataPoint: any = { name: label };
              data.datasets.forEach((dataset: any, i: number) => {
                dataPoint[`dataset${i}`] = dataset.data[index];
              });
              return dataPoint;
            })} 
            margin={customOptions.margin || { top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets.map((dataset: any, index: number) => (
              <Line
                key={index}
                type="monotone"
                dataKey={`dataset${index}`}
                name={dataset.label || `Dataset ${index + 1}`}
                stroke={dataset.borderColor || getColors(index)}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data.labels.map((label: string, index: number) => {
            const dataPoint: any = { name: label };
            data.datasets.forEach((dataset: any, i: number) => {
              dataPoint[`dataset${i}`] = dataset.data[index];
            });
            return dataPoint;
          })} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets.map((dataset: any, index: number) => (
              <Bar
                key={index}
                dataKey={`dataset${index}`}
                name={dataset.label || `Dataset ${index + 1}`}
                fill={dataset.backgroundColor && dataset.backgroundColor[index] ? dataset.backgroundColor[index] : getColors(index)}
              />
            ))}
          </BarChart>
        );

      case 'pie':
      case 'doughnut':
        return (
          <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <Tooltip />
            <Legend />
            <Pie
              data={data.labels.map((label: string, index: number) => ({
                name: label,
                value: data.datasets[0].data[index],
              }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={type === 'doughnut' ? 80 : 100}
              innerRadius={type === 'doughnut' ? 60 : 0}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.labels.map((_: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={data.datasets[0].backgroundColor && data.datasets[0].backgroundColor[index] 
                    ? data.datasets[0].backgroundColor[index] 
                    : getColors(index)} 
                />
              ))}
            </Pie>
          </PieChart>
        );

      case 'area':
        return (
          <AreaChart data={data.labels.map((label: string, index: number) => {
            const dataPoint: any = { name: label };
            data.datasets.forEach((dataset: any, i: number) => {
              dataPoint[`dataset${i}`] = dataset.data[index];
            });
            return dataPoint;
          })} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {data.datasets.map((dataset: any, index: number) => (
              <Area
                key={index}
                type="monotone"
                dataKey={`dataset${index}`}
                name={dataset.label || `Dataset ${index + 1}`}
                stroke={dataset.borderColor || getColors(index)}
                fill={dataset.backgroundColor || getColors(index)}
              />
            ))}
          </AreaChart>
        );

      default:
        return <div>Tipo de gráfico no soportado</div>;
    }
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export { Chart };
