import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Mensaje descriptivo del primer error del control.
 *
 * Solo se muestra cuando el campo ya fue tocado o modificado
 * (`touched || dirty`), para no marcar en rojo un formulario recién abierto.
 */
export function mensajeError(
  control: AbstractControl | null | undefined,
  etiqueta = 'Este campo',
): string | null {
  if (!control || !control.errors) {
    return null;
  }
  if (!control.touched && !control.dirty) {
    return null;
  }
  return traducir(control.errors, etiqueta);
}

function traducir(errores: ValidationErrors, etiqueta: string): string {
  if (errores['required']) {
    return `${etiqueta} es obligatorio.`;
  }
  if (errores['minlength']) {
    return `${etiqueta} debe tener al menos ${errores['minlength'].requiredLength} caracteres.`;
  }
  if (errores['maxlength']) {
    return `${etiqueta} debe tener como máximo ${errores['maxlength'].requiredLength} caracteres.`;
  }
  if (errores['soloEspacios']) {
    return `${etiqueta} no puede contener solo espacios.`;
  }
  if (errores['min']) {
    return `${etiqueta} debe ser como mínimo ${errores['min'].min}.`;
  }
  if (errores['max']) {
    return `${etiqueta} debe ser como máximo ${errores['max'].max}.`;
  }
  if (errores['entero']) {
    return `${etiqueta} debe ser un número entero.`;
  }
  if (errores['positivo']) {
    return `${etiqueta} debe ser mayor que 0.`;
  }
  if (errores['pattern']) {
    return `${etiqueta} tiene un formato no válido.`;
  }
  if (errores['email']) {
    return `${etiqueta} debe ser un correo electrónico válido.`;
  }
  return `${etiqueta} no es válido.`;
}

/** Exige al menos un carácter distinto de espacio en blanco. */
export function soloEspacios(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    const soloBlancos = typeof valor === 'string' && valor.length > 0 && valor.trim().length === 0;
    return soloBlancos ? { soloEspacios: true } : null;
  };
}

/** Exige un número entero (los campos vacíos se validan con `required`). */
export function entero(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (valor === null || valor === '' || valor === undefined) {
      return null;
    }
    return Number.isInteger(Number(valor)) ? null : { entero: true };
  };
}

/** Exige un número mayor que 0 (los campos vacíos se validan con `required`). */
export function positivo(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (valor === null || valor === '' || valor === undefined) {
      return null;
    }
    return Number(valor) > 0 ? null : { positivo: true };
  };
}
