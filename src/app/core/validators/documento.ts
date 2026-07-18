import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/**
 * Reglas de validación por tipo de documento de identidad. Fuente única para
 * todos los formularios (booking público, modal de reservas, alta de cliente):
 * al cambiar el tipo, el formulario debe re-aplicar el validador y actualizar
 * placeholder / longitud máxima con estos metadatos.
 */
export type TipoDocumentoCodigo = 'DNI' | 'PASAPORTE' | 'CE';

export interface ReglaDocumento {
  codigo: TipoDocumentoCodigo;
  label: string;
  /** Regex completa del número (anclada). */
  pattern: RegExp;
  minLength: number;
  maxLength: number;
  placeholder: string;
  /** Mensaje mostrado cuando el número no cumple el formato. */
  mensaje: string;
  /** inputmode sugerido para teclados móviles. */
  inputMode: 'numeric' | 'text';
}

export const REGLAS_DOCUMENTO: readonly ReglaDocumento[] = [
  {
    codigo: 'DNI',
    label: 'DNI',
    pattern: /^\d{8}$/,
    minLength: 8,
    maxLength: 8,
    placeholder: '87654321',
    mensaje: 'El DNI debe tener exactamente 8 dígitos.',
    inputMode: 'numeric',
  },
  {
    codigo: 'PASAPORTE',
    label: 'Pasaporte',
    pattern: /^[A-Za-z0-9]{6,12}$/,
    minLength: 6,
    maxLength: 12,
    placeholder: 'AB1234567',
    mensaje: 'El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos.',
    inputMode: 'text',
  },
  {
    codigo: 'CE',
    label: 'Carné de Extranjería',
    pattern: /^\d{9,12}$/,
    minLength: 9,
    maxLength: 12,
    placeholder: '001234567',
    mensaje: 'El carné de extranjería debe tener entre 9 y 12 dígitos.',
    inputMode: 'numeric',
  },
] as const;

export function reglaDocumento(codigo: string | null | undefined): ReglaDocumento {
  return REGLAS_DOCUMENTO.find((r) => r.codigo === codigo) ?? REGLAS_DOCUMENTO[0];
}

/** Validador de número de documento según el tipo seleccionado. */
export function documentoValidator(codigo: TipoDocumentoCodigo): ValidatorFn {
  const regla = reglaDocumento(codigo);
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null; // required se declara aparte
    return regla.pattern.test(value) ? null : { documento: { mensaje: regla.mensaje } };
  };
}

/**
 * Re-aplica los validadores del control "numeroDocumento" cuando cambia el tipo.
 * Uso: llamar dentro del subscribe de valueChanges del select de tipo.
 */
export function aplicarValidadorDocumento(
  control: AbstractControl,
  codigo: TipoDocumentoCodigo,
  requerido = true,
): void {
  const validators: ValidatorFn[] = [documentoValidator(codigo)];
  if (requerido) validators.unshift(Validators.required);
  control.setValidators(validators);
  control.updateValueAndValidity();
}
