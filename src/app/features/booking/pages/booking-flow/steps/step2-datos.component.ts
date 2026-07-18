import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  EventEmitter,
  inject,
  OnInit,
  Output,
  signal,
  AfterViewInit,
  DestroyRef, // <-- Importa DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BookingStateService } from '../../../services/booking.service';
import { DniLookupComponent } from '../../../../../shared/components/dni-lookup/dni-lookup.component';
import { ReniecPersona } from '../../../../../core/reniec/reniec.service';
import {
  aplicarValidadorDocumento,
  REGLAS_DOCUMENTO,
  reglaDocumento,
  TipoDocumentoCodigo,
} from '../../../../../core/validators/documento';
import { BookingAcompanante } from '../../../models/booking.model';

const TIPOS_DOCUMENTO = REGLAS_DOCUMENTO.map(r => ({ codigo: r.codigo, label: r.label }));

@Component({
  selector: 'app-step2-datos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe, DniLookupComponent],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Formulario (izquierda) -->
      <div class="lg:col-span-2 space-y-5">

        <!-- ── Datos del titular ──────────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-card)]">
          <h2 class="text-lg font-bold text-[#2D2926] mb-5">Datos del titular</h2>
          <form [formGroup]="form" class="space-y-4" novalidate>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Tipo de documento -->
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Tipo de documento <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <select formControlName="tipoDocumento" [class]="inputClass('tipoDocumento')">
                  @for (t of tiposDoc; track t.codigo) {
                    <option [value]="t.codigo">{{ t.label }}</option>
                  }
                </select>
              </div>

              <!-- Número de documento -->
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Número de documento <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input type="text"
                  formControlName="numeroDocumento"
                  [placeholder]="reglaActual().placeholder"
                  [maxlength]="reglaActual().maxLength"
                  [inputMode]="reglaActual().inputMode"
                  [class]="inputClass('numeroDocumento')" />
                @if (errMsg('numeroDocumento'); as msg) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1" role="alert">{{ msg }}</p>
                }
                <!-- Lookup RENIEC solo aplica a DNI -->
                @if (form.controls.tipoDocumento.value === 'DNI') {
                  <app-dni-lookup
                    [dni]="form.controls.numeroDocumento.value"
                    (found)="onReniec($event)" />
                }
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Nombres <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input type="text" formControlName="nombres" placeholder="Ej. Juan Carlos"
                  [class]="inputClass('nombres')" />
                @if (err('nombres')) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1" role="alert">El nombre es obligatorio.</p>
                }
              </div>
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Apellidos <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input type="text" formControlName="apellidos" placeholder="Ej. García López"
                  [class]="inputClass('apellidos')" />
                @if (err('apellidos')) {
                  <p class="text-xs text-[var(--color-danger-500)] mt-1" role="alert">Los apellidos son obligatorios.</p>
                }
              </div>
            </div>

            @if (nombresBloqueados()) {
              <p class="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
                <span aria-hidden="true">🔒</span>
                Nombres verificados con RENIEC. Para editarlos, cambia el número de documento.
              </p>
            }

            <div>
              <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                Correo electrónico <span class="text-[var(--color-danger-500)]">*</span>
              </label>
              <input type="email" formControlName="correo" placeholder="correo@ejemplo.com"
                [class]="inputClass('correo')" />
              @if (err('correo')) {
                <p class="text-xs text-[var(--color-danger-500)] mt-1" role="alert">Ingresa un correo válido.</p>
              }
            </div>

            <div>
              <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                Teléfono
              </label>
              <input type="tel" formControlName="telefono" placeholder="+51 999 999 999"
                [class]="inputClass('telefono')" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Adultos <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <select formControlName="nroAdultos" [class]="inputClass('nroAdultos')">
                  @for (n of [1,2,3,4]; track n) {
                    <option [value]="n">{{ n }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                  Menores de edad
                </label>
                <select formControlName="nroNinos" [class]="inputClass('nroNinos')">
                  @for (n of [0,1,2,3]; track n) {
                    <option [value]="n">{{ n }}</option>
                  }
                </select>
              </div>
            </div>
            @if (errorPersonas(); as msg) {
              <p class="text-xs text-[var(--color-danger-500)]" role="alert">{{ msg }}</p>
            }

            <div>
              <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1.5">
                Servicios adicionales / Observaciones
              </label>
              <textarea formControlName="serviciosAdicionales" rows="3"
                placeholder="Desayuno incluido, cuna para bebé, llegada tardía..."
                class="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-soft)] text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048] resize-none">
              </textarea>
            </div>

          </form>
        </div>

        <!-- ── Acompañantes ───────────────────────────────────────────────── -->
        @if (nAcompanantesSolicitados() > 0) {
          <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-card)]">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-bold text-[#2D2926]">
                Acompañantes
                <span class="ml-2 text-[13px] text-[var(--color-ink-muted)] font-normal">
                  ({{ nAcompanantesSolicitados() }} persona{{ nAcompanantesSolicitados() > 1 ? 's' : '' }})
                </span>
              </h2>
            </div>
            <p class="text-[12px] text-[var(--color-ink-muted)] mb-4">
              Ingresa los datos de los acompañantes para el check-in. Son opcionales pero aceleran el proceso de llegada.
            </p>

            <div [formGroup]="form" class="space-y-6">
              <ng-container formArrayName="acompanantes">
                @for (ctrl of acompananteControls; track $index; let i = $index) {
                  <div [formGroupName]="i"
                    class="p-4 rounded-xl border border-[var(--color-border-soft)] bg-[#FAFAF9] space-y-3">
                    <p class="text-[12px] font-semibold text-[#C5A048] uppercase tracking-wider">
                      Acompañante {{ i + 1 }}
                    </p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <!-- Tipo doc acompañante -->
                      <div>
                        <label class="block text-[12px] font-medium text-[var(--color-ink-soft)] mb-1">
                          Tipo de documento
                        </label>
                        <select formControlName="tipoDocumento"
                          class="w-full h-9 px-3 rounded-lg border border-[var(--color-border-soft)] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048]"
                          (change)="onCambioTipoDocAcomp(i)">
                          @for (t of tiposDoc; track t.codigo) {
                            <option [value]="t.codigo">{{ t.label }}</option>
                          }
                        </select>
                      </div>
                      <!-- Número doc acompañante -->
                      <div>
                        <label class="block text-[12px] font-medium text-[var(--color-ink-soft)] mb-1">
                          Número de documento
                        </label>
                        <input type="text"
                          formControlName="numeroDocumento"
                          [placeholder]="reglaAcomp(i).placeholder"
                          [maxlength]="reglaAcomp(i).maxLength"
                          [inputMode]="reglaAcomp(i).inputMode"
                          class="w-full h-9 px-3 rounded-lg border border-[var(--color-border-soft)] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048]" />
                        @if (errAcomp(i, 'numeroDocumento'); as msg) {
                          <p class="text-xs text-[var(--color-danger-500)] mt-1">{{ msg }}</p>
                        }
                      </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label class="block text-[12px] font-medium text-[var(--color-ink-soft)] mb-1">Nombres</label>
                        <input type="text" formControlName="nombre" placeholder="Nombres"
                          class="w-full h-9 px-3 rounded-lg border border-[var(--color-border-soft)] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048]" />
                      </div>
                      <div>
                        <label class="block text-[12px] font-medium text-[var(--color-ink-soft)] mb-1">Apellido paterno</label>
                        <input type="text" formControlName="apellidoPaterno" placeholder="Apellido paterno"
                          class="w-full h-9 px-3 rounded-lg border border-[var(--color-border-soft)] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048]" />
                      </div>
                      <div>
                        <label class="block text-[12px] font-medium text-[var(--color-ink-soft)] mb-1">Apellido materno</label>
                        <input type="text" formControlName="apellidoMaterno" placeholder="Apellido materno"
                          class="w-full h-9 px-3 rounded-lg border border-[var(--color-border-soft)] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048]" />
                      </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-[12px] font-medium text-[var(--color-ink-soft)] mb-1">Correo (opcional)</label>
                        <input type="email" formControlName="correo" placeholder="correo@ejemplo.com"
                          class="w-full h-9 px-3 rounded-lg border border-[var(--color-border-soft)] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048]" />
                      </div>
                      <div>
                        <label class="block text-[12px] font-medium text-[var(--color-ink-soft)] mb-1">Teléfono (opcional)</label>
                        <input type="tel" formControlName="telefono" placeholder="+51 999 999 999"
                          class="w-full h-9 px-3 rounded-lg border border-[var(--color-border-soft)] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048]" />
                      </div>
                    </div>
                  </div>
                }
              </ng-container>
            </div>
          </div>
        }

      </div>

      <!-- Resumen habitación seleccionada (derecha) -->
      <div class="lg:col-span-1">
        @if (state.habitacionSeleccionada(); as hab) {
          <div class="bg-white rounded-2xl border border-[#C5A048] p-5 shadow-[var(--shadow-card)] sticky top-4">
            <p class="text-[11px] font-semibold text-[#C5A048] uppercase tracking-widest mb-3">Su selección</p>

            <!-- Multi-habitación -->
            @if (state.habitacionesSeleccionadas().length > 1) {
              @for (h of state.habitacionesSeleccionadas(); track h.habitacionId) {
                <div class="mb-2 pb-2 border-b border-[var(--color-border-soft)] last:border-0">
                  <p class="font-semibold text-[#2D2926] text-[14px]">{{ h.tipoHabitacionNombre }}</p>
                  <p class="text-[12px] text-[var(--color-ink-muted)]">Hab. {{ h.numero }}</p>
                </div>
              }
            } @else {
              <p class="font-bold text-[#2D2926] text-[16px]">{{ hab.tipoHabitacionNombre }}</p>
              <p class="text-[13px] text-[var(--color-ink-muted)] mb-4">
                Hab. {{ hab.numero }} — Piso {{ hab.piso }}
              </p>
            }

            <div class="space-y-2 text-[13px] mt-3">
              <div class="flex justify-between">
                <span class="text-[var(--color-ink-muted)]">Entrada</span>
                <span class="font-medium">{{ state.searchParams()?.checkIn }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--color-ink-muted)]">Salida</span>
                <span class="font-medium">{{ state.searchParams()?.checkOut }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--color-ink-muted)]">Noches</span>
                <span class="font-medium">{{ state.noches() }}</span>
              </div>
              <div class="border-t border-[var(--color-border-soft)] pt-2 flex justify-between font-bold text-[#2D2926] text-[15px]">
                <span>Total (inc. IGV)</span>
                <span class="text-[#C5A048]">S/ {{ state.montoTotal() | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Nav buttons -->
    <div class="mt-6 flex justify-between">
      <button (click)="back.emit()"
        class="px-6 h-10 border border-[var(--color-border-soft)] text-[var(--color-ink-muted)] rounded-lg text-[14px] hover:border-[#C5A048] hover:text-[#C5A048] transition-colors">
        Anterior
      </button>
      <button (click)="continuar()"
        class="px-8 h-10 bg-[#C5A048] hover:bg-[#b8923e] text-white font-semibold rounded-lg text-[14px] transition-colors">
        Continuar
      </button>
    </div>
  `,
})
export class Step2DatosComponent implements OnInit, AfterViewInit {
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef); // <-- Inyecta DestroyRef
  readonly state = inject(BookingStateService);

  readonly tiposDoc = TIPOS_DOCUMENTO;

  readonly reglaActual = computed(() => {
    const tipo = this.form?.controls.tipoDocumento?.value as TipoDocumentoCodigo;
    return reglaDocumento(tipo || 'DNI');
  });

  readonly form = this.fb.nonNullable.group({
    tipoDocumento: ['DNI' as TipoDocumentoCodigo, Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
    nombres: ['', [Validators.required, Validators.maxLength(80)]],
    apellidos: ['', [Validators.required, Validators.maxLength(80)]],
    telefono: [''],
    correo: ['', [Validators.required, Validators.email]],
    nroAdultos: [1, [Validators.required, Validators.min(1)]],
    nroNinos: [0],
    serviciosAdicionales: [''],
    acompanantes: this.fb.array<FormGroup>([]),
  });

  readonly nombresBloqueados = signal(false);

  readonly nAcompanantesSolicitados = computed(() => {
    const v = this.form.getRawValue();
    const adultos = Number(v.nroAdultos) || 0;
    const ninos = Number(v.nroNinos) || 0;
    return Math.max(0, adultos + ninos - 1);
  });

  get acompananteControls(): FormGroup[] {
    return (this.form.get('acompanantes') as FormArray).controls as FormGroup[];
  }

  ngOnInit(): void {
    // Restaurar datos existentes o precargar
    const existing = this.state.datosHuesped();
    if (existing) {
      this.form.patchValue({
        tipoDocumento: (existing.tipoDocumento as TipoDocumentoCodigo) || 'DNI',
        numeroDocumento: existing.numeroDocumento,
        nombres: existing.nombres,
        apellidos: existing.apellidos,
        telefono: existing.telefono,
        correo: existing.correo,
        nroAdultos: existing.nroAdultos,
        nroNinos: existing.nroNinos,
        serviciosAdicionales: existing.serviciosAdicionales,
      });
      if (existing.acompanantes?.length) {
        existing.acompanantes.forEach(a => this.agregarAcompanante(a));
      }
    } else {
      const params = this.state.searchParams();
      if (params) {
        const patch: any = {};
        if (params.adultos != null) patch.nroAdultos = params.adultos;
        if (params.ninos != null) patch.nroNinos = params.ninos;
        if (Object.keys(patch).length) this.form.patchValue(patch);
      }
    }

    // Validación dinámica - PASANDO destroyRef
    this.form.controls.tipoDocumento.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef)) // <-- Corregido
      .subscribe((tipo) => {
        aplicarValidadorDocumento(
          this.form.controls.numeroDocumento,
          (tipo || 'DNI') as TipoDocumentoCodigo,
        );
        this.desbloquearNombres();
        this.cdr.markForCheck();
      });

    this.form.controls.nroAdultos.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef)) // <-- Corregido
      .subscribe(() => {
        this.ajustarAcompanantes();
        this.cdr.markForCheck();
      });

    this.form.controls.nroNinos.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef)) // <-- Corregido
      .subscribe(() => {
        this.ajustarAcompanantes();
        this.cdr.markForCheck();
      });

    this.form.controls.numeroDocumento.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef)) // <-- Corregido
      .subscribe(() => this.desbloquearNombres());

    // Validación inicial
    aplicarValidadorDocumento(
      this.form.controls.numeroDocumento,
      (this.form.controls.tipoDocumento.value || 'DNI') as TipoDocumentoCodigo,
    );
  }

  ngAfterViewInit(): void {
    this.ajustarAcompanantes();
    this.cdr.detectChanges();
  }

  // ── RENIEC ────────────────────────────────────────────────────────────────

  onReniec(p: ReniecPersona): void {
    this.form.patchValue({
      nombres: p.nombres,
      apellidos: `${p.apellidoPaterno} ${p.apellidoMaterno}`.trim(),
    });
    this.bloquearNombres();
    this.cdr.detectChanges();
  }

  private bloquearNombres(): void {
    this.form.controls.nombres.disable();
    this.form.controls.apellidos.disable();
    this.nombresBloqueados.set(true);
    this.cdr.detectChanges();
  }

  private desbloquearNombres(): void {
    if (!this.nombresBloqueados()) return;
    this.form.patchValue({ nombres: '', apellidos: '' });
    this.form.controls.nombres.enable();
    this.form.controls.apellidos.enable();
    this.nombresBloqueados.set(false);
    this.cdr.detectChanges();
  }

  // ── FormArray de acompañantes ─────────────────────────────────────────────

  private get acompananteArray(): FormArray {
    return this.form.get('acompanantes') as FormArray;
  }

  private crearAcompananteGroup(data?: Partial<BookingAcompanante>): FormGroup {
    const tipo: TipoDocumentoCodigo = 'DNI';
    const group = this.fb.group({
      tipoDocumento: [tipo],
      numeroDocumento: [''],
      nombre: [data?.nombre ?? ''],
      apellidoPaterno: [data?.apellidoPaterno ?? ''],
      apellidoMaterno: [data?.apellidoMaterno ?? ''],
      correo: [data?.correo ?? ''],
      telefono: [data?.telefono ?? ''],
    });
    aplicarValidadorDocumento(group.controls['numeroDocumento'], tipo, false);
    return group;
  }

  private agregarAcompanante(data?: Partial<BookingAcompanante>): void {
    this.acompananteArray.push(this.crearAcompananteGroup(data));
  }

  private ajustarAcompanantes(): void {
    const total = this.nAcompanantesSolicitados();
    const actual = this.acompananteArray.length;

    if (total > actual) {
      for (let i = actual; i < total; i++) {
        this.acompananteArray.push(this.crearAcompananteGroup());
      }
    } else if (total < actual) {
      for (let i = actual - 1; i >= total; i--) {
        this.acompananteArray.removeAt(i);
      }
    }
    this.cdr.detectChanges();
  }

  onCambioTipoDocAcomp(index: number): void {
    const group = this.acompananteArray.at(index) as FormGroup;
    const tipo = group.controls['tipoDocumento'].value as TipoDocumentoCodigo;
    aplicarValidadorDocumento(group.controls['numeroDocumento'], tipo, false);
    this.cdr.markForCheck();
  }

  reglaAcomp(index: number) {
    const group = this.acompananteArray.at(index) as FormGroup;
    return reglaDocumento(group?.controls['tipoDocumento']?.value);
  }

  // ── Helpers de validación ─────────────────────────────────────────────────

  inputClass(field: string): string {
    const invalid = this.err(field);
    return `w-full h-10 px-3.5 rounded-lg border text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048] disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-muted)] disabled:cursor-not-allowed ${
      invalid ? 'border-[var(--color-danger-500)]' : 'border-[var(--color-border-soft)]'
    }`;
  }

  err(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  errMsg(field: string): string | null {
    const ctrl = this.form.get(field) as AbstractControl | null;
    if (!ctrl?.invalid || !ctrl.touched) return null;
    if (ctrl.errors?.['required']) return 'Este campo es obligatorio.';
    if (ctrl.errors?.['documento']) return ctrl.errors['documento'].mensaje as string;
    if (ctrl.errors?.['email']) return 'Ingresa un correo válido.';
    return 'Valor no válido.';
  }

  errAcomp(index: number, field: string): string | null {
    const group = this.acompananteArray.at(index) as FormGroup;
    const ctrl = group?.controls[field];
    if (!ctrl?.invalid || !ctrl.touched) return null;
    if (ctrl.errors?.['documento']) return ctrl.errors['documento'].mensaje as string;
    return null;
  }

  errorPersonas(): string | null {
    const v = this.form.getRawValue();
    const total = Number(v.nroAdultos) + Number(v.nroNinos);
    const capacidad = this.state.capacidadSeleccionada();
    if (capacidad > 0 && total > capacidad) {
      return `Las habitaciones seleccionadas admiten máximo ${capacidad} persona(s); has indicado ${total}.`;
    }
    const buscadas = this.state.searchParams()?.guests;
    if (buscadas != null && total > buscadas) {
      return `Buscaste habitaciones para ${buscadas} persona(s); ajusta la búsqueda si viajan ${total}.`;
    }
    return null;
  }

  continuar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Completa todos los campos obligatorios.');
      return;
    }
    const errPersonas = this.errorPersonas();
    if (errPersonas) {
      this.toastr.warning(errPersonas, 'Número de personas');
      return;
    }
    const v = this.form.getRawValue();

    const acompanantes: BookingAcompanante[] = v.acompanantes
      .filter((a: any) => a.nombre?.trim() || a.numeroDocumento?.trim())
      .map((a: any) => ({
        nombre: a.nombre?.trim() ?? '',
        apellidoPaterno: a.apellidoPaterno?.trim() ?? '',
        apellidoMaterno: a.apellidoMaterno?.trim() || undefined,
        numeroDocumento: a.numeroDocumento?.trim() ?? '',
        correo: a.correo?.trim() || undefined,
        telefono: a.telefono?.trim() || undefined,
      }));

    this.state.setDatosHuesped({
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: v.numeroDocumento,
      nombres: v.nombres,
      apellidos: v.apellidos,
      telefono: v.telefono,
      correo: v.correo,
      nroAdultos: Number(v.nroAdultos),
      nroNinos: Number(v.nroNinos),
      serviciosAdicionales: v.serviciosAdicionales,
      acompanantes,
    });
    this.next.emit();
  }
}
