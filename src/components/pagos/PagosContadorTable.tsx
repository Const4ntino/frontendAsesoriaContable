import React, { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Eye, CheckCircle } from "lucide-react";
import type { PagoResponse } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmarPagoDialog from "./ConfirmarPagoDialog";

interface PagosContadorTableProps {
  pagos: PagoResponse[];
  loading: boolean;
  error: string | null;
  onConfirmarPago?: (pagoId: number) => void;
}

const PagosContadorTable: React.FC<PagosContadorTableProps> = ({
  pagos,
  loading,
  error,
  onConfirmarPago,
}) => {
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Estado para el modal de visualización del voucher
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Estado para el diálogo de confirmación de pago
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);

  // Calcular índices para paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pagos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(pagos.length / itemsPerPage);

  // Función para mostrar el badge de estado
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "POR_VALIDAR":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Por Validar</Badge>;
      case "VALIDADO":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Validado</Badge>;
      case "RECHAZADO":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rechazado</Badge>;
      case "REGISTRADO":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Registrado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  // Función para mostrar el badge de medio de pago
  const getMedioPagoBadge = (medioPago: string) => {
    switch (medioPago) {
      case "TRANSFERENCIA":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Transferencia</Badge>;
      case "INTERBANK":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Interbank</Badge>;
      case "BCP":
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">BCP</Badge>;
      case "YAPE":
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Yape</Badge>;
      case "NPS":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">NPS</Badge>;
      case "BANCO":
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Banco</Badge>;
      case "APP":
        return <Badge variant="outline" className="bg-cyan-50 text-cyan-600 border-cyan-200">App</Badge>;
      default:
        return <Badge variant="outline">{medioPago}</Badge>;
    }
  };

  // Función para abrir el modal con el voucher
  const verVoucher = (url: string) => {
    // Construir la URL completa si es una ruta relativa
    if (url && url.startsWith('/')) {
      setVoucherUrl(`http://localhost:8099${url}`);
    } else {
      setVoucherUrl(url);
    }
    setModalOpen(true);
  };

  // Renderizar la tabla
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Cargando pagos...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <>
          {/* Tabla de pagos */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha de Pago</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Medio de Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pagado Por</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No se encontraron pagos con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell>
                      <div>
                        {pago.obligacion && pago.obligacion.cliente ? (
                          <>
                            <p className="font-medium">
                              {pago.obligacion.cliente.tipoCliente === "PERSONA_JURIDICA" 
                                ? pago.obligacion.cliente.nombres 
                                : `${pago.obligacion.cliente.nombres} ${pago.obligacion.cliente.apellidos}`}
                            </p>
                            <p className="text-xs text-muted-foreground">{pago.obligacion.cliente.rucDni}</p>
                            {pago.obligacion.cliente.email && (
                              <p className="text-xs text-muted-foreground">{pago.obligacion.cliente.email}</p>
                            )}
                            {pago.obligacion.cliente.regimen && (
                              <p className="text-xs font-medium text-blue-600">{pago.obligacion.cliente.regimen}</p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-medium">{pago.clienteNombre || "Cliente"}</p>
                            <p className="text-xs text-muted-foreground">{pago.clienteRucDni || "Sin RUC/DNI"}</p>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(pago.fechaPago), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>S/ {pago.montoPagado.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getMedioPagoBadge(pago.medioPago)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => verVoucher(pago.urlVoucher)}
                          title="Ver voucher"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getEstadoBadge(pago.estado)}</TableCell>
                    <TableCell>
                      {pago.pagadoPor === "CLIENTE" ? "Cliente" : "Contador"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        disabled={pago.estado !== "POR_VALIDAR"}
                        onClick={() => {
                          setSelectedPagoId(pago.id);
                          setConfirmDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Confirmar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Paginación */}
          {pagos.length > 0 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, pagos.length)} de {pagos.length} pagos
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

          {/* Modal para ver el voucher */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Voucher de Pago</DialogTitle>
              </DialogHeader>
              {voucherUrl && (
                <div className="flex justify-center">
                  <img 
                    src={voucherUrl} 
                    alt="Voucher de pago" 
                    className="max-h-[70vh] object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/400x600?text=Voucher+no+disponible";
                    }}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Diálogo de confirmación de pago */}
          {selectedPagoId && (
            <ConfirmarPagoDialog
              pagoId={selectedPagoId}
              isOpen={confirmDialogOpen}
              onClose={() => {
                setConfirmDialogOpen(false);
                setSelectedPagoId(null);
              }}
              onSuccess={() => {
                // Primero cerramos el diálogo
                setConfirmDialogOpen(false);
                
                // Luego llamamos a onConfirmarPago para recargar los datos
                if (onConfirmarPago && selectedPagoId) {
                  console.log("Recargando datos después de confirmar/rechazar pago");
                  onConfirmarPago(selectedPagoId);
                }
                
                // Finalmente limpiamos el estado
                setSelectedPagoId(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PagosContadorTable;
