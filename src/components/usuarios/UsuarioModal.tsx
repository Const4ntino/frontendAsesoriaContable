import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Usuario {
  id?: number;
  username: string;
  password?: string;
  nombres?: string;
  apellidos?: string;
  rol: string;
  estado: boolean;
}

interface UsuarioModalProps {
  open: boolean;
  usuario?: Usuario | null;
  onSaved?: () => void;
  onClose: () => void;
}

const roles = ["ADMINISTRADOR", "CONTADOR", "CLIENTE"];

const UsuarioModal: React.FC<UsuarioModalProps> = ({ open, onClose, usuario, onSaved }) => {
  const [form, setForm] = useState<Usuario>({
    username: "",
    password: "",
    nombres: "",
    apellidos: "",
    rol: "",
    estado: true,
  });
  const [showNames, setShowNames] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!usuario;

  useEffect(() => {
    if (usuario) {
      setForm({
        username: usuario.username || "",
        password: "",
        nombres: usuario.nombres || "",
        apellidos: usuario.apellidos || "",
        rol: usuario.rol || "",
        estado: usuario.estado ?? true,
      });
      setShowNames(usuario.rol === "ADMINISTRADOR");
    } else {
      setForm({ username: "", password: "", nombres: "", apellidos: "", rol: "", estado: true });
      setShowNames(false);
    }
    setError("");
  }, [usuario, open]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === "rol") {
      setShowNames(value === "ADMINISTRADOR");
      if (value !== "ADMINISTRADOR") {
        setForm(prev => ({
          ...prev,
          [name]: value,
          nombres: "",
          apellidos: "",
        }));
        return;
      }
    }
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked :
        name === "estado" ? value === "true" : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validación de longitud de contraseña solo en edición y si hay valor
    if (isEdit && form.password && form.password.length > 0 && form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const body: any = {
        username: form.username,
        nombres: form.nombres,
        apellidos: form.apellidos,
        rol: form.rol,
        estado: form.estado,
        password: form.password ?? ""
      };

      let url = "http://localhost:8099/api/usuarios";
      let method: "POST" | "PUT" = "POST";
      if (isEdit && usuario && usuario.id) {
        url += `/${usuario.id}`;
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
      if (!response.ok) throw new Error("Error al guardar usuario");
      if (typeof onSaved === "function") onSaved();
      if (typeof onClose === "function") onClose();
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };


  const handleSelectChange = (name: string, value: string) => {
    if (name === "rol") {
      setShowNames(value === "ADMINISTRADOR");
      if (value !== "ADMINISTRADOR") {
        setForm(prev => ({
          ...prev,
          [name]: value,
          nombres: "",
          apellidos: "",
        }));
        return;
      }
    }
    
    if (name === "estado") {
      setForm(prev => ({
        ...prev,
        [name]: value === "true"
      }));
      return;
    }
    
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Usuario" : "Agregar Usuario"}</DialogTitle>
          <DialogDescription>
            Complete los datos del usuario. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                maxLength={100}
                required
                disabled={isEdit}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña {isEdit ? "(dejar vacío para no cambiar)" : "*"}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                minLength={isEdit ? undefined : 6}
                maxLength={72}
                required={!isEdit}
                autoComplete="new-password"
              />
            </div>
            
            {showNames && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="nombres">Nombres</Label>
                  <Input
                    id="nombres"
                    name="nombres"
                    value={form.nombres}
                    onChange={handleChange}
                    maxLength={50}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="apellidos">Apellidos</Label>
                  <Input
                    id="apellidos"
                    name="apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                    maxLength={50}
                  />
                </div>
              </>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="rol">Rol *</Label>
              <Select 
                name="rol" 
                value={form.rol} 
                onValueChange={(value) => handleSelectChange("rol", value)}
                required
              >
                <SelectTrigger id="rol">
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="estado">Estado</Label>
              <Select 
                name="estado" 
                value={form.estado ? "true" : "false"}
                onValueChange={(value) => handleSelectChange("estado", value)}
              >
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Habilitado</SelectItem>
                  <SelectItem value="false">Inhabilitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UsuarioModal;
