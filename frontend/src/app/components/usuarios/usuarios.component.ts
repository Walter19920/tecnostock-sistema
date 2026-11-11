import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Rol } from '../../interfaces/auth.interface';
import { UsuarioCreate, UsuarioItem } from '../../interfaces/usuario.interface';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
})
export class UsuariosComponent implements OnInit {
  protected readonly servicio = inject(UsuarioService);
  protected readonly authService = inject(AuthService);
  private readonly notificaciones = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  /** Signals de estado del componente */
  protected readonly busqueda = signal('');
  protected readonly filtroRol = signal<'TODOS' | 'ADMIN' | 'ALMACENERO'>('TODOS');
  protected readonly modalAbierto = signal(false);
  protected readonly mostrarPasswordModal = signal(false);
  protected readonly guardando = signal(false);
  protected readonly enviado = signal(false);

  /** Formulario reactivo de registro */
  protected readonly formulario: FormGroup = this.fb.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['ALMACENERO' as Rol, [Validators.required]],
  });

  /** Cálculo de usuarios activos */
  protected readonly usuariosActivos = computed(
    () => this.servicio.usuarios().filter((u) => u.activo).length,
  );

  /** Filtrado reactivo de usuarios por búsqueda y rol */
  protected readonly usuariosFiltrados = computed(() => {
    const query = this.busqueda().trim().toLowerCase();
    const rol = this.filtroRol();
    const lista = this.servicio.usuarios();

    return lista.filter((usuario) => {
      // Filtro de rol
      if (rol === 'ADMIN' && !this.esRolAdmin(usuario.rol)) {
        return false;
      }
      if (rol === 'ALMACENERO' && this.esRolAdmin(usuario.rol)) {
        return false;
      }

      // Filtro de búsqueda
      if (!query) {
        return true;
      }
      const nombre = (usuario.nombre_completo || usuario.nombre || '').toLowerCase();
      const username = usuario.username.toLowerCase();
      return nombre.includes(query) || username.includes(query);
    });
  });

  ngOnInit(): void {
    this.servicio.listar().subscribe({
      error: () => {
        this.notificaciones.showError(
          this.servicio.error() || 'No se pudo cargar el listado de usuarios.',
        );
      },
    });
  }

  actualizarBusqueda(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busqueda.set(input.value);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  esRolAdmin(rol: string | Rol): boolean {
    const r = (rol || '').toUpperCase();
    return r === 'ADMIN' || r.includes('ADMINISTRADOR');
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'US';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  abrirModalNuevo(): void {
    this.formulario.reset({
      nombre_completo: '',
      username: '',
      password: '',
      rol: 'ALMACENERO',
    });
    this.enviado.set(false);
    this.mostrarPasswordModal.set(false);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  alternarEstado(usuario: UsuarioItem): void {
    const nuevoEstado = !usuario.activo;

    this.servicio.cambiarEstado(usuario.id_usuario, nuevoEstado).subscribe({
      next: () => {
        this.notificaciones.showSuccess(
          `Estado de "${usuario.nombre_completo || usuario.username}" actualizado a ${
            nuevoEstado ? 'Activo' : 'Inactivo'
          }.`,
        );
      },
      error: (err) => {
        console.error('Error al cambiar estado del usuario:', err);
        this.notificaciones.showError(
          'No se pudo actualizar el estado del usuario en la base de datos.',
        );
      },
    });
  }

  esInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    if (!control) return false;
    return control.invalid && (control.touched || control.dirty || this.enviado());
  }

  obtenerMensajeError(campo: string): string | null {
    if (!this.esInvalido(campo)) return null;
    const errors = this.formulario.get(campo)?.errors;
    if (!errors) return null;

    if (errors['required']) return 'Este campo es obligatorio.';
    if (errors['minlength']) {
      return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
    }
    return 'Valor inválido.';
  }

  guardarUsuario(): void {
    this.enviado.set(true);
    if (this.formulario.invalid) {
      this.notificaciones.showWarning('Por favor completa todos los campos requeridos.');
      return;
    }

    this.guardando.set(true);

    const valorForm = this.formulario.value;
    const nuevo: UsuarioCreate = {
      nombre_completo: valorForm.nombre_completo.trim(),
      username: valorForm.username.trim(),
      password: valorForm.password,
      rol: valorForm.rol,
    };

    this.servicio.registrar(nuevo).subscribe({
      next: (usuarioCreado) => {
        this.guardando.set(false);
        this.cerrarModal();
        this.notificaciones.showSuccess(
          `Usuario "${usuarioCreado.nombre_completo || usuarioCreado.username}" registrado correctamente.`,
        );
      },
      error: (err) => {
        this.guardando.set(false);
        this.notificaciones.showError(
          err?.error?.detail || 'No se pudo registrar el usuario. Revisa los datos ingresados.',
        );
      },
    });
  }

  resetearPassword(usuario: UsuarioItem): void {
    const nuevaPassword = prompt(
      `Ingrese la nueva contraseña para "${usuario.nombre_completo || usuario.username}":`,
    );

    if (nuevaPassword === null) return; // Si hace clic en Cancelar

    if (nuevaPassword.trim().length < 6) {
      this.notificaciones.showWarning('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.servicio.cambiarPassword(usuario.id_usuario, nuevaPassword.trim()).subscribe({
      next: () => {
        this.notificaciones.showSuccess(
          `Contraseña actualizada correctamente para "${usuario.nombre_completo || usuario.username}".`,
        );
      },
      error: (err) => {
        console.error('Error al cambiar contraseña:', err);
        this.notificaciones.showError(err?.error?.detail || 'No se pudo actualizar la contraseña.');
      },
    });
  }
}
