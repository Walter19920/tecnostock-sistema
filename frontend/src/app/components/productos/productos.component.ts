import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { Producto, ProductoCreate, ProductoUpdate } from '../../interfaces/producto.interface';
import { ParametrosPaginacion } from '../../interfaces/paginacion.interface';
import { AuthService } from '../../services/auth.service';
import { CategoriaService } from '../../services/categoria.service';
import { NotificationService } from '../../services/notification.service';
import { ProductoService } from '../../services/producto.service';
import { entero, mensajeError, positivo, soloEspacios } from '../../utils/validaciones';

/** Etiqueta legible de cada campo para los mensajes de validación. */
const ETIQUETAS: Record<string, string> = {
  codigo: 'El código',
  nombre: 'El nombre',
  descripcion: 'La descripción',
  id_categoria: 'La categoría',
  precio_compra: 'El precio de compra',
  precio_venta: 'El precio de venta',
  stock_inicial: 'El stock inicial',
  stock_minimo: 'El stock mínimo',
  imagenUrl: 'La URL de la imagen',
};

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CurrencyPipe],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css',
})
export class ProductosComponent implements OnInit {
  protected readonly servicio = inject(ProductoService);
  protected readonly categorias = inject(CategoriaService);
  private readonly notificaciones = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Paginación por Signals */
  readonly paginaActual = signal(1);
  readonly limite = signal(10);

  /** Filtro por categoría del listado (RF01) */
  readonly filtroCategoria = signal<number | null>(null);

  /** Búsqueda reactiva con debounce (Reactive Forms) */
  protected readonly busqueda = new FormControl('', { nonNullable: true });

  protected readonly modalAbierto = signal(false);
  protected readonly editandoId = signal<number | null>(null);
  protected readonly errorImagenModal = signal(false);
  protected readonly imagenesConError = signal<Set<number>>(new Set());

  /** Reactive Forms con Signals: validación en tiempo real del producto */
  protected readonly formulario = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[A-Za-z0-9._-]+$/),
        soloEspacios(),
      ],
    }),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120),
        soloEspacios(),
      ],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(300)],
    }),
    id_categoria: new FormControl<number | null>(null, { validators: [Validators.required] }),
    imagenUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    precio_compra: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    precio_venta: new FormControl<number | null>(null, {
      validators: [Validators.required, positivo()],
    }),
    stock_inicial: new FormControl<number | null>(null, {
      validators: [Validators.min(0), entero()],
    }),
    stock_minimo: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), entero()],
    }),
  });

  /** valueChanges del formulario expuesto como Signal */
  private readonly cambiosFormulario = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });

  /** Estado derivado del formulario (se recalcula con cada cambio) */
  protected readonly formularioValido = computed(() => {
    this.cambiosFormulario();
    return this.formulario.valid;
  });

  /** Live Preview de la imagen ingresada mediante Signals */
  protected readonly imagenUrlPreview = computed(() => {
    const raw = this.cambiosFormulario()?.imagenUrl;
    return typeof raw === 'string' ? raw.trim() : '';
  });

  /** Icono representativo según la categoría seleccionada en el formulario */
  protected readonly iconoCategoriaActual = computed(() => {
    const idCat = this.cambiosFormulario()?.id_categoria;
    if (!idCat) return 'bi-box-seam';
    const cat = this.categorias.categorias().find((c) => c.id_categoria === idCat);
    return this.obtenerIconoCategoria(cat?.nombre);
  });

  /** Productos de la página actual filtrados por categoría (client-side) */
  protected readonly productosVisibles = computed(() => {
    const idCat = this.filtroCategoria();
    const lista = this.servicio.productos();
    if (idCat === null) {
      return lista;
    }
    return lista.filter((p) => p.id_categoria === idCat);
  });

  constructor() {
    this.busqueda.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.paginaActual.set(1);
        this.cargarProductos();
      });
  }

  ngOnInit(): void {
    if (!this.auth.autenticado()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.cargarProductos();
    this.categorias.obtenerTodas().subscribe({ error: () => undefined });
  }

  /** Conecta la paginación con la llamada al servicio de productos */
  cargarProductos(): void {
    const params: ParametrosPaginacion = {
      pagina: this.paginaActual(),
      tamanio_pagina: this.limite(),
      busqueda: this.busqueda.value.trim() || undefined,
      id_categoria: this.filtroCategoria() ?? undefined,
    };

    this.servicio.obtenerTodos(params).subscribe({
      error: (err) => {
        this.notificaciones.showError(
          this.servicio.error() || 'No se pudieron cargar los productos.',
        );
      },
    });
  }

  /** Botón Anterior */
  paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.update((p) => p - 1);
      this.cargarProductos();
    }
  }

  /** Botón Siguiente */
  paginaSiguiente(): void {
    if (this.servicio.productos().length >= this.limite()) {
      this.paginaActual.update((p) => p + 1);
      this.cargarProductos();
    }
  }

  /** Mensaje de validación del campo (solo si es inválido y ya fue tocado) */
  protected errorDe(nombre: string): string | null {
    return mensajeError(this.formulario.get(nombre), ETIQUETAS[nombre] ?? 'Este campo');
  }

  limpiarBusqueda(): void {
    this.busqueda.setValue('');
  }

  onModalImageError(): void {
    this.errorImagenModal.set(true);
  }

  onTableImageError(idProducto: number): void {
    this.imagenesConError.update((set) => {
      const nuevo = new Set(set);
      nuevo.add(idProducto);
      return nuevo;
    });
  }

  obtenerIconoCategoria(categoria?: string | null): string {
    const c = (categoria || '').toLowerCase();
    if (c.includes('laptop') || c.includes('notebook') || c.includes('comput'))
      return 'bi-laptop text-primary fs-5';
    if (
      c.includes('perif') ||
      c.includes('accesorio') ||
      c.includes('mouse') ||
      c.includes('teclado')
    )
      return 'bi-mouse text-primary fs-5';
    if (c.includes('monitor') || c.includes('pantalla')) return 'bi-display text-primary fs-5';
    if (c.includes('audio') || c.includes('auricular') || c.includes('parlante'))
      return 'bi-headphones text-primary fs-5';
    if (c.includes('red') || c.includes('conectividad') || c.includes('router'))
      return 'bi-router text-primary fs-5';
    if (
      c.includes('almacenamiento') ||
      c.includes('disco') ||
      c.includes('ssd') ||
      c.includes('usb')
    )
      return 'bi-hdd text-primary fs-5';
    return 'bi-box-seam-fill text-primary fs-5';
  }

  abrirNuevo(): void {
    this.editandoId.set(null);
    this.errorImagenModal.set(false);
    this.formulario.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      id_categoria: null,
      imagenUrl: '',
      precio_compra: null,
      precio_venta: null,
      stock_inicial: null,
      stock_minimo: null,
    });
    this.modalAbierto.set(true);
  }

  abrirEditar(producto: Producto): void {
    this.editandoId.set(producto.id_producto);
    this.errorImagenModal.set(false);
    this.formulario.reset({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      id_categoria: producto.id_categoria,
      imagenUrl: producto.imagenUrl ?? producto.imagen_url ?? '',
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      stock_inicial: null,
      stock_minimo: producto.stock_minimo,
    });
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.notificaciones.showWarning('Por favor completa todos los campos requeridos.');
      return;
    }

    const valores = this.formulario.getRawValue();
    const codigo = valores.codigo.trim();
    const nombre = valores.nombre.trim();
    const descripcion = valores.descripcion.trim() || null;
    const id_categoria = valores.id_categoria!;
    const imagenUrl = valores.imagenUrl.trim() || null;
    const precio_compra = valores.precio_compra ?? 0;
    const precio_venta = valores.precio_venta!;
    const stock_minimo = valores.stock_minimo!;

    if (this.editandoId() === null) {
      const datos: ProductoCreate = {
        codigo,
        nombre,
        descripcion,
        id_categoria,
        imagenUrl,
        imagen_url: imagenUrl,
        precio_compra,
        precio_venta,
        stock_inicial: valores.stock_inicial ?? 0,
        stock_minimo,
      };
      this.servicio.crear(datos).subscribe({
        next: () => {
          this.notificaciones.showSuccess(`Producto "${codigo}" registrado correctamente.`);
          this.cerrarModal();
          this.cargarProductos();
        },
        error: () => {
          this.notificaciones.showError(this.servicio.error() || 'No se pudo crear el producto.');
        },
      });
      return;
    }

    const datos: ProductoUpdate = {
      id_producto: this.editandoId()!,
      codigo,
      nombre,
      descripcion,
      id_categoria,
      imagenUrl,
      imagen_url: imagenUrl,
      precio_compra,
      precio_venta,
      stock_minimo,
    };
    this.servicio.actualizar(datos).subscribe({
      next: () => {
        this.notificaciones.showSuccess(`Producto "${codigo}" actualizado correctamente.`);
        this.cerrarModal();
        this.cargarProductos();
      },
      error: () => {
        this.notificaciones.showError(
          this.servicio.error() || 'No se pudo actualizar el producto.',
        );
      },
    });
  }

  desactivar(producto: Producto): void {
    if (!window.confirm(`¿Estás seguro de desactivar el producto "${producto.nombre}"?`)) {
      return;
    }
    this.servicio.desactivar(producto.id_producto).subscribe({
      next: () => {
        this.notificaciones.showSuccess(`Producto "${producto.nombre}" desactivado con éxito.`);
        this.cargarProductos();
      },
      error: () => {
        this.notificaciones.showError(
          this.servicio.error() || 'No se pudo desactivar el producto.',
        );
      },
    });
  }
}
