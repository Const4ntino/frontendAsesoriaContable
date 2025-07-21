import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Eye, FileText, Search, Users } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../ui/pagination";
import ClienteDetallesDialog from "./ClienteDetallesDialog";

// Interfaces para los tipos de datos
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

interface ClienteResponse {
  id: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
  email: string;
  telefono: string;
  tipoRuc: string;
  regimen: string;
  tipoCliente: string;
  usuario: UsuarioResponse | null;
  contador: ContadorResponse | null;
}

interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

const RevisionTable: React.FC = () => {
  // Estados para contadores
  const [contadores, setContadores] = useState<PageResponse<ContadorResponse> | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortDir, setSortDir] = useState<string>("ASC");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Estados para clientes
  const [clientes, setClientes] = useState<ClienteResponse[]>([]);
  const [selectedContador, setSelectedContador] = useState<ContadorResponse | null>(null);
  const [clientesLoading, setClientesLoading] = useState<boolean>(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteResponse | null>(null);
  const [isDetallesDialogOpen, setIsDetallesDialogOpen] = useState<boolean>(false);

  // Efecto para cargar contadores al inicio y cuando cambien los parámetros
  useEffect(() => {
    fetchContadores();
  }, [currentPage, pageSize, sortBy, sortDir]);

  // Función para obtener los contadores con clientes
  const fetchContadores = async () => {
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

      // Construir la URL con los parámetros de paginación y búsqueda
      let url = `http://localhost:8099/api/v1/contadores/con-clientes?`;
      url += `page=${currentPage}&size=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error("Error al obtener contadores con clientes");
      }

      const data = await response.json();
      setContadores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error fetching contadores:", err);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener los clientes de un contador
  const fetchClientesByContador = async (contadorId: number) => {
    setClientesLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`http://localhost:8099/api/clientes/contador/${contadorId}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Error al obtener clientes del contador");
      }

      const data = await response.json();
      setClientes(data);
    } catch (err) {
      console.error("Error fetching clientes:", err);
      setClientes([]);
    } finally {
      setClientesLoading(false);
    }
  };

  // Función para manejar la búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0); // Resetear a la primera página
    fetchContadores();
  };

  // Función para manejar el cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Función para manejar el cambio de tamaño de página
  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size));
    setCurrentPage(0); // Resetear a la primera página
  };

  // Función para manejar el cambio de ordenamiento
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Si ya estamos ordenando por este campo, cambiar la dirección
      setSortDir(sortDir === "ASC" ? "DESC" : "ASC");
    } else {
      // Si es un nuevo campo, establecerlo y ordenar ascendentemente
      setSortBy(field);
      setSortDir("ASC");
    }
    setCurrentPage(0); // Resetear a la primera página
  };

  // Función para ver los clientes de un contador
  const handleVerClientes = (contador: ContadorResponse) => {
    setSelectedContador(contador);
    fetchClientesByContador(contador.id);
  };

  // Función para renderizar los indicadores de paginación
  const renderPagination = () => {
    if (!contadores || contadores.totalPages <= 1) return null;

    const pages = [];
    const maxPages = 5; // Número máximo de páginas a mostrar
    const totalPages = contadores.totalPages;
    const currentPageNumber = contadores.pageable.pageNumber;

    let startPage = Math.max(0, currentPageNumber - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(0, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={i === currentPageNumber}
            onClick={() => handlePageChange(i)}
          >
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPageNumber > 0 && handlePageChange(Math.max(0, currentPageNumber - 1))}
              className={currentPageNumber === 0 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {pages}
          <PaginationItem>
            <PaginationNext
              onClick={() => currentPageNumber < totalPages - 1 && handlePageChange(Math.min(totalPages - 1, currentPageNumber + 1))}
              className={currentPageNumber === totalPages - 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Función para mostrar el estado de carga
  const renderLoading = () => (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Cargando...</span>
        </div>
      </TableCell>
    </TableRow>
  );

  // Función para mostrar mensaje de error
  const renderError = () => (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8 text-red-500">
        Error: {error}
      </TableCell>
    </TableRow>
  );

  // Función para mostrar mensaje de no hay datos
  const renderNoData = () => (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
        No se encontraron contadores con clientes asignados
      </TableCell>
    </TableRow>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Tabla de Contadores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contadores con Clientes
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar por nombre, apellido o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="10 por página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 por página</SelectItem>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="w-[30%] cursor-pointer"
                    onClick={() => handleSortChange("nombres")}
                  >
                    Nombre
                    {sortBy === "nombres" && (
                      <span className="ml-1">{sortDir === "ASC" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="w-[15%] cursor-pointer"
                    onClick={() => handleSortChange("dni")}
                  >
                    DNI
                    {sortBy === "dni" && (
                      <span className="ml-1">{sortDir === "ASC" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead className="w-[20%]">Contacto</TableHead>
                  <TableHead 
                    className="w-[15%] cursor-pointer"
                    onClick={() => handleSortChange("numeroClientes")}
                  >
                    Clientes
                    {sortBy === "numeroClientes" && (
                      <span className="ml-1">{sortDir === "ASC" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead className="w-[20%] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  renderLoading()
                ) : error ? (
                  renderError()
                ) : contadores && contadores.content.length > 0 ? (
                  contadores.content.map((contador) => (
                    <TableRow key={contador.id}>
                      <TableCell className="font-medium">
                        <div>
                          <span className="font-bold text-zinc-900">
                            {contador.nombres} {contador.apellidos}
                          </span>
                          <div className="text-sm text-zinc-500">{contador.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{contador.dni}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{contador.telefono}</div>
                          <div className="text-zinc-500">{contador.especialidad}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`flex items-center gap-1 ${
                            contador.numeroClientes >= 7 
                              ? 'bg-red-50 text-red-600' 
                              : contador.numeroClientes > 0 
                                ? 'bg-blue-50 text-blue-600' 
                                : ''
                          }`}
                        >
                          <Users className="h-3 w-3" />
                          {contador.numeroClientes}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerClientes(contador)}
                          className="flex items-center gap-1"
                          disabled={contador.numeroClientes === 0}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver Clientes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  renderNoData()
                )}
              </TableBody>
            </Table>
          </div>
          {renderPagination()}
        </CardContent>
      </Card>

      {/* Tabla de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {selectedContador 
              ? `Clientes de ${selectedContador.nombres} ${selectedContador.apellidos}` 
              : "Clientes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Nombre</TableHead>
                  <TableHead className="w-[15%]">RUC/DNI</TableHead>
                  <TableHead className="w-[15%]">Tipo</TableHead>
                  <TableHead className="w-[15%]">Régimen</TableHead>
                  <TableHead className="w-[15%]">Contacto</TableHead>
                  <TableHead className="w-[15%]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Cargando clientes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : selectedContador ? (
                  clientes.length > 0 ? (
                    clientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">
                          <div>
                            <span className="font-bold text-zinc-900">
                              {cliente.nombres} {cliente.apellidos}
                            </span>
                            <div className="text-sm text-zinc-500">{cliente.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{cliente.rucDni}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-zinc-100">
                            {cliente.tipoCliente}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              cliente.regimen === "MYPE" 
                                ? "bg-green-50 text-green-600" 
                                : cliente.regimen === "ESPECIAL" 
                                  ? "bg-purple-50 text-purple-600" 
                                  : "bg-blue-50 text-blue-600"
                            }
                          >
                            {cliente.regimen}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{cliente.telefono}</div>
                            <div className="text-zinc-500">{cliente.tipoRuc}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => {
                              setSelectedCliente(cliente);
                              setIsDetallesDialogOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No se encontraron clientes para este contador
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Seleccione un contador para ver sus clientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de detalles del cliente */}
      <ClienteDetallesDialog
        isOpen={isDetallesDialogOpen}
        onClose={() => setIsDetallesDialogOpen(false)}
        cliente={selectedCliente}
      />
    </div>
  );
};

export default RevisionTable;
