import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  tipo: NotificationType;
  mensaje: string;
  titulo?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  /** Lista de notificaciones activas administradas mediante Signals */
  readonly toasts = signal<ToastNotification[]>([]);

  /**
   * Muestra una notificación con auto-dismiss por defecto a los 4 segundos (4000ms).
   */
  show(tipo: NotificationType, mensaje: string, titulo?: string, duracionMs = 4000): void {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const nuevoToast: ToastNotification = { id, tipo, mensaje, titulo };

    this.toasts.update((actuales) => [...actuales, nuevoToast]);

    if (duracionMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duracionMs);
    }
  }

  showSuccess(mensaje: string, titulo = 'Éxito'): void {
    this.show('success', mensaje, titulo);
  }

  showError(mensaje: string, titulo = 'Error'): void {
    this.show('error', mensaje, titulo);
  }

  showWarning(mensaje: string, titulo = 'Advertencia'): void {
    this.show('warning', mensaje, titulo);
  }

  showInfo(mensaje: string, titulo = 'Información'): void {
    this.show('info', mensaje, titulo);
  }

  dismiss(id: string): void {
    this.toasts.update((actuales) => actuales.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
