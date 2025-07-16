import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { PlusCircle, Users, UserMinus } from "lucide-react";
import AsignacionModal from "./AsignacionModal";

// Interfaces para los tipos de datos que devuelve el backend
interface EstadisticasContadorResponse {
  totalContadores: number;
  totalClientesAsignados: number;
  promedioClientesPorContador: number;
}

interface ContadorClienteCountResponse {
  idContador: number;
  nombres: string;
  apellidos: string;
  totalClientes: number;
}

interface RegimenClienteCountResponse {
  regimen: string;
  totalClientes: number;
}

interface UsuarioResponse {
  id: number;
  username: string;
  nombres: string;
  apellidos: string;
}

interface ContadorResponse {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email: string;
  especialidad: string;
  nroColegiatura: string;
  usuario: UsuarioResponse | null;
  numeroClientes: number;
}

const AsignacionesTable: React.FC = () => {
  // Estados para almacenar los datos de las estadísticas
  const [estadisticasContadores, setEstadisticasContadores] = useState<EstadisticasContadorResponse | null>(null);
  const [topContadores, setTopContadores] = useState<ContadorClienteCountResponse[]>([]);
  const [bottomContadores, setBottomContadores] = useState<ContadorClienteCountResponse[]>([]);
  const [clientesSinAsignar, setClientesSinAsignar] = useState<number | null>(null);
  const [distribucionRegimen, setDistribucionRegimen] = useState<RegimenClienteCountResponse[]>([]);
  const [contadores, setContadores] = useState<ContadorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estados para los modales
  const [asignacionModalOpen, setAsignacionModalOpen] = useState(false);
  const [selectedContador, setSelectedContador] = useState<ContadorResponse | null>(null);
  const [modalMode, setModalMode] = useState<'asignar' | 'desasignar'>('asignar');

  // Función para obtener las estadísticas del backend
  const fetchEstadisticas = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Obtener estadísticas generales de contadores
      const estadisticasResponse = await fetch("http://localhost:8099/api/estadisticas/contadores", {
        headers,
      });

      // Obtener top contadores
      const topResponse = await fetch("http://localhost:8099/api/estadisticas/contadores/top?limit=5", {
        headers,
      });

      // Obtener bottom contadores
      const bottomResponse = await fetch("http://localhost:8099/api/estadisticas/contadores/bottom?limit=5", {
        headers,
      });

      // Obtener clientes sin asignar
      const sinAsignarResponse = await fetch("http://localhost:8099/api/estadisticas/clientes/sin-asignar", {
        headers,
      });

      // Obtener distribución por régimen
      const distribucionResponse = await fetch("http://localhost:8099/api/estadisticas/clientes/distribucion-regimen", {
        headers,
      });

      // Obtener lista de contadores
      const contadoresResponse = await fetch("http://localhost:8099/api/v1/contadores", {
        headers,
      });

      if (!estadisticasResponse.ok || !topResponse.ok || !bottomResponse.ok ||
        !sinAsignarResponse.ok || !distribucionResponse.ok || !contadoresResponse.ok) {
        throw new Error("Error al obtener datos");
      }

      const estadisticasData = await estadisticasResponse.json();
      const topData = await topResponse.json();
      const bottomData = await bottomResponse.json();
      const sinAsignarData = await sinAsignarResponse.json();
      const distribucionData = await distribucionResponse.json();
      const contadoresData = await contadoresResponse.json();

      setEstadisticasContadores(estadisticasData);
      setTopContadores(topData);
      setBottomContadores(bottomData);
      setClientesSinAsignar(sinAsignarData);
      setDistribucionRegimen(distribucionData);
      setContadores(contadoresData);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {


    fetchEstadisticas();
  }, []);

  // Función para mostrar un skeleton loader mientras se cargan los datos
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Card key={item} className="w-full">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-3 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  // Función para formatear números con separador de miles
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // Si hay error, mostrar mensaje de error
  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  // Si está cargando, mostrar skeleton loader
  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <h2 className="text-2xl font-bold">Estadísticas de Asignaciones</h2>
        {renderSkeleton()}
      </div>
    );
  }

  // Colores para los badges de régimen
  const regimenColors: Record<string, string> = {
    GENERAL: "bg-blue-100 text-blue-800",
    ESPECIAL: "bg-purple-100 text-purple-800",
    MYPE: "bg-green-100 text-green-800",
    RUS: "bg-amber-100 text-amber-800",
  };

  // Función para manejar la asignación de cliente a un contador
  const handleAsignarCliente = (contadorId: number) => {
    const contador = contadores.find(c => c.id === contadorId);
    if (contador) {
      setSelectedContador(contador);
      setModalMode('asignar');
      setAsignacionModalOpen(true);
    }
  };

  const handleDesasignarCliente = (contadorId: number) => {
    const contador = contadores.find(c => c.id === contadorId);
    if (contador) {
      setSelectedContador(contador);
      setModalMode('desasignar');
      setAsignacionModalOpen(true);
    }
  };
  
  // Función para asignar un cliente a un contador
  const handleAsignarClienteContador = async (clienteId: number, contadorId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const response = await fetch(
        `http://localhost:8099/api/clientes/${clienteId}/asignar-contador/${contadorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al asignar cliente a contador");
      }

      // Actualizar estadísticas después de la asignación
      fetchEstadisticas();
    } catch (err: any) {
      console.error("Error al asignar cliente:", err);
      alert(err.message || "Error al asignar cliente");
    }
  };

  const handleDesasignarClienteContador = async (clienteId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const response = await fetch(
        `http://localhost:8099/api/clientes/${clienteId}/desasignar-contador`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al desasignar cliente de contador");
      }

      // Actualizar estadísticas después de la desasignación
      fetchEstadisticas();
    } catch (err: any) {
      console.error("Error al desasignar cliente:", err);
      alert(err.message || "Error al desasignar cliente");
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Estadísticas y Asignaciones</h2>

      {/* Tarjetas principales - Ancho completo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Contadores</CardTitle>
            <CardDescription>Contadores registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {estadisticasContadores?.totalContadores ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Clientes Asignados</CardTitle>
            <CardDescription>Total de clientes con contador asignado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {estadisticasContadores?.totalClientesAsignados ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Clientes Sin Asignar</CardTitle>
            <CardDescription>Clientes que necesitan un contador</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-600">
              {clientesSinAsignar ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layout secundario: estadísticas a la izquierda (más pequeño), tabla a la derecha (más grande) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Columna izquierda con estadísticas de análisis y rankings */}
        <div className="w-full lg:w-2/5 space-y-6">
          {/* Tarjetas de análisis */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Promedio de Clientes</CardTitle>
                <CardDescription>Clientes promedio por contador</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">
                  {estadisticasContadores?.promedioClientesPorContador.toFixed(1) ?? "0.0"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Régimen</CardTitle>
                <CardDescription>Clientes agrupados por régimen tributario</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {distribucionRegimen.length > 0 ? (
                  distribucionRegimen.map((item) => (
                    <div key={item.regimen} className="flex justify-between items-center">
                      <Badge className={regimenColors[item.regimen] || "bg-gray-100 text-gray-800"}>
                        {item.regimen}
                      </Badge>
                      <span className="font-medium">{formatNumber(item.totalClientes)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center">No hay datos disponibles</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rankings de contadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Contadores</CardTitle>
                <CardDescription>Contadores con más clientes asignados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {topContadores.length > 0 ? (
                  topContadores.map((contador, index) => (
                    <div key={contador.idContador} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{index + 1}.</span>
                        <span>{contador.nombres} {contador.apellidos}</span>
                      </div>
                      <Badge variant="outline" className="bg-blue-50">
                        {contador.totalClientes} clientes
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center">No hay datos disponibles</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contadores con Menos Carga</CardTitle>
                <CardDescription>Contadores con menos clientes asignados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {bottomContadores.length > 0 ? (
                  bottomContadores.map((contador, index) => (
                    <div key={contador.idContador} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{index + 1}.</span>
                        <span>{contador.nombres} {contador.apellidos}</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50">
                        {contador.totalClientes} clientes
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center">No hay datos disponibles</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Columna derecha con tabla de contadores - más ancha */}
        <div className="w-full lg:w-3/5">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Contadores</CardTitle>
              <CardDescription>Contadores disponibles para asignación</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Datos Personales</TableHead>
                    <TableHead className="w-[15%]">DNI</TableHead>
                    <TableHead className="w-[15%]">Teléfono</TableHead>
                    <TableHead className="w-[10%]">Nro Clientes</TableHead>
                    <TableHead className="w-[30%] text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contadores.length > 0 ? (
                    contadores.map((contador) => (
                      <TableRow key={contador.id}>
                        <TableCell className="font-medium">
                          <div>
                            <span className="font-bold text-zinc-900">{contador.nombres} {contador.apellidos}</span>
                            <div className="text-sm text-zinc-500">{contador.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{contador.dni}</TableCell>
                        <TableCell>{contador.telefono}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`flex items-center gap-1 ${contador.numeroClientes >= 7 ? 'bg-red-50 text-red-600' : 'bg-blue-50'}`}
                          >
                            <Users className="h-3 w-3" />
                            {contador.numeroClientes}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAsignarCliente(contador.id)}
                              className="flex items-center gap-1 px-2"
                              disabled={contador.numeroClientes >= 7}
                              title={contador.numeroClientes >= 7 ? "Este contador ha alcanzado el máximo de clientes" : ""}
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              Asignar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDesasignarCliente(contador.id)}
                              className="flex items-center gap-1 px-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={contador.numeroClientes === 0}
                              title={contador.numeroClientes === 0 ? "Este contador no tiene clientes asignados" : ""}
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                              Desasignar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No hay contadores disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de asignación/desasignación */}
      <AsignacionModal 
        open={asignacionModalOpen}
        onClose={() => setAsignacionModalOpen(false)}
        contador={selectedContador}
        onAsignar={handleAsignarClienteContador}
        onDesasignar={handleDesasignarClienteContador}
        mode={modalMode}
      />
    </div>
  );
};

export default AsignacionesTable;
