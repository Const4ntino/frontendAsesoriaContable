import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Info, ArrowDownCircle } from "lucide-react";
import ObligacionesNRUSTable from "./ObligacionesNRUSTable";
import { format, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ObligacionNRUS {
  periodo: string;
  fechaLimite: string;
  montoIngresos: number;
  montoEgresos: number;
  montoMayor: number;
  categoria: number;
  cuota: number;
}

const ObligacionesNRUSModule: React.FC = () => {
  const [currentTab, setCurrentTab] = useState("actual");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [obligaciones, setObligaciones] = useState<ObligacionNRUS[]>([]);
  const [ingresosActual, setIngresosActual] = useState(0);
  const [ingresosPasado, setIngresosPasado] = useState(0);
  const [egresosActual, setEgresosActual] = useState(0);
  const [egresosPasado, setEgresosPasado] = useState(0);
  const [categoriaActual, setCategoriaActual] = useState(1);
  const [categoriaPasado, setCategoriaPasado] = useState(1);

  // Obtener el primer día del mes actual y del mes pasado
  const today = new Date();
  const currentMonth = format(today, "yyyy-MM-01");
  const lastMonth = format(subMonths(today, 1), "yyyy-MM-01");
  
  // Nombres de los meses para mostrar
  const currentMonthName = format(today, "MMMM yyyy", { locale: es });
  const lastMonthName = format(subMonths(today, 1), "MMMM yyyy", { locale: es });

  // Fecha límite de pago (día 5 del mes siguiente al periodo)
  const fechaLimite = `${format(addMonths(today, 1), "yyyy-MM")}-05`;
  const fechaLimitePasado = `${format(today, "yyyy-MM")}-05`;



  // Determinar categoría según ingresos
  const determinarCategoria = (ingresos: number) => {
    if (ingresos <= 5000) {
      return 1;
    } else if (ingresos <= 8000) {
      return 2;
    } else {
      return 2; // Si excede 8000, sigue siendo categoría 2 pero debería cambiar de régimen
    }
  };

  // Determinar cuota según categoría
  const determinarCuota = (categoria: number) => {
    return categoria === 1 ? 20 : 50;
  };

  // Cargar datos de ingresos y egresos
  useEffect(() => {
    const fetchDatos = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No se encontró el token de autenticación");

        // Obtener ingresos y egresos del mes actual
        const [responseIngresosActual, responseEgresosActual, responseIngresosPasado, responseEgresosPasado] = await Promise.all([
          fetch(`http://localhost:8099/api/clientes/ingresos/suma?periodo=${currentMonth}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:8099/api/clientes/egresos/suma?periodo=${currentMonth}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:8099/api/clientes/ingresos/suma?periodo=${lastMonth}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:8099/api/clientes/egresos/suma?periodo=${lastMonth}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (!responseIngresosActual.ok || !responseEgresosActual.ok || 
            !responseIngresosPasado.ok || !responseEgresosPasado.ok) {
          throw new Error("Error al obtener los datos de ingresos o egresos");
        }

        const ingresosActualData = await responseIngresosActual.json();
        const egresosActualData = await responseEgresosActual.json();
        const ingresosPasadoData = await responseIngresosPasado.json();
        const egresosPasadoData = await responseEgresosPasado.json();

        // Convertir a número si es necesario
        const ingresosActualValue = typeof ingresosActualData === 'number' 
          ? ingresosActualData : parseFloat(ingresosActualData) || 0;
          
        const egresosActualValue = typeof egresosActualData === 'number' 
          ? egresosActualData : parseFloat(egresosActualData) || 0;
          
        const ingresosPasadoValue = typeof ingresosPasadoData === 'number' 
          ? ingresosPasadoData : parseFloat(ingresosPasadoData) || 0;
          
        const egresosPasadoValue = typeof egresosPasadoData === 'number' 
          ? egresosPasadoData : parseFloat(egresosPasadoData) || 0;

        setIngresosActual(ingresosActualValue);
        setEgresosActual(egresosActualValue);
        setIngresosPasado(ingresosPasadoValue);
        setEgresosPasado(egresosPasadoValue);

        // Determinar el monto mayor entre ingresos y egresos
        const montoMayorActualValue = Math.max(ingresosActualValue, egresosActualValue);
        const montoMayorPasadoValue = Math.max(ingresosPasadoValue, egresosPasadoValue);

        // Determinar categorías basadas en el monto mayor
        const catActual = determinarCategoria(montoMayorActualValue);
        const catPasado = determinarCategoria(montoMayorPasadoValue);
        
        setCategoriaActual(catActual);
        setCategoriaPasado(catPasado);

        // Crear objetos de obligaciones
        const obligacionActual: ObligacionNRUS = {
          periodo: currentMonthName,
          fechaLimite: fechaLimite,
          montoIngresos: ingresosActualValue,
          montoEgresos: egresosActualValue,
          montoMayor: montoMayorActualValue,
          categoria: catActual,
          cuota: determinarCuota(catActual),
        };

        const obligacionPasada: ObligacionNRUS = {
          periodo: lastMonthName,
          fechaLimite: fechaLimitePasado,
          montoIngresos: ingresosPasadoValue,
          montoEgresos: egresosPasadoValue,
          montoMayor: montoMayorPasadoValue,
          categoria: catPasado,
          cuota: determinarCuota(catPasado),
        };

        setObligaciones([obligacionActual, obligacionPasada]);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Ocurrió un error al cargar los datos de ingresos. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, [currentMonth, lastMonth, fechaLimite, fechaLimitePasado]);

  // Filtrar obligaciones según la pestaña seleccionada
  const obligacionesFiltradas = obligaciones.filter((obligacion) => {
    if (currentTab === "actual") {
      return obligacion.periodo === currentMonthName;
    } else if (currentTab === "pasado") {
      return obligacion.periodo === lastMonthName;
    }
    return true; // "todos" muestra todas
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Obligaciones NRUS</h2>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Información sobre el Régimen NRUS</AlertTitle>
        <AlertDescription>
          <p>El Nuevo Régimen Único Simplificado (NRUS) tiene dos categorías de pago:</p>
          <ul className="list-disc pl-5 mt-2">
            <li><strong>Categoría 1:</strong> Ingresos o compras hasta S/ 5,000.00. Cuota mensual de S/ 20.00.</li>
            <li><strong>Categoría 2:</strong> Ingresos o compras hasta S/ 8,000.00. Cuota mensual de S/ 50.00.</li>
          </ul>
          <p className="mt-2">La fecha límite de pago es hasta el día 5 de cada mes.</p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mes Actual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {ingresosActual.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMonthName}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos Mes Actual</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {egresosActual.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMonthName}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categoría Actual</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Categoría {categoriaActual}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cuota: S/ {determinarCuota(categoriaActual).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mes Anterior</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {ingresosPasado.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastMonthName}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos Mes Anterior</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {egresosPasado.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastMonthName}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categoría Anterior</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Categoría {categoriaPasado}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cuota: S/ {determinarCuota(categoriaPasado).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Obligaciones NRUS</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="actual" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="actual">Mes Actual</TabsTrigger>
              <TabsTrigger value="pasado">Mes Anterior</TabsTrigger>
              <TabsTrigger value="todos">Todos</TabsTrigger>
            </TabsList>
            <TabsContent value="actual">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Cargando datos...</p>
                </div>
              ) : error ? (
                <div className="text-red-500 p-4">{error}</div>
              ) : (
                <ObligacionesNRUSTable obligaciones={obligacionesFiltradas} />
              )}
            </TabsContent>
            <TabsContent value="pasado">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Cargando datos...</p>
                </div>
              ) : error ? (
                <div className="text-red-500 p-4">{error}</div>
              ) : (
                <ObligacionesNRUSTable obligaciones={obligacionesFiltradas} />
              )}
            </TabsContent>
            <TabsContent value="todos">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Cargando datos...</p>
                </div>
              ) : error ? (
                <div className="text-red-500 p-4">{error}</div>
              ) : (
                <ObligacionesNRUSTable obligaciones={obligaciones} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ObligacionesNRUSModule;
