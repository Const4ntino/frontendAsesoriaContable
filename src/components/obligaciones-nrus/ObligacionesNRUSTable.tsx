import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ObligacionNRUS {
  periodo: string;
  fechaLimite: string;
  montoIngresos: number;
  montoEgresos: number;
  montoMayor: number;
  categoria: number;
  cuota: number;
}

interface ObligacionesNRUSTableProps {
  obligaciones: ObligacionNRUS[];
}

const ObligacionesNRUSTable: React.FC<ObligacionesNRUSTableProps> = ({ obligaciones }) => {
  const formatDate = (dateString: string) => {
    // Formato: "YYYY-MM-DD" a "5 de enero de 2024"
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
  };



  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Período</TableHead>
            <TableHead>Fecha Límite</TableHead>
            <TableHead>Ingresos (S/)</TableHead>
            <TableHead>Egresos (S/)</TableHead>
            <TableHead>Monto Mayor (S/)</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Cuota (S/)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {obligaciones.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">
                No hay obligaciones NRUS para mostrar
              </TableCell>
            </TableRow>
          ) : (
            obligaciones.map((obligacion, index) => (
              <TableRow key={index}>
                <TableCell>{obligacion.periodo}</TableCell>
                <TableCell>{formatDate(obligacion.fechaLimite)}</TableCell>
                <TableCell>{obligacion.montoIngresos.toFixed(2)}</TableCell>
                <TableCell>{obligacion.montoEgresos.toFixed(2)}</TableCell>
                <TableCell className="font-medium">{obligacion.montoMayor.toFixed(2)}</TableCell>
                <TableCell>{obligacion.categoria}</TableCell>
                <TableCell>{obligacion.cuota.toFixed(2)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ObligacionesNRUSTable;
