import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { EstadoObligacion } from "@/types/obligacion"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount)
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function getBadgeVariantByEstadoObligacion(estado: EstadoObligacion): "outline" | "destructive" | "secondary" | "default" | null | undefined {
  switch (estado) {
    case 'PENDIENTE':
      return 'outline';
    case 'PAGADA':
      return 'secondary';
    case 'PAGADA_CON_RETRASO':
      return 'default';
    case 'VENCIDA':
      return 'destructive';
    case 'NO_DISPONIBLE':
      return 'outline';
    default:
      return 'outline';
  }
}
