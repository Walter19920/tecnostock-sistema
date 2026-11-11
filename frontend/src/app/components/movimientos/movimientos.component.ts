import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ParametrosMovimiento, TipoMovimiento } from '../../interfaces/movimiento.interface';
import { AuthService } from '../../services/auth.service';
import { MovimientoService } from '../../services/movimiento.service';
import { NotificationService } from '../../services/notification.service';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './movimientos.component.html',
})
export class MovimientosComponent implements OnInit {
  protected readonly servicio = inject(MovimientoService);
  protected readonly productos = inject(ProductoService);
  private readonly notificaciones = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // --- ESTADO PAGINACIÓN Y FILTROS ---
  protected readonly paginaActual = signal(1);
  protected readonly tamanioPagina = signal(10);
  protected readonly filtroTipo = signal<string>('');
  protected readonly filtroProducto = signal<number | null>(null);
  protected readonly filtroTexto = signal<string>('');

  // --- RANGO DE FECHAS DEL HISTORIAL (RF05) ---
  protected readonly filtroFechaInicio = signal<string>('');
  protected readonly filtroFechaFin = signal<string>('');

  // --- MOVIMIENTOS FILTRADOS EN FRONTEND ---
  protected readonly movimientosFiltrados = computed(() => {
    let lista = this.servicio.movimientos();
    const tipo = this.filtroTipo();
    const prodId = this.filtroProducto();
    const texto = this.filtroTexto().toLowerCase().trim();

    // 1. Filtro por Tipo (ENTRADA / SALIDA)
    if (tipo) {
      lista = lista.filter((m) => m.tipo?.toUpperCase() === tipo.toUpperCase());
    }

    // 2. Filtro por Producto
    if (prodId !== null) {
      const prodObj = this.productos.productos().find((p) => p.id_producto === Number(prodId));
      if (prodObj) {
        lista = lista.filter(
          (m) =>
            m.producto === prodObj.nombre ||
            (m as { id_producto?: number }).id_producto === Number(prodId),
        );
      }
    }

    // 3. Filtro por Texto en Buscador (Usuario, Producto u Observación)
    if (texto) {
      lista = lista.filter((m) => {
        const usuarioStr = String(m.usuario || '').toLowerCase();
        const productoStr = String(m.producto || '').toLowerCase();
        const observacionStr = String(m.observacion || '').toLowerCase();

        return (
          usuarioStr.includes(texto) ||
          productoStr.includes(texto) ||
          observacionStr.includes(texto)
        );
      });
    }

    // 4. Filtro por rango de fechas (desde / hasta, ambas inclusive)
    const desde = this.filtroFechaInicio();
    const hasta = this.filtroFechaFin();
    if (desde || hasta) {
      lista = lista.filter((m) => {
        const fecha = this.soloFecha(m.fecha);
        return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
      });
    }

    return lista;
  });

  /** Extrae la parte local AAAA-MM-DD de una fecha venga como venga del backend. */
  private soloFecha(valor: string): string {
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return String(valor).slice(0, 10);
    }
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
  }

  // --- ESTADO MODAL ---
  protected readonly modalAbierto = signal(false);
  protected readonly enviado = signal(false);

  protected readonly productoId = signal<number | null>(null);
  protected readonly tipo = signal<TipoMovimiento>('ENTRADA');
  protected readonly cantidad = signal(1);
  protected readonly observacion = signal('');

  protected readonly productoSeleccionado = computed(() => {
    const id = this.productoId();
    if (!id) return null;
    return this.productos.productos().find((p) => p.id_producto === id) ?? null;
  });

  protected readonly stockDisponible = computed(() => {
    return this.productoSeleccionado()?.stock_actual ?? 0;
  });

  protected readonly stockInsuficiente = computed(() => {
    return (
      this.tipo() === 'SALIDA' &&
      this.productoSeleccionado() !== null &&
      this.cantidad() > this.stockDisponible()
    );
  });

  protected readonly formularioValido = computed(() => {
    return !!this.productoId() && this.cantidad() >= 1 && !this.stockInsuficiente();
  });

  ngOnInit(): void {
    if (!this.auth.autenticado()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.productos.obtenerTodos().subscribe({ error: () => undefined });
    this.cargarMovimientos();
  }

  /** Carga los movimientos pasando paginación y filtros a la API */
  cargarMovimientos(): void {
    const params: ParametrosMovimiento = {
      pagina: this.paginaActual(),
      tamanio_pagina: this.filtroTexto().trim() ? 100 : this.tamanioPagina(),
    };

    if (this.filtroTipo()) {
      params.tipo = this.filtroTipo() as TipoMovimiento;
    }
    if (this.filtroProducto() !== null) {
      params.id_producto = Number(this.filtroProducto());
    }
    if (this.filtroFechaInicio()) {
      params.fecha_inicio = this.filtroFechaInicio();
    }
    if (this.filtroFechaFin()) {
      params.fecha_fin = this.filtroFechaFin();
    }

    this.servicio.obtenerTodos(params).subscribe({
      error: () => {
        this.notificaciones.showError(
          this.servicio.error() || 'No se pudo cargar el historial de movimientos.',
        );
      },
    });
  }

  // --- MÉTODOS DE PAGINACIÓN Y FILTROS ---
  paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.update((p) => p - 1);
      this.cargarMovimientos();
    }
  }

  paginaSiguiente(): void {
    if (this.movimientosFiltrados().length >= this.tamanioPagina()) {
      this.paginaActual.update((p) => p + 1);
      this.cargarMovimientos();
    }
  }

  cambiarTamanio(nuevoTamanio: number): void {
    this.tamanioPagina.set(Number(nuevoTamanio));
    this.paginaActual.set(1);
    this.cargarMovimientos();
  }

  aplicarFiltros(): void {
    this.paginaActual.set(1);
    this.cargarMovimientos();
  }

  limpiarFiltros(): void {
    this.filtroTipo.set('');
    this.filtroProducto.set(null);
    this.filtroTexto.set('');
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
    this.paginaActual.set(1);
    this.cargarMovimientos();
  }

  // --- LÓGICA DEL MODAL ---
  abrirNuevo(): void {
    this.productoId.set(null);
    this.tipo.set('ENTRADA');
    this.cantidad.set(1);
    this.observacion.set('');
    this.enviado.set(false);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  seleccionarProducto(id: number | null): void {
    this.productoId.set(id);
  }

  cambiarTipo(nuevoTipo: TipoMovimiento): void {
    this.tipo.set(nuevoTipo);
  }

  cambiarCantidad(valor: unknown): void {
    this.cantidad.set(Math.max(0, Number(valor) || 0));
  }

  guardar(): void {
    this.enviado.set(true);

    if (!this.formularioValido()) {
      if (this.stockInsuficiente()) {
        this.notificaciones.showWarning(
          `Stock insuficiente: solicitas ${this.cantidad()} un. pero sólo hay ${this.stockDisponible()} un.`,
          'Validación de Stock',
        );
      } else {
        this.notificaciones.showWarning('Por favor selecciona un producto y una cantidad válida.');
      }
      return;
    }

    const id_producto = this.productoId()!;
    const cantidad = this.cantidad();
    const observacion = this.observacion().trim() || null;
    const prod = this.productoSeleccionado();

    if (this.tipo() === 'ENTRADA') {
      this.servicio
        .registrarEntrada({
          id_producto,
          cantidad,
          precio_compra: prod?.precio_compra ?? 0,
          observacion,
        })
        .subscribe({
          next: () => {
            this.notificaciones.showSuccess(
              `Entrada de ${cantidad} unidad(es) registrada con éxito.`,
            );
            this.cerrarModal();
            this.productos.obtenerTodos().subscribe({ error: () => undefined });
            this.cargarMovimientos();
          },
          error: (err) => {
            this.notificaciones.showError(
              err?.error?.detail || this.servicio.error() || 'No se pudo registrar la entrada.',
            );
          },
        });
      return;
    }

    this.servicio
      .registrarSalida({
        id_producto,
        cantidad,
        precio_venta: prod?.precio_venta ?? 0,
        observacion,
      })
      .subscribe({
        next: () => {
          this.notificaciones.showSuccess(`Salida de ${cantidad} unidad(es) registrada con éxito.`);
          this.cerrarModal();
          this.productos.obtenerTodos().subscribe({ error: () => undefined });
          this.cargarMovimientos();
        },
        error: (err) => {
          this.notificaciones.showError(
            err?.error?.detail || this.servicio.error() || 'No se pudo registrar la salida.',
          );
        },
      });
  }
}
