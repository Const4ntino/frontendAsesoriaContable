import React, { useEffect, useState } from "react";
import ContadorModal from "./ContadorModal";
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
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpDown, RefreshCw, X } from "lucide-react";
import { debounce } from "lodash";

interface Contador {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  especialidad: string;
  nroColegiatura: string;
  usuario?: {
    id: number;
    username: string;
  }
}

const ContadoresTable: React.FC = () => {
  const [contadores, setContadores] = useState<Contador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [contadorEditar, setContadorEditar] = useState<Contador | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nombres");
  const [sortOrder, setSortOrder] = useState("asc");

  const fetchContadores = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      
      // Construir URL con parámetros de búsqueda
      let url = new URL("http://localhost:8099/api/v1/contadores/search");
      
      // Añadir parámetros si tienen valor
      if (searchTerm) url.searchParams.append("searchTerm", searchTerm);
      if (sortBy) url.searchParams.append("sortBy", sortBy);
      if (sortOrder) url.searchParams.append("sortOrder", sortOrder);
      
      const response = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al obtener contadores");
      const data = await response.json();
      setContadores(data);
    } catch (err) {
      setError("No se pudo cargar la lista de contadores");
    } finally {
      setLoading(false);
    }
  };
  
  // Función con debounce para la búsqueda
  const debouncedSearch = debounce(() => {
    fetchContadores();
  }, 500);
  
  // Efecto para actualizar la búsqueda cuando cambia el término
  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [searchTerm]);
  
  // Efecto para actualizar cuando cambian los criterios de ordenamiento
  useEffect(() => {
    fetchContadores();
  }, [sortBy, sortOrder]);

  useEffect(() => {
    // Carga inicial
    fetchContadores();
  }, []);
  
  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setSortBy("nombres");
    setSortOrder("asc");
    fetchContadores();
  };

  const handleAgregar = () => {
    setContadorEditar(null);
    setModalOpen(true);
  };

  const handleEditar = (contador: Contador) => {
    setContadorEditar(contador);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setContadorEditar(null);
    setModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 relative">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          Gestión de Contadores
        </h1>
        <p className="text-zinc-500 mt-1">
          Administra los contadores registrados en el sistema
        </p>
      </div>
      <ContadorModal
        open={modalOpen}
        onClose={handleCloseModal}
        contador={contadorEditar}
        onSaved={() => {
          setModalOpen(false);
          setContadorEditar(null);
          fetchContadores();
        }}
      />
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar contador..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-[180px]">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombres">Nombres</SelectItem>
                  <SelectItem value="apellidos">Apellidos</SelectItem>
                  <SelectItem value="especialidad">Especialidad</SelectItem>
                  <SelectItem value="nroColegiatura">N° Colegiatura</SelectItem>
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
              <Button variant="outline" onClick={fetchContadores} className="flex items-center gap-2">
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
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <div className="flex-1"></div>
        <Button
          variant="default"
          className="bg-blue-700 hover:bg-blue-800 text-white"
          onClick={handleAgregar}
        >
          + Agregar Contador
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando contadores...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="border border-zinc-200 rounded-xl overflow-hidden">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2 text-left font-semibold">ID</TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold">Datos Personales</TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold">DNI</TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold">Teléfono</TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold">Especialidad</TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold">N° Colegiatura</TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold">Usuario</TableHead>
                <TableHead className="px-4 py-2 text-center font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contadores.map((c) => (
                <TableRow key={c.id} className="border-b hover:bg-gray-50">
                  <TableCell className="px-4 py-2">{c.id}</TableCell>
                  <TableCell className="px-4 py-2">
                    <div>
                      <span className="font-bold text-zinc-900">{c.nombres} {c.apellidos}</span>
                      <div className="text-sm text-zinc-500">{c.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">{c.dni}</TableCell>
                  <TableCell className="px-4 py-2">{c.telefono}</TableCell>
                  <TableCell className="px-4 py-2">{c.especialidad || "—"}</TableCell>
                  <TableCell className="px-4 py-2">{c.nroColegiatura || "—"}</TableCell>
                  <TableCell className="px-4 py-2">{c.usuario?.username ? <Badge variant="secondary" className="text-gray-700 bg-gray-100 border border-gray-200">{c.usuario.username}</Badge> : "—"}</TableCell>
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
                          if (window.confirm(`¿Seguro que deseas eliminar al contador ${c.nombres} ${c.apellidos}?`)) {
                            try {
                              const token = localStorage.getItem("token");
                              const res = await fetch(`http://localhost:8099/api/contadores/${c.id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              if (!res.ok) throw new Error("Error al eliminar contador");
                              alert("Contador eliminado correctamente");
                              fetchContadores();
                            } catch (err: any) {
                              alert(err.message || "No se pudo eliminar el contador");
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
        </div>
      )}
    </div>
  );
};

export default ContadoresTable;
