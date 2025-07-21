import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface Contador {
  id?: number;
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
  } | null
}

interface ContadorModalProps {
  open: boolean;
  onClose: () => void;
  contador?: Contador | null;
  onSaved?: () => void;
}

const ContadorModal: React.FC<ContadorModalProps> = ({ open, onClose, contador, onSaved }) => {
  const [form, setForm] = useState<Contador>({
    nombres: "",
    apellidos: "",
    dni: "",
    email: "",
    telefono: "",
    especialidad: "",
    nroColegiatura: "",
    usuario: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usuariosLibres, setUsuariosLibres] = useState<any[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const isEdit = !!contador;

  useEffect(() => {
    if (contador) {
      setForm({ ...contador });
      if (contador.usuario) {
        setBusquedaUsuario(contador.usuario.username);
      } else {
        setBusquedaUsuario("");
      }
    } else {
      setForm({
        nombres: "",
        apellidos: "",
        dni: "",
        email: "",
        telefono: "",
        especialidad: "",
        nroColegiatura: "",
        usuario: null,
      });
      setBusquedaUsuario("");
    }
    setError("");
  }, [contador, open]);

  useEffect(() => {
    if (!open || busquedaUsuario.length < 2) return;
    const fetchUsuariosLibres = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8099/api/usuarios/contadores-libres?username=${busquedaUsuario}`,
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
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // La selección de usuario se maneja directamente en el onClick del elemento

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const body: any = {
        nombres: form.nombres,
        apellidos: form.apellidos,
        dni: form.dni,
        email: form.email,
        telefono: form.telefono,
        especialidad: form.especialidad,
        nroColegiatura: form.nroColegiatura,
        idUsuario: form.usuario?.id ?? null,
      };

      let url = "http://localhost:8099/api/v1/contadores";
      let method: "POST" | "PUT" = "POST";
      if (isEdit && contador && contador.id) {
        url += `/${contador.id}`;
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
      if (!response.ok) throw new Error("Error al guardar contador");
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
          <DialogTitle>{isEdit ? "Editar Contador" : "Agregar Contador"}</DialogTitle>
        </DialogHeader>
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="nombres">Nombres *</Label>
            <Input
              id="nombres"
              name="nombres"
              value={form.nombres}
              onChange={handleChange}
              maxLength={50}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apellidos">Apellidos *</Label>
            <Input
              id="apellidos"
              name="apellidos"
              value={form.apellidos}
              onChange={handleChange}
              maxLength={50}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dni">DNI *</Label>
            <Input
              id="dni"
              name="dni"
              value={form.dni}
              onChange={handleChange}
              maxLength={8}
              minLength={8}
              pattern="[0-9]*"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input
              id="telefono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              maxLength={9}
              minLength={9}
              pattern="[0-9]*"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="especialidad">Especialidad</Label>
            <Input
              id="especialidad"
              name="especialidad"
              value={form.especialidad}
              onChange={handleChange}
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nroColegiatura">N° Colegiatura</Label>
            <Input
              id="nroColegiatura"
              name="nroColegiatura"
              value={form.nroColegiatura}
              onChange={handleChange}
              maxLength={50}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="usuario">Usuario Relacionado *</Label>
            <div className="relative">
              <Input
                id="usuario"
                placeholder="Buscar usuario..."
                value={busquedaUsuario}
                onChange={e => {
                  const value = e.target.value;
                  setBusquedaUsuario(value);
                  if (value === "") {
                    setForm(prev => ({ ...prev, usuario: null }));
                  }
                }}
                className="mb-1"
              />
              {busquedaUsuario.length >= 2 && busquedaUsuario !== (form.usuario?.username || "") && (
                <ScrollArea className="absolute z-50 bg-white border rounded-md shadow w-full mt-1" style={{ maxHeight: "160px" }}>
                  {usuariosLibres.length === 0 && 
                    <div className="text-zinc-400 text-sm px-3 py-2">No hay usuarios disponibles</div>
                  }
                  {usuariosLibres.map(u => (
                    <div
                      key={u.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-zinc-100 ${form.usuario?.id === u.id ? "bg-zinc-200 font-medium" : ""}`}
                      onClick={() => {
                        setForm(prev => ({ ...prev, usuario: u }));
                        setBusquedaUsuario("");
                      }}
                    >
                      {u.username}
                    </div>
                  ))}
                </ScrollArea>
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
          </div>
          {error && <div className="col-span-2 text-red-600 text-sm text-center">{error}</div>}
          <DialogFooter className="sm:justify-end col-span-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
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

export default ContadorModal;
