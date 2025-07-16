import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
// Eliminada importación no usada de Button
import { Search, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClienteConMetricas } from "@/types/cliente";
import ClientesTable from "@/components/mis-clientes/ClientesTable";
import { Skeleton } from "@/components/ui/skeleton";

const MisClientesModule: React.FC = () => {
  const [clientesNaturales, setClientesNaturales] = useState<ClienteConMetricas[]>([]);
  const [clientesJuridicos, setClientesJuridicos] = useState<ClienteConMetricas[]>([]);
  const [loadingNaturales, setLoadingNaturales] = useState(true);
  const [loadingJuridicos, setLoadingJuridicos] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [regimenFilter, setRegimenFilter] = useState<string>("todos");
  const [tabActivo, setTabActivo] = useState<string>("naturales");

  // Cargar clientes naturales
  useEffect(() => {
    const fetchClientesNaturales = async () => {
      setLoadingNaturales(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No se encontró token de autenticación");

        let url = "http://localhost:8099/api/v1/contadores/mis-clientes/naturales/metricas";
        const params = new URLSearchParams();
        
        if (searchTerm) {
          params.append("nombres", searchTerm);
        }
        
        if (regimenFilter && regimenFilter !== "todos") {
          params.append("regimen", regimenFilter);
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Error al obtener clientes");
        
        const data = await response.json();
        setClientesNaturales(data);
      } catch (err) {
        console.error("Error al cargar clientes personas naturales:", err);
        setClientesNaturales([]);
      } finally {
        setLoadingNaturales(false);
      }
    };

    if (tabActivo === "naturales") {
      fetchClientesNaturales();
    }
  }, [searchTerm, regimenFilter, tabActivo]);

  // Cargar clientes jurídicos
  useEffect(() => {
    const fetchClientesJuridicos = async () => {
      setLoadingJuridicos(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No se encontró token de autenticación");

        let url = "http://localhost:8099/api/v1/contadores/mis-clientes/juridicos/metricas";
        const params = new URLSearchParams();
        
        if (searchTerm) {
          params.append("nombres", searchTerm);
        }
        
        if (regimenFilter && regimenFilter !== "todos") {
          params.append("regimen", regimenFilter);
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Error al obtener clientes");
        
        const data = await response.json();
        setClientesJuridicos(data);
      } catch (err) {
        console.error("Error al cargar clientes personas jurídicas:", err);
        setClientesJuridicos([]);
      } finally {
        setLoadingJuridicos(false);
      }
    };

    if (tabActivo === "juridicos") {
      fetchClientesJuridicos();
    }
  }, [searchTerm, regimenFilter, tabActivo]);

  // Manejar búsqueda
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Manejar cambio de filtro por régimen
  const handleRegimenChange = (value: string) => {
    setRegimenFilter(value);
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
        <p className="text-gray-600 mt-1">
          Gestiona y visualiza información de tus clientes asignados
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por nombres o RUC/DNI..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <div className="w-full md:w-1/4">
                <Select
                  value={regimenFilter}
                  onValueChange={handleRegimenChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por régimen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los regímenes</SelectItem>
                    <SelectItem value="RER">RER</SelectItem>
                    <SelectItem value="RG">RG</SelectItem>
                    <SelectItem value="RMT">RMT</SelectItem>
                    <SelectItem value="NRUS">NRUS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs y Tablas */}
        <Tabs defaultValue="naturales" onValueChange={setTabActivo} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="naturales">Personas Naturales</TabsTrigger>
            <TabsTrigger value="juridicos">Personas Jurídicas</TabsTrigger>
          </TabsList>
          <TabsContent value="naturales" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Users size={18} />
                  Clientes Personas Naturales
                </CardTitle>
                <CardDescription>
                  Lista de clientes tipo persona natural y sus métricas del mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingNaturales ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <ClientesTable 
                    clientes={clientesNaturales} 
                    tipoCliente="PERSONA_NATURAL"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="juridicos" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Users size={18} />
                  Clientes Personas Jurídicas
                </CardTitle>
                <CardDescription>
                  Lista de clientes tipo persona jurídica y sus métricas del mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJuridicos ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <ClientesTable 
                    clientes={clientesJuridicos} 
                    tipoCliente="PERSONA_JURIDICA"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MisClientesModule;
