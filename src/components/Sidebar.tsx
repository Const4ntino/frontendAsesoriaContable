import React, { useEffect, useState } from "react";
import { LogOut, Users, User, Briefcase, DollarSign, ClipboardList, FileCheck, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  rol: string;
  username: string;
  onLogout: () => void;
  onSelect: (key: string) => void;
  moduloSeleccionado: string;
}

interface ClienteInfo {
  id: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
  regimen: string;
  tipoCliente: string;
}

// Función para obtener las opciones del sidebar según el rol y el régimen (para clientes)
const getSidebarOptions = (rol: string, regimen?: string) => {
  const baseOptions: Record<string, { label: string; key: string; icon: React.ReactNode }[]> = {
    ADMINISTRADOR: [
      { label: "Usuarios", key: "usuarios", icon: <Users className="w-5 h-5" /> },
      { label: "Clientes", key: "clientes", icon: <User className="w-5 h-5" /> },
      { label: "Contadores", key: "contadores", icon: <Briefcase className="w-5 h-5" /> },
      { label: "Asignaciones", key: "asignaciones", icon: <ClipboardList className="w-5 h-5" /> },
    ],
    CONTADOR: [
      { label: "Mis Clientes", key: "mis-clientes", icon: <Users className="w-5 h-5" /> },
      { label: "Declaraciones", key: "declaraciones", icon: <FileText className="w-5 h-5" /> },
      { label: "Obligaciones", key: "obligaciones", icon: <Calendar className="w-5 h-5" /> },
      { label: "Pagos", key: "pagos", icon: <FileCheck className="w-5 h-5" /> },
    ],
    CLIENTE: [
      { label: "Ingresos", key: "ingresos", icon: <DollarSign className="w-5 h-5" /> },
      { label: "Egresos", key: "egresos", icon: <DollarSign className="w-5 h-5 rotate-180" /> },
    ],
  };

  // Si es cliente NRUS, agregar módulo específico de Obligaciones NRUS
  if (rol.toUpperCase() === 'CLIENTE' && regimen?.toUpperCase() === 'NRUS') {
    baseOptions.CLIENTE.push(
      { label: "Obligaciones NRUS", key: "obligaciones-nrus", icon: <FileText className="w-5 h-5" /> }
    );
  }
  // Si es cliente y no es NRUS, agregar módulos adicionales
  else if (rol.toUpperCase() === 'CLIENTE' && regimen?.toUpperCase() !== 'NRUS') {
    baseOptions.CLIENTE.push(
      { label: "Pagos", key: "pagos", icon: <FileCheck className="w-5 h-5" /> },
      { label: "Obligaciones", key: "obligaciones", icon: <Calendar className="w-5 h-5" /> }
    );
    
    // Si el cliente puede ver declaraciones (RER, RG, RMT), agregar el módulo
    if (regimen && ["RER", "RG", "RMT"].includes(regimen)) {
      baseOptions.CLIENTE.push(
        { label: "Declaraciones", key: "declaraciones", icon: <FileText className="w-5 h-5" /> }
      );
    }
  }

  return baseOptions[rol.toUpperCase()] || [];
};

const Sidebar: React.FC<SidebarProps> = ({ rol, username, onLogout, onSelect, moduloSeleccionado }) => {
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);

  // Obtener información del cliente cuando el rol es CLIENTE
  useEffect(() => {
    const fetchClienteInfo = async () => {
      if (rol.toUpperCase() !== "CLIENTE") return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8099/api/clientes/encontrarme", {
          headers: { "Authorization": `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Error al obtener información del cliente");
        const data = await response.json();
        setClienteInfo(data);

        // Si el cliente no es de régimen NRUS, hacer petición para generar declaración si no existe
        if (data && data.regimen !== "NRUS") {
          try {
            const declaracionResponse = await fetch("http://localhost:8099/api/v1/declaraciones/actual", {
              headers: { "Authorization": `Bearer ${token}` },
            });

            if (!declaracionResponse.ok) {
              console.error("No se pudo generar/verificar la declaración actual");
            } else {
              console.log("Declaración actual verificada/generada correctamente");
            }
          } catch (declaracionErr) {
            console.error("Error al generar/verificar declaración actual:", declaracionErr);
          }
        }
      } catch (err) {
        console.error("Error al obtener información del cliente:", err);
      }
    };

    fetchClienteInfo();
  }, [rol]);

  // Determinar la imagen del avatar según el rol del usuario
  const getAvatarImage = () => {
    switch (rol.toUpperCase()) {
      case "ADMINISTRADOR":
        return "/admin.jpg";
      case "CONTADOR":
        return "/contador.jpg";
      case "CLIENTE":
        return "/cliente.jpg";
      default:
        return "";
    }
  };

  // Determinar el color del badge según el rol
  const getBadgeVariant = () => {
    switch (rol.toUpperCase()) {
      case "ADMINISTRADOR":
        return "default";
      case "CONTADOR":
        return "default";
      case "CLIENTE":
        return "default";
      default:
        return "outline";
    }
  };

  // Obtener las opciones del menú según el rol y el régimen del cliente
  const sidebarItems = getSidebarOptions(rol, clienteInfo?.regimen);

  return (
    <aside className="bg-white h-screen w-64 flex flex-col border-r border-zinc-200 shadow-lg sticky top-0 left-0">
      <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-center">
        <img 
          src="/logo-asesoria-sin-fondo.png" 
          alt="Logo Asesoría Contable" 
          className="h-16 object-contain"
        />
      </div>
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {sidebarItems.map(opt => (
            <li key={opt.key}>
              <Button
                variant={moduloSeleccionado === opt.key ? "secondary" : "ghost"}
                className={cn(
                  "w-full flex items-center justify-start gap-3 px-4 py-2 rounded-lg transition-colors text-base",
                  moduloSeleccionado === opt.key
                    ? "bg-zinc-100 text-blue-600 font-semibold"
                    : "hover:bg-zinc-50 text-zinc-700"
                )}
                onClick={() => onSelect(opt.key)}
              >
                {opt.icon}
                {opt.label}
              </Button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="px-6 pt-4 pb-2 mt-auto border-t border-zinc-200">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 border border-zinc-200">
            <AvatarImage src={getAvatarImage()} alt={username} />
            <AvatarFallback>{username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">{username}</span>
            <div className="flex gap-1 mt-1">
              <Badge variant={getBadgeVariant()} className="text-xs">
                {rol}
              </Badge>
              {rol.toUpperCase() === "CLIENTE" && clienteInfo && (
                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                  {clienteInfo.regimen}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Separator className="my-2" />
        <Button
          variant="ghost"
          className="w-full flex items-center gap-2 justify-start text-zinc-600 hover:text-red-600 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
