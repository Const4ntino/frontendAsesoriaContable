import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import type { ObligacionResponse } from "@/types/obligacion";
import { Upload, Loader2, Check, AlertCircle } from "lucide-react";

// Enum de medios de pago según el backend
type MedioPago = "TRANSFERENCIA" | "INTERBANK" | "BCP" | "YAPE" | "NPS" | "BANCO" | "APP";

interface PagoContadorModalProps {
  obligacion: ObligacionResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PagoContadorModal: React.FC<PagoContadorModalProps> = ({
  obligacion,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fechaPago: format(new Date(), "yyyy-MM-dd"),
    medioPago: "TRANSFERENCIA" as MedioPago,
    urlVoucher: "",
    comentarioContador: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
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
      setError("Por favor seleccione un archivo");
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
      setFormData(prev => ({ ...prev, urlVoucher: urlRelativa }));
      setUploadSuccess(true);
    } catch (err: any) {
      setError("Error al subir el archivo: " + (err.message || "Error desconocido"));
      setUploadSuccess(false);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!obligacion) return;
    
    // Verificar si se ha subido un comprobante
    if (!formData.urlVoucher) {
      setError("Debe subir un comprobante de pago antes de continuar");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8099/api/v1/obligaciones/${obligacion.id}/pagos/contador`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Error al registrar el pago");
      }

      // Llamar a onSuccess para actualizar la tabla de obligaciones
      if (onSuccess) onSuccess();
      // Mostrar mensaje de éxito
      alert("Pago registrado correctamente");
      onClose();
    } catch (error) {
      console.error("Error al registrar pago:", error);
      alert(error instanceof Error ? error.message : "Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Complete los datos para registrar el pago de la obligación.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {obligacion && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium mb-1">Cliente:</p>
                <p className="text-sm">{obligacion.cliente ? 
                  (obligacion.cliente.tipoCliente === "PERSONA_NATURAL" ? 
                    `${obligacion.cliente.nombres} ${obligacion.cliente.apellidos}` : 
                    obligacion.cliente.nombres) : 
                  `Cliente #${obligacion.id}`
                }</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Monto:</p>
                <p className="text-sm font-bold">${obligacion.monto?.toLocaleString('es-CO')}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Tipo:</p>
                <p className="text-sm">{obligacion.tipo}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Fecha Límite:</p>
                <p className="text-sm">{new Date(obligacion.fechaLimite).toLocaleDateString('es-CO')}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fechaPago">Fecha de Pago</Label>
            <Input
              id="fechaPago"
              name="fechaPago"
              type="date"
              value={formData.fechaPago}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medioPago">Medio de Pago</Label>
            <Select
              value={formData.medioPago}
              onValueChange={(value) =>
                handleSelectChange("medioPago", value as MedioPago)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar medio de pago" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="space-y-2">
            <Label htmlFor="comprobante">Comprobante de Pago (PDF, imagen)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="comprobante"
                type="file"
                ref={fileInputRef}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleFileUpload}
                disabled={uploadingFile || !fileInputRef.current?.files?.length}
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : uploadSuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Subido
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir
                  </>
                )}
              </Button>
            </div>
            {selectedFileName && (
              <p className="text-sm text-muted-foreground mt-1">
                Archivo seleccionado: {selectedFileName}
              </p>
            )}
            {uploadSuccess && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <Check className="mr-1 h-4 w-4" /> Archivo subido correctamente
              </p>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start mt-2">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comentarioContador">Comentarios (opcional)</Label>
            <Textarea
              id="comentarioContador"
              name="comentarioContador"
              placeholder="Ingrese comentarios adicionales..."
              value={formData.comentarioContador}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Generar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PagoContadorModal;
