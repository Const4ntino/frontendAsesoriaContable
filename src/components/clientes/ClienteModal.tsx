import React, { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Cliente {
  id?: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
  email: string;
  telefono: string;
  tipoRuc: string;
  regimen: string;
  tipoCliente: string;
  usuario?: {
    id: number;
    username: string;
  } | null
  idContador: number | null;
}

interface ClienteModalProps {
  open: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
  onSaved?: () => void;
}

const ClienteModal: React.FC<ClienteModalProps> = ({ open, onClose, cliente, onSaved }) => {
  const [form, setForm] = useState<Cliente>({
    nombres: "",
    apellidos: "",
    rucDni: "",
    email: "",
    telefono: "",
    tipoRuc: "10",
    regimen: "NRUS",
    tipoCliente: "PERSONA_NATURAL",
    usuario: null,
    idContador: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usuariosLibres, setUsuariosLibres] = useState<any[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const isEdit = !!cliente;

  useEffect(() => {
    if (cliente) {
      setForm({ ...cliente });
      // Si hay usuario asignado, muestra su username en el input de búsqueda
      if (cliente.usuario) {
        setBusquedaUsuario(cliente.usuario.username); // ✅ Esto sí
      } else {
        setBusquedaUsuario("");
      }
    } else {
      setForm({
        nombres: "",
        apellidos: "",
        rucDni: "",
        email: "",
        telefono: "",
        tipoRuc: "10",
        regimen: "NRUS",
        tipoCliente: "PERSONA_NATURAL",
        usuario: null,
        idContador: null,
      });
      setBusquedaUsuario("");
    }
    setError("");
  }, [cliente, open]);

  useEffect(() => {
    // Buscar usuarios libres solo si el modal está abierto
    if (!open) return;
    const fetchUsuariosLibres = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8099/api/usuarios/clientes-libres?username=${busquedaUsuario}`,
          { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          setUsuariosLibres(data);
        } else {
          setUsuariosLibres([]);
        }
      } catch {
        setUsuariosLibres([]);
      }
    };
    fetchUsuariosLibres();
  }, [busquedaUsuario, open]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validación para RUC/DNI: solo permitir números
    if (name === "rucDni") {
      // Solo permitir números
      const numericValue = value.replace(/[^0-9]/g, "");
      
      // Para RUC (si es persona jurídica), validar que empiece con 10 o 20
      if (form.tipoCliente === "PERSONA_JURIDICA") {
        if (numericValue.length > 0) {
          // Si el primer dígito no es 1 o 2, no permitir la entrada
          if (numericValue.length === 1 && numericValue !== "1" && numericValue !== "2") {
            return;
          }
          // Si los dos primeros dígitos no son 10 o 20, no permitir la entrada
          if (numericValue.length >= 2 && 
              numericValue.substring(0, 2) !== "10" && 
              numericValue.substring(0, 2) !== "20") {
            return;
          }
        }
      }
      
      setForm(prev => ({ ...prev, [name]: numericValue }));
      return;
    }
    
    // Validación para teléfono: solo permitir números
    if (name === "telefono") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setForm(prev => ({ ...prev, [name]: numericValue }));
      return;
    }
    
    // Para otros campos, comportamiento normal
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTipoClienteChange = (value: string) => {
    if (value === "PERSONA_NATURAL") {
      setForm(prev => ({
        ...prev,
        tipoCliente: value,
        regimen: "NRUS",
        tipoRuc: "10",
        rucDni: "", // Limpiar el campo RUC/DNI al cambiar el tipo
      }));
    } else {
      setForm(prev => ({
        ...prev,
        tipoCliente: value,
        regimen: "RER",
        tipoRuc: "10",
        apellidos: "", // Limpiar apellidos para persona jurídica
        rucDni: "", // Limpiar el campo RUC/DNI al cambiar el tipo
      }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const body: any = {
        nombres: form.nombres,
        apellidos: form.apellidos,
        rucDni: form.rucDni,
        email: form.email,
        telefono: form.telefono,
        tipoRuc: form.tipoRuc,
        regimen: form.regimen,
        tipoCliente: form.tipoCliente,
        idUsuario: form.usuario?.id ?? null,
        idContador: form.idContador,
      };
      let url = "http://localhost:8099/api/clientes";
      let method: "POST" | "PUT" = "POST";
      if (isEdit && cliente && cliente.id) {
        url += `/${cliente.id}`;
        method = "PUT";
      }
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Error al guardar cliente");
      if (typeof onSaved === "function") onSaved();
      if (typeof onClose === "function") onClose();
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cliente" : "Agregar Cliente"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifica los datos del cliente" : "Completa el formulario para agregar un nuevo cliente"}
          </DialogDescription>
        </DialogHeader>
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className={form.tipoCliente === "PERSONA_JURIDICA" ? "col-span-2" : ""}>  
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.tipoCliente === "PERSONA_NATURAL" ? "Nombres *" : "Razón Social *"}
            </label>
            <Input
              type="text"
              name="nombres"
              value={form.nombres}
              onChange={handleChange}
              className="w-full"
              maxLength={50}
              required
            />
          </div>
          {form.tipoCliente === "PERSONA_NATURAL" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
              <Input
                type="text"
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
                className="w-full"
                maxLength={50}
                required
              />
            </div>
          )}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente *</label>
            <Select
              value={form.tipoCliente}
              onValueChange={handleTipoClienteChange}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERSONA_NATURAL">Persona Natural</SelectItem>
                <SelectItem value="PERSONA_JURIDICA">Persona Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.tipoCliente === "PERSONA_NATURAL" ? "DNI *" : "RUC *"}
            </label>
            <Input
              type="text"
              name="rucDni"
              value={form.rucDni}
              onChange={handleChange}
              className="w-full"
              minLength={form.tipoCliente === "PERSONA_NATURAL" ? 8 : 11}
              maxLength={form.tipoCliente === "PERSONA_NATURAL" ? 8 : 11}
              pattern="[0-9]*"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
            <Input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="w-full"
              maxLength={9}
              required
            />
          </div>
          {form.tipoCliente === "PERSONA_JURIDICA" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo RUC</label>
              <Select
                value={form.tipoRuc}
                onValueChange={value => setForm(prev => ({ ...prev, tipoRuc: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Régimen *</label>
            {form.tipoCliente === "PERSONA_NATURAL" ? (
              <Select
                value="NRUS"
                disabled={true}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue>NRUS</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NRUS">NRUS</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={form.regimen}
                onValueChange={value => setForm(prev => ({ ...prev, regimen: value }))}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RER">RER</SelectItem>
                  <SelectItem value="RMT">RMT</SelectItem>
                  <SelectItem value="RG">RG</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="col-span-2 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario Relacionado *</label>

            <Input
              type="text"
              placeholder="Buscar usuario..."
              value={busquedaUsuario}
              onChange={e => {
                const value = e.target.value;
                setBusquedaUsuario(value);
                if (value === "") {
                  setForm(prev => ({ ...prev, usuario: null }));
                }
              }}
              className="w-full mb-2"
            />

            {busquedaUsuario.length >= 2 && busquedaUsuario !== (form.usuario?.username || "") && (
              <div className="absolute z-50 bg-white border rounded-md shadow max-h-40 overflow-y-auto w-full mt-1">
                {usuariosLibres.length === 0 && (
                  <div className="text-gray-400 text-sm px-3 py-2">
                    No hay usuarios disponibles
                  </div>
                )}
                {usuariosLibres.map(u => (
                  <div
                    key={u.id}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${form.usuario?.id === u.id ? "bg-blue-200 font-bold" : ""}`}
                    onClick={() => {
                      setForm(prev => ({ ...prev, usuario: u }));
                      setBusquedaUsuario(""); // Cierra la lista flotante
                    }}
                  >
                    {u.username}
                  </div>
                ))}
              </div>
            )}

            {form.usuario?.username && busquedaUsuario === "" && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1 py-1 px-2 bg-zinc-50">
                  <User className="h-3 w-3" />
                  <span>{form.usuario.username}</span>
                </Badge>
              </div>
            )}
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? "Guardando..." : isEdit ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteModal;
