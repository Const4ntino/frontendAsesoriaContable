import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, FileText, Edit, X } from "lucide-react";
import type { DeclaracionResponse } from "@/types/declaracion";
import { formatCurrency } from "@/lib/utils";

interface MetricasDeclaracion {
  ingresosGravados: number;
  ingresosExonerados: number;
  ingresosInafectos: number;
  totalIgvIngresos: number;
  
  egresosGravados: number;
  egresosExonerados: number;
  egresosInafectos: number;
  totalIgvEgresos: number;
}

// Extender la interfaz DeclaracionResponse para incluir las métricas
declare module "@/types/declaracion" {
  interface DeclaracionResponse {
    metricas?: MetricasDeclaracion;
  }
}

interface GenerarDeclaracionModalProps {
  isOpen: boolean;
  onClose: () => void;
  declaracion: DeclaracionResponse | null;
  onDataUpdated?: () => void;
}

const GenerarDeclaracionModal: React.FC<GenerarDeclaracionModalProps> = ({
  isOpen,
  onClose,
  declaracion,
  onDataUpdated,
}) => {
  if (!declaracion) return null;
  
  // Ref para el contenido del PDF
  const pdfContentRef = useRef<HTMLDivElement>(null);
  
  // Estados para los campos editables
  const [saldoAFavor, setSaldoAFavor] = useState<string>("0.00");
  const [retenciones, setRetenciones] = useState<string>("0.00");
  const [percepciones, setPercepciones] = useState<string>("0.00");
  const [multasIntereses, setMultasIntereses] = useState<string>("0.00");
  
  // Calcular el IGV neto a pagar
  const calcularIgvNetoPagar = () => {
    if (!declaracion.metricas) return 0;
    
    const igvVentas = declaracion.metricas.totalIgvIngresos || 0;
    const igvCompras = declaracion.metricas.totalIgvEgresos || 0;
    const saldoFavor = parseFloat(saldoAFavor) || 0;
    const retencionesValor = parseFloat(retenciones) || 0;
    const percepcionesValor = parseFloat(percepciones) || 0;
    
    const igvNeto = Math.max(0, igvVentas - igvCompras - saldoFavor - retencionesValor - percepcionesValor);
    return igvNeto;
  };
  
  // Calcular el IR estimado
  const calcularIrEstimado = () => {
    return declaracion.irEstimado || (declaracion.metricas?.ingresosGravados || declaracion.totalIngresos || 0) * 0.015;
  };
  
  // Calcular el total a pagar
  const calcularTotalPagar = () => {
    const igvNeto = calcularIgvNetoPagar();
    const irEstimado = calcularIrEstimado();
    const multasInteresesValor = parseFloat(multasIntereses) || 0;
    
    return igvNeto + irEstimado + multasInteresesValor;
  };
  
  // Función para generar, subir y descargar el PDF
  const generarPDF = async () => {
    try {
      // Crear el PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = margin;
      
      // Funciones auxiliares para el PDF
      const addTitle = (text: string) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14); // Reducir tamaño de título
        pdf.setTextColor(0, 51, 102); // Azul oscuro
        pdf.text(text, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8; // Reducir espacio después del título
      };
      
      const addSubtitle = (text: string) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11); // Reducir tamaño de subtítulo
        pdf.setTextColor(60, 60, 60); // Gris oscuro
        pdf.text(text, margin, yPos);
        yPos += 6; // Reducir espacio después del subtítulo
      };
      
      // Función addText eliminada ya que no se usa
      
      const addSpacer = (height: number = 3) => { // Reducir espacio por defecto
        yPos += height;
      };
      
      const addLine = () => {
        pdf.setDrawColor(200, 200, 200); // Gris claro
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 3; // Reducir espacio después de la línea
      };
      
      const addTable = (headers: string[], data: string[][]) => {
        const colWidth = (pageWidth - margin * 2) / headers.length;
        
        // Encabezados
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255); // Blanco para el texto de los encabezados
        pdf.setFillColor(0, 51, 102); // Azul oscuro para el fondo de los encabezados
        
        headers.forEach((header, i) => {
          pdf.rect(margin + (i * colWidth), yPos - 5, colWidth, 7, 'F');
          pdf.text(header, margin + (i * colWidth) + colWidth / 2, yPos, { align: 'center' });
        });
        yPos += 5;
        
        // Datos
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // Negro para el texto de los datos
        
        data.forEach((row, rowIndex) => {
          // Alternar colores de fondo para las filas
          if (rowIndex % 2 === 0) {
            pdf.setFillColor(240, 240, 240); // Gris muy claro para filas pares
          } else {
            pdf.setFillColor(255, 255, 255); // Blanco para filas impares
          }
          
          // Dibujar el fondo de la fila completa primero
          row.forEach((_, cellIndex) => {
            pdf.rect(margin + (cellIndex * colWidth), yPos - 5, colWidth, 7, 'F');
          });
          
          // Luego dibujar el texto encima
          row.forEach((cell, cellIndex) => {
            pdf.text(cell, margin + (cellIndex * colWidth) + colWidth / 2, yPos, { align: 'center' });
          });
          
          yPos += 6; // Reducir el espacio entre filas
        });
        
        yPos += 3; // Reducir el espacio después de la tabla
      };
      
      // Añadir título y fecha
      addTitle('DECLARACIÓN MENSUAL');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100); // Gris
      pdf.text(`Periodo: ${declaracion.periodoTributario} | Fecha: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      // Datos del contribuyente
      addSubtitle('DATOS DEL CONTRIBUYENTE');
      // Mostrar datos del cliente en dos columnas para ahorrar espacio
      const col1Width = 90;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      
      pdf.text(`RUC/DNI: ${declaracion.cliente?.rucDni || '-'}`, margin, yPos);
      pdf.text(`Régimen: ${declaracion.cliente?.tipoRuc || '-'}`, margin + col1Width, yPos);
      yPos += 4;
      
      pdf.text(`Nombre: ${declaracion.cliente?.nombres || ''} ${declaracion.cliente?.apellidos || ''}`, margin, yPos);
      pdf.text(`Tipo: ${declaracion.cliente?.tipoCliente || '-'}`, margin + col1Width, yPos);
      yPos += 4;
      
      if (declaracion.cliente?.direccion) {
        pdf.text(`Dirección: ${declaracion.cliente.direccion}`, margin, yPos);
        yPos += 4;
      }
      
      addSpacer(2);
      addLine();
      
      // Impuesto General a las Ventas (IGV)
      addSubtitle('IMPUESTO GENERAL A LAS VENTAS (IGV)');
      
      // Tabla de ingresos
      addTable(
        ['Concepto', 'Monto (S/)'],
        [
          ['Ingresos Gravados', formatCurrency(declaracion.metricas?.ingresosGravados || 0)],
          ['Ingresos Exonerados', formatCurrency(declaracion.metricas?.ingresosExonerados || 0)],
          ['Ingresos Inafectos', formatCurrency(declaracion.metricas?.ingresosInafectos || 0)],
          ['Total IGV Ventas', formatCurrency(declaracion.metricas?.totalIgvIngresos || 0)]
        ]
      );
      
      addSpacer(2);
      
      // Tabla de egresos
      addSubtitle('CRÉDITO FISCAL (COMPRAS)');
      addTable(
        ['Concepto', 'Monto (S/)'],
        [
          ['Egresos Gravados', formatCurrency(declaracion.metricas?.egresosGravados || 0)],
          ['Egresos Exonerados', formatCurrency(declaracion.metricas?.egresosExonerados || 0)],
          ['Egresos Inafectos', formatCurrency(declaracion.metricas?.egresosInafectos || 0)],
          ['Total IGV Compras', formatCurrency(declaracion.metricas?.totalIgvEgresos || 0)]
        ]
      );
      
      addSpacer(2);
      
      // Resultado del IGV
      addSubtitle('RESULTADO DEL IGV');
      addTable(
        ['Concepto', 'Monto (S/)'],
        [
          ['IGV Ventas', formatCurrency(declaracion.metricas?.totalIgvIngresos || 0)],
          ['IGV Compras', formatCurrency(declaracion.metricas?.totalIgvEgresos || 0)],
          ['Saldo a favor', formatCurrency(parseFloat(saldoAFavor) || 0)],
          ['Retenciones', formatCurrency(parseFloat(retenciones) || 0)],
          ['Percepciones', formatCurrency(parseFloat(percepciones) || 0)],
          ['IGV neto a pagar', formatCurrency(calcularIgvNetoPagar())]
        ]
      );
      
      addSpacer(2);
      
      // Combinar Impuesto a la Renta y Multas e intereses en una sola tabla
      addSubtitle('IMPUESTO A LA RENTA Y MULTAS');
      addTable(
        ['Concepto', 'Monto (S/)'],
        [
          ['Ingresos netos del mes', formatCurrency(declaracion.metricas?.ingresosGravados || declaracion.totalIngresos || 0)],
          ['Impuesto a la Renta (1.5%)', formatCurrency(calcularIrEstimado())],
          ['Multas e intereses', formatCurrency(parseFloat(multasIntereses) || 0)]
        ]
      );
      
      addSpacer(2);
      addLine();
      
      // Total a pagar
      addSubtitle('TOTAL A PAGAR');
      addTable(
        ['Concepto', 'Monto (S/)'],
        [
          ['IGV neto a pagar', formatCurrency(calcularIgvNetoPagar())],
          ['Impuesto a la Renta', formatCurrency(calcularIrEstimado())],
          ['Multas e intereses', formatCurrency(parseFloat(multasIntereses) || 0)],
          ['TOTAL', formatCurrency(calcularTotalPagar())]
        ]
      );
      
      // Añadir pie de página
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150); // Gris claro
      pdf.text('Documento generado automáticamente por el sistema de Asesoría Contable', pageWidth / 2, 285, { align: 'center' });
      pdf.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, pageWidth / 2, 290, { align: 'center' });
      
      // Nombre del archivo PDF
      const nombreArchivo = `Declaracion_${declaracion.periodoTributario}_${declaracion.cliente?.rucDni}.pdf`;
      
      // Guardar el PDF localmente
      pdf.save(nombreArchivo);
      
      try {
        // Convertir el PDF a un blob para enviarlo al servidor
        const pdfBlob = pdf.output('blob');
        
        // Crear un FormData para enviar el archivo
        const formData = new FormData();
        formData.append('archivo', pdfBlob, nombreArchivo);
        
        // Obtener el token de autenticación del localStorage
        const token = localStorage.getItem('token');

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
        
        // Marcar la declaración como en proceso con la URL del archivo
        if (declaracion.id) {
          // Usar directamente el endpoint PATCH ahora que está habilitado en el backend
          const marcarEnProcesoResponse = await fetch(`http://localhost:8099/api/v1/declaraciones/${declaracion.id}/marcar-en-proceso`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? {'Authorization': `Bearer ${token}`} : {})
            },
            body: JSON.stringify({
              urlConstancia: urlArchivo,
              monto: calcularTotalPagar()
            }),
            credentials: 'include',
            mode: 'cors'
          });
          
          if (!marcarEnProcesoResponse.ok) {
            const errorText = await marcarEnProcesoResponse.text();
            console.error('Error del servidor al marcar en proceso:', errorText);
            console.warn('No se pudo actualizar el estado de la declaración, pero el PDF se generó correctamente');
          } else {
            console.log('Declaración marcada como en proceso correctamente');
            
            // Llamar a la función onDataUpdated para actualizar la tabla automáticamente
            console.log('Intentando actualizar datos después de confirmación...', !!onDataUpdated);
            if (onDataUpdated) {
              console.log('Llamando a onDataUpdated desde GenerarDeclaracionModal');
              onDataUpdated();
            } else {
              console.warn('No hay función onDataUpdated disponible en GenerarDeclaracionModal');
            }
          }
        }
        
        // Primero ejecutamos onDataUpdated si existe (no lo hacemos dentro del if de marcarEnProcesoResponse.ok)
        // para asegurarnos que siempre se actualice incluso si hay error en marcarEnProceso
        console.log('Verificando onDataUpdated antes de cerrar...', !!onDataUpdated);
        if (onDataUpdated) {
          console.log('Ejecutando onDataUpdated antes de cerrar modal');
          try {
            await onDataUpdated();
            console.log('onDataUpdated ejecutado con éxito');
          } catch (updateError) {
            console.error('Error al actualizar datos:', updateError);
          }
        }
        
        // Cerrar el modal después de actualizar
        onClose();
      } catch (uploadError) {
        console.error('Error al procesar el archivo en el servidor:', uploadError);
        alert('El PDF se ha generado correctamente, pero hubo un error al procesarlo en el servidor.');
      }
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    }
  };
  
  // Efecto para inicializar los valores cuando cambian las métricas
  useEffect(() => {
    if (declaracion.metricas) {
      // Inicializar con valores por defecto
      setSaldoAFavor("0.00");
      setRetenciones("0.00");
      setPercepciones("0.00");
      setMultasIntereses("0.00");
    }
  }, [declaracion.metricas]);

  const formatPeriodo = (periodo: string) => {
    // Formato esperado: YYYY-MM-DD o MM/YYYY
    if (periodo.includes("-")) {
      const date = new Date(periodo);
      return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    }
    return periodo;
  };

  const getNombreCompleto = () => {
    if (!declaracion.cliente) return "Cliente";
    
    if (declaracion.cliente.tipoCliente === "PERSONA_NATURAL") {
      return `${declaracion.cliente.nombres} ${declaracion.cliente.apellidos}`;
    } else {
      return declaracion.cliente.nombres; // Para personas jurídicas, el nombre de la empresa está en "nombres"
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden px-6">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Procesando Declaración - {getNombreCompleto()}
          </DialogTitle>
          <div className="flex items-center gap-2 text-green-600 mt-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Cálculo Automático Completado</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Datos procesados correctamente. Revisa los resultados antes de enviar.
          </p>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Datos del cliente */}
          <div className="space-y-2">
            <h3 className="font-medium">Datos del contribuyente</h3>
            <div ref={pdfContentRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">RUC/DNI:</p>
                <p className="font-medium">{declaracion.cliente?.rucDni || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nombre:</p>
                <p className="font-medium">{getNombreCompleto()}</p>
              </div>
            </div>
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-amber-800 text-sm mt-2">
              <p className="font-medium">Nota: declara con tu usuario sol y clave sol</p>
            </div>
          </div>

          <Separator />

          {/* Datos generales */}
          <div className="space-y-2">
            <h3 className="font-medium">Datos Generales</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                Periodo Tributario: <span className="font-medium">{formatPeriodo(declaracion.periodoTributario)}</span>
              </li>
              <li>
                Tipo de régimen: <span className="font-medium">{declaracion.cliente?.tipoRuc || "-"}</span>
              </li>
              <li>
                Tipo de declaración: <span className="font-medium">Original</span>
              </li>
            </ul>
          </div>

          <Separator />

          {/* Resumen de cálculos */}
          <div>
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              Resumen de Cálculos
            </h3>

            <Card className="p-4 mb-4 mx-1">
              <h4 className="font-medium mb-2">Impuesto General a las Ventas (IGV)</h4>
              <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                <li>
                  C100: Ingresos gravados: <span className="font-medium">{formatCurrency(declaracion.metricas?.ingresosGravados || declaracion.totalIngresos || 0)}</span>
                </li>
                <li>
                  Ingresos exoneradas: <span className="font-medium">{formatCurrency(declaracion.metricas?.ingresosExonerados || 0)}</span>
                </li>
                <li>
                  Ingresos inafectos: <span className="font-medium">{formatCurrency(declaracion.metricas?.ingresosInafectos || 0)}</span>
                </li>
                <li>
                  IGV ventas: <span className="font-medium">{formatCurrency(declaracion.metricas?.totalIgvIngresos || declaracion.igvVentas || 0)}</span>
                </li>
              </ul>
            </Card>

            <Card className="p-4 mb-4 mx-1">
              <h4 className="font-medium mb-2">Crédito Fiscal (Compras)</h4>
              <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                <li>
                  Compras gravadas: <span className="font-medium">{formatCurrency(declaracion.metricas?.egresosGravados || 0)}</span>
                </li>
                <li>
                  Compras exoneradas: <span className="font-medium">{formatCurrency(declaracion.metricas?.egresosExonerados || 0)}</span>
                </li>
                <li>
                  Compras inafectas: <span className="font-medium">{formatCurrency(declaracion.metricas?.egresosInafectos || 0)}</span>
                </li>
                <li>
                  IGV compras: <span className="font-medium">{formatCurrency(declaracion.metricas?.totalIgvEgresos || declaracion.igvCompras || 0)}</span>
                </li>
              </ul>
            </Card>

            <Card className="p-4 mb-4 mx-1">
              <h4 className="font-medium mb-2">Resultado del IGV</h4>
              <ul className="list-none space-y-3 pl-2">
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">IGV neto a pagar:</span> 
                    <span className="font-medium">{formatCurrency(calcularIgvNetoPagar())}</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">Saldo a favor IGV:</span>
                    <div className="flex-1 max-w-[150px]">
                      <Input 
                        type="number" 
                        value={saldoAFavor} 
                        onChange={(e) => setSaldoAFavor(e.target.value)}
                        className="h-8 text-right" 
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">Retenciones de IGV:</span>
                    <div className="flex-1 max-w-[150px]">
                      <Input 
                        type="number" 
                        value={retenciones} 
                        onChange={(e) => setRetenciones(e.target.value)}
                        className="h-8 text-right" 
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">Percepciones de IGV:</span>
                    <div className="flex-1 max-w-[150px]">
                      <Input 
                        type="number" 
                        value={percepciones} 
                        onChange={(e) => setPercepciones(e.target.value)}
                        className="h-8 text-right" 
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </li>
              </ul>
            </Card>

            <Card className="p-4 mb-4 mx-1">
              <h4 className="font-medium mb-2">Impuesto a la Renta (IR)</h4>
              <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                <li>
                  C 120: Ingresos netos del mes: <span className="font-medium">{formatCurrency(declaracion.metricas?.ingresosGravados || declaracion.totalIngresos || 0)}</span>
                </li>
                <li>
                  C 121: Impuesto a la Renta (1.5%): <span className="font-medium">{formatCurrency((declaracion.metricas?.ingresosGravados || declaracion.totalIngresos || 0) * 0.015)}</span>
                </li>
                <li>
                  IR estimado: <span className="font-medium">{formatCurrency(declaracion.irEstimado || (declaracion.metricas?.ingresosGravados || declaracion.totalIngresos || 0) * 0.015)}</span>
                </li>
              </ul>
            </Card>

            <Card className="p-4 mb-4 mx-1">
              <h4 className="font-medium mb-2">Multas e intereses</h4>
              <div className="flex items-center gap-2 mt-3">
                <span>Monto de multas e intereses:</span>
                <div className="flex-1 max-w-[150px]">
                  <Input 
                    type="number" 
                    value={multasIntereses} 
                    onChange={(e) => setMultasIntereses(e.target.value)}
                    className="h-8 text-right" 
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gray-50 mx-1">
              <h4 className="font-medium mb-2">Total a pagar</h4>
              <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                <li>
                  IGV neto a pagar: <span className="font-medium">{formatCurrency(calcularIgvNetoPagar())}</span>
                </li>
                <li>
                  Impuesto a la Renta: <span className="font-medium">{formatCurrency(calcularIrEstimado())}</span>
                </li>
                <li>
                  Multas e intereses: <span className="font-medium">{formatCurrency(parseFloat(multasIntereses) || 0)}</span>
                </li>
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Casilla 140: Total a pagar</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(calcularTotalPagar())}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Ajustar Manual
            </Button>
            <Button onClick={generarPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Confirmar y Descargar PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerarDeclaracionModal;
