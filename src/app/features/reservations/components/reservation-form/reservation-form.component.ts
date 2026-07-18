import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DisponibilidadService, HabitacionDisponible } from '../../services/disponibilidad.service';
import { ClienteService } from '../../../clients/services/cliente.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { Acompanante, Reserva, CreateReservaPayload, UpdateReservaPayload, ModalidadPago } from '../../models/reservation.model';
import { Cliente, CreateClientePayload } from '../../../clients/models/cliente.model';

export interface ReservaFormSaveEvent {
  payload: CreateReservaPayload | UpdateReservaPayload;
  id?: number;
  metodoPagoStaff?: 'EFECTIVO' | 'NIUBIZ';
}

// Online (3) se asigna automáticamente al cliente; el staff solo elige entre Directa y Booking.
const CANALES = [
  { canalId: 1, nombre: 'Directa' },
  { canalId: 2, nombre: 'Booking' },
];

const INPUT_BASE = 'mt-1.5 w-full h-10 px-3.5 rounded-lg border bg-white text-sm focus:outline-none transition';
const INPUT_OK  = `${INPUT_BASE} border-[#EEE3D1] focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20`;
const INPUT_ERR = `${INPUT_BASE} border-red-400 focus:ring-2 focus:ring-red-400/20`;

@Component({
  selector: 'app-reservation-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe],
  host: {
    '(document:keydown.escape)': 'isOpen() && onClose.emit()',
    role: 'dialog',
    'aria-modal': 'true',
  },
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
           (click)="onClose.emit()">
        <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]"
             (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-[#EEE3D1] shrink-0">
            <div>
              <h2 class="text-base font-bold text-[#2D2926]">
                {{ esEdicion() ? 'Editar reserva' : 'Nueva reserva' }}
              </h2>
              @if (esEdicion()) {
                <p class="text-xs font-mono text-[#C5A048] mt-0.5">{{ reserva()!.codReserva }}</p>
              } @else {
                <p class="text-xs text-[#2D2926]/45 mt-0.5">Complete los pasos para registrar la reserva.</p>
              }
            </div>
            <button type="button" (click)="onClose.emit()"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-[#2D2926]/40
                     hover:text-[#2D2926] hover:bg-[#F9F5F0] transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- ── CREATE MODE ── -->
          @if (!esEdicion()) {

            <!-- Step bar -->
            <div class="flex items-center px-6 py-3 border-b border-[#EEE3D1] bg-[#F9F5F0] shrink-0">
              @for (p of [1,2,3,4,5]; track p) {
                <button type="button"
                  class="flex items-center gap-1.5 disabled:cursor-not-allowed"
                  [disabled]="pasoActual() < p"
                  (click)="irAPaso(p)">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors"
                        [class]="stepCircleCls(p)">
                    @if (pasoActual() > p) {
                      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                      </svg>
                    } @else {
                      {{ p }}
                    }
                  </span>
                  <span class="text-[11px] font-semibold hidden sm:block" [class]="stepLabelCls(p)">
                    {{ pasoLabel(p) }}
                  </span>
                </button>
                @if (p < 5) {
                  <div class="flex-1 h-px mx-2 transition-colors"
                       [class]="pasoActual() > p ? 'bg-emerald-500' : 'bg-[#EEE3D1]'"></div>
                }
              }
            </div>

            <!-- Error banner -->
            @if (errorPaso()) {
              <div class="flex items-center gap-2 px-6 py-2.5 bg-red-50 border-b border-red-100
                          text-red-600 text-sm shrink-0">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
                </svg>
                {{ errorPaso() }}
              </div>
            }

            <!-- PASO 1: Fechas -->
            @if (pasoActual() === 1) {
              <div class="flex-1 overflow-y-auto px-6 py-5">
                <form [formGroup]="paso1Form" class="space-y-4">
                  <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label class="text-[13px] font-medium text-[#2D2926]/70">
                        Fecha de llegada <span class="text-red-500">*</span>
                      </label>
                      <input type="date" formControlName="fechaInicio"
                        [min]="hoy()"
                        (change)="onFechaChange()"
                        [class]="ic1('fechaInicio')" />
                      @if (inv1('fechaInicio')) {
                        <p class="text-xs text-red-500 mt-1">Obligatorio.</p>
                      }
                    </div>
                    <div>
                      <label class="text-[13px] font-medium text-[#2D2926]/70">
                        Fecha de salida <span class="text-red-500">*</span>
                      </label>
                      <input type="date" formControlName="fechaFin"
                        [min]="minFechaFin()"
                        (change)="onFechaChange()"
                        [class]="ic1('fechaFin')" />
                      @if (inv1('fechaFin')) {
                        <p class="text-xs text-red-500 mt-1">Obligatorio.</p>
                      }
                    </div>
                  </div>

                  <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label class="text-[13px] font-medium text-[#2D2926]/70">
                        Adultos <span class="text-red-500">*</span>
                      </label>
                      <input type="number" formControlName="nroAdultos" min="1"
                        [class]="ic1('nroAdultos')" />
                      @if (inv1('nroAdultos')) {
                        <p class="text-xs text-red-500 mt-1">Mínimo 1 adulto.</p>
                      }
                    </div>
                    <div>
                      <label class="text-[13px] font-medium text-[#2D2926]/70">Niños</label>
                      <input type="number" formControlName="nroNinos" min="0"
                        [class]="ic1('nroNinos')" />
                    </div>
                  </div>

                  @if (!esCliente()) {
                    <div>
                      <label class="text-[13px] font-medium text-[#2D2926]/70">Canal de reserva</label>
                      <select formControlName="canalId" [class]="ic1('canalId')">
                        @for (c of canales; track c.canalId) {
                          <option [value]="c.canalId">{{ c.nombre }}</option>
                        }
                      </select>
                    </div>
                  }

                  @if (noches() > 0) {
                    <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                bg-[#FFF8E1] border border-[#FDE68A] text-[#C5A048] text-sm font-semibold">
                      {{ noches() }} noche{{ noches() === 1 ? '' : 's' }}
                    </div>
                  }
                </form>
              </div>

              <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#EEE3D1] shrink-0">
                <button type="button" (click)="onClose.emit()"
                  class="h-9 px-4 rounded-xl border border-[#EEE3D1] text-sm font-medium
                         text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors">
                  Cancelar
                </button>
                <button type="button" (click)="buscarDisponibilidad()"
                  class="h-9 px-5 rounded-xl bg-[#C5A048] text-white text-sm font-semibold
                         hover:bg-[#8E6F2E] transition-colors flex items-center gap-2">
                  Buscar disponibilidad
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                  </svg>
                </button>
              </div>
            }

            <!-- PASO 2: Habitaciones -->
            @if (pasoActual() === 2) {
              <div class="flex-1 overflow-y-auto px-6 py-5">
                <div class="flex items-center gap-2 p-3 mb-4 rounded-xl bg-[#F9F5F0] border border-[#EEE3D1] text-sm">
                  <span class="font-semibold text-[#C5A048]">{{ formatFecha(paso1Form.value.fechaInicio!) }}</span>
                  <svg class="w-3.5 h-3.5 text-[#2D2926]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                  </svg>
                  <span class="font-semibold text-[#C5A048]">{{ formatFecha(paso1Form.value.fechaFin!) }}</span>
                  <span class="text-[#2D2926]/50 ml-1">
                    · {{ noches() }} noche{{ noches() !== 1 ? 's' : '' }}
                    · {{ paso1Form.value.nroAdultos }} adulto{{ paso1Form.value.nroAdultos !== 1 ? 's' : '' }}
                  </span>
                </div>

                @if (disponiblesCargando()) {
                  <div class="py-12 text-center">
                    <div class="w-8 h-8 border-2 border-[#C5A048] border-t-transparent rounded-full
                                animate-spin mx-auto mb-3"></div>
                    <p class="text-sm text-[#2D2926]/50">Buscando habitaciones disponibles...</p>
                  </div>
                } @else if (disponibles().length === 0) {
                  <div class="py-12 text-center">
                    <p class="text-sm font-semibold text-[#2D2926]">Sin disponibilidad</p>
                    <p class="text-xs text-[#2D2926]/45 mt-1">
                      No hay habitaciones libres para las fechas seleccionadas.
                    </p>
                  </div>
                } @else {
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    @for (hab of disponibles(); track hab.habitacionId) {
                      <div class="rounded-xl border-2 p-3 cursor-pointer transition-all"
                           [class]="estaSeleccionada(hab.habitacionId)
                             ? 'border-[#C5A048] bg-[#FFFDF5]'
                             : 'border-[#EEE3D1] bg-white hover:border-[#C5A048]/50'"
                           (click)="toggleHabitacion(hab)">
                        <div class="flex items-start justify-between mb-0.5">
                          <span class="font-bold text-[#2D2926] text-sm">N° {{ hab.numero }}</span>
                          @if (estaSeleccionada(hab.habitacionId)) {
                            <span class="w-5 h-5 rounded-full bg-[#C5A048] flex items-center justify-center shrink-0">
                              <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none"
                                   stroke="currentColor" stroke-width="3">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                              </svg>
                            </span>
                          }
                        </div>
                        <p class="text-[11px] text-[#2D2926]/50 mb-1">Piso {{ hab.piso }}</p>
                        @if (hab.descripcion) {
                          <p class="text-[11px] text-[#2D2926]/55 italic">{{ hab.descripcion }}</p>
                        }

                        @if (estaSeleccionada(hab.habitacionId)) {
                          <div class="mt-2 pt-2 border-t border-[#EEE3D1]">
                            @if (getTipoId(hab.habitacionId) > 0) {
                              <p class="text-[10px] uppercase tracking-wider font-semibold text-[#C5A048] mb-0.5">
                                Tipo
                              </p>
                              <p class="text-[11px] font-semibold text-[#2D2926]">
                                {{ getNombreTipo(hab.habitacionId) }}
                              </p>

                              <!-- Tarifa pactada: solo staff. Rango 50%–200% del precio base (revalidado en backend). -->
                              @if (!esCliente() && getPrecioBase(hab.habitacionId) > 0) {
                                <div class="mt-1.5" (click)="$event.stopPropagation()">
                                  <p class="text-[10px] uppercase tracking-wider font-semibold text-[#C5A048] mb-0.5">
                                    Tarifa / noche (S/)
                                  </p>
                                  <input type="number" min="0" step="0.01"
                                    [value]="getTarifa(hab.habitacionId)"
                                    (input)="setTarifaPactada(hab.habitacionId, +$any($event.target).value || 0)"
                                    [class]="tarifaInvalida(hab.habitacionId)
                                      ? 'w-full h-8 px-2 rounded-md border border-red-400 bg-white text-[12px] focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                      : 'w-full h-8 px-2 rounded-md border border-[#EEE3D1] bg-white text-[12px] focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20'" />
                                  <p class="text-[10px] mt-0.5"
                                     [class]="tarifaInvalida(hab.habitacionId) ? 'text-red-500' : 'text-[#2D2926]/45'">
                                    Base S/ {{ getPrecioBase(hab.habitacionId) | number:'1.2-2' }} ·
                                    rango S/ {{ getPrecioBase(hab.habitacionId) * 0.5 | number:'1.2-2' }}–{{ getPrecioBase(hab.habitacionId) * 2 | number:'1.2-2' }}
                                  </p>
                                </div>
                              }

                              @if (getTarifa(hab.habitacionId) > 0) {
                                <p class="text-[11px] text-emerald-600 font-semibold mt-1">
                                  Subtotal: S/ {{ (getTarifa(hab.habitacionId) * noches()) | number:'1.2-2' }}
                                </p>
                              }
                            } @else {
                              <p class="text-[11px] text-amber-600 font-medium">
                                Sin tipo asignado — no se puede continuar
                              </p>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>

                  @if (habitacionesSeleccionadas().length > 0) {
                    <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200
                                text-emerald-700 text-sm font-semibold">
                      {{ habitacionesSeleccionadas().length }}
                      habitación{{ habitacionesSeleccionadas().length !== 1 ? 'es' : '' }}
                      seleccionada{{ habitacionesSeleccionadas().length !== 1 ? 's' : '' }}
                      · Subtotal estimado: S/ {{ subtotal() | number:'1.2-2' }}
                    </div>
                  }
                }
              </div>

              <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#EEE3D1] shrink-0">
                <button type="button" (click)="irAPaso(1)"
                  class="h-9 px-4 rounded-xl border border-[#EEE3D1] text-sm font-medium
                         text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
                  </svg>
                  Volver
                </button>
                <button type="button" (click)="avanzarPaso()"
                  [disabled]="habitacionesSeleccionadas().length === 0 || hayTarifaInvalida()"
                  class="h-9 px-5 rounded-xl bg-[#C5A048] text-white text-sm font-semibold
                         hover:bg-[#8E6F2E] transition-colors disabled:opacity-50 flex items-center gap-2">
                  Continuar
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                  </svg>
                </button>
              </div>
            }

            <!-- PASO 3: Huéspedes -->
            @if (pasoActual() === 3) {
              <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                @if (esCliente()) {
                  <div class="rounded-xl bg-[#FFF8E1] border border-[#FDE68A] px-4 py-3">
                    <p class="text-sm font-semibold text-[#8E6F2E]">Reserva a tu nombre</p>
                    <p class="text-xs text-[#8E6F2E]/80 mt-0.5">
                      Esta reserva se asociará automáticamente a tu cuenta; no necesitas
                      seleccionar huéspedes.
                    </p>
                  </div>

                  <!-- Acompañantes: huéspedes sin cuenta (p. ej. un hijo). El titular es automático. -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-[11px] uppercase tracking-wider text-[#C5A048] font-semibold">
                        Acompañantes
                      </p>
                      @if (maxAcompanantes() > 0) {
                        <span class="text-[11px] text-[#2D2926]/50">
                          Puedes agregar hasta {{ maxAcompanantes() }}
                          acompañante{{ maxAcompanantes() !== 1 ? 's' : '' }}
                        </span>
                      }
                    </div>

                    @for (grupo of acompanantesCtrls(); track $index) {
                      <div [formGroup]="grupo"
                           class="bg-white border border-[#EEE3D1] rounded-xl p-4 mb-3 space-y-3">
                        <div class="flex items-center justify-between">
                          <p class="text-xs font-semibold text-[#8E6F2E]">
                            Acompañante {{ $index + 1 }}
                          </p>
                          <button type="button" (click)="quitarAcompanante($index)"
                            class="w-7 h-7 rounded-lg flex items-center justify-center
                                   text-red-400 hover:bg-red-50 transition-colors"
                            aria-label="Eliminar acompañante">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>

                        <div class="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label class="text-[13px] font-medium text-[#2D2926]/70">
                              Nombre <span class="text-red-500">*</span>
                            </label>
                            <input type="text" formControlName="nombre" maxlength="80" placeholder="Juan"
                              [class]="icAcomp($index, 'nombre')" />
                          </div>
                          <div>
                            <label class="text-[13px] font-medium text-[#2D2926]/70">
                              Apellido paterno <span class="text-red-500">*</span>
                            </label>
                            <input type="text" formControlName="apellidoPaterno" maxlength="80" placeholder="Pérez"
                              [class]="icAcomp($index, 'apellidoPaterno')" />
                          </div>
                        </div>

                        <div class="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label class="text-[13px] font-medium text-[#2D2926]/70">Apellido materno</label>
                            <input type="text" formControlName="apellidoMaterno" maxlength="80" placeholder="Quispe"
                              [class]="icAcomp($index, 'apellidoMaterno')" />
                          </div>
                          <div>
                            <label class="text-[13px] font-medium text-[#2D2926]/70">
                              N° documento <span class="text-red-500">*</span>
                            </label>
                            <input type="text" formControlName="numeroDocumento" maxlength="20" placeholder="71234567"
                              [class]="icAcomp($index, 'numeroDocumento')" />
                          </div>
                        </div>

                        <div class="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label class="text-[13px] font-medium text-[#2D2926]/70">Nacionalidad</label>
                            <input type="text" formControlName="nacionalidad" maxlength="60" placeholder="Peruana"
                              [class]="icAcomp($index, 'nacionalidad')" />
                          </div>
                          <div>
                            <label class="text-[13px] font-medium text-[#2D2926]/70">Correo</label>
                            <input type="email" formControlName="correo" maxlength="150" placeholder="correo@ejemplo.com"
                              [class]="icAcomp($index, 'correo')" />
                            @if (invAcomp($index, 'correo')) {
                              <p class="text-xs text-red-500 mt-1">Correo no válido.</p>
                            }
                          </div>
                        </div>

                        <div class="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label class="text-[13px] font-medium text-[#2D2926]/70">Teléfono</label>
                            <input type="tel" formControlName="telefono" maxlength="20" placeholder="987 654 321"
                              [class]="icAcomp($index, 'telefono')" />
                          </div>
                        </div>
                      </div>
                    }

                    @if (maxAcompanantes() === 0) {
                      <p class="text-[11px] text-[#2D2926]/50">
                        Esta reserva es para 1 persona; no puedes agregar acompañantes.
                      </p>
                    } @else {
                      <button type="button" (click)="agregarAcompanante()"
                        [disabled]="acompanantes.length >= maxAcompanantes()"
                        class="w-full h-10 rounded-xl border-2 border-dashed border-[#C5A048] text-[#C5A048]
                               text-sm font-semibold hover:bg-[#FFF8E1] transition-colors
                               flex items-center justify-center gap-2
                               disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" d="M12 4.5v15m7.5-7.5h-15"/>
                        </svg>
                        Agregar acompañante
                      </button>
                    }
                  </div>
                }

                @if (!esCliente()) {
                <div>
                  <label class="text-[13px] font-medium text-[#2D2926]/70">
                    Buscar cliente por nombre o documento
                  </label>
                  <div class="relative mt-1.5">
                    <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2D2926]/40"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="7"/>
                      <path stroke-linecap="round" d="m21 21-3.5-3.5"/>
                    </svg>
                    <input type="text"
                      class="w-full h-10 pl-9 pr-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                             focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20 transition"
                      [value]="busquedaHuesped()"
                      (input)="setBusqueda($any($event.target).value)"
                      placeholder="García, 45678901..." />
                  </div>
                </div>

                @if (resultadosBusqueda().length > 0) {
                  <div class="bg-white border border-[#EEE3D1] rounded-xl overflow-hidden shadow-sm">
                    @for (c of resultadosBusqueda(); track c.huespedId) {
                      <button type="button" (click)="agregarHuesped(c)"
                        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F9F5F0] transition-colors
                               border-b border-[#EEE3D1] last:border-0 text-left">
                        <span class="w-8 h-8 rounded-full bg-[#C5A048] text-white flex items-center
                                     justify-center text-sm font-bold shrink-0">
                          {{ c.nombreCompleto[0] }}
                        </span>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-[#2D2926] truncate">{{ c.nombreCompleto }}</p>
                          <p class="text-xs text-[#8E6F2E]">{{ c.numeroDocumento }}</p>
                        </div>
                        <svg class="w-4 h-4 text-[#C5A048] shrink-0" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" d="M12 4.5v15m7.5-7.5h-15"/>
                        </svg>
                      </button>
                    }
                  </div>
                } @else if (busquedaHuesped().length >= 2) {
                  <p class="text-sm text-[#2D2926]/50">No se encontraron clientes con ese criterio.</p>
                }

                @if (!nuevoClienteAbierto()) {
                  <button type="button" (click)="nuevoClienteAbierto.set(true)"
                    class="w-full h-10 rounded-xl border-2 border-dashed border-[#C5A048] text-[#C5A048]
                           text-sm font-semibold hover:bg-[#FFF8E1] transition-colors
                           flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" d="M12 4.5v15m7.5-7.5h-15"/>
                    </svg>
                    Registrar nuevo cliente
                  </button>
                } @else {
                  <div class="bg-[#FFF8E1] border border-[#FDE68A] rounded-xl p-4">
                    <p class="text-sm font-bold text-[#C5A048] mb-3">Nuevo cliente</p>
                    <form [formGroup]="nuevoClienteForm" (ngSubmit)="guardarNuevoCliente()" class="space-y-3">
                      <div class="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label class="text-[13px] font-medium text-[#2D2926]/70">
                            Nombre <span class="text-red-500">*</span>
                          </label>
                          <input type="text" formControlName="nombre" maxlength="80" placeholder="Nombre"
                            [class]="icNC('nombre')" />
                        </div>
                        <div>
                          <label class="text-[13px] font-medium text-[#2D2926]/70">
                            Apellido paterno <span class="text-red-500">*</span>
                          </label>
                          <input type="text" formControlName="apellidoPaterno" maxlength="80"
                            [class]="icNC('apellidoPaterno')" />
                        </div>
                      </div>
                      <div class="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label class="text-[13px] font-medium text-[#2D2926]/70">Apellido materno</label>
                          <input type="text" formControlName="apellidoMaterno" maxlength="80"
                            [class]="icNC('apellidoMaterno')" />
                        </div>
                        <div>
                          <label class="text-[13px] font-medium text-[#2D2926]/70">
                            N° documento <span class="text-red-500">*</span>
                          </label>
                          <input type="text" formControlName="numeroDocumento" maxlength="20"
                            [class]="icNC('numeroDocumento')" />
                        </div>
                      </div>
                      <div class="flex items-center justify-end gap-2 pt-1">
                        <button type="button"
                          (click)="nuevoClienteAbierto.set(false); nuevoClienteForm.reset()"
                          class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                                 text-[#2D2926]/70 hover:bg-white transition-colors">
                          Cancelar
                        </button>
                        <button type="submit" [disabled]="nuevoClienteForm.invalid"
                          class="h-8 px-4 rounded-lg bg-[#C5A048] text-white text-xs font-semibold
                                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-50">
                          Registrar y agregar
                        </button>
                      </div>
                    </form>
                  </div>
                }
                }

                @if (huespedesSeleccionados().length > 0) {
                  <div>
                    <p class="text-[11px] uppercase tracking-wider text-[#C5A048] font-semibold mb-2">
                      Huéspedes agregados
                    </p>
                    <div class="space-y-2">
                      @for (h of huespedesSeleccionados(); track h.cliente.huespedId) {
                        <div class="flex items-center gap-3 p-3 rounded-xl bg-white border transition-colors"
                             [class]="h.esPrincipal ? 'border-[#C5A048]' : 'border-[#EEE3D1]'">
                          <span class="w-8 h-8 rounded-full bg-[#C5A048] text-white flex items-center
                                       justify-center text-sm font-bold shrink-0">
                            {{ h.cliente.nombreCompleto[0] }}
                          </span>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-[#2D2926] truncate">
                              {{ h.cliente.nombreCompleto }}
                            </p>
                            <p class="text-xs text-[#8E6F2E]">{{ h.cliente.numeroDocumento }}</p>
                          </div>
                          @if (h.esPrincipal) {
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold
                                         bg-[#FFF8E1] text-[#C5A048] border border-[#FDE68A]">
                              Principal
                            </span>
                          } @else {
                            <button type="button" (click)="marcarPrincipal(h.cliente.huespedId)"
                              class="h-7 px-2.5 rounded-lg border border-[#EEE3D1] text-[11px] font-medium
                                     text-[#2D2926]/50 hover:border-[#C5A048] hover:text-[#C5A048] transition-colors">
                              Principal
                            </button>
                          }
                          <button type="button" (click)="quitarHuesped(h.cliente.huespedId)"
                            class="w-7 h-7 rounded-lg flex items-center justify-center
                                   text-red-400 hover:bg-red-50 transition-colors">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#EEE3D1] shrink-0">
                <button type="button" (click)="irAPaso(2)"
                  class="h-9 px-4 rounded-xl border border-[#EEE3D1] text-sm font-medium
                         text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
                  </svg>
                  Volver
                </button>
                <button type="button" (click)="avanzarPaso()"
                  [disabled]="(!esCliente() && huespedesSeleccionados().length === 0)
                              || (esCliente() && acompanantes.invalid)"
                  class="h-9 px-5 rounded-xl bg-[#C5A048] text-white text-sm font-semibold
                         hover:bg-[#8E6F2E] transition-colors disabled:opacity-50 flex items-center gap-2">
                  Continuar
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                  </svg>
                </button>
              </div>
            }

            <!-- PASO 4: Detalles + resumen -->
            @if (pasoActual() === 4) {
              <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <!-- Descuento: solo staff. El cliente nunca lo aplica (backend lo fuerza a 0). -->
                @if (!esCliente()) {
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">
                      Descuento (S/)
                      <span class="text-[11px] font-normal text-[#2D2926]/40 ml-1">
                        Máx 30% — S/ {{ descuentoMax() | number:'1.2-2' }}
                      </span>
                    </label>
                    <input type="number" min="0" step="0.01"
                      [class]="descuentoInvalido()
                        ? 'mt-1.5 w-full h-10 px-3.5 rounded-lg border border-red-400 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-400/20 transition'
                        : 'mt-1.5 w-full h-10 px-3.5 rounded-lg border border-[#EEE3D1] bg-white text-sm focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20 transition'"
                      [value]="descuento()"
                      (input)="descuento.set(+$any($event.target).value || 0)" />
                    @if (descuentoInvalido()) {
                      <p class="text-xs text-red-500 mt-1">El descuento no puede superar el 30% del subtotal.</p>
                    }
                  </div>
                }

                @if (!esCliente()) {
                  <!-- Selector para el staff: Si elije EFECTIVO, se confirma de inmediato; si NIUBIZ, se abre el modal y espera el pago -->
                  <div class="mt-4 border-t border-[#EEE3D1] pt-4">
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Método de pago inicial</label>
                    <div class="mt-2 grid grid-cols-2 gap-3">
                      <button type="button" (click)="metodoPagoStaff.set('NIUBIZ')"
                        [class]="metodoPagoStaff() === 'NIUBIZ'
                          ? 'flex items-center gap-2 py-3 px-4 rounded-lg border-2 border-[#C5A048] bg-[#FBF7EF] transition'
                          : 'flex items-center gap-2 py-3 px-4 rounded-lg border border-[#EEE3D1] bg-white hover:border-[#C5A048]/50 transition'">
                        <div class="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center shrink-0"
                             [class]="metodoPagoStaff() === 'NIUBIZ' ? 'text-[#C5A048]' : 'text-transparent'">
                          <div class="w-2 h-2 rounded-full bg-current"></div>
                        </div>
                        <span class="text-sm font-semibold text-[#2D2926]">Pago en Línea (Niubiz)</span>
                      </button>
                      <button type="button" (click)="metodoPagoStaff.set('EFECTIVO')"
                        [class]="metodoPagoStaff() === 'EFECTIVO'
                          ? 'flex items-center gap-2 py-3 px-4 rounded-lg border-2 border-emerald-500 bg-emerald-50 transition'
                          : 'flex items-center gap-2 py-3 px-4 rounded-lg border border-[#EEE3D1] bg-white hover:border-emerald-500/50 transition'">
                        <div class="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center shrink-0"
                             [class]="metodoPagoStaff() === 'EFECTIVO' ? 'text-emerald-500' : 'text-transparent'">
                          <div class="w-2 h-2 rounded-full bg-current"></div>
                        </div>
                        <span class="text-sm font-semibold text-[#2D2926]">Efectivo en Caja</span>
                      </button>
                    </div>
                  </div>
                }

                <!-- Modalidad de pago: PARCIAL (50%) | TOTAL (100%). El backend deriva el monto. -->
                <div>
                  <label class="text-[13px] font-medium text-[#2D2926]/70">Modalidad de pago</label>
                  <div class="mt-1.5 grid grid-cols-2 gap-3">
                    @for (op of modalidades; track op.value) {
                      <button type="button" (click)="modalidadPago.set(op.value)"
                        [class]="modalidadPago() === op.value
                          ? 'h-auto py-3 px-4 rounded-lg border-2 border-[#C5A048] bg-[#FBF7EF] text-left transition'
                          : 'h-auto py-3 px-4 rounded-lg border border-[#EEE3D1] bg-white text-left hover:border-[#C5A048]/50 transition'">
                        <span class="block text-sm font-semibold text-[#2D2926]">{{ op.label }}</span>
                        <span class="block text-[11px] text-[#2D2926]/50">{{ op.hint }}</span>
                      </button>
                    }
                  </div>
                  <p class="text-[11px] text-[#2D2926]/50 mt-1.5">
                    Adelanto a pagar:
                    <strong class="text-[#C5A048]">S/ {{ adelanto() | number:'1.2-2' }}</strong>
                  </p>
                </div>

                <!-- Impuesto: IGV 18% calculado por el backend; aquí solo preview de solo lectura. -->
                <div>
                  <label class="text-[13px] font-medium text-[#2D2926]/70">
                    Impuesto (S/)
                    <span class="text-[11px] font-normal text-[#2D2926]/40 ml-1">Auto-calculado 18%</span>
                  </label>
                  <input type="number" readonly tabindex="-1"
                    class="mt-1.5 w-full h-10 px-3.5 rounded-lg border border-[#EEE3D1] bg-[#F9F5F0] text-sm
                           text-[#2D2926]/70 focus:outline-none cursor-not-allowed"
                    [value]="impuesto() | number:'1.2-2'" />
                </div>
                <div>
                  <label class="text-[13px] font-medium text-[#2D2926]/70">Observaciones</label>
                  <textarea rows="2" maxlength="500" placeholder="Notas adicionales..."
                    class="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                           focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20
                           transition resize-none"
                    [value]="observaciones() ?? ''"
                    (input)="observaciones.set($any($event.target).value || null)"></textarea>
                </div>

                <!-- Resumen -->
                <div>
                  <p class="text-[11px] uppercase tracking-wider text-[#C5A048] font-semibold mb-3">
                    Resumen de la reserva
                  </p>
                  <div class="grid sm:grid-cols-3 gap-3 bg-[#F9F5F0] rounded-xl p-4 mb-3 text-xs">
                    <div>
                      <p class="text-[10px] uppercase tracking-wider text-[#C5A048] font-semibold mb-1">Fechas</p>
                      <p class="text-[#2D2926]">
                        {{ formatFecha(paso1Form.value.fechaInicio!) }} —
                        {{ formatFecha(paso1Form.value.fechaFin!) }}
                      </p>
                      <p class="text-[#2D2926]/50">{{ noches() }} noche{{ noches() !== 1 ? 's' : '' }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] uppercase tracking-wider text-[#C5A048] font-semibold mb-1">
                        Habitaciones
                      </p>
                      @for (h of habitacionesSeleccionadas(); track h.hab.habitacionId) {
                        <p class="text-[#2D2926]">N° {{ h.hab.numero }} – {{ h.tipoHabitacionNombre }}</p>
                      }
                    </div>
                    <div>
                      <p class="text-[10px] uppercase tracking-wider text-[#C5A048] font-semibold mb-1">
                        Huéspedes
                      </p>
                      @for (h of huespedesSeleccionados(); track h.cliente.huespedId) {
                        <p class="text-[#2D2926]">
                          {{ h.cliente.nombreCompleto }}{{ h.esPrincipal ? ' (Principal)' : '' }}
                        </p>
                      }
                    </div>
                  </div>

                  <div class="bg-white rounded-xl border border-[#EEE3D1] overflow-hidden">
                    <div class="flex justify-between px-4 py-2.5 text-sm border-b border-[#EEE3D1]">
                      <span class="text-[#2D2926]/65">Subtotal</span>
                      <span class="font-medium text-[#2D2926]">S/ {{ subtotal() | number:'1.2-2' }}</span>
                    </div>
                    @if (!esCliente()) {
                      <div class="flex justify-between px-4 py-2.5 text-sm border-b border-[#EEE3D1]">
                        <span class="text-[#2D2926]/65">Descuento</span>
                        <span class="font-medium text-emerald-600">— S/ {{ descuentoEfectivo() | number:'1.2-2' }}</span>
                      </div>
                    }
                    <div class="flex justify-between px-4 py-2.5 text-sm border-b border-[#EEE3D1]">
                      <span class="text-[#2D2926]/65">Impuesto (18%)</span>
                      <span class="font-medium text-[#2D2926]">S/ {{ impuesto() | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between px-4 py-3 text-sm font-bold bg-[#F9F5F0] border-b border-[#EEE3D1]">
                      <span class="text-[#2D2926]">Total</span>
                      <span class="text-[#2D2926] text-base">S/ {{ total() | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between px-4 py-2.5 text-sm border-b border-[#EEE3D1]">
                      <span class="text-[#2D2926]/65">Adelanto ({{ modalidadPago() === 'TOTAL' ? '100%' : '50%' }})</span>
                      <span class="font-medium text-[#2D2926]">S/ {{ adelanto() | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between px-4 py-2.5 text-sm font-semibold text-[#C5A048]">
                      <span>Saldo pendiente</span>
                      <span>S/ {{ saldoPendiente() | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#EEE3D1] shrink-0">
                <button type="button" (click)="irAPaso(3)"
                  class="h-9 px-4 rounded-xl border border-[#EEE3D1] text-sm font-medium
                         text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
                  </svg>
                  Volver
                </button>
                <button type="button" (click)="avanzarPaso()" [disabled]="descuentoInvalido()"
                  class="h-9 px-5 rounded-xl bg-[#C5A048] text-white text-sm font-semibold
                         hover:bg-[#8E6F2E] transition-colors flex items-center gap-2 disabled:opacity-50">
                  Continuar
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                  </svg>
                </button>
              </div>
            }

            <!-- PASO 5: Pago -->
            @if (pasoActual() === 5) {
              <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                <!-- Resumen del cobro -->
                <div class="p-5 rounded-xl border-2 border-[#C5A048] bg-[#FDF8EF] space-y-2">
                  <div class="flex justify-between text-[14px]">
                    <span class="text-[#2D2926]/65">Total de la reserva</span>
                    <span class="font-medium text-[#2D2926]">S/ {{ total() | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between text-[15px] font-bold text-[#C5A048] border-t border-[#EEE3D1] pt-2">
                    <span>A pagar ahora ({{ modalidadPago() === 'TOTAL' ? '100%' : '50%' }})</span>
                    <span>S/ {{ adelanto() | number:'1.2-2' }}</span>
                  </div>
                  @if (saldoPendiente() > 0) {
                    <div class="flex justify-between text-[12px] text-[#2D2926]/50">
                      <span>Saldo al llegar al hotel</span>
                      <span>S/ {{ saldoPendiente() | number:'1.2-2' }}</span>
                    </div>
                  }
                </div>

                @if (esCliente() || (!esCliente() && metodoPagoStaff() === 'NIUBIZ')) {
                  <!-- Pago en línea con Niubiz -->
                  <div class="rounded-xl border border-[#EEE3D1] p-4 space-y-3">
                    <div class="flex items-center gap-2 text-[13px] text-[#2D2926]/65">
                      <svg class="w-4 h-4 shrink-0 text-[#C5A048]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h2m2 0h2M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      Aceptamos Visa, Mastercard, Amex, Diners y Yape.
                    </div>
                    <div class="flex items-center gap-2 text-[11px] text-[#2D2926]/50">
                      <svg class="w-4 h-4 shrink-0 text-[#C5A048]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      Los datos de pago se ingresan en el formulario seguro de Niubiz.
                    </div>
                  </div>
                }

                @if (!esCliente() && metodoPagoStaff() === 'EFECTIVO') {
                  <!-- Pago en efectivo -->
                  <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p class="text-sm font-semibold text-emerald-700">Pago en efectivo</p>
                    <p class="text-xs text-emerald-600 mt-1">
                      Al confirmar, la reserva quedará en estado <strong>CONFIRMADA</strong> y
                      se registrará el adelanto de S/ {{ adelanto() | number:'1.2-2' }} en el sistema.
                    </p>
                  </div>
                }

              </div>

              <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#EEE3D1] shrink-0">
                <button type="button" (click)="irAPaso(4)" [disabled]="enviandoPago()"
                  class="h-9 px-4 rounded-xl border border-[#EEE3D1] text-sm font-medium
                         text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors flex items-center gap-2
                         disabled:opacity-50">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
                  </svg>
                  Volver
                </button>

                @if (esCliente() || (!esCliente() && metodoPagoStaff() === 'NIUBIZ')) {
                  <button type="button" (click)="guardarCreate()" [disabled]="enviandoPago()"
                    class="h-9 px-6 rounded-xl bg-[#C5A048] text-white text-sm font-semibold
                           hover:bg-[#8E6F2E] transition-colors flex items-center gap-2 disabled:opacity-60">
                    @if (enviandoPago()) {
                      <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" d="M12 3v3m0 12v3M3 12h3m12 0h3"/>
                      </svg>
                      Procesando...
                    } @else {
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h2m2 0h2M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      Crear y pagar con Niubiz
                    }
                  </button>
                }

                @if (!esCliente() && metodoPagoStaff() === 'EFECTIVO') {
                  <button type="button" (click)="guardarCreate()" [disabled]="enviandoPago()"
                    class="h-9 px-6 rounded-xl bg-emerald-600 text-white text-sm font-semibold
                           hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60">
                    @if (enviandoPago()) {
                      <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" d="M12 3v3m0 12v3M3 12h3m12 0h3"/>
                      </svg>
                      Registrando...
                    } @else {
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                      </svg>
                      Confirmar pago en efectivo
                    }
                  </button>
                }
              </div>
            }
          }

          <!-- ── EDIT MODE ── -->
          @if (esEdicion()) {
            <div class="flex-1 overflow-y-auto px-6 py-5">
              <form [formGroup]="editForm" (ngSubmit)="guardarEdit()" class="space-y-4">
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">
                      Fecha de llegada <span class="text-red-500">*</span>
                    </label>
                    <input type="date" formControlName="fechaInicio"
                      [min]="hoy()" [class]="icEdit('fechaInicio')" />
                    @if (invEdit('fechaInicio')) {
                      <p class="text-xs text-red-500 mt-1">Obligatorio.</p>
                    }
                  </div>
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">
                      Fecha de salida <span class="text-red-500">*</span>
                    </label>
                    <input type="date" formControlName="fechaFin" [class]="icEdit('fechaFin')" />
                    @if (invEdit('fechaFin')) {
                      <p class="text-xs text-red-500 mt-1">Obligatorio.</p>
                    }
                  </div>
                </div>

                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">
                      Adultos <span class="text-red-500">*</span>
                    </label>
                    <input type="number" formControlName="nroAdultos" min="1"
                      [class]="icEdit('nroAdultos')" />
                  </div>
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Niños</label>
                    <input type="number" formControlName="nroNinos" min="0"
                      [class]="icEdit('nroNinos')" />
                  </div>
                </div>

                <div>
                  <label class="text-[13px] font-medium text-[#2D2926]/70">Canal de reserva</label>
                  <select formControlName="canalId" [class]="icEdit('canalId')">
                    <option [value]="null">Sin canal específico</option>
                    @for (c of canales; track c.canalId) {
                      <option [value]="c.canalId">{{ c.nombre }}</option>
                    }
                  </select>
                </div>

                <!-- Acompañantes (staff): reemplazan a los huéspedes no-principales. -->
                <div class="pt-2 border-t border-[#EEE3D1]">
                  <div class="flex items-center justify-between mb-1">
                    <p class="text-[11px] uppercase tracking-wider text-[#C5A048] font-semibold">
                      Acompañantes
                    </p>
                    @if (maxAcompanantes() > 0) {
                      <span class="text-[11px] text-[#2D2926]/50">
                        Hasta {{ maxAcompanantes() }} (1 titular + acompañantes ≤ huéspedes)
                      </span>
                    }
                  </div>
                  <p class="text-[11px] text-[#2D2926]/50 mb-3">
                    Los acompañantes que quites de esta lista se eliminarán de la reserva al guardar.
                  </p>

                  @for (grupo of acompanantesCtrls(); track $index) {
                    <div [formGroup]="grupo" class="bg-[#F9F5F0] border border-[#EEE3D1] rounded-xl p-3 mb-3 space-y-3">
                      <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold text-[#8E6F2E]">Acompañante {{ $index + 1 }}</p>
                        <button type="button" (click)="quitarAcompanante($index); acompanantes.markAsDirty()"
                          class="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
                          aria-label="Eliminar acompañante">
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                      <div class="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label class="text-[13px] font-medium text-[#2D2926]/70">
                            Nombre <span class="text-red-500">*</span>
                          </label>
                          <input type="text" formControlName="nombre" maxlength="80" placeholder="Ana"
                            [class]="icAcomp($index, 'nombre')" />
                        </div>
                        <div>
                          <label class="text-[13px] font-medium text-[#2D2926]/70">
                            Apellido paterno <span class="text-red-500">*</span>
                          </label>
                          <input type="text" formControlName="apellidoPaterno" maxlength="80" placeholder="Gómez"
                            [class]="icAcomp($index, 'apellidoPaterno')" />
                        </div>
                      </div>
                      <div class="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label class="text-[13px] font-medium text-[#2D2926]/70">Apellido materno</label>
                          <input type="text" formControlName="apellidoMaterno" maxlength="80" placeholder="López"
                            [class]="icAcomp($index, 'apellidoMaterno')" />
                        </div>
                        <div>
                          <label class="text-[13px] font-medium text-[#2D2926]/70">
                            N° documento <span class="text-red-500">*</span>
                          </label>
                          <input type="text" formControlName="numeroDocumento" maxlength="20" placeholder="99999999"
                            [class]="icAcomp($index, 'numeroDocumento')" />
                        </div>
                      </div>
                      <div class="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label class="text-[13px] font-medium text-[#2D2926]/70">Nacionalidad</label>
                          <input type="text" formControlName="nacionalidad" maxlength="60" placeholder="Peruana"
                            [class]="icAcomp($index, 'nacionalidad')" />
                        </div>
                        <div>
                          <label class="text-[13px] font-medium text-[#2D2926]/70">Correo</label>
                          <input type="email" formControlName="correo" maxlength="150" placeholder="correo@ejemplo.com"
                            [class]="icAcomp($index, 'correo')" />
                          @if (invAcomp($index, 'correo')) {
                            <p class="text-xs text-red-500 mt-1">Correo no válido.</p>
                          }
                        </div>
                      </div>
                      <div class="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label class="text-[13px] font-medium text-[#2D2926]/70">Teléfono</label>
                          <input type="tel" formControlName="telefono" maxlength="20" placeholder="999 888 777"
                            [class]="icAcomp($index, 'telefono')" />
                        </div>
                      </div>
                    </div>
                  }

                  @if (maxAcompanantes() > 0 && acompanantes.length < maxAcompanantes()) {
                    <button type="button" (click)="agregarAcompanante(); acompanantes.markAsDirty()"
                      class="w-full h-9 rounded-xl border-2 border-dashed border-[#C5A048] text-[#C5A048]
                             text-sm font-semibold hover:bg-[#FFF8E1] transition-colors
                             flex items-center justify-center gap-2">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" d="M12 4.5v15m7.5-7.5h-15"/>
                      </svg>
                      Agregar acompañante
                    </button>
                  }
                </div>

                <div class="pt-2 border-t border-[#EEE3D1]">
                  <p class="text-[11px] uppercase tracking-wider text-[#C5A048] font-semibold mb-3">
                    Datos económicos
                  </p>
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">
                      Descuento (S/)
                      <span class="text-[11px] font-normal text-[#2D2926]/40 ml-1">
                        Máx 30% — S/ {{ descuentoMax() | number:'1.2-2' }}
                      </span>
                    </label>
                    <input type="number" formControlName="descuento" min="0" step="0.01"
                      [class]="icEdit('descuento')" />
                    @if (descuentoInvalido()) {
                      <p class="text-xs text-red-500 mt-1">El descuento no puede superar el 30% del subtotal.</p>
                    }
                  </div>

                  <!-- Modalidad de pago: el backend re-deriva el adelanto del nuevo total. -->
                  <div class="mt-4">
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Modalidad de pago</label>
                    <div class="mt-1.5 grid grid-cols-2 gap-3">
                      @for (op of modalidades; track op.value) {
                        <button type="button" (click)="modalidadPago.set(op.value)"
                          [class]="modalidadPago() === op.value
                            ? 'h-auto py-3 px-4 rounded-lg border-2 border-[#C5A048] bg-[#FBF7EF] text-left transition'
                            : 'h-auto py-3 px-4 rounded-lg border border-[#EEE3D1] bg-white text-left hover:border-[#C5A048]/50 transition'">
                          <span class="block text-sm font-semibold text-[#2D2926]">{{ op.label }}</span>
                          <span class="block text-[11px] text-[#2D2926]/50">{{ op.hint }}</span>
                        </button>
                      }
                    </div>
                    <p class="text-[11px] text-[#2D2926]/50 mt-1.5">
                      Adelanto estimado:
                      <strong class="text-[#C5A048]">S/ {{ adelanto() | number:'1.2-2' }}</strong>
                      · Saldo: S/ {{ saldoPendiente() | number:'1.2-2' }}
                    </p>
                  </div>

                  <div class="mt-4">
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Observaciones</label>
                    <textarea formControlName="observaciones" rows="2" maxlength="500"
                      placeholder="Notas adicionales..."
                      class="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                             focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20
                             transition resize-none"></textarea>
                  </div>
                </div>
              </form>
            </div>

            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#EEE3D1] shrink-0">
              <button type="button" (click)="onClose.emit()"
                class="h-9 px-4 rounded-xl border border-[#EEE3D1] text-sm font-medium
                       text-[#2D2926]/70 hover:bg-[#F9F5F0] transition-colors">
                Cancelar
              </button>
              <button type="button" [disabled]="editForm.invalid || descuentoInvalido()" (click)="guardarEdit()"
                class="h-9 px-5 rounded-xl bg-[#C5A048] text-white text-sm font-semibold
                       hover:bg-[#8E6F2E] transition-colors disabled:opacity-50">
                Guardar cambios
              </button>
            </div>
          }

        </div>
      </div>
    }
  `,
})
export class ReservationFormComponent {
  private readonly fb                 = inject(FormBuilder);
  private readonly disponibilidadSvc  = inject(DisponibilidadService);
  private readonly clienteSvc         = inject(ClienteService);
  private readonly authStore          = inject(AuthStore);
  private readonly destroyRef         = inject(DestroyRef);

  isOpen        = input.required<boolean>();
  reserva       = input<Reserva | null>(null);
  initialFechas = input<{ fechaInicio: string; fechaFin: string; nroAdultos: number } | null>(null);

  onClose = output<void>();
  onSave  = output<ReservaFormSaveEvent>();

  readonly canales = CANALES;

  readonly modalidades: ReadonlyArray<{ value: ModalidadPago; label: string; hint: string }> = [
    { value: 'PARCIAL', label: 'Pago parcial', hint: '50% del total' },
    { value: 'TOTAL',   label: 'Pago total',   hint: '100% del total' },
  ];

  /** Método de pago solo para staff: EFECTIVO o NIUBIZ. */
  readonly metodoPagoStaff = signal<'EFECTIVO' | 'NIUBIZ'>('NIUBIZ');

  /** True si el usuario en sesión es RECEPCIONISTA o ADMIN. */
  readonly esStaff = computed(() => {
    const rol = this.authStore.rol();
    return rol === 'RECEPCIONISTA' || rol === 'ADMIN';
  });

  // ── State ──────────────────────────────────────────────────────────────────
  readonly pasoActual               = signal<1 | 2 | 3 | 4 | 5>(1);
  readonly enviandoPago             = signal(false);
  readonly habitacionesSeleccionadas = signal<Array<{
    hab: HabitacionDisponible;
    tipoHabitacionId: number;
    tipoHabitacionNombre: string;
    tarifaPactada: number;
  }>>([]);
  readonly huespedesSeleccionados   = signal<Array<{ cliente: Cliente; esPrincipal: boolean }>>([]);
  readonly busquedaHuesped          = signal('');
  readonly nuevoClienteAbierto      = signal(false);
  readonly errorPaso                = signal<string | null>(null);

  /** Cuando el usuario es CLIENTE, el backend infiere el huésped del JWT:
   *  se oculta el selector de cliente y no se exige seleccionar huéspedes. */
  readonly esCliente = computed(() => this.authStore.rol() === 'CLIENTE');

  /** Subject para la búsqueda dinámica de clientes (debounce + switchMap). */
  private readonly _busquedaSubject = new Subject<string>();
  /** Resultados dinámicos de la búsqueda de clientes (vaciar en resultados de menos de 2 chars). */
  readonly resultadosBusquedaDinamicos = signal<import('../../../clients/models/cliente.model').Cliente[]>([]);

  private readonly _fechaInicio = signal('');
  private readonly _fechaFin    = signal('');
  private readonly _nroAdultos  = signal(1);
  private readonly _nroNinos    = signal(0);

  /** Tope de acompañantes: 1 titular + acompañantes ≤ nroAdultos + nroNinos. */
  readonly maxAcompanantes = computed(() =>
    Math.max(0, this._nroAdultos() + this._nroNinos() - 1),
  );

  readonly descuento    = signal(0);
  readonly modalidadPago = signal<ModalidadPago>('PARCIAL');
  readonly observaciones = signal<string | null>(null);

  /** Acompañantes (cliente): huéspedes sin cuenta. El titular NO va aquí. */
  readonly acompanantes = new FormArray<FormGroup>([]);

  // ── Forms ──────────────────────────────────────────────────────────────────
  readonly paso1Form = this.fb.group({
    fechaInicio: ['', Validators.required],
    fechaFin:    ['', Validators.required],
    nroAdultos:  [1,  [Validators.required, Validators.min(1)]],
    nroNinos:    [0,  [Validators.min(0)]],
    canalId:     [1 as number | null],  // Directa por defecto para staff
  });

  readonly editForm = this.fb.group({
    fechaInicio:   ['', Validators.required],
    fechaFin:      ['', Validators.required],
    nroAdultos:    [1,  [Validators.required, Validators.min(1)]],
    nroNinos:      [0,  [Validators.min(0)]],
    canalId:       [1 as number | null],  // Directa por defecto para staff
    descuento:     [0,  Validators.min(0)],
    observaciones: [null as string | null, Validators.maxLength(500)],
  });

  readonly nuevoClienteForm = this.fb.group({
    nombre:          ['', [Validators.required, Validators.maxLength(80)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(80)]],
    apellidoMaterno: ['', Validators.maxLength(80)],
    numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
  });

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly esEdicion = computed(() => this.reserva() != null);

  readonly disponibles         = this.disponibilidadSvc.disponibles;
  readonly disponiblesCargando = this.disponibilidadSvc.loading;
  readonly tipos               = this.disponibilidadSvc.tipos;
  readonly tiposCargando       = this.disponibilidadSvc.loadingTipos;

  readonly hoy = computed(() => new Date().toISOString().slice(0, 10));

  readonly minFechaFin = computed(() => {
    const fi = this._fechaInicio();
    if (!fi) return this.hoy();
    const d = new Date(fi + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  readonly noches = computed(() => {
    const fi = this._fechaInicio();
    const ff = this._fechaFin();
    if (!fi || !ff) return 0;
    return Math.max(0, Math.round((new Date(ff).getTime() - new Date(fi).getTime()) / 86_400_000));
  });

  readonly subtotal = computed(() =>
    this.esEdicion()
      ? (this.reserva()?.subtotal ?? 0)
      : this.habitacionesSeleccionadas().reduce((s, h) => s + h.tarifaPactada * this.noches(), 0),
  );

  /** Descuento efectivo: el cliente nunca lo aplica (backend lo fuerza a 0). */
  readonly descuentoEfectivo = computed(() => (this.esCliente() ? 0 : this.descuento()));

  /** Tope de descuento para staff: 30% del subtotal. */
  readonly descuentoMax = computed(() => Math.round(this.subtotal() * 0.3 * 100) / 100);

  /** True si el descuento de staff supera el tope permitido. */
  readonly descuentoInvalido = computed(
    () => !this.esCliente() && this.descuento() > this.descuentoMax(),
  );

  /** IGV 18% — preview optimista; el valor válido es el del response del backend. */
  readonly impuesto = computed(
    () => Math.round((this.subtotal() - this.descuentoEfectivo()) * 0.18 * 100) / 100,
  );

  readonly total = computed(() =>
    Math.max(0, this.subtotal() - this.descuentoEfectivo() + this.impuesto()),
  );

  /** Adelanto derivado de la modalidad: TOTAL=100%, PARCIAL=50% del total. */
  readonly adelanto = computed(() =>
    this.modalidadPago() === 'TOTAL'
      ? this.total()
      : Math.round(this.total() * 0.5 * 100) / 100,
  );

  readonly saldoPendiente = computed(() => Math.max(0, this.total() - this.adelanto()));

  /** Alguna tarifa pactada por staff está fuera del rango 50%–200% del precio base. */
  readonly hayTarifaInvalida = computed(() => {
    if (this.esCliente()) return false;
    return this.habitacionesSeleccionadas().some(h => {
      const base = this.tipos().find(t => t.tipoHabitacionId === h.tipoHabitacionId)?.precioBase ?? 0;
      return base > 0 && (h.tarifaPactada < base * 0.5 || h.tarifaPactada > base * 2);
    });
  });

  readonly resultadosBusqueda = computed(() => {
    return this.resultadosBusquedaDinamicos();
  });

  private readonly _editHydratedId = signal<number | null>(null);

  constructor() {
    effect(() => {
      const r = this.reserva();
      if (r && this._editHydratedId() !== r.reservaId) {
        this.editForm.patchValue({
          fechaInicio:   r.fechaInicio,
          fechaFin:      r.fechaFin,
          nroAdultos:    r.nroAdultos,
          nroNinos:      r.nroNinos,
          canalId:       r.canalId,
          descuento:     r.descuento,
          observaciones: r.observaciones,
        });
        this.descuento.set(r.descuento);
        this.modalidadPago.set(r.modalidadPago ?? 'PARCIAL');
        // Pax → tope de acompañantes; luego se pre-llenan los actuales (no-principales).
        this._nroAdultos.set(r.nroAdultos);
        this._nroNinos.set(r.nroNinos);
        this.hidratarAcompanantes(r);
        this._editHydratedId.set(r.reservaId);
      }
    });

    effect(() => {
      if (!this.isOpen()) this.reset();
    });

    // Si se reduce nroAdultos/nroNinos tras agregar acompañantes, recorta los
    // sobrantes para no exceder el tope (1 titular + acompañantes ≤ pax).
    effect(() => {
      const max = this.maxAcompanantes();
      while (this.acompanantes.length > max) {
        this.acompanantes.removeAt(this.acompanantes.length - 1);
      }
    });

    effect(() => {
      const init = this.initialFechas();
      const open = this.isOpen();
      if (init && open && !this.esEdicion()) {
        this.paso1Form.patchValue({
          fechaInicio: init.fechaInicio,
          fechaFin:    init.fechaFin,
          nroAdultos:  init.nroAdultos,
        });
        this._fechaInicio.set(init.fechaInicio);
        this._fechaFin.set(init.fechaFin);
        this._nroAdultos.set(init.nroAdultos);
      }
    });

    this.paso1Form.get('fechaInicio')!.valueChanges.pipe(
      debounceTime(100), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef),
    ).subscribe(v => this._fechaInicio.set(v ?? ''));

    this.paso1Form.get('fechaFin')!.valueChanges.pipe(
      debounceTime(100), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef),
    ).subscribe(v => this._fechaFin.set(v ?? ''));

    // Pax → signals para calcular el tope de acompañantes reactivamente.
    this.paso1Form.get('nroAdultos')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(v => this._nroAdultos.set(Number(v ?? 1)));

    this.paso1Form.get('nroNinos')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(v => this._nroNinos.set(Number(v ?? 0)));

    // En edición, reflejar el descuento del form en el signal para el preview de totales.
    this.editForm.get('descuento')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(v => this.descuento.set(Number(v ?? 0)));

    // En edición, pax del editForm → signals del tope de acompañantes.
    this.editForm.get('nroAdultos')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(v => this._nroAdultos.set(Number(v ?? 1)));

    this.editForm.get('nroNinos')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(v => this._nroNinos.set(Number(v ?? 0)));

    // Búsqueda dinámica de clientes: debounce 300ms + cancel de peticiones previas.
    this._busquedaSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.trim().length < 2) {
          this.resultadosBusquedaDinamicos.set([]);
          return [];
        }
        return this.clienteSvc.buscar(q);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(lista => {
      const selIds = new Set(this.huespedesSeleccionados().map(h => h.cliente.huespedId));
      this.resultadosBusquedaDinamicos.set(
        lista.filter(c => !selIds.has(c.huespedId) && c.estado === 'ACTIVO').slice(0, 8),
      );
    });
  }

  reset(): void {
    this.pasoActual.set(1);
    this.habitacionesSeleccionadas.set([]);
    this.huespedesSeleccionados.set([]);
    this.busquedaHuesped.set('');
    this.resultadosBusquedaDinamicos.set([]);
    this.nuevoClienteAbierto.set(false);
    this.errorPaso.set(null);
    this.descuento.set(0);
    this.modalidadPago.set('PARCIAL');
    this.metodoPagoStaff.set('NIUBIZ');
    this.observaciones.set(null);
    this.enviandoPago.set(false);
    this._fechaInicio.set('');
    this._fechaFin.set('');
    this._nroAdultos.set(1);
    this._nroNinos.set(0);
    this.acompanantes.clear();
    this._editHydratedId.set(null);
    this.paso1Form.reset({ nroAdultos: 1, nroNinos: 0 });
    this.nuevoClienteForm.reset();
    this.disponibilidadSvc.limpiar();
  }


  // ── Step navigation ────────────────────────────────────────────────────────

  irAPaso(paso: number): void {
    if (paso >= this.pasoActual()) return;
    this.pasoActual.set(paso as 1 | 2 | 3 | 4 | 5);
    this.errorPaso.set(null);
  }

  buscarDisponibilidad(): void {
    if (this.paso1Form.invalid) {
      this.paso1Form.markAllAsTouched();
      return;
    }
    const v = this.paso1Form.value;
    if (v.fechaInicio! < this.hoy()) {
      this.errorPaso.set('La fecha de entrada no puede ser en el pasado.');
      return;
    }
    if (v.fechaInicio! >= v.fechaFin!) {
      this.errorPaso.set('La fecha de salida debe ser posterior a la fecha de entrada.');
      return;
    }
    this.errorPaso.set(null);
    this.habitacionesSeleccionadas.set([]);
    this.disponibilidadSvc.buscarDisponibles(v.fechaInicio!, v.fechaFin!);
    this.disponibilidadSvc.cargarTipos();
    this.pasoActual.set(2);
  }

  avanzarPaso(): void {
    this.errorPaso.set(null);
    const paso = this.pasoActual();
    if (paso === 2) {
      if (this.habitacionesSeleccionadas().length === 0) {
        this.errorPaso.set('Selecciona al menos una habitación para continuar.');
        return;
      }
      const sinTipo = this.habitacionesSeleccionadas().some(h => h.tipoHabitacionId === 0);
      if (sinTipo) {
        this.errorPaso.set('Asigna un tipo de habitación a cada habitación seleccionada.');
        return;
      }
      if (this.hayTarifaInvalida()) {
        this.errorPaso.set('La tarifa pactada debe estar entre el 50% y el 200% del precio base.');
        return;
      }
      this.pasoActual.set(3);
    } else if (paso === 3) {
      if (!this.esCliente() && this.huespedesSeleccionados().length === 0) {
        this.errorPaso.set('Agrega al menos un huésped para continuar.');
        return;
      }
      if (this.esCliente()) {
        if (this.acompanantes.length > this.maxAcompanantes()) {
          this.errorPaso.set(
            `Máximo ${this.maxAcompanantes()} acompañante(s) para el número de huéspedes indicado.`,
          );
          return;
        }
        if (this.acompanantes.invalid) {
          this.acompanantes.markAllAsTouched();
          this.errorPaso.set('Completa los datos obligatorios de los acompañantes.');
          return;
        }
      }
      this.pasoActual.set(4);
    } else if (paso === 4) {
      if (!this.esCliente() && this.descuentoInvalido()) {
        this.errorPaso.set('El descuento no puede superar el 30% del subtotal.');
        return;
      }
      this.pasoActual.set(5);
    }
  }

  onFechaChange(): void {
    this._fechaInicio.set(this.paso1Form.get('fechaInicio')?.value ?? '');
    this._fechaFin.set(this.paso1Form.get('fechaFin')?.value ?? '');
  }

  // ── Room selection ─────────────────────────────────────────────────────────

  toggleHabitacion(hab: HabitacionDisponible): void {
    const actual = this.habitacionesSeleccionadas();
    const idx = actual.findIndex(h => h.hab.habitacionId === hab.habitacionId);
    if (idx >= 0) {
      // Deseleccionar siempre permitido
      this.habitacionesSeleccionadas.set(actual.filter((_, i) => i !== idx));
    } else {
      // Bloquear selección de más de 1 habitación cuando nroAdultos === 1
      if (this._nroAdultos() <= 1 && actual.length >= 1) {
        this.errorPaso.set('Con 1 adulto solo puedes seleccionar 1 habitación. Aumenta el número de adultos para agregar más.');
        return;
      }
      this.errorPaso.set(null);
      // Auto-asignar tipo si la habitación ya tiene uno asignado
      const tipoEnLista = hab.tipoHabitacionId
        ? this.tipos().find(t => t.tipoHabitacionId === hab.tipoHabitacionId)
        : null;
      this.habitacionesSeleccionadas.set([...actual, {
        hab,
        tipoHabitacionId:    hab.tipoHabitacionId ?? 0,
        tipoHabitacionNombre: tipoEnLista?.nombre ?? hab.tipoHabitacionNombre ?? '',
        tarifaPactada:        tipoEnLista?.precioBase ?? hab.precioBase ?? 0,
      }]);
    }
  }

  estaSeleccionada(habitacionId: number): boolean {
    return this.habitacionesSeleccionadas().some(h => h.hab.habitacionId === habitacionId);
  }

  setTipoHabitacion(habitacionId: number, tipoId: number): void {
    const tipo = this.tipos().find(t => t.tipoHabitacionId === tipoId);
    this.habitacionesSeleccionadas.update(list =>
      list.map(h =>
        h.hab.habitacionId === habitacionId
          ? { ...h, tipoHabitacionId: tipoId, tipoHabitacionNombre: tipo?.nombre ?? '', tarifaPactada: tipo?.precioBase ?? 0 }
          : h,
      ),
    );
  }

  getTipoId(habitacionId: number): number {
    return this.habitacionesSeleccionadas().find(h => h.hab.habitacionId === habitacionId)?.tipoHabitacionId ?? 0;
  }

  getTarifa(habitacionId: number): number {
    return this.habitacionesSeleccionadas().find(h => h.hab.habitacionId === habitacionId)?.tarifaPactada ?? 0;
  }

  getNombreTipo(habitacionId: number): string {
    return this.habitacionesSeleccionadas().find(h => h.hab.habitacionId === habitacionId)?.tipoHabitacionNombre ?? '—';
  }

  /** Precio base del tipo asignado a la habitación (referencia para validar la tarifa pactada). */
  getPrecioBase(habitacionId: number): number {
    const tipoId = this.getTipoId(habitacionId);
    return this.tipos().find(t => t.tipoHabitacionId === tipoId)?.precioBase ?? 0;
  }

  /** Solo staff puede pactar la tarifa; el backend revalida el rango 50%–200% del precio base. */
  setTarifaPactada(habitacionId: number, valor: number): void {
    this.habitacionesSeleccionadas.update(list =>
      list.map(h =>
        h.hab.habitacionId === habitacionId ? { ...h, tarifaPactada: Math.max(0, valor) } : h,
      ),
    );
  }

  /** True si la tarifa pactada queda fuera del rango permitido (50%–200% del precio base). */
  tarifaInvalida(habitacionId: number): boolean {
    const base = this.getPrecioBase(habitacionId);
    if (base <= 0) return false;
    const t = this.getTarifa(habitacionId);
    return t < base * 0.5 || t > base * 2;
  }

  // ── Acompañantes (cliente) ───────────────────────────────────────────────────

  /** Devuelve los grupos del FormArray tipados para el template. */
  acompanantesCtrls(): FormGroup[] {
    return this.acompanantes.controls as FormGroup[];
  }

  private nuevoAcompananteGroup(v: Partial<Record<string, string>> = {}): FormGroup {
    return this.fb.group({
      nombre:          [v['nombre'] ?? '', [Validators.required, Validators.maxLength(80)]],
      apellidoPaterno: [v['apellidoPaterno'] ?? '', [Validators.required, Validators.maxLength(80)]],
      apellidoMaterno: [v['apellidoMaterno'] ?? '', Validators.maxLength(80)],
      numeroDocumento: [v['numeroDocumento'] ?? '', [Validators.required, Validators.maxLength(20)]],
      nacionalidad:    [v['nacionalidad'] ?? '', Validators.maxLength(60)],
      correo:          [v['correo'] ?? '', [Validators.email, Validators.maxLength(150)]],
      telefono:        [v['telefono'] ?? '', Validators.maxLength(20)],
    });
  }

  /** Rellena el FormArray con los acompañantes actuales (no-principales) de la reserva. */
  private hidratarAcompanantes(r: Reserva): void {
    this.acompanantes.clear();
    for (const h of r.huespedes.filter(x => !x.esPrincipal)) {
      this.acompanantes.push(this.nuevoAcompananteGroup({
        nombre:          h.nombre,
        apellidoPaterno: h.apellidoPaterno,
        apellidoMaterno: h.apellidoMaterno ?? '',
        numeroDocumento: h.numeroDocumento,
        nacionalidad:    h.nacionalidad ?? '',
        correo:          h.correo ?? '',
        telefono:        h.telefono ?? '',
      }));
    }
  }

  agregarAcompanante(): void {
    if (this.acompanantes.length >= this.maxAcompanantes()) return;
    this.acompanantes.push(this.nuevoAcompananteGroup());
  }

  quitarAcompanante(index: number): void {
    this.acompanantes.removeAt(index);
  }

  invAcomp(index: number, field: string): boolean {
    const c = this.acompanantes.at(index)?.get(field);
    return !!(c?.invalid && c.touched);
  }

  icAcomp(index: number, field: string): string {
    return this.invAcomp(index, field) ? INPUT_ERR : INPUT_OK;
  }

  /** Construye el arreglo `Acompanante[]` del payload, omitiendo campos opcionales vacíos. */
  private construirAcompanantes(): Acompanante[] {
    return this.acompanantesCtrls().map(g => {
      const v = g.getRawValue() as Record<string, string | null>;
      const a: Acompanante = {
        nombre:          (v['nombre'] ?? '').trim(),
        apellidoPaterno: (v['apellidoPaterno'] ?? '').trim(),
        numeroDocumento: (v['numeroDocumento'] ?? '').trim(),
      };
      const apMaterno = v['apellidoMaterno']?.trim();
      const nacionalidad = v['nacionalidad']?.trim();
      const correo = v['correo']?.trim();
      const telefono = v['telefono']?.trim();
      if (apMaterno)   a.apellidoMaterno = apMaterno;
      if (nacionalidad) a.nacionalidad = nacionalidad;
      if (correo)      a.correo = correo;
      if (telefono)    a.telefono = telefono;
      return a;
    });
  }

  // ── Guest management ───────────────────────────────────────────────────────

  setBusqueda(termino: string): void {
    this.busquedaHuesped.set(termino);
    this._busquedaSubject.next(termino);
  }

  agregarHuesped(cliente: Cliente): void {
    if (this.huespedesSeleccionados().some(h => h.cliente.huespedId === cliente.huespedId)) return;
    const esPrincipal = this.huespedesSeleccionados().length === 0;
    this.huespedesSeleccionados.update(list => [...list, { cliente, esPrincipal }]);
    this.busquedaHuesped.set('');
    this.resultadosBusquedaDinamicos.set([]);
    this._busquedaSubject.next('');
  }

  quitarHuesped(huespedId: number): void {
    const lista = this.huespedesSeleccionados().filter(h => h.cliente.huespedId !== huespedId);
    if (lista.length > 0 && !lista.some(h => h.esPrincipal)) {
      lista[0] = { ...lista[0], esPrincipal: true };
    }
    this.huespedesSeleccionados.set(lista);
  }

  marcarPrincipal(huespedId: number): void {
    this.huespedesSeleccionados.set(
      this.huespedesSeleccionados().map(h => ({ ...h, esPrincipal: h.cliente.huespedId === huespedId })),
    );
  }

  guardarNuevoCliente(): void {
    if (this.nuevoClienteForm.invalid) return;
    const v = this.nuevoClienteForm.value;
    const payload: CreateClientePayload = {
      nombre:          v.nombre!.trim(),
      apellidoPaterno: v.apellidoPaterno!.trim(),
      apellidoMaterno: v.apellidoMaterno?.trim() || null,
      numeroDocumento: v.numeroDocumento!.trim(),
      nacionalidad:    null,
      correo:          null,
      telefono:        null,
      estado:          'ACTIVO',
      usuarioId:       null,
    };
    this.clienteSvc.create(payload).subscribe(nuevo => {
      this.agregarHuesped(nuevo);
      this.nuevoClienteAbierto.set(false);
      this.nuevoClienteForm.reset();
    });
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  guardarCreate(): void {
    if (this.descuentoInvalido()) {
      this.errorPaso.set('El descuento no puede superar el 30% del subtotal.');
      return;
    }
    const f1 = this.paso1Form.value;

    // Base común. El backend genera codReserva, recalcula impuesto/subtotal/total
    // y deriva el adelanto de modalidadPago, así que no se envían.
    const payload: CreateReservaPayload = {
      fechaInicio:   f1.fechaInicio!,
      fechaFin:      f1.fechaFin!,
      nroAdultos:    f1.nroAdultos!,
      nroNinos:      f1.nroNinos ?? 0,
      modalidadPago: this.modalidadPago(),
      observaciones: this.observaciones(),
      huespedes: this.esCliente()
        ? [] // el backend infiere el huésped del JWT
        : this.huespedesSeleccionados().map(h => ({
            huespedId:   h.cliente.huespedId,
            esPrincipal: h.esPrincipal,
          })),
      habitaciones: this.habitacionesSeleccionadas().map(h => ({
        habitacionId:     h.hab.habitacionId,
        tipoHabitacionId: h.tipoHabitacionId,
        // El cliente omite la tarifa (backend usa el precio base); el staff la pacta.
        ...(this.esCliente() ? {} : { tarifaPactada: h.tarifaPactada }),
      })),
    };

    if (this.esCliente()) {
      payload.canalId = 3; // Online: el cliente reserva desde su dashboard
      // Titular NO va en acompanantes (backend lo deriva del JWT). Solo si hay ≥1.
      if (this.acompanantes.invalid) {
        this.acompanantes.markAllAsTouched();
        this.errorPaso.set('Completa los datos obligatorios de los acompañantes.');
        return;
      }
      if (this.acompanantes.length > 0) {
        payload.acompanantes = this.construirAcompanantes();
      }
    } else {
      payload.descuento = this.descuento();
      payload.usuarioId = this.authStore.user()?.usuarioId ?? null;
      payload.canalId   = f1.canalId ?? 1; // Directa por defecto si el staff no elige
    }

    this.enviandoPago.set(true);
    this.onSave.emit({
      payload,
      metodoPagoStaff: this.esStaff() ? this.metodoPagoStaff() : undefined,
    });
  }

  guardarEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    if (this.descuentoInvalido()) {
      this.errorPaso.set('El descuento no puede superar el 30% del subtotal.');
      return;
    }
    if (this.acompanantes.invalid) {
      this.acompanantes.markAllAsTouched();
      this.errorPaso.set('Completa los datos obligatorios de los acompañantes.');
      return;
    }
    if (this.acompanantes.length > this.maxAcompanantes()) {
      this.errorPaso.set(
        `Máximo ${this.maxAcompanantes()} acompañante(s) para el número de huéspedes indicado.`,
      );
      return;
    }
    const v = this.editForm.value;
    // No se envían impuesto ni adelanto: el backend los recalcula/deriva.
    const payload: UpdateReservaPayload = {
      fechaInicio:   v.fechaInicio ?? undefined,
      fechaFin:      v.fechaFin ?? undefined,
      nroAdultos:    v.nroAdultos ?? undefined,
      nroNinos:      v.nroNinos ?? undefined,
      canalId:       v.canalId ?? null,
      descuento:     Number(v.descuento ?? 0),
      modalidadPago: this.modalidadPago(),
      observaciones: v.observaciones?.trim() || null,
    };
    // Solo se envían acompañantes si el staff los modificó (evita el modo destructivo
    // "solo acompanantes" cuando no se tocaron). Reenviarlos preserva a los actuales.
    if (this.acompanantes.dirty) {
      payload.acompanantes = this.construirAcompanantes();
    }
    this.onSave.emit({ payload, id: this.reserva()!.reservaId });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  pasoLabel(paso: number): string {
    return ['', 'Fechas', 'Habitaciones', 'Huéspedes', 'Detalles', 'Pago'][paso] ?? '';
  }

  stepCircleCls(p: number): string {
    if (this.pasoActual() > p)  return 'bg-emerald-500 text-white';
    if (this.pasoActual() === p) return 'bg-[#C5A048] text-white';
    return 'bg-[#EEE3D1] text-[#8E6F2E]';
  }

  stepLabelCls(p: number): string {
    if (this.pasoActual() > p)  return 'text-emerald-600';
    if (this.pasoActual() === p) return 'text-[#C5A048]';
    return 'text-[#2D2926]/35';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '—';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  ic1(f: string): string {
    return this.inv1(f) ? INPUT_ERR : INPUT_OK;
  }

  icEdit(f: string): string {
    return this.invEdit(f) ? INPUT_ERR : INPUT_OK;
  }

  icNC(f: string): string {
    return this.invNC(f) ? INPUT_ERR : INPUT_OK;
  }

  inv1(field: string): boolean {
    const c = this.paso1Form.get(field);
    return !!(c?.invalid && c.touched);
  }

  invEdit(field: string): boolean {
    const c = this.editForm.get(field);
    return !!(c?.invalid && c.touched);
  }

  invNC(field: string): boolean {
    const c = this.nuevoClienteForm.get(field);
    return !!(c?.invalid && c.touched);
  }
}
