import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Categoria, CategoriaCreate, CategoriaUpdate } from '../../interfaces/categoria.interface';
import { AuthService } from '../../services/auth.service';
import { CategoriaService } from '../../services/categoria.service';
import { NotificationService } from '../../services/notification.service';
import { mensajeError, soloEspacios } from '../../utils/validaciones';

/** Etiqueta legible de cada campo para los mensajes de validación. */
const ETIQUETAS: Record<string, string> = {
  nombre: 'El nombre',
  descripcion: 'La descripción',
};

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './categorias.component.html',
})
export class CategoriasComponent implements OnInit {
  protected readonly servicio = inject(CategoriaService);
  private readonly notificaciones = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly modalAbierto = signal(false);
  protected readonly editandoId = signal<number | null>(null);

  /** Reactive Forms con Signals: validación en tiempo real de la categoría. */
  protected readonly formulario = new FormGroup({
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
      validators: [Validators.maxLength(500)],
    }),
    activo: new FormControl(true, { nonNullable: true }),
  });

  /** valueChanges del formulario expuesto como Signal. */
  private readonly cambiosFormulario = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });

  /** Estado derivado del formulario (se recalcula con cada cambio). */
  protected readonly formularioValido = computed(() => {
    this.cambiosFormulario();
    return this.formulario.valid;
  });

  ngOnInit(): void {
    if (!this.auth.autenticado()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.servicio.obtenerTodas().subscribe({
      error: () => {
        this.notificaciones.showError(
          this.servicio.error() || 'No se pudieron cargar las categorías.',
        );
      },
    });
  }

  /** Mensaje de validación del campo (solo si es inválido y ya fue tocado). */
  protected errorDe(nombre: 'nombre' | 'descripcion'): string | null {
    return mensajeError(this.formulario.get(nombre), ETIQUETAS[nombre] ?? 'Este campo');
  }

  abrirNuevo(): void {
    this.editandoId.set(null);
    this.formulario.reset({ nombre: '', descripcion: '', activo: true });
    this.modalAbierto.set(true);
  }

  abrirEditar(categoria: Categoria): void {
    this.editandoId.set(categoria.id_categoria);
    this.formulario.setValue({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? '',
      activo: categoria.activo,
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

    const { nombre, descripcion, activo } = this.formulario.getRawValue();
    const nombreLimpio = nombre.trim();
    const descripcionLimpia = descripcion.trim() || null;

    if (this.editandoId() === null) {
      const datos: CategoriaCreate = { nombre: nombreLimpio, descripcion: descripcionLimpia };
      this.servicio.crear(datos).subscribe({
        next: () => {
          this.notificaciones.showSuccess(`Categoría "${nombreLimpio}" creada con éxito.`);
          this.cerrarModal();
        },
        error: () => {
          this.notificaciones.showError(this.servicio.error() || 'No se pudo crear la categoría.');
        },
      });
      return;
    }

    const datos: CategoriaUpdate = {
      id_categoria: this.editandoId()!,
      nombre: nombreLimpio,
      descripcion: descripcionLimpia,
      activo,
    };
    this.servicio.actualizar(datos).subscribe({
      next: () => {
        this.notificaciones.showSuccess(`Categoría "${nombreLimpio}" actualizada.`);
        this.cerrarModal();
      },
      error: () => {
        this.notificaciones.showError(
          this.servicio.error() || 'No se pudo actualizar la categoría.',
        );
      },
    });
  }
}
