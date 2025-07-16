import React, { useEffect, useState } from "react";
import UsuarioModal from "./UsuarioModal";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Ajusta según tu UsuarioResponse.java
interface Usuario {
  id: number;
  username: string;
  nombres: string;
  apellidos: string;
  rol: string;
  estado: boolean;
  email?: string;
}

const UsuariosTable: React.FC = () => {
  const [usuariosAdministradores, setUsuariosAdministradores] = useState<Usuario[]>([]);
  const [usuariosClientesTrabajadores, setUsuariosClientesTrabajadores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [rolFilter, setRolFilter] = useState<string>("todos");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<string>("username");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [activeTab, setActiveTab] = useState("administradores");
  
  // Estados para paginación
  const [currentPageAdmins, setCurrentPageAdmins] = useState(1);
  const [currentPageClients, setCurrentPageClients] = useState(1);
  const itemsPerPage = 5;

  const fetchUsuarios = async (roles: string[]) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      
      // Construir URL con parámetros de filtro
      const params = new URLSearchParams();
      if (searchTerm) params.append("searchTerm", searchTerm);
      
      // Añadir roles como parámetros múltiples
      roles.forEach(rol => params.append("roles", rol));
      
      // Filtro de estado
      if (estadoFilter !== "todos") {
        params.append("estado", estadoFilter === "activo" ? "true" : "false");
      }
      
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);
      
      const response = await fetch(`http://localhost:8099/api/usuarios/search?${params}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error al obtener usuarios");
      const data = await response.json();
      
      // Actualizar el estado según el tipo de usuarios
      if (roles.includes("ADMINISTRADOR")) {
        setUsuariosAdministradores(data);
      } else {
        setUsuariosClientesTrabajadores(data);
      }
    } catch (err) {
      setError(`No se pudo cargar la lista de usuarios ${roles.join(", ")}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar con debounce
  const debouncedSearch = React.useCallback(
    debounce(() => {
      if (activeTab === "administradores") {
        fetchUsuarios(["ADMINISTRADOR"]);
      } else {
        fetchUsuarios(["CLIENTE", "CONTADOR"]);
      }
    }, 500),
    [searchTerm, rolFilter, estadoFilter, sortBy, sortOrder, activeTab]
  );

  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [searchTerm, rolFilter, estadoFilter, sortBy, sortOrder, activeTab, debouncedSearch]);

  useEffect(() => {
    // Cargar ambos tipos de usuarios al inicio
    fetchUsuarios(["ADMINISTRADOR"]);
    fetchUsuarios(["CLIENTE", "CONTADOR"]);
  }, []);

  const handleAgregar = () => {
    setUsuarioEditar(null);
    setModalOpen(true);
  };

  const handleEditar = (usuario: Usuario) => {
    setUsuarioEditar(usuario);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setUsuarioEditar(null);
    setModalOpen(false);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reiniciar la página actual al cambiar de pestaña
    if (value === "administradores") {
      setCurrentPageAdmins(1);
    } else {
      setCurrentPageClients(1);
    }
  };
  
  const handleRefresh = () => {
    // Reiniciar la paginación
    setCurrentPageAdmins(1);
    setCurrentPageClients(1);
    fetchUsuarios(["ADMINISTRADOR"]);
    fetchUsuarios(["CLIENTE", "CONTADOR"]);
  };
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setRolFilter("todos");
    setEstadoFilter("todos");
    setSortBy("username");
    setSortOrder("asc");
    setCurrentPageAdmins(1);
    setCurrentPageClients(1);
    fetchUsuarios(["ADMINISTRADOR"]);
    fetchUsuarios(["CLIENTE", "CONTADOR"]);
  };

  const renderUsuarioTable = (usuarios: Usuario[], showRolColumn: boolean = true, showNames: boolean = true) => {
    // Obtener la página actual según la pestaña activa
    const currentPage = activeTab === "administradores" ? currentPageAdmins : currentPageClients;
    
    // Calcular índices para paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    
    // Obtener los usuarios para la página actual
    const currentUsuarios = usuarios.slice(indexOfFirstItem, indexOfLastItem);
    
    // Calcular el número total de páginas
    const totalPages = Math.ceil(usuarios.length / itemsPerPage);
    
    // Función para cambiar de página
    const handlePageChange = (page: number) => {
      if (activeTab === "administradores") {
        setCurrentPageAdmins(page);
      } else {
        setCurrentPageClients(page);
      }
    };
    
    // Generar array de números de página para mostrar
    const getPageNumbers = () => {
      const pages = [];
      const maxPagesToShow = 5; // Mostrar máximo 5 números de página
      
      if (totalPages <= maxPagesToShow) {
        // Si hay menos páginas que el máximo a mostrar, mostrar todas
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Siempre mostrar la primera página
        pages.push(1);
        
        // Calcular el rango de páginas a mostrar alrededor de la página actual
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);
        
        // Ajustar si estamos cerca del inicio o fin
        if (currentPage <= 2) {
          endPage = 4;
        } else if (currentPage >= totalPages - 1) {
          startPage = totalPages - 3;
        }
        
        // Agregar elipsis si es necesario
        if (startPage > 2) {
          pages.push(-1); // -1 representa elipsis
        }
        
        // Agregar páginas intermedias
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
        
        // Agregar elipsis si es necesario
        if (endPage < totalPages - 1) {
          pages.push(-2); // -2 representa elipsis
        }
        
        // Siempre mostrar la última página
        pages.push(totalPages);
      }
      
      return pages;
    };
    
    return (
      <div className="overflow-x-auto">
        {usuarios.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay usuarios {activeTab === "administradores" ? "administradores" : "clientes/contadores"}
          </div>
        ) : (
          <>
            <Table className="border border-zinc-200 rounded-xl overflow-hidden">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-2 text-left font-semibold">Username</TableHead>
                  {showNames && (
                    <>
                      <TableHead className="px-4 py-2 text-left font-semibold">Nombres</TableHead>
                      <TableHead className="px-4 py-2 text-left font-semibold">Apellidos</TableHead>
                    </>
                  )}
                  {showRolColumn && (
                    <TableHead className="px-4 py-2 text-left font-semibold">Rol</TableHead>
                  )}
                  <TableHead className="px-4 py-2 text-left font-semibold">Estado</TableHead>
                  <TableHead className="px-4 py-2 text-center font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsuarios.map((u) => (
                  <TableRow key={u.id} className="border-b hover:bg-gray-50">
                    <TableCell className="px-4 py-2">
                      <div>
                        <span className="font-bold text-zinc-900">{u.username}</span>
                        {u.email && <div className="text-sm text-zinc-500">{u.email}</div>}
                      </div>
                    </TableCell>
                    {showNames && (
                      <>
                        <TableCell className="px-4 py-2">{u.nombres || "—"}</TableCell>
                        <TableCell className="px-4 py-2">{u.apellidos || "—"}</TableCell>
                      </>
                    )}
                    {showRolColumn && (
                      <TableCell className="px-4 py-2">
                        <Badge variant="secondary" className="text-gray-700 bg-gray-100 border border-gray-200">
                          {u.rol}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="px-4 py-2">
                      {u.estado ? (
                        <Badge variant="default" className="text-green-700 bg-green-100 border border-green-200">
                          Habilitado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 border-gray-200 bg-white">
                          Inhabilitado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          className="px-4"
                          onClick={() => handleEditar(u)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="default"
                          className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={async () => {
                            if (window.confirm(`¿Seguro que deseas eliminar al usuario ${u.username}?`)) {
                              try {
                                const token = localStorage.getItem("token");
                                const res = await fetch(`http://localhost:8099/api/usuarios/${u.id}`, {
                                  method: "DELETE",
                                  headers: { Authorization: `Bearer ${token}` },
                                });
                                if (!res.ok) throw new Error("Error al eliminar usuario");
                                alert("Usuario eliminado correctamente");
                                handleRefresh();
                              } catch (err: any) {
                                alert(err.message || "No se pudo eliminar el usuario");
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
            
            {/* Componente de paginación */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    {/* Botón Anterior */}
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {/* Números de página */}
                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === -1 || page === -2 ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink 
                            isActive={page === currentPage}
                            onClick={() => handlePageChange(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    {/* Botón Siguiente */}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 relative">
      <UsuarioModal
        open={modalOpen}
        onClose={handleCloseModal}
        usuario={usuarioEditar}
        onSaved={() => {
          setModalOpen(false);
          setUsuarioEditar(null);
          handleRefresh();
        }}
      />
      
      {/* Encabezado y botón agregar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
        </div>
        <Button
          className="bg-blue-700 hover:bg-blue-800"
          onClick={handleAgregar}
        >
          + Agregar Usuario
        </Button>
      </div>
      
      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar usuario..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {activeTab === "clientes_trabajadores" && (
              <div className="w-[150px]">
                <Select value={rolFilter} onValueChange={setRolFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los roles</SelectItem>
                    <SelectItem value="CLIENTE">Cliente</SelectItem>
                    <SelectItem value="CONTADOR">Contador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="w-[180px]">
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Habilitado</SelectItem>
                  <SelectItem value="inactivo">Inhabilitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 w-[180px]">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="username">Username</SelectItem>
                  <SelectItem value="nombres">Nombres</SelectItem>
                  {activeTab === "clientes_trabajadores" && (
                    <SelectItem value="rol">Rol</SelectItem>
                  )}
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
      
      {loading && !usuariosAdministradores.length && !usuariosClientesTrabajadores.length ? (
        <div className="text-center py-8 text-gray-500">Cargando usuarios...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <Tabs defaultValue="administradores" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="administradores">Administradores</TabsTrigger>
            <TabsTrigger value="clientes_trabajadores">Clientes y Contadores</TabsTrigger>
          </TabsList>
          
          <TabsContent value="administradores" className="mt-0">
            {renderUsuarioTable(usuariosAdministradores, false, true)}
          </TabsContent>
          
          <TabsContent value="clientes_trabajadores" className="mt-0">
            {renderUsuarioTable(usuariosClientesTrabajadores, true, false)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default UsuariosTable;
