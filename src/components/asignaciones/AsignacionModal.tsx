import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Search, User, Phone, Mail, Briefcase, FileText, Users, UserMinus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Interfaces
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
  idContador: number | null;
}

interface AsignacionModalProps {
  open: boolean;
  onClose: () => void;
  contador: ContadorResponse | null;
  onAsignar?: (clienteId: number, contadorId: number) => Promise<void>;
  onDesasignar?: (clienteId: number) => Promise<void>;
  mode: 'asignar' | 'desasignar';
}

const AsignacionModal: React.FC<AsignacionModalProps> = ({
  open,
  onClose,
  contador,
  onAsignar,
  onDesasignar,
  mode,
}) => {
  const [tipoCliente, setTipoCliente] = useState<string>("PERSONA_NATURAL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [clientes, setClientes] = useState<ClienteResponse[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [clientesContador, setClientesContador] = useState<ClienteResponse[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);

  // Resetear estados cuando se abre/cierra el modal
  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setClientes([]);
      setSelectedCliente(null);
      setSelectedClienteId(null);
      setClientesContador([]);
      setError("");
      
      // Si estamos en modo desasignar y tenemos un contador, cargar sus clientes
      if (mode === 'desasignar' && contador) {
        fetchClientesContador(contador.id);
      }
    }
  }, [open, mode, contador]);
  
  // Función para obtener los clientes asignados a un contador
  const fetchClientesContador = async (contadorId: number) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const response = await fetch(
        `http://localhost:8099/api/clientes/contador/${contadorId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener clientes del contador");
      }

      const data = await response.json();
      setClientesContador(data);
    } catch (err: any) {
      setError(err.message || "Error al obtener clientes del contador");
      console.error("Error al obtener clientes del contador:", err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    if (!open || searchTerm.length < 2) {
      setClientes([]);
      return;
    }

    const searchClientes = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No se encontró token de autenticación");
        }

        const response = await fetch(
          `http://localhost:8099/api/clientes/search?searchTerm=${encodeURIComponent(searchTerm)}&tipoCliente=${tipoCliente}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al buscar clientes");
        }

        const data = await response.json();
        setClientes(data);
      } catch (err: any) {
        setError(err.message || "Error al buscar clientes");
        console.error("Error al buscar clientes:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchClientes();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, tipoCliente, open]);

  const handleSelectCliente = (cliente: ClienteResponse) => {
    setSelectedCliente(cliente);
  };

  const handleAsignar = async () => {
    if (!contador || !selectedCliente) return;
    
    setLoading(true);
    setError("");
    try {
      if (onAsignar) {
        await onAsignar(selectedCliente.id, contador.id);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al asignar cliente");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDesasignar = async () => {
    if (!contador || !selectedClienteId) return;
    
    setLoading(true);
    setError("");
    try {
      if (onDesasignar) {
        await onDesasignar(selectedClienteId);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al desasignar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            {mode === 'asignar' ? 'Asignar Cliente a Contador' : 'Desasignar Cliente de Contador'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row h-[500px]">
          {/* Panel izquierdo - Detalles del contador */}
          <div className="w-full md:w-1/3 p-6 overflow-y-auto">
            {contador ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {contador.nombres} {contador.apellidos}
                  </h3>
                  <Badge variant="outline" className="bg-blue-50 flex items-center gap-1 w-fit">
                    <Users className="h-3 w-3" />
                    {contador.numeroClientes} clientes
                  </Badge>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">DNI:</span>
                    <span>{contador.dni}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Teléfono:</span>
                    <span>{contador.telefono}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="break-all">{contador.email}</span>
                  </div>
                  
                  {contador.especialidad && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Especialidad:</span>
                      <span>{contador.especialidad}</span>
                    </div>
                  )}
                  
                  {contador.nroColegiatura && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">N° Colegiatura:</span>
                      <span>{contador.nroColegiatura}</span>
                    </div>
                  )}
                </div>
                
                {contador.usuario && (
                  <div className="pt-2">
                    <Badge variant="outline" className="flex items-center gap-1 py-1 px-2 bg-zinc-50">
                      <User className="h-3 w-3" />
                      <span>{contador.usuario.username}</span>
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <div className="space-y-3 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            )}
          </div>
          
          {/* Separador vertical */}
          <Separator orientation="vertical" className="hidden md:block" />
          <Separator orientation="horizontal" className="block md:hidden my-2" />
          
          {/* Panel derecho - Búsqueda y selección de cliente */}
          <div className="w-full md:w-2/3 p-6 flex flex-col">
            {mode === 'asignar' ? (
              <div className="space-y-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-1/3">
                    <Select
                      value={tipoCliente}
                      onValueChange={setTipoCliente}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de Cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERSONA_NATURAL">Persona Natural</SelectItem>
                        <SelectItem value="PERSONA_JURIDICA">Persona Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="relative w-full sm:w-2/3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={
                        tipoCliente === "PERSONA_NATURAL"
                          ? "Buscar por nombres, apellidos o DNI..."
                          : "Buscar por razón social o RUC..."
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <UserMinus className="h-5 w-5 text-primary" />
                  Clientes asignados a este contador
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Seleccione el cliente que desea desasignar de este contador.
                </p>
              </div>
            )}
            
            <div className="flex-grow overflow-y-auto">
              {mode === 'asignar' ? (
                <>
                  {loading && !selectedCliente && (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  )}
                  
                  {!loading && searchTerm.length >= 2 && clientes.length === 0 && !selectedCliente && (
                    <div className="text-center py-8 text-muted-foreground">
                      No se encontraron clientes con ese criterio de búsqueda
                    </div>
                  )}
                  
                  {!loading && clientes.length > 0 && !selectedCliente && (
                    <div className="space-y-2">
                      {clientes.map((cliente) => (
                        <Card
                          key={cliente.id}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleSelectCliente(cliente)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">
                                  {cliente.tipoCliente === "PERSONA_JURIDICA"
                                    ? cliente.nombres
                                    : `${cliente.nombres} ${cliente.apellidos}`}
                                </h4>
                                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                  <span>
                                    {cliente.tipoCliente === "PERSONA_JURIDICA" ? "RUC: " : "DNI: "}
                                    {cliente.rucDni}
                                  </span>
                                  {cliente.tipoCliente === "PERSONA_JURIDICA" && cliente.tipoRuc && (
                                    <Badge variant="outline" className="text-xs py-0">
                                      Tipo: {cliente.tipoRuc}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge>{cliente.regimen}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {loading && (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  )}
                  
                  {!loading && clientesContador.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Este contador no tiene clientes asignados
                    </div>
                  )}
                  
                  {!loading && clientesContador.length > 0 && (
                    <div className="space-y-2">
                      {clientesContador.map((cliente) => (
                        <div 
                          key={cliente.id} 
                          className={`border rounded-lg p-4 ${selectedClienteId === cliente.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'} transition-colors`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              id={`cliente-${cliente.id}`} 
                              checked={selectedClienteId === cliente.id}
                              onCheckedChange={() => {
                                if (selectedClienteId === cliente.id) {
                                  setSelectedClienteId(null);
                                } else {
                                  setSelectedClienteId(cliente.id);
                                }
                              }}
                            />
                            <div className="flex-1">
                              <label 
                                htmlFor={`cliente-${cliente.id}`} 
                                className="flex justify-between items-start cursor-pointer"
                              >
                                <div>
                                  <h4 className="font-medium">
                                    {cliente.tipoCliente === "PERSONA_JURIDICA"
                                      ? cliente.nombres
                                      : `${cliente.nombres} ${cliente.apellidos}`}
                                  </h4>
                                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <span>
                                      {cliente.tipoCliente === "PERSONA_JURIDICA" ? "RUC: " : "DNI: "}
                                      {cliente.rucDni}
                                    </span>
                                    {cliente.tipoCliente === "PERSONA_JURIDICA" && cliente.tipoRuc && (
                                      <Badge variant="outline" className="text-xs py-0">
                                        Tipo: {cliente.tipoRuc}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Badge>{cliente.regimen}</Badge>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              {selectedCliente && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedCliente.tipoCliente === "PERSONA_JURIDICA"
                          ? selectedCliente.nombres
                          : `${selectedCliente.nombres} ${selectedCliente.apellidos}`}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {selectedCliente.tipoCliente === "PERSONA_JURIDICA" ? "RUC: " : "DNI: "}
                          {selectedCliente.rucDni}
                        </Badge>
                        <Badge>{selectedCliente.regimen}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCliente(null)}
                    >
                      Cambiar
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {selectedCliente.tipoCliente === "PERSONA_JURIDICA" && selectedCliente.tipoRuc && (
                      <div>
                        <span className="text-muted-foreground">Tipo RUC:</span>
                        <span className="ml-2">{selectedCliente.tipoRuc}</span>
                      </div>
                    )}
                    
                    {selectedCliente.email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2">{selectedCliente.email}</span>
                      </div>
                    )}
                    
                    {selectedCliente.telefono && (
                      <div>
                        <span className="text-muted-foreground">Teléfono:</span>
                        <span className="ml-2">{selectedCliente.telefono}</span>
                      </div>
                    )}
                    
                    {selectedCliente.idContador && (
                      <div className="col-span-2">
                        <Badge variant="destructive">
                          Este cliente ya tiene un contador asignado
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          {mode === 'asignar' ? (
            <Button 
              onClick={handleAsignar} 
              disabled={loading || !selectedCliente}
            >
              {loading ? "Asignando..." : "Asignar Cliente"}
            </Button>
          ) : (
            <Button 
              onClick={handleDesasignar} 
              disabled={loading || !selectedClienteId}
              variant="destructive"
            >
              {loading ? "Desasignando..." : "Confirmar Desasignación"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AsignacionModal;
