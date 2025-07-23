import React, { useEffect, useState, useRef } from "react";
import IngresosTable from "./IngresosTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, FileText, TrendingUp, TrendingDown, PieChart, Repeat, Scale, Download } from "lucide-react";

// Importaciones para PDF y gráficos
import { jsPDF } from 'jspdf';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// No se necesitan interfaces adicionales para el PDF

// Registrar componentes de ChartJS
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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
  variacionPorcentual: any; // BigDecimal del backend
  cantidadComprobantes: number;
}

interface MetricasAvanzadas {
  totalMesActual: any; // BigDecimal del backend
  totalMesAnterior: any; // BigDecimal del backend
  ingresosPorTipoTributario: Record<string, any>; // Map con valores por tipo tributario
  ingresosRecurrentes: Array<{descripcion: string, monto: number, frecuencia: number}>;
  balanceMensual: any; // BigDecimal del backend
}

const IngresosModule: React.FC = (): React.ReactNode => {
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(""); // Mantenemos setError para usarlo en los catch
  const [metricas, setMetricas] = useState<MetricasNRUS | null>(null);
  const [metricasAvanzadas, setMetricasAvanzadas] = useState<MetricasAvanzadas | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // Referencias para los gráficos
  const pieChartRef = useRef<any>(null);
  const barChartRef = useRef<any>(null);

  const refreshMetricas = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Componentes de gráficos para visualizar datos
  const PieChartComponent = () => {
    if (!metricasAvanzadas?.ingresosPorTipoTributario) return null;
    
    const tipoTributarioLabels = Object.keys(metricasAvanzadas.ingresosPorTipoTributario);
    const tipoTributarioValues = tipoTributarioLabels.map(key => parseFloat(metricasAvanzadas.ingresosPorTipoTributario[key]));
    
    const data = {
      labels: tipoTributarioLabels,
      datasets: [
        {
          data: tipoTributarioValues,
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',  // Azul para GRAVADA
            'rgba(75, 192, 192, 0.7)',  // Verde para EXONERADA
            'rgba(255, 206, 86, 0.7)',  // Amarillo para INAFECTA
            'rgba(153, 102, 255, 0.7)', // Morado para otros
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    return (
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', height: '200px', width: '200px' }}>
        <Pie ref={pieChartRef} data={data} options={{ 
          maintainAspectRatio: true, 
          animation: { duration: 0 },
          responsive: true
        }} />
      </div>
    );
  };
  
  // Gráfico de barras para ingresos recurrentes
  const BarChartComponent = () => {
    if (!metricasAvanzadas?.ingresosRecurrentes || metricasAvanzadas.ingresosRecurrentes.length === 0) return null;
    
    const data = {
      labels: metricasAvanzadas.ingresosRecurrentes.map(ingreso => ingreso.descripcion),
      datasets: [
        {
          label: 'Monto',
          data: metricasAvanzadas.ingresosRecurrentes.map(ingreso => ingreso.monto),
          backgroundColor: 'rgba(142, 68, 173, 0.7)',
          borderColor: 'rgba(142, 68, 173, 1)',
          borderWidth: 1,
        },
      ],
    };
    
    const options = {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      animation: {
        duration: 0 // deshabilitar animaciones
      },
      responsive: true,
      maintainAspectRatio: true
    };
    
    return (
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', height: '200px', width: '400px' }}>
        <Bar ref={barChartRef} data={data} options={options} />
      </div>
    );
  };
  
  // Función para generar PDF con métricas
  const generatePDF = async () => {
    if (!metricasAvanzadas || !clienteInfo) {
      console.error('No hay datos de métricas o cliente para generar el PDF');
      return;
    }
    
    setGeneratingPDF(true);
    console.log('Iniciando generación de PDF...');
    
    try {
      // Asegurarse de que los gráficos estén renderizados
      console.log('Esperando renderizado de gráficos...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      console.log('Documento PDF creado');
      
      // Variable para seguir la posición Y actual
      let currentY = 20;
      const margin = 20;
      const lineHeight = 7;
      
      // Añadir encabezado
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text('Reporte de Ingresos', pageWidth / 2, currentY, { align: 'center' });
      currentY += lineHeight * 2;
      
      // Información del cliente
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      doc.text(`Cliente: ${clienteInfo.nombres} ${clienteInfo.apellidos}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`RUC/DNI: ${clienteInfo.rucDni}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Régimen: ${clienteInfo.regimen}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margin, currentY);
      currentY += lineHeight * 2;
      
      // Métricas principales
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('Métricas de Ingresos', margin, currentY);
      currentY += lineHeight * 1.5;
      
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      doc.text(`Total Mes Actual: S/ ${parseFloat(metricasAvanzadas.totalMesActual).toFixed(2)}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Total Mes Anterior: S/ ${parseFloat(metricasAvanzadas.totalMesAnterior).toFixed(2)}`, margin, currentY);
      currentY += lineHeight;
      
      const variacion = metricasAvanzadas.totalMesAnterior > 0 ? 
        ((parseFloat(metricasAvanzadas.totalMesActual) / parseFloat(metricasAvanzadas.totalMesAnterior) - 1) * 100).toFixed(1) : 
        metricasAvanzadas.totalMesActual > 0 ? '+100' : '0';
      
      doc.text(`Variación: ${variacion}%`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Balance Mensual: S/ ${parseFloat(metricasAvanzadas.balanceMensual).toFixed(2)}`, margin, currentY);
      currentY += lineHeight * 2;
      
      // Gráfico de distribución por tipo tributario
      if (metricasAvanzadas.ingresosPorTipoTributario && Object.keys(metricasAvanzadas.ingresosPorTipoTributario).length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(41, 128, 185);
        doc.text('Distribución por Tipo Tributario', margin, currentY);
        currentY += lineHeight * 1.5;
        
        // Crear datos para el gráfico
        const tipoTributarioLabels = Object.keys(metricasAvanzadas.ingresosPorTipoTributario);
        const tipoTributarioValues = tipoTributarioLabels.map(key => parseFloat(metricasAvanzadas.ingresosPorTipoTributario[key]));
        
        // Tabla de distribución por tipo tributario (manual)
        doc.setFontSize(9); // Reducir tamaño de fuente para tablas
        doc.setFillColor(41, 128, 185);
        doc.setTextColor(255, 255, 255);
        doc.rect(margin, currentY, pageWidth - (margin * 2), lineHeight, 'F');
        
        // Encabezados de tabla
        const col1Width = 60;
        const col2Width = 50;
        
        doc.text('Tipo', margin + 5, currentY + 5);
        doc.text('Monto', margin + col1Width + 5, currentY + 5);
        doc.text('Porcentaje', margin + col1Width + col2Width + 5, currentY + 5);
        currentY += lineHeight;
        
        // Filas de datos
        doc.setTextColor(52, 73, 94);
        let rowColor = false;
        
        tipoTributarioLabels.forEach((tipo, index) => {
          if (rowColor) {
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, currentY, pageWidth - (margin * 2), lineHeight, 'F');
          }
          
          const monto = `S/ ${tipoTributarioValues[index].toFixed(2)}`;
          const porcentaje = `${((tipoTributarioValues[index] / tipoTributarioValues.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%`;
          
          doc.text(tipo, margin + 5, currentY + 5);
          doc.text(monto, margin + col1Width + 5, currentY + 5);
          doc.text(porcentaje, margin + col1Width + col2Width + 5, currentY + 5);
          
          currentY += lineHeight;
          rowColor = !rowColor;
        });
        
        currentY += lineHeight;
        
        // Si hay un gráfico de pastel, capturarlo e insertarlo
        if (pieChartRef.current && pieChartRef.current.canvas) {
          try {
            console.log('Capturando gráfico de pastel...');
            const pieChartImg = pieChartRef.current.canvas.toDataURL('image/png');
            
            // Verificar si necesitamos una nueva página
            if (currentY + 80 > pageHeight - 40) {
              doc.addPage();
              currentY = margin;
            }
            
            doc.addImage(pieChartImg, 'PNG', (pageWidth - 80) / 2, currentY, 80, 80);
            currentY += 90; // Altura del gráfico + margen
            console.log('Gráfico de pastel añadido al PDF');
          } catch (err) {
            console.error('Error al capturar gráfico de pastel:', err);
          }
        } else {
          console.warn('No se encontró el gráfico de pastel para capturar');
        }
      }
      
      // Ingresos recurrentes
      if (metricasAvanzadas.ingresosRecurrentes && metricasAvanzadas.ingresosRecurrentes.length > 0) {
        // Verificar si necesitamos una nueva página
        if (currentY + 40 > pageHeight - 40) {
          doc.addPage();
          currentY = margin;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(41, 128, 185);
        doc.text('Ingresos Recurrentes', margin, currentY);
        currentY += lineHeight * 1.5;
        
        // Tabla de ingresos recurrentes (manual)
        doc.setFontSize(9); // Reducir tamaño de fuente para tablas
        doc.setFillColor(142, 68, 173);
        doc.setTextColor(255, 255, 255);
        doc.rect(margin, currentY, pageWidth - (margin * 2), lineHeight, 'F');
        
        // Encabezados de tabla
        const col1Width = 80;
        const col2Width = 50;
        
        doc.text('Descripción', margin + 5, currentY + 5);
        doc.text('Monto', margin + col1Width + 5, currentY + 5);
        doc.text('Frecuencia', margin + col1Width + col2Width + 5, currentY + 5);
        currentY += lineHeight;
        
        // Filas de datos
        doc.setTextColor(52, 73, 94);
        let rowColor = false;
        
        metricasAvanzadas.ingresosRecurrentes.forEach(ingreso => {
          if (rowColor) {
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, currentY, pageWidth - (margin * 2), lineHeight, 'F');
          }
          
          const monto = `S/ ${ingreso.monto.toFixed(2)}`;
          const frecuencia = `${ingreso.frecuencia} veces`;
          
          doc.text(ingreso.descripcion, margin + 5, currentY + 5);
          doc.text(monto, margin + col1Width + 5, currentY + 5);
          doc.text(frecuencia, margin + col1Width + col2Width + 5, currentY + 5);
          
          currentY += lineHeight;
          rowColor = !rowColor;
        });
        
        currentY += lineHeight * 2;
      }
      
      // Tabla de ingresos
      // Obtener datos de la tabla de ingresos (últimos 10 registros)
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8099/api/v1/ingresos/mis-ingresos?size=10", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (response.ok) {
        const ingresosData = await response.json();
        console.log('Datos de ingresos recibidos:', ingresosData);
        
        // Verificar si necesitamos una nueva página
        if (currentY + 40 > pageHeight - 60) {
          doc.addPage();
          currentY = margin;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(41, 128, 185);
        doc.text('Últimos Ingresos Registrados', margin, currentY);
        currentY += lineHeight * 1.5;
        
        // Tabla de últimos ingresos (manual)
        doc.setFontSize(8); // Tamaño más pequeño para esta tabla que tiene más columnas
        doc.setFillColor(52, 152, 219);
        doc.setTextColor(255, 255, 255);
        doc.rect(margin, currentY, pageWidth - (margin * 2), lineHeight, 'F');
        
        // Encabezados de tabla
        const colWidth = (pageWidth - (margin * 2)) / 5;
        
        doc.text('Fecha', margin + 5, currentY + 5);
        doc.text('Descripción', margin + colWidth + 5, currentY + 5);
        doc.text('Comprobante', margin + (colWidth * 2) + 5, currentY + 5);
        doc.text('Tipo', margin + (colWidth * 3) + 5, currentY + 5);
        doc.text('Monto', margin + (colWidth * 4) + 5, currentY + 5);
        currentY += lineHeight;
        
        // Filas de datos
        doc.setTextColor(52, 73, 94);
        let rowColor = false;
        
        // Verificar la estructura de los datos antes de iterar
        const ingresos = ingresosData.content || ingresosData;
        
        if (Array.isArray(ingresos) && ingresos.length > 0) {
          ingresos.forEach((ingreso: any) => {
          // Verificar si necesitamos una nueva página
          if (currentY + lineHeight > pageHeight - 30) {
            doc.addPage();
            currentY = margin;
            
            // Repetir encabezados en la nueva página
            doc.setFontSize(8); // Mantener el mismo tamaño pequeño
            doc.setFillColor(52, 152, 219);
            doc.setTextColor(255, 255, 255);
            doc.rect(margin, currentY, pageWidth - (margin * 2), lineHeight, 'F');
            
            doc.text('Fecha', margin + 5, currentY + 5);
            doc.text('Descripción', margin + colWidth + 5, currentY + 5);
            doc.text('Comprobante', margin + (colWidth * 2) + 5, currentY + 5);
            doc.text('Tipo', margin + (colWidth * 3) + 5, currentY + 5);
            doc.text('Monto', margin + (colWidth * 4) + 5, currentY + 5);
            currentY += lineHeight;
            
            doc.setTextColor(52, 73, 94);
            rowColor = false;
          }
          
          if (rowColor) {
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, currentY, pageWidth - (margin * 2), lineHeight, 'F');
          }
          
          const fecha = new Date(ingreso.fecha).toLocaleDateString();
          const descripcion = ingreso.descripcion;
          const comprobante = ingreso.comprobante || 'No especificado';
          const tipo = ingreso.tipoTributario;
          const monto = `S/ ${parseFloat(ingreso.monto).toFixed(2)}`;
          
          // Truncar textos largos - permitir más caracteres con fuente más pequeña
          const maxChars = 20;
          const truncatedDesc = descripcion.length > maxChars ? descripcion.substring(0, maxChars) + '...' : descripcion;
          const truncatedComp = comprobante.length > maxChars ? comprobante.substring(0, maxChars) + '...' : comprobante;
          
          doc.text(fecha, margin + 5, currentY + 5);
          doc.text(truncatedDesc, margin + colWidth + 5, currentY + 5);
          doc.text(truncatedComp, margin + (colWidth * 2) + 5, currentY + 5);
          doc.text(tipo, margin + (colWidth * 3) + 5, currentY + 5);
          doc.text(monto, margin + (colWidth * 4) + 5, currentY + 5);
          
          currentY += lineHeight;
          rowColor = !rowColor;
          });
          
          currentY += lineHeight * 2;
        } else {
          // No hay ingresos para mostrar
          doc.setTextColor(52, 73, 94);
          doc.text('No hay ingresos registrados', margin + 5, currentY + 5);
          currentY += lineHeight * 2;
        }
      }
      
      // Pie de página
      // Si estamos cerca del final de la página, añadir una nueva
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(127, 140, 141);
      doc.text(`Reporte generado el ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
      
      // Guardar PDF
      console.log('Guardando PDF...');
      doc.save(`Reporte_Ingresos_${clienteInfo.rucDni}.pdf`);
      console.log('PDF guardado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setGeneratingPDF(false);
    }
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
      const response = await fetch("http://localhost:8099/api/v1/ingresos/mis-ingresos/metricas", {
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
  
  // Obtener métricas avanzadas para otros regímenes
  const fetchMetricasAvanzadas = async () => {
    setLoadingMetricas(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8099/api/v1/ingresos/mis-ingresos/metricas-avanzadas", {
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
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Ingresos</h1>
        <p className="text-muted-foreground">
          Administra tus ingresos y comprobantes para un mejor control financiero.
        </p>
      </div>
      
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <div className="animate-pulse h-20"></div>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Tarjeta de Total de Ingresos para todos los clientes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-500" />
                Total de Ingresos del Mes Actual
              </CardTitle>
              <CardDescription>Monto total registrado</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMetricas ? (
                <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
              ) : isNRUS && metricas ? (
                <>
                  <div className="text-2xl font-bold">
                    S/ {parseFloat(metricas.totalMesActual).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {parseFloat(metricas.variacionPorcentual) > 0 ? "+" : ""}
                    {parseFloat(metricas.variacionPorcentual).toFixed(1)}% desde el mes pasado
                  </p>
                </>
              ) : metricasAvanzadas ? (
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
              ) : (
                <>
                  <div className="text-2xl font-bold">S/ 0.00</div>
                  <p className="text-xs text-muted-foreground">
                    +0% desde el mes pasado
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Mostrar tarjetas específicas según el régimen */}
          {isNRUS ? (
            // Tarjetas específicas para NRUS
            <>
              {/* Tarjeta de Total Mes Anterior */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Total Mes Anterior
                  </CardTitle>
                  <CardDescription>Ingresos previos</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMetricas ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="text-2xl font-bold">
                        S/ {metricas?.totalMesAnterior ? parseFloat(metricas.totalMesAnterior).toFixed(2) : "0.00"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Historial de ingresos</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tarjeta de Comprobantes Emitidos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-500" />
                    Comprobantes Emitidos
                  </CardTitle>
                  <CardDescription>Documentos registrados</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMetricas ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {metricas?.cantidadComprobantes || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Este mes
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            // Tarjetas para otros regímenes (RER, RG, RMT)
            <>
              {/* Tarjeta de Total Mes Anterior */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Total Mes Anterior
                  </CardTitle>
                  <CardDescription>Ingresos previos</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMetricas ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                  ) : (
                    <div className="text-2xl font-bold">
                      S/ {metricasAvanzadas?.totalMesAnterior ? parseFloat(metricasAvanzadas.totalMesAnterior).toFixed(2) : "0.00"}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tarjeta de Balance Mensual */}
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
                      <div className={`text-2xl font-bold ${parseFloat(metricasAvanzadas?.balanceMensual || "0") >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        S/ {metricasAvanzadas?.balanceMensual ? parseFloat(metricasAvanzadas.balanceMensual).toFixed(2) : "0.00"}
                      </div>
                      {parseFloat(metricasAvanzadas?.balanceMensual || "0") >= 0 ? 
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><TrendingUp className="h-3 w-3 mr-1" />Positivo</Badge> : 
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><TrendingDown className="h-3 w-3 mr-1" />Negativo</Badge>
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tarjeta de Distribución por Tipo Tributario */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-indigo-500" />
                    Por Tipo Tributario
                  </CardTitle>
                  <CardDescription>Distribución tributaria</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Botón para descargar PDF */}
                  {!isNRUS && metricasAvanzadas && (
                    <div className="mb-4">
                      <Button 
                        onClick={generatePDF} 
                        disabled={generatingPDF} 
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {generatingPDF ? 'Generando PDF...' : 'Descargar Reporte PDF'}
                      </Button>
                    </div>
                  )}
                  {loadingMetricas ? (
                    <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {metricasAvanzadas?.ingresosPorTipoTributario ? (
                        Object.entries(metricasAvanzadas.ingresosPorTipoTributario).map(([tipo, monto]) => {
                          let badgeColor = "";
                          switch(tipo) {
                            case "GRAVADA":
                              badgeColor = "bg-blue-100 text-blue-800 hover:bg-blue-100";
                              break;
                            case "EXONERADA":
                              badgeColor = "bg-green-100 text-green-800 hover:bg-green-100";
                              break;
                            case "INAFECTA":
                              badgeColor = "bg-amber-100 text-amber-800 hover:bg-amber-100";
                              break;
                            default:
                              badgeColor = "bg-gray-100 text-gray-800 hover:bg-gray-100";
                          }
                          return (
                            <Badge key={tipo} className={badgeColor}>
                              {tipo}: S/ {parseFloat(monto as string).toFixed(2)}
                            </Badge>
                          );
                        })
                      ) : (
                        <div className="text-sm text-muted-foreground">No hay datos disponibles</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Tarjeta de Ingresos Recurrentes */}
              {metricasAvanzadas?.ingresosRecurrentes && metricasAvanzadas.ingresosRecurrentes.length > 0 && (
                <Card className="col-span-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Repeat className="h-5 w-5 text-purple-500" />
                      Ingresos Recurrentes
                    </CardTitle>
                    <CardDescription>Ingresos que se repiten con frecuencia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {metricasAvanzadas.ingresosRecurrentes.map((ingreso, index) => (
                        <div key={index} className="border rounded-md p-4 border-blue-200">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium text-gray-500">{ingreso.descripcion}</div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {ingreso.frecuencia} veces
                            </Badge>
                          </div>
                          <div className="text-xl font-bold mt-2">S/ {ingreso.monto.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          

        </div>
      )}
      
      {/* Componentes de gráficos ocultos para generar PDF */}
      {!isNRUS && clienteInfo && metricasAvanzadas && <PieChartComponent />}
      {!isNRUS && clienteInfo && metricasAvanzadas && <BarChartComponent />}
      
      <IngresosTable 
        clienteRegimen={clienteInfo?.regimen || ""} 
        onDataChange={refreshMetricas} 
      />
    </div>
  );
};

export default IngresosModule;
