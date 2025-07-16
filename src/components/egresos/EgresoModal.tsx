import React, { useEffect, useState, useRef } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Calendar, FileText, Tag, Upload, Loader2, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  rucDni: string;
}

interface EgresoResponse {
  id: number;
  cliente: Cliente;
  monto: number;
  montoIgv: number;
  fecha: string;
  descripcion: string;
  nroComprobante: string;
  urlComprobante: string;
  tipoContabilidad: string;
  tipoTributario: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface EgresoRequest {
  idCliente: number;
  monto: number;
  montoIgv: number;
  fecha: string;
  descripcion: string;
  nroComprobante: string;
  urlComprobante: string;
  tipoContabilidad: string;
  tipoTributario: string;
}

interface EgresoModalProps {
  open: boolean;
  onClose: () => void;
  egreso?: EgresoResponse | null;
  onSaved?: () => void;
  clienteRegimen?: string;
}

const EgresoModal: React.FC<EgresoModalProps> = ({ open, onClose, egreso, onSaved, clienteRegimen = "" }) => {
  // Verificar si el cliente es de régimen NRUS
  const isNRUS = clienteRegimen === "NRUS";
  const [form, setForm] = useState<EgresoRequest>({
    idCliente: 0,
    monto: 0,
    montoIgv: 0,
    fecha: format(new Date(), "yyyy-MM-dd"),
    descripcion: "",
    nroComprobante: "",
    urlComprobante: "",
    tipoContabilidad: "GASTO",
    tipoTributario: "GRAVADA"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!egreso;

  useEffect(() => {
    if (egreso) {
      setForm({
        idCliente: egreso.cliente.id,
        monto: egreso.monto,
        montoIgv: egreso.montoIgv,
        fecha: format(new Date(`${egreso.fecha}T12:00:00`), "yyyy-MM-dd"),
        descripcion: egreso.descripcion || "",
        nroComprobante: egreso.nroComprobante || "",
        urlComprobante: egreso.urlComprobante || "",
        tipoContabilidad: egreso.tipoContabilidad,
        tipoTributario: egreso.tipoTributario
      });
    } else {
      setForm({
        idCliente: 0,
        monto: 0,
        montoIgv: 0,
        fecha: format(new Date(), "yyyy-MM-dd"),
        descripcion: "",
        nroComprobante: "",
        urlComprobante: "",
        tipoContabilidad: "GASTO",
        tipoTributario: "GRAVADA"
      });
    }
    setError("");
  }, [egreso, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    if (!isNaN(numValue) || value === "") {
      setForm(prev => ({ ...prev, [name]: value === "" ? 0 : numValue }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
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
      setForm(prev => ({ ...prev, urlComprobante: urlRelativa }));
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
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const url = isEdit
        ? `http://localhost:8099/api/v1/egresos/mis-egresos/${egreso?.id}`
        : "http://localhost:8099/api/v1/egresos/mis-egresos/nuevo";
      
      // Preparar el body de la petición según el régimen
      let bodyData: any = {...form};
      
      // Si es NRUS, establecer montoIgv a 0.0 y no enviar tipoTributario
      if (isNRUS) {
        const { tipoTributario, ...restData } = bodyData;
        bodyData = {
          ...restData,
          montoIgv: 0.0  // Siempre enviar montoIgv con valor 0.0 para NRUS
        };
      }
      
      // Si no hay URL de comprobante, no enviar ese campo
      if (!bodyData.urlComprobante) {
        const { urlComprobante, ...restData } = bodyData;
        bodyData = restData;
      }
      
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar el egreso");
      }

      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el egreso");
    } finally {
      setLoading(false);
    }
  };

  // Validar formulario
  const isFormValid = () => {
    // Validación básica para todos los regímenes
    const basicValidation = form.monto > 0 && form.fecha && form.tipoContabilidad;
    
    // Para NRUS no requerimos validar tipoTributario
    if (isNRUS) {
      return basicValidation;
    }
    
    // Para otros regímenes, validamos también tipoTributario
    return basicValidation && form.tipoTributario;
  };

  // Calcular IGV automáticamente (18% del monto)
  const calcularIGV = () => {
    if (form.tipoTributario === "GRAVADA" && form.monto > 0) {
      const igv = form.monto * 0.18;
      setForm(prev => ({ ...prev, montoIgv: parseFloat(igv.toFixed(2)) }));
    } else {
      setForm(prev => ({ ...prev, montoIgv: 0 }));
    }
  };

  // Calcular IGV cuando cambia el monto o tipo tributario
  useEffect(() => {
    calcularIGV();
  }, [form.monto, form.tipoTributario]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Egreso" : "Registrar Nuevo Egreso"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos del egreso seleccionado."
              : "Completa el formulario para registrar un nuevo egreso."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className={isNRUS ? "" : "grid grid-cols-2 gap-4"}>
            <div className="space-y-2">
              <Label htmlFor="monto">Monto (S/)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  value={form.monto}
                  onChange={handleNumberChange}
                  required
                />
              </div>
            </div>

            {!isNRUS && (
              <div className="space-y-2">
                <Label htmlFor="montoIgv">IGV (S/)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="montoIgv"
                    name="montoIgv"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-8"
                    value={form.montoIgv}
                    onChange={handleNumberChange}
                    disabled={form.tipoTributario !== "GRAVADA"}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="fecha"
                name="fecha"
                type="date"
                className="pl-8"
                value={form.fecha}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              placeholder="Describe el egreso..."
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nroComprobante">Número de Comprobante</Label>
              <div className="relative">
                <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="nroComprobante"
                  name="nroComprobante"
                  placeholder="Ej: F001-00000123"
                  className="pl-8"
                  value={form.nroComprobante}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoContabilidad">Tipo Contabilidad</Label>
              <div className="relative">
                <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                <Select
                  value={form.tipoContabilidad}
                  onValueChange={(value) => handleSelectChange("tipoContabilidad", value)}
                >
                  <SelectTrigger className="pl-8">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GASTO">Gasto</SelectItem>
                    <SelectItem value="COSTO">Costo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {!isNRUS && (
            <div className="space-y-2">
              <Label htmlFor="tipoTributario">Tipo Tributario</Label>
              <div className="relative">
                <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                <Select
                  value={form.tipoTributario}
                  onValueChange={(value) => handleSelectChange("tipoTributario", value)}
                >
                  <SelectTrigger className="pl-8">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GRAVADA">Gravada</SelectItem>
                    <SelectItem value="EXONERADA">Exonerada</SelectItem>
                    <SelectItem value="INAFECTA">Inafecta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Comprobante</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="relative">
                <input 
                  type="file" 
                  id="fileInput" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png" 
                  onChange={handleFileSelect}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar archivo
                </Button>
              </div>
              <Button 
                type="button" 
                onClick={handleFileUpload} 
                disabled={!selectedFileName || uploadingFile || uploadSuccess}
                variant={uploadSuccess ? "outline" : "secondary"}
                className="w-full"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : uploadSuccess ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Subido
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Subir archivo
                  </>
                )}
              </Button>
            </div>
            {selectedFileName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" /> {selectedFileName}
              </p>
            )}
            {form.urlComprobante && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> Comprobante guardado
              </p>
            )}
            {error && error.includes("archivo") && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid() || loading}
            >
              {loading ? "Guardando..." : isEdit ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EgresoModal;
