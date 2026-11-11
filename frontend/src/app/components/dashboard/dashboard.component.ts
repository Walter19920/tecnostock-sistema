import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { IndicadorService } from '../../services/indicador.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  protected readonly indicador = inject(IndicadorService);
  private readonly notificaciones = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly hoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  ngOnInit(): void {
    if (!this.auth.autenticado()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.indicador.obtenerDashboard().subscribe({
      error: () => {
        this.notificaciones.showError(
          this.indicador.error() || 'No se pudieron cargar los indicadores del dashboard.',
        );
      },
    });
    this.indicador.obtenerStockBajo().subscribe({
      error: () => {
        this.notificaciones.showError(
          this.indicador.error() || 'No se pudieron cargar las alertas de stock bajo.',
        );
      },
    });
  }

  protected nivel(actual: number, minimo: number): number {
    return minimo > 0 ? Math.min(100, Math.round((actual / minimo) * 100)) : 0;
  }
}
