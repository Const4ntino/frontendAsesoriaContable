import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";

interface PagoResponse {
  id: number;
  idObligacion: number;
  montoPagado: number;
  fechaPago: string;
  medioPago: string;
  urlVoucher: string | null;
  estado: string;
  pagadoPor: string;
  comentarioContador: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface PagosTableProps {
  filtroRecientes?: boolean;
}

const PagosTable: React.FC<PagosTableProps> = ({ filtroRecientes = false }) => {
  const [pagos, setPagos] = useState<PagoResponse[]>([]);
  const [filteredPagos, setFilteredPagos] = useState<PagoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estados para filtros
  const [medioPagoFilter, setMedioPagoFilter] = useState<string>("");
  const [fechaFilter, setFechaFilter] = useState<Date | undefined>(undefined);
  const [montoFilter, setMontoFilter] = useState<string>("");
  const [ordenFilter, setOrdenFilter] = useState<string>("DESC");
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Estados para visualización de comprobante
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);

  // Cargar pagos desde la API
  useEffect(() => {
    const fetchPagos = async () => {
      try {
        setLoading(true);
        
        // Construir URL con parámetros de filtro
        let url = "http://localhost:8099/api/v1/pagos/mis-pagos?";
        
        if (fechaFilter) {
          url += `periodoTributario=${format(fechaFilter, "yyyy-MM-dd")}&`;
        }
        
        if (montoFilter && !isNaN(parseFloat(montoFilter))) {
          url += `monto=${montoFilter}&`;
        }
        
        url += `orden=${ordenFilter}`;
        
        const token = localStorage.getItem("token");
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener los pagos");
        }

        const data = await response.json();
        setPagos(data);
        
        // Si es filtro de recientes, mostrar solo los últimos 3 meses
        if (filtroRecientes) {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          
          const recientes = data.filter((pago: PagoResponse) => {
            const fechaPago = new Date(pago.fechaPago);
            return fechaPago >= threeMonthsAgo;
          });
          
          setFilteredPagos(recientes);
        } else {
          setFilteredPagos(data);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar los pagos");
        console.error("Error al cargar pagos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPagos();
  }, [filtroRecientes, fechaFilter, montoFilter, ordenFilter]);

  // Filtrar pagos cuando cambian los filtros
  useEffect(() => {
    let result = [...pagos];
    
    // No hay filtro de búsqueda
    
    // Filtrar por medio de pago
    if (medioPagoFilter && medioPagoFilter !== "todos") {
      result = result.filter((pago) => pago.medioPago === medioPagoFilter);
    }
    
    // Filtrar por monto
    if (montoFilter && !isNaN(parseFloat(montoFilter))) {
      const montoNumerico = parseFloat(montoFilter);
      result = result.filter((pago) => pago.montoPagado === montoNumerico);
    }
    
    // Filtrar por fecha (periodoTributario en formato ISO)
    if (fechaFilter) {
      const fechaISO = format(fechaFilter, "yyyy-MM-dd");
      result = result.filter((pago) => {
        const pagoDate = new Date(pago.fechaPago);
        const pagoDateISO = format(pagoDate, "yyyy-MM-dd");
        return pagoDateISO === fechaISO;
      });
    }
    
    // Aplicar filtro de recientes si es necesario
    if (filtroRecientes) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      result = result.filter((pago) => {
        const fechaPago = new Date(pago.fechaPago);
        return fechaPago >= threeMonthsAgo;
      });
    }
    
    setFilteredPagos(result);
    setCurrentPage(1); // Resetear a la primera página cuando cambian los filtros
  }, [pagos, medioPagoFilter, montoFilter, filtroRecientes]);

  // Calcular índices para paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPagos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPagos.length / itemsPerPage);

  // Función para visualizar el comprobante
  const handleViewVoucher = (url: string | null) => {
    if (url) {
      setSelectedVoucher(`http://localhost:8099${url}`);
      setIsVoucherOpen(true);
    } else {
      alert("No hay comprobante disponible para este pago");
    }
  };

  // Función para formatear el estado del pago
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return <Badge variant="outline">Pendiente</Badge>;
      case "APROBADO":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aprobado</Badge>;
      case "RECHAZADO":
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        
        <div className="w-full md:w-[180px]">
          <Select
            value={medioPagoFilter}
            onValueChange={setMedioPagoFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Medio de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
              <SelectItem value="INTERBANK">Interbank</SelectItem>
              <SelectItem value="BCP">BCP</SelectItem>
              <SelectItem value="YAPE">Yape</SelectItem>
              <SelectItem value="NPS">NPS</SelectItem>
              <SelectItem value="BANCO">Banco</SelectItem>
              <SelectItem value="APP">App</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-[180px]">
          <Input
            type="date"
            placeholder="Filtrar por fecha"
            value={fechaFilter ? format(fechaFilter, "yyyy-MM-dd") : ""}
            onChange={(e) => {
              if (e.target.value) {
                setFechaFilter(new Date(e.target.value));
              } else {
                setFechaFilter(undefined);
              }
            }}
            className="w-full"
          />
        </div>
        
        <div className="w-full md:w-[180px]">
          <Input
            type="number"
            placeholder="Filtrar por monto"
            value={montoFilter}
            onChange={(e) => setMontoFilter(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-[180px]">
          <Select
            value={ordenFilter}
            onValueChange={setOrdenFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DESC">Más recientes</SelectItem>
              <SelectItem value="ASC">Más antiguos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {fechaFilter && (
          <Button 
            variant="ghost" 
            onClick={() => setFechaFilter(undefined)}
            className="h-9 px-2"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Cargando pagos...</div>
      ) : filteredPagos.length === 0 ? (
        <div className="text-center py-8">No se encontraron pagos</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Medio de Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pagado Por</TableHead>
                <TableHead>Comprobante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell>S/ {pago.montoPagado.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(pago.fechaPago), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{pago.medioPago}</TableCell>
                  <TableCell>{getEstadoBadge(pago.estado)}</TableCell>
                  <TableCell>{pago.pagadoPor}</TableCell>
                  <TableCell>
                    {pago.urlVoucher ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewVoucher(pago.urlVoucher)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">No disponible</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Paginación */}
          {filteredPagos.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {indexOfFirstItem + 1} a{" "}
                {Math.min(indexOfLastItem, filteredPagos.length)} de{" "}
                {filteredPagos.length} pagos
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  Página {currentPage} de {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Modal para visualizar comprobante */}
      <Dialog open={isVoucherOpen} onOpenChange={setIsVoucherOpen}>
        <DialogContent className="max-w-3xl">
          <div className="w-full h-[70vh] overflow-auto">
            {selectedVoucher && selectedVoucher.toLowerCase().endsWith('.pdf') ? (
              <iframe 
                src={selectedVoucher} 
                className="w-full h-full" 
                title="Comprobante de pago"
              />
            ) : selectedVoucher ? (
              <img 
                src={selectedVoucher} 
                alt="Comprobante de pago" 
                className="max-w-full h-auto mx-auto"
              />
            ) : (
              <div className="text-center py-8">No se pudo cargar el comprobante</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagosTable;
