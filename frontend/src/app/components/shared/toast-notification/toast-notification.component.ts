import { Component, inject } from '@angular/core';
import { NotificationService, NotificationType } from '../../../services/notification.service';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  templateUrl: './toast-notification.component.html',
  styleUrl: './toast-notification.component.css',
})
export class ToastNotificationComponent {
  protected readonly notificaciones = inject(NotificationService);

  cerrar(id: string): void {
    this.notificaciones.dismiss(id);
  }

  obtenerBorde(tipo: NotificationType): string {
    switch (tipo) {
      case 'success':
        return 'border-start border-4 border-success';
      case 'error':
        return 'border-start border-4 border-danger';
      case 'warning':
        return 'border-start border-4 border-warning';
      case 'info':
        return 'border-start border-4 border-info';
    }
  }

  obtenerIcono(tipo: NotificationType): string {
    switch (tipo) {
      case 'success':
        return 'bi-check-circle-fill text-success';
      case 'error':
        return 'bi-x-circle-fill text-danger';
      case 'warning':
        return 'bi-exclamation-triangle-fill text-warning';
      case 'info':
        return 'bi-info-circle-fill text-info';
    }
  }
}
