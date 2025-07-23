import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BitacoraTable from "./BitacoraTable";
import BitacoraFiltros from "./BitacoraFiltros";
import type { BitacoraFiltros as BitacoraFiltrosType } from "@/types/bitacora";

const BitacoraModule: React.FC = () => {
  const [filtros, setFiltros] = useState<BitacoraFiltrosType>({
    page: 0,
    size: 10,
    sortBy: "fechaMovimiento",
    sortDir: "DESC"
  });

  const handleFiltrosChange = (nuevosFiltros: Partial<BitacoraFiltrosType>) => {
    setFiltros(prev => ({
      ...prev,
      ...nuevosFiltros,
      // Resetear a la primera página cuando cambian los filtros (excepto cuando se cambia la página explícitamente)
      page: 'page' in nuevosFiltros ? nuevosFiltros.page! : 0
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Bitácora del Sistema</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>
            Utilice los filtros para encontrar movimientos específicos en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BitacoraFiltros filtros={filtros} onFiltrosChange={handleFiltrosChange} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Registrados</CardTitle>
          <CardDescription>
            Lista de todas las acciones realizadas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BitacoraTable filtros={filtros} onFiltrosChange={handleFiltrosChange} />
        </CardContent>
      </Card>
    </div>
  );
};

export default BitacoraModule;
