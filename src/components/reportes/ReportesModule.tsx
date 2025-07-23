import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle, BarChart2, PieChart, TrendingUp, RefreshCw, FileText } from "lucide-react";
// Importamos los componentes desde el archivo index.ts
import { ResumenFinanciero, DistribucionTributaria, HistorialDeclaraciones, EstadoObligaciones } from "./index";

interface ReporteClienteDTO {
  cliente: {
    id: number;
    nombres: string;
    apellidos: string;
    rucDni: string;
    tipoRuc: string;
    regimen: string;
    tipoCliente: string;
    email: string;
    telefono: string;
  };
  metricasGenerales: {
    totalIngresos: number;
    totalEgresos: number;
    balance: number;
    utilidadEstimada: number;
    igvPorPagar: number;
    irEstimado: number;
    tendenciaMensual: Record<string, number>;
  };
  ingresos: {
    totalMesActual: number;
    totalMesAnterior: number;
    variacionPorcentual: number;
    ingresosPorTipoTributario: Record<string, number>;
    ultimosIngresos: {
      id: number;
      fecha: string;
      monto: number;
      montoIgv: number;
      descripcion: string;
      nroComprobante: string;
      tipoTributario: string;
    }[];
  };
  egresos: {
    totalMesActual: number;
    totalMesAnterior: number;
    variacionPorcentual: number;
    egresosPorTipoTributario: Record<string, number>;
    egresosPorTipoContabilidad: Record<string, number>;
    ultimosEgresos: {
      id: number;
      fecha: string;
      monto: number;
      montoIgv: number;
      descripcion: string;
      nroComprobante: string;
      tipoTributario: string;
      tipoContabilidad: string;
    }[];
  };
  declaraciones: {
    id: number;
    periodo: string;
    fechaPresentacion: string;
    estado: string;
  }[];
  obligaciones: {
    id: number;
    concepto: string;
    fechaLimite: string;
    monto: number;
    estado: string;
  }[];
  pagos: any[];
}

const ReportesModule: React.FC = () => {
  const [reporte, setReporte] = useState<ReporteClienteDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [anio, setAnio] = useState<string>(new Date().getFullYear().toString());
  const [mes, setMes] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  // El tipo de reporte siempre es COMPLETO
  const [tipoReporte] = useState<string>("COMPLETO");
  const [activeTab, setActiveTab] = useState<string>("resumen");
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const fetchReporte = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No se encontró token de autenticación");
        setLoading(false);
        return;
      }

      const periodo = `${anio}-${mes}`;
      const url = `http://localhost:8099/api/v1/reportes/cliente/metricas?periodo=${periodo}&tipoReporte=${tipoReporte}`;
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Error al obtener el reporte: ${response.statusText}`);
      }

      const data = await response.json();
      setReporte(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el reporte");
      console.error("Error al cargar el reporte:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte();
  }, [anio, mes, tipoReporte]);

  const handleLimpiarFiltros = () => {
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    setAnio(currentYear);
    setMes(currentMonth);
    // El tipo de reporte siempre es COMPLETO
  };

  const handleDescargarPdf = async () => {
    setDownloadingPdf(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No se encontró token de autenticación");
        setDownloadingPdf(false);
        return;
      }

      const periodo = `${anio}-${mes}`;
      const url = `http://localhost:8099/api/v1/reportes/cliente/metricas/pdf?periodo=${periodo}&tipoReporte=${tipoReporte}`;
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        method: "GET"
      });

      if (!response.ok) {
        throw new Error(`Error al descargar el reporte PDF: ${response.statusText}`);
      }

      // Obtener el blob del PDF
      const blob = await response.blob();
      
      // Crear URL para el blob
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Crear un elemento <a> temporal para descargar el archivo
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Obtener el nombre del archivo de las cabeceras si está disponible
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'reporte-cliente.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      link.click();
      
      // Limpiar
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descargar el PDF");
      console.error("Error al descargar el PDF:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const renderAnios = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i.toString());
    }
    return years.map(year => (
      <SelectItem key={year} value={year}>{year}</SelectItem>
    ));
  };

  const meses = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" }
  ];

  // El tipo de reporte siempre es COMPLETO

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reportes y Métricas</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleLimpiarFiltros}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Limpiar filtros
          </Button>
          <Button 
            onClick={fetchReporte}
            className="flex items-center gap-1"
            disabled={loading}
          >
            {loading ? "Cargando..." : "Generar reporte"}
          </Button>
          <Button 
            variant="outline"
            className="flex items-center gap-1 bg-white text-red-600 border-red-600 hover:bg-red-50"
            onClick={handleDescargarPdf}
            disabled={downloadingPdf || !reporte}
          >
            <FileText className="h-4 w-4" />
            {downloadingPdf ? "Descargando..." : "Descargar Reporte (PDF)"}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecciona el período que deseas visualizar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <Select value={anio} onValueChange={setAnio}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un año" />
                </SelectTrigger>
                <SelectContent>
                  {renderAnios()}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un mes" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(mes => (
                    <SelectItem key={mes.value} value={mes.value}>{mes.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* El tipo de reporte siempre es COMPLETO */}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {reporte && !loading && (
        <>
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{reporte?.cliente?.nombres || 'Cliente'} {reporte?.cliente?.apellidos || ''}</h2>
                <p className="text-gray-500">RUC/DNI: {reporte?.cliente?.rucDni || '-'} | Régimen: {reporte?.cliente?.regimen || '-'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Período del reporte</p>
                <p className="font-medium">{`${anio}-${mes}` || '-'}</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="resumen" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="distribucion" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Distribución
              </TabsTrigger>
              <TabsTrigger value="declaraciones" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Declaraciones
              </TabsTrigger>
              <TabsTrigger value="obligaciones" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Obligaciones
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="resumen">
              {reporte?.metricasGenerales && (
                <ResumenFinanciero resumenFinanciero={{
                  totalIngresos: reporte.metricasGenerales.totalIngresos,
                  totalEgresos: reporte.metricasGenerales.totalEgresos,
                  balanceNeto: reporte.metricasGenerales.balance,
                  variacionIngresos: reporte.ingresos?.variacionPorcentual || 0,
                  variacionEgresos: reporte.egresos?.variacionPorcentual || 0
                }} />
              )}
            </TabsContent>
            
            <TabsContent value="distribucion">
              {reporte?.ingresos?.ingresosPorTipoTributario && reporte?.egresos?.egresosPorTipoTributario && (
                <DistribucionTributaria 
                  distribucionIngresos={Object.entries(reporte.ingresos.ingresosPorTipoTributario).map(([tipoTributario, monto]) => ({
                    tipoTributario,
                    monto
                  }))}
                  distribucionEgresos={[
                    // Solo datos por tipo tributario para el tab de tipo tributario
                    ...Object.entries(reporte.egresos.egresosPorTipoTributario).map(([tipoTributario, monto]) => ({
                      tipoTributario,
                      monto,
                      tipoContabilidad: "" // Dejamos vacío para que no se mezcle con los datos de contabilidad
                    })),
                    // Solo datos por tipo contabilidad para el tab de contabilidad
                    ...Object.entries(reporte.egresos.egresosPorTipoContabilidad).map(([tipoContabilidad, monto]) => ({
                      tipoTributario: "", // Dejamos vacío para que no se mezcle con los datos tributarios
                      monto,
                      tipoContabilidad // GASTO, COSTO, etc.
                    }))
                  ]}
                />
              )}
            </TabsContent>
            
            <TabsContent value="declaraciones">
              {reporte?.declaraciones && (
                <HistorialDeclaraciones declaraciones={reporte.declaraciones} />
              )}
            </TabsContent>
            
            <TabsContent value="obligaciones">
              {reporte?.obligaciones && (
                <EstadoObligaciones obligaciones={reporte.obligaciones} />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ReportesModule;
