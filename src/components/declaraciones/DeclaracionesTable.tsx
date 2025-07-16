import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCheck, Download, Search } from "lucide-react";
import type { DeclaracionResponse } from "../../types/declaracion";

interface DeclaracionesTableProps {
  declaraciones: DeclaracionResponse[];
  isLoading: boolean;
}

const DeclaracionesTable: React.FC<DeclaracionesTableProps> = ({
  declaraciones,
  isLoading,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const itemsPerPage = 5;
  
  // Filtrar declaraciones según búsqueda y filtro de estado
  const filteredDeclaraciones = declaraciones.filter((declaracion) => {
    const matchesSearch = search === "" || 
      (declaracion.periodoTributario && 
       format(new Date(`${declaracion.periodoTributario}T00:00:00`), "MMMM yyyy", { locale: es })
         .toLowerCase()
         .includes(search.toLowerCase())) ||
      (declaracion.tipo && 
       declaracion.tipo.toLowerCase().includes(search.toLowerCase()));
       
    const matchesEstado = estadoFilter === "todos" || estadoFilter === "" || 
      (declaracion.estado && declaracion.estado === estadoFilter);
      
    return matchesSearch && matchesEstado;
  });
  
  // Paginar resultados
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDeclaraciones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDeclaraciones.length / itemsPerPage);
  
  // Estados únicos para el filtro
  const uniqueEstados = Array.from(
    new Set(declaraciones.map((d) => d.estado))
  ).filter(Boolean) as string[];
  
  // Generar los números de página para la paginación
  const generatePaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        items.push(
          <PaginationItem key={i}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    return items;
  };
  
  // Obtener el color del badge según el estado
  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "CREADO":
        return "default";
      case "EN_PROCESO":
        return "secondary";
      case "COMPLETADO":
        return "default";
      case "PAGADO":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <div className="w-full">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por período o tipo..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Select
          value={estadoFilter}
          onValueChange={setEstadoFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {uniqueEstados.map((estado) => (
              <SelectItem key={estado} value={estado}>
                {estado.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">#</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Límite</TableHead>
              <TableHead>Total a Pagar</TableHead>
              <TableHead className="text-right">Descargar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-5" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
            ) : currentItems.length > 0 ? (
              currentItems.map((declaracion, index) => (
                <TableRow key={declaracion.id}>
                  <TableCell>{indexOfFirstItem + index + 1}</TableCell>
                  <TableCell>
                    {declaracion.periodoTributario
                      ? format(
                          new Date(`${declaracion.periodoTributario}T12:00:00`),
                          "MMMM yyyy",
                          { locale: es }
                        )
                      : "-"}
                  </TableCell>
                  <TableCell>{declaracion.tipo || "-"}</TableCell>
                  <TableCell>
                    {declaracion.estado ? (
                      <Badge variant={getEstadoBadgeVariant(declaracion.estado)}>
                        {declaracion.estado.replace("_", " ")}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {declaracion.fechaLimite
                      ? format(new Date(`${declaracion.fechaLimite}T00:00:00`), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {declaracion.totalPagarDeclaracion ? 
                      `S/ ${declaracion.totalPagarDeclaracion.toFixed(2)}` : 
                      <span className="text-gray-500 italic">sin calcular</span>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!declaracion.urlConstanciaDeclaracion}
                      onClick={() => window.open(declaracion.urlConstanciaDeclaracion, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
                    <FileCheck className="h-10 w-10 mb-2" />
                    <p>No se encontraron declaraciones</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {!isLoading && filteredDeclaraciones.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                {currentPage === 1 ? (
                  <PaginationPrevious className="opacity-50 pointer-events-none" />
                ) : (
                  <PaginationPrevious
                    onClick={() => setCurrentPage(currentPage - 1)}
                  />
                )}
              </PaginationItem>

              {generatePaginationItems()}

              <PaginationItem>
                {currentPage === totalPages || totalPages === 0 ? (
                  <PaginationNext className="opacity-50 pointer-events-none" />
                ) : (
                  <PaginationNext
                    onClick={() => setCurrentPage(currentPage + 1)}
                  />
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default DeclaracionesTable;
