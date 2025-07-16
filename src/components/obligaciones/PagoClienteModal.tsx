import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar, Upload, Loader2, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import type { ObligacionResponse } from "@/types/obligacion";

interface PagoClienteModalProps {
  obligacion: ObligacionResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PagoClienteModal: React.FC<PagoClienteModalProps> = ({
  obligacion,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [medioPago, setMedioPago] = useState<string>("TRANSFERENCIA");
  const [urlVoucher, setUrlVoucher] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejar la selección de archivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      setUploadSuccess(false);
    }
  };

  // Subir archivo al servidor
  const handleFileUpload = async () => {
    if (!fileInputRef.current?.files?.length) {
      return;
    }

    const file = fileInputRef.current.files[0];
    setUploadingFile(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("archivo", file);

      const response = await fetch("http://localhost:8099/api/archivos/subir-comprobante", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Error al subir el archivo");
      }

      const urlRelativa = await response.text();
      setUrlVoucher(urlRelativa);
      setUploadSuccess(true);
    } catch (err: any) {
      setError("Error al subir el archivo: " + (err.message || "Error desconocido"));
      setUploadSuccess(false);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (!obligacion) return;
    
    if (!urlVoucher) {
      setError("Debe subir un comprobante de pago");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const url = `http://localhost:8099/api/v1/obligaciones/${obligacion.id}/pagos/cliente`;
      
      const pagoData = {
        fechaPago: format(new Date(), "yyyy-MM-dd"),
        medioPago: medioPago,
        urlVoucher: urlVoucher
      };
      
      console.log('Enviando datos de pago:', JSON.stringify(pagoData));
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(pagoData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Verificar si es el error específico de la restricción de verificación
        if (errorText.includes('obligacion_estado_check')) {
          throw new Error('Error en la base de datos: El estado "POR_VALIDAR" no está permitido. Por favor, contacte al administrador del sistema.');
        } else {
          throw new Error(`Error al registrar el pago: ${response.status}`);
        }
      }

      // Limpiar el formulario
      setSelectedFileName("");
      setUrlVoucher("");
      setUploadSuccess(false);
      
      // Cerrar modal y notificar éxito
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError("Error al registrar el pago: " + (err.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFileName("");
    setUrlVoucher("");
    setUploadSuccess(false);
    setError("");
    setMedioPago("TRANSFERENCIA");
  };

  // Limpiar el formulario cuando se cierra el modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago de Obligación</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 p-3 rounded-md flex items-center gap-2 text-red-700 mb-4">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 py-4">
          {obligacion && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Obligación</Label>
                <div className="font-medium mt-1">{obligacion.tipo}</div>
              </div>
              <div>
                <Label>Monto</Label>
                <div className="font-medium mt-1">S/ {obligacion.monto.toFixed(2)}</div>
              </div>
              <div>
                <Label>Periodo Tributario</Label>
                <div className="font-medium mt-1">{obligacion.periodoTributario}</div>
              </div>
              <div>
                <Label>Fecha Límite</Label>
                <div className="font-medium mt-1">
                  {format(new Date(obligacion.fechaLimite), "dd/MM/yyyy")}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="medioPago">Medio de Pago</Label>
            <Select value={medioPago} onValueChange={setMedioPago}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione medio de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRANSFERENCIA">Transferencia Bancaria</SelectItem>
                <SelectItem value="BCP">BCP</SelectItem>
                <SelectItem value="INTERBANK">Interbank</SelectItem>
                <SelectItem value="YAPE">Yape</SelectItem>
                <SelectItem value="NPS">NPS</SelectItem>
                <SelectItem value="BANCO">Banco</SelectItem>
                <SelectItem value="APP">App</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comprobante">Comprobante de Pago</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="comprobante"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".jpg,.jpeg,.png,.pdf"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Seleccionar archivo
              </Button>
              {selectedFileName && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFileUpload}
                  disabled={uploadingFile || uploadSuccess}
                  className="flex items-center gap-2"
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : uploadSuccess ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Subido
                    </>
                  ) : (
                    "Subir archivo"
                  )}
                </Button>
              )}
            </div>
            {selectedFileName && (
              <div className="text-sm text-muted-foreground mt-1">
                Archivo seleccionado: {selectedFileName}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !urlVoucher}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                Generar Pago
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PagoClienteModal;
