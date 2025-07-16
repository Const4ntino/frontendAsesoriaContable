import React, { useEffect, useState } from "react";
import ClienteModal from "./ClienteModal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ArrowUpDown, RefreshCw, X } from "lucide-react";
import { debounce } from "lodash";

interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
  email: string;
  telefono: string;
  tipoRuc: string;
  regimen: string;
  tipoCliente: string;
  idContador: number | null;
  usuario?: {
    id: number;
    username: string;
  } | null;
  contador?: {
    id: number;
    nombres: string;
    apellidos: string;
  } | null;
}

const ClientesTable: React.FC = () => {
  const [clientesNaturales, setClientesNaturales] = useState<Cliente[]>([]);
  const [clientesJuridicos, setClientesJuridicos] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [regimenFilter, setRegimenFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("nombres");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [activeTab, setActiveTab] = useState("persona_natural");

  const fetchClientes = async (tipoCliente: string) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      
      // Construir URL con parámetros de filtro
      const params = new URLSearchParams();
      if (searchTerm) params.append("searchTerm", searchTerm);
      params.append("tipoCliente", tipoCliente);
      if (regimenFilter && regimenFilter !== "todos") params.append("regimen", regimenFilter);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);
      
      const response = await fetch(`http://localhost:8099/api/clientes/search?${params}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al obtener clientes");
      const data = await response.json();
      
      if (tipoCliente === "PERSONA_NATURAL") {
        setClientesNaturales(data);
      } else {
        setClientesJuridicos(data);
      }
    } catch (err) {
      setError(`No se pudo cargar la lista de clientes ${tipoCliente}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar con debounce
  const debouncedSearch = React.useCallback(
    debounce(() => {
      fetchClientes(activeTab === "persona_natural" ? "PERSONA_NATURAL" : "PERSONA_JURIDICA");
    }, 500),
    [searchTerm, regimenFilter, sortBy, sortOrder, activeTab]
  );

  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [searchTerm, regimenFilter, sortBy, sortOrder, activeTab, debouncedSearch]);

  useEffect(() => {
    // Cargar ambos tipos de clientes al inicio
    fetchClientes("PERSONA_NATURAL");
    fetchClientes("PERSONA_JURIDICA");
  }, []);

  const handleAgregar = () => {
    setClienteEditar(null);
    setModalOpen(true);
  };

  const handleEditar = (cliente: Cliente) => {
    setClienteEditar(cliente);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setClienteEditar(null);
    setModalOpen(false);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleRefresh = () => {
    fetchClientes("PERSONA_NATURAL");
    fetchClientes("PERSONA_JURIDICA");
  };
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setRegimenFilter("todos");
    setSortBy("nombres");
    setSortOrder("asc");
    fetchClientes("PERSONA_NATURAL");
    fetchClientes("PERSONA_JURIDICA");
  };

  const renderClienteTable = (clientes: Cliente[], tipoCliente: string) => {
    return (
      <div className="overflow-x-auto">
        {clientes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay clientes de tipo {tipoCliente === "PERSONA_NATURAL" ? "Persona Natural" : "Persona Jurídica"}
          </div>
        ) : (
          <Table className="border border-zinc-200 rounded-xl overflow-hidden">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2 text-left font-semibold">
                  {tipoCliente === "PERSONA_NATURAL" ? "Datos Personales" : "Razón Social"}
                </TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold">{tipoCliente === "PERSONA_NATURAL" ? "DNI" : "RUC"}</TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold">Teléfono</TableHead>
                {tipoCliente === "PERSONA_JURIDICA" && (
                  <TableHead className="px-4 py-2 text-left font-semibold">Tipo RUC</TableHead>
                )}
                <TableHead className="px-4 py-2 text-left font-semibold">Usuario</TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold">Contador</TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold">Régimen</TableHead>
                <TableHead className="px-4 py-2 text-center font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id} className="border-b hover:bg-gray-50">
                  <TableCell className="px-4 py-2">
                    <div>
                      <span className="font-bold text-zinc-900">
                        {tipoCliente === "PERSONA_NATURAL" 
                          ? `${c.nombres} ${c.apellidos}` 
                          : c.nombres}
                      </span>
                      <div className="text-sm text-zinc-500">{c.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">{c.rucDni}</TableCell>
                  <TableCell className="px-4 py-2">{c.telefono}</TableCell>
                  {tipoCliente === "PERSONA_JURIDICA" && (
                    <TableCell className="px-4 py-2">{c.tipoRuc || "—"}</TableCell>
                  )}
                  <TableCell className="px-4 py-2">
                    {c.usuario?.username ? 
                      <Badge variant="secondary" className="text-gray-700 bg-gray-100 border border-gray-200">
                        {c.usuario.username}
                      </Badge> 
                      : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {c.contador?.nombres 
                      ? <Badge variant="secondary" className="text-gray-700 bg-gray-100 border border-gray-200">
                          {`${c.contador.nombres} ${c.contador.apellidos}`}
                        </Badge> 
                      : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {c.regimen ? 
                      <Badge variant="secondary" className="text-gray-700 bg-gray-100 border border-gray-200">
                        {c.regimen}
                      </Badge> 
                      : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        className="px-4"
                        onClick={() => handleEditar(c)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="default"
                        className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={async () => {
                          if (window.confirm(`¿Seguro que deseas eliminar al cliente ${c.nombres} ${c.apellidos || ''}?`)) {
                            try {
                              const token = localStorage.getItem("token");
                              const res = await fetch(`http://localhost:8099/api/clientes/${c.id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              if (!res.ok) throw new Error("Error al eliminar cliente");
                              alert("Cliente eliminado correctamente");
                              handleRefresh();
                            } catch (err: any) {
                              alert(err.message || "No se pudo eliminar el cliente");
                            }
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 relative">
      <ClienteModal
        open={modalOpen}
        onClose={handleCloseModal}
        cliente={clienteEditar}
        onSaved={() => {
          setModalOpen(false);
          setClienteEditar(null);
          handleRefresh();
        }}
      />
      
      {/* Encabezado y botón agregar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
        </div>
        <Button
          className="bg-blue-700 hover:bg-blue-800"
          onClick={handleAgregar}
        >
          + Agregar Cliente
        </Button>
      </div>
      
      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar cliente..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={regimenFilter} onValueChange={setRegimenFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Régimen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="NRUS">NRUS</SelectItem>
                <SelectItem value="RER">RER</SelectItem>
                <SelectItem value="RG">RG</SelectItem>
                <SelectItem value="RMT">RMT</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombres">Nombres</SelectItem>
                  <SelectItem value="rucDni">RUC/DNI</SelectItem>
                  <SelectItem value="regimen">Régimen</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title={sortOrder === "asc" ? "Ascendente" : "Descendente"}
              >
                <ArrowUpDown className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <span>Actualizar</span>
              </Button>
              <Button variant="outline" onClick={handleClearFilters} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                <span>Limpiar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {loading && !clientesNaturales.length && !clientesJuridicos.length ? (
        <div className="text-center py-8 text-gray-500">Cargando clientes...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <Tabs defaultValue="persona_natural" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="persona_natural">Personas Naturales</TabsTrigger>
            <TabsTrigger value="persona_juridica">Personas Jurídicas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="persona_natural" className="mt-0">
            {renderClienteTable(clientesNaturales, "PERSONA_NATURAL")}
          </TabsContent>
          
          <TabsContent value="persona_juridica" className="mt-0">
            {renderClienteTable(clientesJuridicos, "PERSONA_JURIDICA")}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ClientesTable;
