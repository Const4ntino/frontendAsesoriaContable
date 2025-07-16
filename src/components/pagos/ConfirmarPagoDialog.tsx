import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmarPagoDialogProps {
  pagoId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ConfirmarPagoDialog: React.FC<ConfirmarPagoDialogProps> = ({
  pagoId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleValidarPago = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8099/api/v1/pagos/${pagoId}/actualizar-estado`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "text/plain"
        },
        body: "VALIDADO"
      });

      if (!response.ok) {
        throw new Error(`Error al validar el pago: ${response.status}`);
      }

      console.log("Pago validado correctamente");
      // Llamamos a onSuccess primero para asegurar que se recarguen los datos
      onSuccess();
      // Luego cerramos el diálogo
      onClose();
    } catch (error) {
      console.error("Error al validar pago:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRechazarPago = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8099/api/v1/pagos/${pagoId}/rechazar-pago`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "text/plain"
        },
        body: "Pago rechazado por el contador"
      });

      if (!response.ok) {
        throw new Error(`Error al rechazar el pago: ${response.status}`);
      }

      console.log("Pago rechazado correctamente");
      // Llamamos a onSuccess primero para asegurar que se recarguen los datos
      onSuccess();
      // Luego cerramos el diálogo
      onClose();
    } catch (error) {
      console.error("Error al rechazar pago:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar acción</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            ¿Desea validar o rechazar este pago? Esta acción no se puede deshacer.
          </p>
        </DialogHeader>
        <DialogFooter className="flex items-center justify-between">
          <Button 
            variant="destructive" 
            onClick={handleRechazarPago}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Rechazar Pago
          </Button>
          <Button 
            variant="default" 
            onClick={handleValidarPago}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Validar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmarPagoDialog;
