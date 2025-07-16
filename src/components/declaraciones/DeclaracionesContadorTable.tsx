import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  FileCheck,
  AlertCircle,
  FilePlus,
  Calendar,
  Upload,
  ExternalLink,
  CheckCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import GenerarDeclaracionModal from "./GenerarDeclaracionModal";
import type { DeclaracionResponse } from "@/types/declaracion";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
// Importaciones de date-fns ya están incluidas arriba

interface DeclaracionesContadorTableProps {
  declaraciones: DeclaracionResponse[];
  onDataUpdated?: () => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, variant = "ghost", disabled = false }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className="h-8 w-8"
            onClick={onClick}
            disabled={disabled}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const DeclaracionesContadorTable: React.FC<DeclaracionesContadorTableProps> = ({
  declaraciones,
  onDataUpdated
}) => {
  // Log para verificar que onDataUpdated está disponible
  console.log('DeclaracionesContadorTable - onDataUpdated disponible:', !!onDataUpdated);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeclaracion, setSelectedDeclaracion] = useState<DeclaracionResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para manejar los alertas de shadcn
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  
  // Estado para el diálogo de generar obligación
  const [isObligacionDialogOpen, setIsObligacionDialogOpen] = useState(false);
  const [obligacionDeclaracionId, setObligacionDeclaracionId] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState('');
  
  const itemsPerPage = 5;
  
  // Función para mostrar alertas
  const showCustomAlert = (message: string, type: "success" | "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    
    // Ocultar la alerta después de 5 segundos
    setTimeout(() => {
      setShowAlert(false);
    }, 5000);
  };
  
  // Funciones para manejar las acciones de los botones
  const handleGenerarDocumento = async (declaracion: DeclaracionResponse) => {
    console.log(`Generando documento para declaración ${declaracion.id}`);
    try {
      // Consumir el endpoint para obtener las métricas de la declaración
      const response = await fetch(`http://localhost:8099/api/clientes/metricas-declaracion/${declaracion.cliente?.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener métricas de la declaración');
      }
      
      const metricasData = await response.json();
      console.log('Métricas obtenidas:', metricasData);
      
      // Guardar la declaración y las métricas
      setSelectedDeclaracion({...declaracion, metricas: metricasData});
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error al obtener métricas:', error);
      showCustomAlert('No se pudieron obtener los datos para generar la declaración', 'error');
    }
  };
  
  const handleGenerarObligacion = (declaracion: DeclaracionResponse) => {
    console.log(`Preparando generación de obligación para declaración ${declaracion.id}`);
    // Abrir diálogo para ingresar observaciones
    setObligacionDeclaracionId(declaracion.id || null);
    setObservaciones('');
    setIsObligacionDialogOpen(true);
  };

  const confirmarGenerarObligacion = async () => {
    if (!obligacionDeclaracionId) return;

    try {
      const response = await fetch(`http://localhost:8099/api/v1/declaraciones/${obligacionDeclaracionId}/marcar-declarado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: observaciones,
      });

      if (!response.ok) {
        throw new Error('Error al generar obligación');
      }

      const data = await response.json();
      console.log('Obligación generada:', data);
      showCustomAlert(`Obligación generada exitosamente para la declaración ${obligacionDeclaracionId}`, 'success');
      
      // Cerrar el diálogo
      setIsObligacionDialogOpen(false);
      
      // Refrescar los datos después de generar la obligación
      if (onDataUpdated) {
        onDataUpdated();
      }
    } catch (error) {
      console.error('Error:', error);
      showCustomAlert(`Error al generar obligación: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    }
  };

  // Método para subir un archivo PDF al servidor
  const handleSubirArchivo = (declaracionId: number, tipo: 'DECLARACION' | 'SUNAT') => {
    console.log(`Subiendo archivo ${tipo} para declaración ${declaracionId}`);
    // Crear input para seleccionar archivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf'; // Solo permitir archivos PDF
    
    input.onchange = async (e) => {
      try {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const file = target.files[0];
          
          if (file.type !== 'application/pdf') {
            showCustomAlert('Por favor, seleccione un archivo PDF', 'error');
            return;
          }
          
          console.log(`Archivo seleccionado: ${file.name}`);
          
          // Crear FormData y añadir el archivo
          const formData = new FormData();
          formData.append('archivo', file);
          
          // Obtener token
          const token = localStorage.getItem('token');
          if (!token) {
            showCustomAlert('No estás autenticado. Por favor, vuelve a iniciar sesión.', 'error');
            return;
          }
          
          // Enviar el archivo al servidor
          const subirArchivoResponse = await fetch('http://localhost:8099/api/archivos/subir-documentos', {
            method: 'POST',
            body: formData,
            headers: token ? {
              'Authorization': `Bearer ${token}`
            } : undefined,
            credentials: 'include',
            mode: 'cors'
          });
          
          if (!subirArchivoResponse.ok) {
            const errorText = await subirArchivoResponse.text();
            console.error('Error del servidor:', errorText);
            throw new Error(`Error al subir el archivo: ${subirArchivoResponse.status} ${subirArchivoResponse.statusText}`);
          }
          
          // Obtener la URL del archivo subido
          const urlArchivo = await subirArchivoResponse.text();
          console.log('URL del archivo subido:', urlArchivo);
          
          // Registrar la URL del documento en la declaración usando parámetros de consulta
          const urlParams = new URLSearchParams();
          urlParams.append('urlConstancia', urlArchivo);
          urlParams.append('tipo', tipo);
          
          const registrarUrlResponse = await fetch(
            `http://localhost:8099/api/v1/declaraciones/${declaracionId}/subir-comprobante-declaracion?${urlParams.toString()}`, 
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              // No hay body con parámetros de consulta
              credentials: 'include',
              mode: 'cors'
            }
          );
          
          if (!registrarUrlResponse.ok) {
            const errorText = await registrarUrlResponse.text();
            console.error('Error al registrar URL:', errorText);
            throw new Error(`Error al registrar URL: ${registrarUrlResponse.status} ${registrarUrlResponse.statusText}`);
          }
          
          showCustomAlert(`Archivo ${file.name} subido y registrado correctamente.`, 'success');
          
          // En lugar de recargar la página, notificar al componente padre para que actualice los datos
          if (onDataUpdated) {
            onDataUpdated();
          } else {
            // Si no hay función de actualización, recargar solo los datos necesarios
            // Esto evita que se cierre la sesión al no recargar toda la página
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(
                "http://localhost:8099/api/v1/declaraciones/mis-clientes/ultimas-declaraciones",
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              
              if (response.ok) {
                // No necesitamos usar estos datos directamente aquí, 
                // solo verificamos que la sesión sigue activa
                console.log('Datos actualizados correctamente');
              }
            } catch (err) {
              console.error('Error al actualizar datos:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
        alert(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    };
    
    input.click();
  };

  const handleVerDocumento = (declaracionId: number, url: string) => {
    console.log(`Viendo documento para declaración ${declaracionId}`);
    // Abrir documento en nueva ventana
    if (url) {
      const baseUrl = 'http://localhost:8099';
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      window.open(fullUrl, '_blank');
    } else {
      alert('No hay documento disponible para ver');
    }
  };

  // Filtrar declaraciones por término de búsqueda
  const filteredDeclaraciones = declaraciones.filter((declaracion) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      declaracion.periodoTributario.toLowerCase().includes(searchTermLower) ||
      declaracion.tipo.toLowerCase().includes(searchTermLower) ||
      declaracion.estado.toLowerCase().includes(searchTermLower)
    );
  });

  // Calcular paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDeclaraciones.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredDeclaraciones.length / itemsPerPage);

  // Formatear fecha exacta del servidor (sin conversión de zona horaria)
  const formatDate = (dateString: string) => {
    try {
      // Parsear la fecha manualmente para evitar problemas de zona horaria
      const [year, month, day] = dateString.split('-').map(Number);
      // Crear fecha en UTC para evitar cambios por zona horaria
      const date = new Date(Date.UTC(year, month - 1, day));
      
      if (isNaN(date.getTime())) return "Fecha no válida";
      
      // Formatear la fecha manualmente para mayor precisión
      const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      
      return `${day} de ${months[month - 1]} de ${year}`;
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Fecha no válida";
    }
  };

  // Formatear periodo tributario
  const formatPeriodo = (periodo: string) => {
    try {
      // Extraer el año y mes directamente del string YYYY-MM-DD
      if (periodo && periodo.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month] = periodo.split('-');
        const monthNumber = parseInt(month, 10);
        
        // Array de nombres de meses en español
        const monthNames = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        
        // Restar 1 porque los meses en JavaScript son 0-indexed
        const monthName = monthNames[monthNumber - 1];
        return `${monthName} de ${year}`;
      }
      
      return "Periodo no válido";
    } catch (error) {
      console.error("Error al formatear periodo:", error);
      return "Periodo no válido";
    }
  };

  // Obtener color del badge según el estado
  const getEstadoBadgeColor = (estado: string) => {
    switch (estado.toUpperCase()) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "COMPLETADA":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "VENCIDA":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "EN_PROCESO":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "DECLARADO":
        return "bg-green-200 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Obtener icono según el estado
  const getEstadoIcon = (estado: string) => {
    switch (estado.toUpperCase()) {
      case "PENDIENTE":
        return <AlertCircle className="h-4 w-4" />;
      case "COMPLETADA":
        return <FileCheck className="h-4 w-4" />;
      case "VENCIDA":
        return <AlertCircle className="h-4 w-4" />;
      case "EN_PROCESO":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full">
      {/* Alerta personalizada con shadcn/ui */}
      {showAlert && (
        <Alert variant={alertType === "error" ? "destructive" : "default"} className="mb-4">
          {alertType === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertTitle>{alertType === "error" ? "Error" : "Éxito"}</AlertTitle>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}

      {/* Diálogo para ingresar observaciones */}
      <Dialog open={isObligacionDialogOpen} onOpenChange={setIsObligacionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Obligación</DialogTitle>
            <DialogDescription>
              Ingrese observaciones para generar la obligación (opcional)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Ingrese observaciones (opcional)"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsObligacionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarGenerarObligacion}>
              Generar Obligación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para generar declaración */}
      <GenerarDeclaracionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        declaracion={selectedDeclaracion}
        onDataUpdated={onDataUpdated}
      />
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar declaración..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha Límite</TableHead>
              <TableHead>Total a Pagar</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Constancia Declaración</TableHead>
              <TableHead>Constancia SUNAT</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((declaracion) => (
                <TableRow key={declaracion.id}>
                  <TableCell className="font-medium">
                    <div>
                      {declaracion.cliente ? 
                        (declaracion.cliente.tipoCliente === "PERSONA_NATURAL" ? 
                          `${declaracion.cliente.nombres} ${declaracion.cliente.apellidos}` : 
                          declaracion.cliente.nombres) : 
                        `Cliente #${declaracion.id}`
                      }
                      {declaracion.cliente && (
                        <div className="text-xs text-gray-500 mt-1">
                          {declaracion.cliente.tipoCliente === "PERSONA_NATURAL" ? "Persona Natural" : "Persona Jurídica"} 
                          {declaracion.cliente.tipoRuc && ` - Régimen: ${declaracion.cliente.tipoRuc}`}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatPeriodo(declaracion.periodoTributario)}</TableCell>
                  <TableCell>{declaracion.tipo}</TableCell>
                  <TableCell>{formatDate(declaracion.fechaLimite)}</TableCell>
                  <TableCell>
                    {declaracion.totalPagarDeclaracion ? 
                      formatCurrency(declaracion.totalPagarDeclaracion) : 
                      <span className="text-gray-500 italic">sin calcular</span>
                    }
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 ${getEstadoBadgeColor(
                        declaracion.estado
                      )}`}
                    >
                      {getEstadoIcon(declaracion.estado)}
                      {declaracion.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      {declaracion.urlConstanciaDeclaracion ? (
                        <ActionButton
                          icon={<ExternalLink className="h-4 w-4" />}
                          label="Ver constancia de declaración"
                          onClick={() => handleVerDocumento(declaracion.id, declaracion.urlConstanciaDeclaracion)}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs italic">Sin documento</span>
                      )}
                      <ActionButton
                        icon={<Upload className="h-4 w-4" />}
                        label="Subir constancia de declaración"
                        onClick={() => handleSubirArchivo(declaracion.id, 'DECLARACION')}
                        disabled={declaracion.estado === "DECLARADO"}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      {declaracion.urlConstanciaSunat ? (
                        <ActionButton
                          icon={<ExternalLink className="h-4 w-4" />}
                          label="Ver constancia SUNAT"
                          onClick={() => handleVerDocumento(declaracion.id, declaracion.urlConstanciaSunat)}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs italic">Sin documento</span>
                      )}
                      <ActionButton
                        icon={<Upload className="h-4 w-4" />}
                        label="Subir constancia SUNAT"
                        onClick={() => handleSubirArchivo(declaracion.id, 'SUNAT')}
                        disabled={declaracion.estado === "DECLARADO"}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <ActionButton
                        icon={<FilePlus className="h-4 w-4" />}
                        label="Generar documento"
                        onClick={() => handleGenerarDocumento(declaracion)}
                        disabled={declaracion.estado === "COMPLETADA" || declaracion.estado === "DECLARADO"}
                      />
                      <ActionButton
                        icon={<Calendar className="h-4 w-4" />}
                        label={!declaracion.urlConstanciaSunat ? "Subir constancia SUNAT primero" : "Generar obligación"}
                        onClick={() => handleGenerarObligacion(declaracion)}
                        variant="ghost"
                        disabled={declaracion.estado === "DECLARADO" || !declaracion.urlConstanciaSunat}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No se encontraron declaraciones
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {filteredDeclaraciones.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {indexOfFirstItem + 1} a{" "}
            {Math.min(indexOfLastItem, filteredDeclaraciones.length)} de{" "}
            {filteredDeclaraciones.length} declaraciones
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
  );
};

export default DeclaracionesContadorTable;
