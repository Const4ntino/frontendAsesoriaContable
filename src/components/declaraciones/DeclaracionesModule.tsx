import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, AlertTriangle, Clock, Calendar } from "lucide-react";
import type { DeclaracionResponse } from "../../types/declaracion";
import type { PeriodoVencimientoResponse } from "../../types/periodoVencimiento";
import DeclaracionesTable from "./DeclaracionesTable";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const DeclaracionesModule: React.FC = () => {
  const [declaraciones, setDeclaraciones] = useState<DeclaracionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  // Estados para los nuevos endpoints
  const [vencimientoActual, setVencimientoActual] = useState<PeriodoVencimientoResponse | null>(null);
  const [loadingVencimiento, setLoadingVencimiento] = useState(true);
  const [errorVencimiento, setErrorVencimiento] = useState<string | null>(null);
  
  const [primeraDeclaracion, setPrimeraDeclaracion] = useState<DeclaracionResponse | null>(null);
  const [loadingPrimera, setLoadingPrimera] = useState(true);
  const [errorPrimera, setErrorPrimera] = useState<string | null>(null);

  // Cargar período actual y fecha de vencimiento
  useEffect(() => {
    const fetchVencimientoActual = async () => {
      setLoadingVencimiento(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No se encontró token de autenticación");

        const response = await fetch("http://localhost:8099/api/v1/declaraciones/mis-declaraciones/vencimiento-actual", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.warn(`Error al obtener vencimiento: ${response.status} ${response.statusText}`);
          setErrorVencimiento("No se pudo obtener la información del período actual");
          return;
        }
        
        const data = await response.json();
        setVencimientoActual(data);
      } catch (err) {
        console.error("Error al cargar vencimiento actual:", err);
        setErrorVencimiento("No se pudo cargar la información del período actual.");
      } finally {
        setLoadingVencimiento(false);
      }
    };

    fetchVencimientoActual();
  }, []);
  
  // Cargar primera declaración en estado CREADO
  useEffect(() => {
    const fetchPrimeraDeclaracion = async () => {
      setLoadingPrimera(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No se encontró token de autenticación");

        const response = await fetch("http://localhost:8099/api/v1/declaraciones/mis-declaraciones/ultima", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Si no hay declaración, es un caso normal, no un error
          if (response.status === 404) {
            setErrorPrimera("No tienes declaraciones pendientes");
          } else {
            console.warn(`Error al obtener primera declaración: ${response.status} ${response.statusText}`);
            setErrorPrimera("No se pudo obtener la declaración pendiente");
          }
          return;
        }
        
        const data = await response.json();
        setPrimeraDeclaracion(data);
      } catch (err) {
        console.error("Error al cargar primera declaración:", err);
        setErrorPrimera("No se pudo cargar la información de declaraciones pendientes.");
      } finally {
        setLoadingPrimera(false);
      }
    };

    fetchPrimeraDeclaracion();
  }, [])

  useEffect(() => {
    const fetchDeclaraciones = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No se encontró token de autenticación");

        // Construir URL con parámetros de filtro
        let url = "http://localhost:8099/api/v1/declaraciones/mis-declaraciones";
        const params = new URLSearchParams();
        
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Error al obtener declaraciones");
        
        const data = await response.json();
        setDeclaraciones(data);
      } catch (err) {
        console.error("Error al cargar declaraciones:", err);
        setDeclaraciones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeclaraciones();
  }, [fechaInicio, fechaFin]);

    // Función para determinar si una fecha está próxima (menos de 7 días)
  const esFechaProxima = (fechaStr?: string): boolean => {
    if (!fechaStr) return false;
    
    const fecha = parseISO(fechaStr);
    const hoy = new Date();
    const diferenciaMs = fecha.getTime() - hoy.getTime();
    const diferenciaDias = diferenciaMs / (1000 * 60 * 60 * 24);
    
    return diferenciaDias >= 0 && diferenciaDias <= 7;
  };
  
  // Obtener la variante de Badge según el estado
  const getEstadoBadgeVariant = (estado?: string) => {
    switch (estado) {
      case "CREADO":
        return "default";
      case "EN_PROCESO":
        return "secondary";
      case "COMPLETADO":
        return "default";
      case "PAGADO":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Declaraciones Tributarias</h1>
        <p className="text-muted-foreground">
          Gestiona y visualiza tus declaraciones tributarias mensuales
        </p>
      </div>

      {/* Tarjetas de información actual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Tarjeta de período y vencimiento actual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período Tributario Actual
            </CardTitle>
            <CardDescription>
              Información del período actual y fecha de vencimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVencimiento ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-6 w-32" />
              </div>
            ) : errorVencimiento ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
                <p className="text-muted-foreground">{errorVencimiento}</p>
              </div>
            ) : vencimientoActual ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium text-muted-foreground">Período Actual</h4>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {format(parseISO(vencimientoActual.periodo), "MMMM yyyy", { locale: es })}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium text-muted-foreground">Fecha de Vencimiento</h4>
                  </div>
                  <p className="text-xl font-medium mt-1">
                    {format(parseISO(vencimientoActual.fechaVencimiento), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  <Badge className="mt-2" variant="outline">
                    {esFechaProxima(vencimientoActual.fechaVencimiento) ? 
                      "Vence pronto" : "En plazo normal"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No hay información del período actual</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Tarjeta de primera declaración pendiente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Declaración Pendiente
            </CardTitle>
            <CardDescription>
              Tu declaración pendiente más próxima
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPrimera ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-36" />
                <div className="flex gap-4 mt-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            ) : errorPrimera ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FileCheck className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{errorPrimera}</p>
              </div>
            ) : primeraDeclaracion ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    {primeraDeclaracion.periodoTributario 
                      ? format(new Date(`${primeraDeclaracion.periodoTributario}T12:00:00`), "MMMM yyyy", { locale: es })
                      : "Sin período"}
                  </h3>
                  <Badge variant={getEstadoBadgeVariant(primeraDeclaracion.estado)}>
                    {primeraDeclaracion.estado?.replace("_", " ") || "PENDIENTE"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Fecha Límite</h4>
                    <p className="text-base font-medium mt-1">
                      {primeraDeclaracion.fechaLimite 
                        ? format(new Date(`${primeraDeclaracion.fechaLimite}T12:00:00`), "d 'de' MMMM", { locale: es })
                        : "No especificada"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Tipo</h4>
                    <p className="text-base font-medium mt-1">
                      {primeraDeclaracion.tipo || "No especificado"}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className="w-full" 
                    size="sm" 
                    disabled={primeraDeclaracion.estado !== "DECLARADO" || !primeraDeclaracion.urlConstanciaDeclaracion}
                    onClick={() => {
                      if (primeraDeclaracion.urlConstanciaDeclaracion) {
                        const url = primeraDeclaracion.urlConstanciaDeclaracion.startsWith('http') 
                          ? primeraDeclaracion.urlConstanciaDeclaracion 
                          : `http://localhost:8099${primeraDeclaracion.urlConstanciaDeclaracion}`;
                        window.open(url, '_blank');
                      }
                    }}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Constancia Declaración
                  </Button>
                  
                  <Button 
                    className="w-full" 
                    size="sm" 
                    disabled={primeraDeclaracion.estado !== "DECLARADO" || !primeraDeclaracion.urlConstanciaSunat}
                    onClick={() => {
                      if (primeraDeclaracion.urlConstanciaSunat) {
                        const url = primeraDeclaracion.urlConstanciaSunat.startsWith('http') 
                          ? primeraDeclaracion.urlConstanciaSunat 
                          : `http://localhost:8099${primeraDeclaracion.urlConstanciaSunat}`;
                        window.open(url, '_blank');
                      }
                    }}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Constancia SUNAT
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FileCheck className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No tienes declaraciones pendientes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historial de declaraciones */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Historial de Declaraciones
          </CardTitle>
          <CardDescription>
            Consulta y filtra tus declaraciones tributarias anteriores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todas" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
              <TabsTrigger value="completadas">Completadas</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="fechaInicio" className="text-sm font-medium">
                  Desde
                </label>
                <div className="relative">
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="fechaFin" className="text-sm font-medium">
                  Hasta
                </label>
                <div className="relative">
                  <Input
                    id="fechaFin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setFechaInicio("");
                    setFechaFin("");
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>

            <TabsContent value="todas">
              <DeclaracionesTable
                declaraciones={declaraciones}
                isLoading={loading}
              />
            </TabsContent>
            
            <TabsContent value="pendientes">
              <DeclaracionesTable
                declaraciones={declaraciones.filter(
                  (d) => d.estado === "CREADO" || d.estado === "EN_PROCESO"
                )}
                isLoading={loading}
              />
            </TabsContent>
            
            <TabsContent value="completadas">
              <DeclaracionesTable
                declaraciones={declaraciones.filter(
                  (d) => d.estado === "COMPLETADO" || d.estado === "PAGADO"
                )}
                isLoading={loading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeclaracionesModule;
