import React, { useEffect, useState, useRef } from "react";
import EgresosTable from "./EgresosTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, DollarSign, Scale, PieChart, TrendingUp, TrendingDown, Download } from "lucide-react";

// Importaciones para PDF y gráficos
import { jsPDF } from 'jspdf';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

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
  egresosPorTipoContabilidad: Record<string, any>; // Map<String, BigDecimal> del backend
  balanceMensual: any; // BigDecimal del backend
  egresosRecurrentes?: Array<{descripcion: string, monto: number, frecuencia: number}>;
}

interface MetricasAvanzadas {
  totalMesActual: any; // BigDecimal del backend
  totalMesAnterior: any; // BigDecimal del backend
  egresosPorTipoContabilidad: Record<string, any>; // Map<String, BigDecimal> del backend
  egresosPorTipoTributario: Record<string, any>; // Map<String, BigDecimal> del backend
  balanceMensual: any; // BigDecimal del backend
  egresosRecurrentes?: Array<{descripcion: string, monto: number, frecuencia: number}>;
}

const EgresosModule: React.FC = (): React.ReactNode => {
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
  
  // Estado para controlar la visibilidad de los gráficos durante la generación del PDF
  const [chartsVisible, setChartsVisible] = useState(false);

  // Función para recargar las métricas
  const refreshMetricas = () => {
    // Incrementar el contador para activar el efecto
    setRefreshTrigger(prev => prev + 1);
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
          // Para regímenes RER, RG, RMT
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
      const response = await fetch("http://localhost:8099/api/v1/egresos/mis-egresos/metricas", {
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
  
  // Obtener métricas avanzadas para otros regímenes (RER, RG, RMT)
  const fetchMetricasAvanzadas = async () => {
    setLoadingMetricas(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8099/api/v1/egresos/mis-egresos/metricas-avanzadas", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al obtener métricas");
      const data = await response.json();
      setMetricasAvanzadas(data);
    } catch (err) {
      console.error("Error al obtener métricas avanzadas:", err);
    } finally {
      setLoadingMetricas(false);
    }
  };
  
  // Las opciones de los gráficos ahora se definen directamente en los componentes

  // Función para generar PDF
  const generatePDF = async () => {
    if (!clienteInfo || !metricasAvanzadas) return;
    
    setGeneratingPDF(true);
    setChartsVisible(true); // Hacer visibles los gráficos para capturarlos
    
    try {
      console.log('Generando PDF...');
      // Esperar un momento para asegurar que los gráficos se hayan renderizado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const doc = new jsPDF();
      
      // Configuración de página
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let currentY = margin;
      const lineHeight = 10;
      
      // Encabezado
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185);
      doc.text('Reporte de Egresos', pageWidth / 2, currentY, { align: 'center' });
      currentY += lineHeight * 1.5;
      
      // Información del cliente
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      doc.text(`Cliente: ${clienteInfo.nombres} ${clienteInfo.apellidos}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`RUC/DNI: ${clienteInfo.rucDni}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Régimen: ${clienteInfo.regimen}`, margin, currentY);
      currentY += lineHeight * 2;
      
      // Resumen de métricas
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('Resumen de Egresos', margin, currentY);
      currentY += lineHeight * 1.5;
      
      doc.setFontSize(11);
      doc.setTextColor(52, 73, 94);
      doc.text(`Total del Mes Actual: S/ ${parseFloat(metricasAvanzadas.totalMesActual).toFixed(2)}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Total del Mes Anterior: S/ ${parseFloat(metricasAvanzadas.totalMesAnterior).toFixed(2)}`, margin, currentY);
      currentY += lineHeight;
      
      // Calcular variación porcentual
      const mesActual = parseFloat(metricasAvanzadas.totalMesActual);
      const mesAnterior = parseFloat(metricasAvanzadas.totalMesAnterior);
      let variacion = 0;
      if (mesAnterior > 0) {
        variacion = ((mesActual - mesAnterior) / mesAnterior) * 100;
      }
      
      doc.text(`Variación: ${variacion.toFixed(1)}%`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Balance Mensual: S/ ${parseFloat(metricasAvanzadas.balanceMensual).toFixed(2)}`, margin, currentY);
      currentY += lineHeight * 2;
      
      // Gráfico de distribución por tipo tributario
      try {
        if (pieChartRef.current) {
          doc.setFontSize(14);
          doc.setTextColor(41, 128, 185);
          doc.text('Distribución por Tipo Tributario', margin, currentY);
          currentY += lineHeight * 1.5;
          
          const pieCanvas = pieChartRef.current.canvas;
          // Usar una calidad más baja para evitar problemas
          const pieImgData = pieCanvas.toDataURL('image/jpeg', 0.95);
          
          // Centrar la imagen del gráfico
          const imgWidth = 100;
          const imgHeight = 100;
          const imgX = (pageWidth - imgWidth) / 2;
          
          doc.addImage(pieImgData, 'JPEG', imgX, currentY, imgWidth, imgHeight);
          currentY += imgHeight + lineHeight;
        } else {
          console.log('Gráfico de pastel no disponible');
          currentY += lineHeight;
        }
      } catch (err) {
        console.error('Error al agregar gráfico de pastel:', err);
        doc.text('Error al generar gráfico de distribución por tipo tributario', margin, currentY);
        currentY += lineHeight * 2;
      }
      
      // Tabla de distribución por tipo tributario
      const tipoTributarioLabels = Object.keys(metricasAvanzadas.egresosPorTipoTributario);
      const tipoTributarioValues = tipoTributarioLabels.map(key => parseFloat(metricasAvanzadas.egresosPorTipoTributario[key]));
      
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
      
      // Gráfico de distribución por tipo de contabilidad
      try {
        if (barChartRef.current) {
          // Si estamos cerca del final de la página, añadir una nueva
          if (currentY > pageHeight - 120) {
            doc.addPage();
            currentY = margin;
          }
          
          doc.setFontSize(14);
          doc.setTextColor(41, 128, 185);
          doc.text('Distribución por Tipo de Contabilidad', margin, currentY);
          currentY += lineHeight * 1.5;
          
          const barCanvas = barChartRef.current.canvas;
          // Usar una calidad más baja para evitar problemas
          const barImgData = barCanvas.toDataURL('image/jpeg', 0.95);
          
          // Centrar la imagen del gráfico
          const imgWidth = 150;
          const imgHeight = 100;
          const imgX = (pageWidth - imgWidth) / 2;
          
          doc.addImage(barImgData, 'JPEG', imgX, currentY, imgWidth, imgHeight);
          currentY += imgHeight + lineHeight;
        } else {
          console.log('Gráfico de barras no disponible');
          currentY += lineHeight;
        }
      } catch (err) {
        console.error('Error al agregar gráfico de barras:', err);
        doc.text('Error al generar gráfico de distribución por tipo de contabilidad', margin, currentY);
        currentY += lineHeight * 2;
      }
      
      // Tabla de distribución por tipo de contabilidad
      const tipoContabilidadLabels = Object.keys(metricasAvanzadas.egresosPorTipoContabilidad);
      const tipoContabilidadValues = tipoContabilidadLabels.map(key => parseFloat(metricasAvanzadas.egresosPorTipoContabilidad[key]));
      
      // Si estamos cerca del final de la página, añadir una nueva
      if (currentY > pageHeight - 60) {
        doc.addPage();
        currentY = margin;
      }
      
      // Tabla de distribución por tipo de contabilidad (manual)
      doc.setFontSize(9); // Reducir tamaño de fuente para tablas
      doc.setFillColor(142, 68, 173);
      doc.setTextColor(255, 255, 255);
      doc.rect(margin, currentY, pageWidth - (margin * 2), lineHeight, 'F');
      
      // Encabezados de tabla
      doc.text('Tipo', margin + 5, currentY + 5);
      doc.text('Monto', margin + col1Width + 5, currentY + 5);
      doc.text('Porcentaje', margin + col1Width + col2Width + 5, currentY + 5);
      currentY += lineHeight;
      
      // Filas de datos
      doc.setTextColor(52, 73, 94);
      rowColor = false;
      
      tipoContabilidadLabels.forEach((tipo, index) => {
        if (rowColor) {
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, currentY, pageWidth - (margin * 2), lineHeight, 'F');
        }
        
        const monto = `S/ ${tipoContabilidadValues[index].toFixed(2)}`;
        const porcentaje = `${((tipoContabilidadValues[index] / tipoContabilidadValues.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%`;
        
        doc.text(tipo, margin + 5, currentY + 5);
        doc.text(monto, margin + col1Width + 5, currentY + 5);
        doc.text(porcentaje, margin + col1Width + col2Width + 5, currentY + 5);
        
        currentY += lineHeight;
        rowColor = !rowColor;
      });
      
      currentY += lineHeight * 1.5;
      
      // Tabla de últimos egresos
      // Si estamos cerca del final de la página, añadir una nueva
      if (currentY > pageHeight - 60) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('Últimos Egresos Registrados', margin, currentY);
      currentY += lineHeight * 1.5;
      
      // Obtener los últimos egresos
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8099/api/v1/egresos/mis-egresos?size=10", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (response.ok) {
        const egresosData = await response.json();
        console.log('Datos de egresos recibidos:', egresosData);
        
        // Verificar si necesitamos una nueva página
        if (currentY > pageHeight - 60) {
          doc.addPage();
          currentY = margin;
        }
        
        // Tabla de últimos egresos (manual)
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
        rowColor = false;
        
        // Verificar si egresosData tiene la propiedad content (paginación) o es un array directo
        const egresos = Array.isArray(egresosData) ? egresosData : (egresosData.content || []);
        
        if (egresos && egresos.length > 0) {
          egresos.forEach((egreso: any) => {
            // Verificar si necesitamos una nueva página
            if (currentY > pageHeight - lineHeight) {
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
              rowColor = false;
            }
            
            if (rowColor) {
              doc.setFillColor(240, 240, 240);
              doc.rect(margin, currentY, pageWidth - (margin * 2), lineHeight, 'F');
            }
            
            // Formatear fecha
            const fecha = new Date(egreso.fecha).toLocaleDateString();
            const descripcion = egreso.descripcion || "";
            const comprobante = egreso.nroComprobante || "No especificado";
            const tipo = egreso.tipoTributario || "";
            const monto = `S/ ${parseFloat(egreso.monto).toFixed(2)}`;
            
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
          // No hay egresos para mostrar
          doc.setTextColor(52, 73, 94);
          doc.text('No hay egresos registrados', margin + 5, currentY + 5);
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
      doc.save(`Reporte_Egresos_${clienteInfo.rucDni}.pdf`);
      console.log('PDF guardado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setGeneratingPDF(false);
      setChartsVisible(false); // Ocultar los gráficos después de capturarlos
    }
  };
  
  // Verificar si el cliente es de régimen NRUS
  const isNRUS = clienteInfo?.regimen === "NRUS";
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Egresos</h1>
        <p className="text-muted-foreground">
          Administra tus egresos y comprobantes para un mejor control financiero.
        </p>
      </div>
      
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <div className="animate-pulse h-20"></div>
          </Card>
        </div>
      ) : (
        <>
          {/* Métricas para NRUS - Todo en una sola fila */}
          {isNRUS && metricas ? (
            <div className="grid grid-cols-1 gap-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Total de Egresos */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-red-500" />
                      Total de Egresos del Mes Actual
                    </CardTitle>
                    <CardDescription>Monto total registrado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      S/ {parseFloat(metricas.totalMesActual).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metricas.totalMesAnterior > 0 ? 
                        `${((parseFloat(metricas.totalMesActual) / parseFloat(metricas.totalMesAnterior) - 1) * 100).toFixed(1)}%` : 
                        metricas.totalMesActual > 0 && parseFloat(metricas.totalMesAnterior) === 0 ? '+100%' : '0%'} desde el mes pasado
                    </p>
                  </CardContent>
                </Card>
                
                {/* Total Mes Anterior */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-orange-500" />
                      Total Mes Anterior
                    </CardTitle>
                    <CardDescription>Egresos previos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-1">
                      <div className="text-2xl font-bold">
                        S/ {metricas?.totalMesAnterior ? parseFloat(metricas.totalMesAnterior).toFixed(2) : "0.00"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Historial de egresos</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Balance Mensual */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-blue-500" />
                      Balance Mensual
                    </CardTitle>
                    <CardDescription>Ingresos - Egresos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className={`text-2xl font-bold ${parseFloat(metricas.balanceMensual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        S/ {parseFloat(metricas.balanceMensual).toFixed(2)}
                      </div>
                      {parseFloat(metricas.balanceMensual) >= 0 ? 
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><TrendingUp className="h-3 w-3 mr-1" />Positivo</Badge> : 
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><TrendingDown className="h-3 w-3 mr-1" />Negativo</Badge>
                      }
                    </div>
                  </CardContent>
                </Card>
                
                {/* Egresos por Tipo de Contabilidad */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-500" />
                      Por Categoría
                    </CardTitle>
                    <CardDescription>Distribución de gastos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(metricas.egresosPorTipoContabilidad).map(([tipo, monto]) => {
                        let badgeClass = "";
                        if (tipo === "ADMINISTRATIVA") badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-200";
                        else if (tipo === "COSTO_VENTA") badgeClass = "bg-green-100 text-green-800 hover:bg-green-200";
                        else if (tipo === "GASTO_VENTA") badgeClass = "bg-amber-100 text-amber-800 hover:bg-amber-200";
                        else badgeClass = "bg-purple-100 text-purple-800 hover:bg-purple-200";
                        
                        return (
                          <Badge key={tipo} className={badgeClass}>
                            {tipo}: S/ {parseFloat(monto).toFixed(2)}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
          
          {/* Métricas avanzadas para otros regímenes */}
          {!isNRUS && metricasAvanzadas ? (
            <>
              {/* Primera fila: Total Actual, Mes Anterior y Balance */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {/* Total de Egresos del Mes Actual */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-red-500" />
                      Total de Egresos del Mes Actual
                    </CardTitle>
                    <CardDescription>Monto total registrado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMetricas ? (
                      <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                    ) : (
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
                    )}
                  </CardContent>
                </Card>
                
                {/* Total de Egresos del Mes Anterior */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-orange-500" />
                      Total de Egresos del Mes Anterior
                    </CardTitle>
                    <CardDescription>Monto previo registrado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMetricas ? (
                      <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
                    ) : (
                      <div className="text-2xl font-bold">
                        S/ {parseFloat(metricasAvanzadas.totalMesAnterior).toFixed(2)}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Balance Mensual */}
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
                        <div className={`text-2xl font-bold ${parseFloat(metricasAvanzadas.balanceMensual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          S/ {parseFloat(metricasAvanzadas.balanceMensual).toFixed(2)}
                        </div>
                        {parseFloat(metricasAvanzadas.balanceMensual) >= 0 ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><TrendingUp className="h-3 w-3 mr-1" />Positivo</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><TrendingDown className="h-3 w-3 mr-1" />Negativo</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Segunda fila: Distribución por Tipo Tributario y otros */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Distribución por Tipo Tributario */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-500" />
                      Por Tipo Tributario
                    </CardTitle>
                    <CardDescription>Distribución tributaria</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMetricas ? (
                      <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(metricasAvanzadas.egresosPorTipoTributario).map(([tipo, monto]) => {
                          let badgeClass = "";
                          if (tipo === "GRAVADA") badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-200";
                          else if (tipo === "EXONERADA") badgeClass = "bg-green-100 text-green-800 hover:bg-green-200";
                          else if (tipo === "INAFECTA") badgeClass = "bg-amber-100 text-amber-800 hover:bg-amber-200";
                          
                          return (
                            <Badge key={tipo} className={badgeClass}>
                              {tipo}: S/ {parseFloat(monto).toFixed(2)}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Distribución por Tipo Contabilidad */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-purple-500" />
                      Por Tipo de Contabilidad
                    </CardTitle>
                    <CardDescription>Distribución de gastos por categoría</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMetricas ? (
                      <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(metricasAvanzadas.egresosPorTipoContabilidad).map(([tipo, monto]) => {
                          const isGasto = tipo === "GASTO";
                          return (
                            <div key={tipo} className={`border rounded-md p-4 ${isGasto ? 'border-orange-200' : 'border-blue-200'}`}>
                              <div className="flex justify-between items-center">
                                <div className="text-sm font-medium text-gray-500">{tipo}</div>
                                <Badge className={isGasto ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}>
                                  {isGasto ? 'Operativo' : 'Productivo'}
                                </Badge>
                              </div>
                              <div className="text-xl font-bold mt-2">S/ {parseFloat(monto).toFixed(2)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
          
          {/* Estado de carga para cualquier régimen */}
          {!isNRUS && !metricasAvanzadas && !loading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Sin datos disponibles</CardTitle>
                  <CardDescription>No se encontraron métricas</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Registra egresos para ver métricas</p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      
      {/* Gráficos para PDF - visibles solo durante la generación */}
      {chartsVisible && (
        <div 
          style={{ 
            position: 'fixed', 
            left: '-9999px',
            width: '800px',
            height: '800px',
            backgroundColor: '#FFFFFF',
            padding: '20px',
          }}
        >
          {/* Contenedor para gráfico de pastel con fondo blanco */}
          <div 
            style={{ 
              width: '400px', 
              height: '400px', 
              backgroundColor: '#FFFFFF',
              marginBottom: '20px',
              padding: '10px',
              borderRadius: '8px',
            }}
          >
            <Pie
              ref={pieChartRef}
              data={{
                labels: Object.keys(metricasAvanzadas?.egresosPorTipoTributario || {}),
                datasets: [
                  {
                    data: Object.values(metricasAvanzadas?.egresosPorTipoTributario || {}).map(val => parseFloat(val.toString())),
                    backgroundColor: [
                      'rgb(52, 152, 219)',  // Azul
                      'rgb(46, 204, 113)',  // Verde
                      'rgb(231, 76, 60)',   // Rojo
                      'rgb(241, 196, 15)',  // Amarillo
                      'rgb(155, 89, 182)',  // Morado
                    ],
                    borderColor: 'white',
                    borderWidth: 3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      color: '#000000',
                      font: { weight: 'bold', size: 14 },
                      padding: 20,
                    },
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 12,
                  },
                },
              }}
            />
          </div>
          
          {/* Contenedor para gráfico de barras con fondo blanco */}
          <div 
            style={{ 
              width: '600px', 
              height: '400px', 
              backgroundColor: '#FFFFFF',
              padding: '10px',
              borderRadius: '8px',
            }}
          >
            <Bar
              ref={barChartRef}
              data={{
                labels: Object.keys(metricasAvanzadas?.egresosPorTipoContabilidad || {}),
                datasets: [
                  {
                    label: 'Monto',
                    data: Object.values(metricasAvanzadas?.egresosPorTipoContabilidad || {}).map(val => parseFloat(val.toString())),
                    backgroundColor: 'rgb(155, 89, 182)',  // Morado
                    borderColor: 'rgb(120, 70, 140)',
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: '#E0E0E0' },
                    ticks: { color: '#000000', font: { weight: 'bold' } },
                  },
                  x: {
                    grid: { color: '#E0E0E0' },
                    ticks: { color: '#000000', font: { weight: 'bold' } },
                  },
                },
                plugins: {
                  legend: {
                    labels: { color: '#000000', font: { weight: 'bold', size: 12 } },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
      
      {/* Botón para generar PDF (solo para clientes no NRUS) */}
      {!isNRUS && clienteInfo && metricasAvanzadas && (
        <div className="flex justify-end mb-4">
          <Button 
            onClick={generatePDF} 
            disabled={generatingPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            {generatingPDF ? 'Generando PDF...' : 'Descargar Reporte PDF'}
          </Button>
        </div>
      )}
      
      <EgresosTable 
        clienteRegimen={clienteInfo?.regimen || ""} 
        onDataChange={refreshMetricas} 
      />
    </div>
  );
};

export default EgresosModule;
