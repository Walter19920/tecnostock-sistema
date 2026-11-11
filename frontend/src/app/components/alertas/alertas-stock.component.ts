import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { IndicadorService } from '../../services/indicador.service';
import { NotificationService } from '../../services/notification.service';

/**
 * Pantalla de Alertas de Stock Bajo (RF06).
 * Lista los productos cuyo stock_actual <= stock_minimo a partir de
 * GET /indicadores/stock-bajo y GET /indicadores/dashboard.
 */
@Component({
  selector: 'app-alertas-stock',
  standalone: true,
  imports: [],
  templateUrl: './alertas-stock.component.html',
})
export class AlertasStockComponent implements OnInit {
  protected readonly indicador = inject(IndicadorService);
  protected readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificationService);

  ngOnInit(): void {
    if (!this.auth.autenticado()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.indicador.obtenerStockBajo().subscribe({
      error: () =>
        this.notificaciones.showError(
          this.indicador.error() || 'No se pudieron cargar las alertas de stock bajo.',
        ),
    });
    this.indicador.obtenerDashboard().subscribe({ error: () => undefined });
  }

  /** Porcentaje de ocupación respecto al mínimo (para la barra de nivel). */
  protegerNivel(stockActual: number, stockMinimo: number): number {
    if (!stockMinimo || stockMinimo <= 0) {
      return stockActual > 0 ? 100 : 0;
    }
    return Math.max(4, Math.min(100, Math.round((stockActual / stockMinimo) * 100)));
  }

  /** Estado visual del producto según su stock. */
  estadoDe(stockActual: number, stockMinimo: number): string {
    if (stockActual <= 0) return 'Agotado';
    if (stockActual === stockMinimo) return 'Crítico';
    return 'Stock bajo';
  }

  recargar(): void {
    this.indicador.obtenerStockBajo().subscribe({
      error: () => this.notificaciones.showError('No se pudieron actualizar las alertas.'),
    });
  }
}
