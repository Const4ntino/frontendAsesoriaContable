import React, { useState } from "react";
import Sidebar from "./Sidebar";
import UsuariosTable from "./usuarios/UsuariosTable";
import ClientesTable from "./clientes/ClientesTable";
import ContadoresTable from "./contadores/ContadoresTable";
import AsignacionesTable from "./asignaciones/AsignacionesTable";
import IngresosModule from "./ingresos/IngresosModule";
import EgresosModule from "./egresos/EgresosModule";
import DeclaracionesModule from "./declaraciones/DeclaracionesModule";
import DeclaracionesContadorModule from "./declaraciones/DeclaracionesContadorModule";
import ObligacionesContadorModule from "./obligaciones/ObligacionesContadorModule";
import ObligacionesClienteModule from "./obligaciones/ObligacionesClienteModule";
import MisClientesModule from "./mis-clientes/MisClientesModule";
import PagosModule from "./pagos/PagosModule";
import PagosContadorModule from "./pagos/PagosContadorModule";
import ObligacionesNRUSModule from "./obligaciones-nrus/ObligacionesNRUSModule";

interface AuthInfoProps {
    token: string;
    username: string;
    rol: string;
    onLogout: () => void;
}


interface AuthInfoProps {
    token: string;
    username: string;
    rol: string;
    onLogout: () => void;
}

const defaultModuleByRol: Record<string, string> = {
    ADMINISTRADOR: "usuarios",
    CONTADOR: "mis-clientes",
    CLIENTE: "ingresos",
};

const AuthInfo: React.FC<AuthInfoProps> = ({ username, rol, onLogout }) => {
    const [modulo, setModulo] = useState(defaultModuleByRol[rol.toUpperCase()] || "");

    // Sidebar recibe setModulo para navegación interna
    return (
        <div className="min-h-screen flex bg-white">
            <Sidebar rol={rol} username={username} onLogout={onLogout} onSelect={setModulo} moduloSeleccionado={modulo} />
            <main className="flex-1 p-0 overflow-auto bg-white flex flex-col">
                <div className="p-10 flex-1">
                  {rol.toUpperCase() === "ADMINISTRADOR" && modulo === "usuarios" && (
                    <UsuariosTable />
                  )}
                  {/* Placeholders para otros módulos */}
                  {rol.toUpperCase() === "ADMINISTRADOR" && modulo === "clientes" && (
                    <ClientesTable />
                  )}
                  {rol.toUpperCase() === "ADMINISTRADOR" && modulo === "contadores" && (
                    <ContadoresTable />
                  )}
                  {rol.toUpperCase() === "ADMINISTRADOR" && modulo === "asignaciones" && (
                    <AsignacionesTable />
                  )}
                  {rol.toUpperCase() === "CONTADOR" && modulo === "mis-clientes" && (
                    <MisClientesModule />
                  )}
                  {rol.toUpperCase() === "CONTADOR" && modulo === "declaraciones" && (
                    <DeclaracionesContadorModule />
                  )}
                  {rol.toUpperCase() === "CONTADOR" && modulo === "obligaciones" && (
                    <ObligacionesContadorModule />
                  )}
                  {rol.toUpperCase() === "CONTADOR" && modulo === "pagos" && (
                    <PagosContadorModule />
                  )}
                  {rol.toUpperCase() === "CLIENTE" && modulo === "ingresos" && (
                    <IngresosModule />
                  )}
                  {rol.toUpperCase() === "CLIENTE" && modulo === "egresos" && (
                    <EgresosModule />
                  )}
                  {rol.toUpperCase() === "CLIENTE" && modulo === "declaraciones" && (
                    <DeclaracionesModule />
                  )}
                  {rol.toUpperCase() === "CLIENTE" && modulo === "pagos" && (
                    <PagosModule />
                  )}
                  {rol.toUpperCase() === "CLIENTE" && modulo === "obligaciones" && (
                    <ObligacionesClienteModule />
                  )}
                  {rol.toUpperCase() === "CLIENTE" && modulo === "obligaciones-nrus" && (
                    <ObligacionesNRUSModule />
                  )}
                </div>
            </main>
        </div>
    );
};

export default AuthInfo;
