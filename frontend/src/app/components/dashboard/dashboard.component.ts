import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { IndicadorService } from '../../services/indicador.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  template: `
    <div class="container-fluid py-3">
      <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
        <div>
          <h1 class="titulo mb-1"><i class="bi bi-speedometer2"></i>Dashboard</h1>
          <p class="text-muted mb-0">Resumen general de tu inventario</p>
        </div>
        <span class="chip-fecha"><i class="bi bi-calendar3 me-2"></i>{{ hoy }}</span>
      </div>

      @if (indicador.error()) {
        <div class="alert alert-warning" role="alert">
          <i class="bi bi-exclamation-triangle me-2"></i>{{ indicador.error() }}
        </div>
      }

      @if (indicador.cargando() && !indicador.dashboard()) {
        <div class="text-center py-5" role="status">
          <div class="spinner-border text-primary"></div>
        </div>
      }

      @if (indicador.dashboard(); as datos) {
        <div class="row g-3">
          <div class="col-12 col-sm-6 col-xl">
            <div class="stat-card c-azul">
              <div class="stat-icon"><i class="bi bi-box-seam"></i></div>
              <div>
                <div class="stat-valor">{{ datos.total_productos | number }}</div>
                <div class="stat-label">Productos</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-xl">
            <div class="stat-card c-verde">
              <div class="stat-icon"><i class="bi bi-arrow-down-circle"></i></div>
              <div>
                <div class="stat-valor">{{ datos.total_entradas_mes | number }}</div>
                <div class="stat-label">Entradas del mes</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-xl">
            <div class="stat-card c-rojo">
              <div class="stat-icon"><i class="bi bi-arrow-up-circle"></i></div>
              <div>
                <div class="stat-valor">{{ datos.total_salidas_mes | number }}</div>
                <div class="stat-label">Salidas del mes</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-xl">
            <div class="stat-card c-cian">
              <div class="stat-icon"><i class="bi bi-cash-coin"></i></div>
              <div>
                <div class="stat-valor">
                  {{ datos.valor_inventario | currency: 'PEN' : 'S/ ' }}
                </div>
                <div class="stat-label">Valor de inventario</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-xl">
            <div class="stat-card c-ambar">
              <div class="stat-icon"><i class="bi bi-exclamation-triangle"></i></div>
              <div>
                <div class="stat-valor">{{ datos.productos_stock_bajo | number }}</div>
                <div class="stat-label">Con stock bajo</div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel mt-4">
          <div class="panel-head">
            <span class="panel-titulo">
              <i class="bi bi-exclamation-circle"></i>Productos con stock bajo
            </span>
            <span class="pill pill-rojo">{{ indicador.stockBajo().length }} en alerta</span>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Categoría</th>
                  <th scope="col" class="text-end">Stock actual</th>
                  <th scope="col" class="text-end">Stock mínimo</th>
                </tr>
              </thead>
              <tbody>
                @for (item of indicador.stockBajo(); track item.id_producto) {
                  <tr>
                    <td class="nombre">{{ item.nombre }}</td>
                    <td><span class="pill pill-gris">{{ item.categoria }}</span></td>
                    <td class="text-end">
                      <span class="pill pill-rojo">{{ item.stock_actual }}</span>
                      <div class="nivel" title="Stock respecto al mínimo">
                        <div
                          class="nivel-barra"
                          [style.width.%]="nivel(item.stock_actual, item.stock_minimo)"
                        ></div>
                      </div>
                    </td>
                    <td class="text-end">{{ item.stock_minimo }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="vacio">
                      <i class="bi bi-check-circle"></i>
                      <div>Todo en orden: no hay productos con stock bajo</div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .titulo { font-size: 1.7rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: .6rem; }
      .titulo i { display: grid; place-items: center; width: 42px; height: 42px; font-size: 1.2rem; color: #2563eb; background: #dbeafe; border-radius: 12px; }
      .chip-fecha { font-size: .85rem; color: #475569; background: #fff; border: 1px solid #e2e8f0; border-radius: 999px; padding: .4rem .9rem; }

      .c-azul  { --c: #2563eb; --s: #dbeafe; }
      .c-verde { --c: #16a34a; --s: #dcfce7; }
      .c-rojo  { --c: #dc2626; --s: #fee2e2; }
      .c-cian  { --c: #0891b2; --s: #cffafe; }
      .c-ambar { --c: #d97706; --s: #fef3c7; }

      .stat-card { position: relative; display: flex; align-items: center; gap: 1rem; height: 100%; padding: 1.25rem 1.25rem 1.25rem 1.5rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.05); overflow: hidden; transition: transform .2s, box-shadow .2s; }
      .stat-card::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 5px; background: var(--c); }
      .stat-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(15,23,42,.12); }
      .stat-icon { flex: none; display: grid; place-items: center; width: 54px; height: 54px; font-size: 1.5rem; color: var(--c); background: var(--s); border-radius: 14px; }
      .stat-valor { font-size: 1.55rem; font-weight: 700; line-height: 1.1; color: #0f172a; }
      .stat-label { margin-top: .2rem; font-size: .85rem; color: #64748b; }

      .panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.05); overflow: hidden; }
      .panel-head { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; }
      .panel-titulo { font-weight: 600; color: #0f172a; }
      .panel-titulo i { color: #dc2626; margin-right: .5rem; }

      .table thead th { background: #f8fafc; color: #64748b; font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: .8rem 1.25rem; border-bottom: 1px solid #e2e8f0; }
      .table tbody td { padding: .95rem 1.25rem; color: #334155; border-color: #f1f5f9; }
      .table tbody tr:hover > * { background: #eff6ff; }
      .nombre { font-weight: 600; color: #0f172a !important; }

      .pill { display: inline-block; padding: .3em .8em; font-size: .75rem; font-weight: 600; border-radius: 999px; }
      .pill-rojo { background: #fee2e2; color: #b91c1c; }
      .pill-gris { background: #e2e8f0; color: #475569; }

      .nivel { width: 90px; height: 6px; margin: .45rem 0 0 auto; background: #fee2e2; border-radius: 999px; overflow: hidden; }
      .nivel-barra { height: 100%; background: #ef4444; border-radius: 999px; }

      .vacio { text-align: center; padding: 2.5rem 1rem !important; color: #64748b; }
      .vacio i { display: block; margin-bottom: .4rem; font-size: 2rem; color: #16a34a; }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  protected readonly indicador = inject(IndicadorService);
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
    this.indicador.obtenerDashboard().subscribe({ error: () => undefined });
    this.indicador.obtenerStockBajo().subscribe({ error: () => undefined });
  }

  protected nivel(actual: number, minimo: number): number {
    return minimo > 0 ? Math.min(100, Math.round((actual / minimo) * 100)) : 0;
  }
}