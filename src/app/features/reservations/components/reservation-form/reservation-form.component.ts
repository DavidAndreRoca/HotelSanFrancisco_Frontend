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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DisponibilidadService, HabitacionDisponible } from '../../services/disponibilidad.service';
import { ClienteService } from '../../../clients/services/cliente.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { Reserva, CreateReservaPayload, UpdateReservaPayload } from '../../models/reservation.model';
import { Cliente, CreateClientePayload } from '../../../clients/models/cliente.model';

export interface ReservaFormSaveEvent {
  payload: CreateReservaPayload | UpdateReservaPayload;
  id?: number;
}

const CANALES = [
  { canalId: 1, nombre: 'Directa' },
  { canalId: 2, nombre: 'Booking' },
  { canalId: 3, nombre: 'Online' },
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
              @for (p of [1,2,3,4]; track p) {
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
                @if (p < 4) {
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
                        Check-in <span class="text-red-500">*</span>
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
                        Check-out <span class="text-red-500">*</span>
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

                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Canal de reserva</label>
                    <select formControlName="canalId" [class]="ic1('canalId')">
                      <option [value]="null">Sin canal específico</option>
                      @for (c of canales; track c.canalId) {
                        <option [value]="c.canalId">{{ c.nombre }}</option>
                      }
                    </select>
                  </div>

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
                  [disabled]="habitacionesSeleccionadas().length === 0"
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
                      (input)="busquedaHuesped.set($any($event.target).value)"
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
                  [disabled]="huespedesSeleccionados().length === 0"
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
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Descuento (S/)</label>
                    <input type="number" min="0" step="0.01"
                      class="mt-1.5 w-full h-10 px-3.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                             focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20 transition"
                      [value]="descuento()"
                      (input)="descuento.set(+$any($event.target).value || 0)" />
                  </div>
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Adelanto / Pago inicial (S/)</label>
                    <input type="number" min="0" step="0.01"
                      class="mt-1.5 w-full h-10 px-3.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                             focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20 transition"
                      [value]="adelanto()"
                      (input)="adelanto.set(+$any($event.target).value || 0)" />
                  </div>
                </div>
                <div>
                  <label class="text-[13px] font-medium text-[#2D2926]/70">
                    Impuesto (S/)
                    <span class="text-[11px] font-normal text-[#2D2926]/40 ml-1">Auto-calculado 18%</span>
                  </label>
                  <input type="number" min="0" step="0.01"
                    class="mt-1.5 w-full h-10 px-3.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                           focus:outline-none focus:border-[#C5A048] focus:ring-2 focus:ring-[#C5A048]/20 transition"
                    [value]="impuesto()"
                    (input)="impuesto.set(+$any($event.target).value || 0)" />
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
                    <div class="flex justify-between px-4 py-2.5 text-sm border-b border-[#EEE3D1]">
                      <span class="text-[#2D2926]/65">Descuento</span>
                      <span class="font-medium text-emerald-600">— S/ {{ descuento() | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between px-4 py-2.5 text-sm border-b border-[#EEE3D1]">
                      <span class="text-[#2D2926]/65">Impuesto (18%)</span>
                      <span class="font-medium text-[#2D2926]">S/ {{ impuesto() | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between px-4 py-3 text-sm font-bold bg-[#F9F5F0] border-b border-[#EEE3D1]">
                      <span class="text-[#2D2926]">Total</span>
                      <span class="text-[#2D2926] text-base">S/ {{ total() | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between px-4 py-2.5 text-sm border-b border-[#EEE3D1]">
                      <span class="text-[#2D2926]/65">Adelanto</span>
                      <span class="font-medium text-[#2D2926]">S/ {{ adelanto() | number:'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between px-4 py-2.5 text-sm font-semibold text-[#C5A048]">
                      <span>Saldo pendiente</span>
                      <span>S/ {{ (total() - adelanto()) | number:'1.2-2' }}</span>
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
                <button type="button" (click)="guardarCreate()"
                  class="h-9 px-5 rounded-xl bg-[#C5A048] text-white text-sm font-semibold
                         hover:bg-[#8E6F2E] transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                  </svg>
                  Crear reserva
                </button>
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
                      Check-in <span class="text-red-500">*</span>
                    </label>
                    <input type="date" formControlName="fechaInicio"
                      [min]="hoy()" [class]="icEdit('fechaInicio')" />
                    @if (invEdit('fechaInicio')) {
                      <p class="text-xs text-red-500 mt-1">Obligatorio.</p>
                    }
                  </div>
                  <div>
                    <label class="text-[13px] font-medium text-[#2D2926]/70">
                      Check-out <span class="text-red-500">*</span>
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

                <div class="pt-2 border-t border-[#EEE3D1]">
                  <p class="text-[11px] uppercase tracking-wider text-[#C5A048] font-semibold mb-3">
                    Datos económicos
                  </p>
                  <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label class="text-[13px] font-medium text-[#2D2926]/70">Descuento (S/)</label>
                      <input type="number" formControlName="descuento" min="0" step="0.01"
                        [class]="icEdit('descuento')" />
                    </div>
                    <div>
                      <label class="text-[13px] font-medium text-[#2D2926]/70">Adelanto (S/)</label>
                      <input type="number" formControlName="adelanto" min="0" step="0.01"
                        [class]="icEdit('adelanto')" />
                    </div>
                  </div>
                  <div class="mt-4">
                    <label class="text-[13px] font-medium text-[#2D2926]/70">Impuesto (S/)</label>
                    <input type="number" formControlName="impuesto" min="0" step="0.01"
                      [class]="icEdit('impuesto')" />
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
              <button type="button" [disabled]="editForm.invalid" (click)="guardarEdit()"
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

  // ── State ──────────────────────────────────────────────────────────────────
  readonly pasoActual               = signal<1 | 2 | 3 | 4>(1);
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

  private readonly _fechaInicio = signal('');
  private readonly _fechaFin    = signal('');

  readonly descuento    = signal(0);
  readonly adelanto     = signal(0);
  readonly impuesto     = signal(0);
  readonly observaciones = signal<string | null>(null);

  // ── Forms ──────────────────────────────────────────────────────────────────
  readonly paso1Form = this.fb.group({
    fechaInicio: ['', Validators.required],
    fechaFin:    ['', Validators.required],
    nroAdultos:  [1,  [Validators.required, Validators.min(1)]],
    nroNinos:    [0,  [Validators.min(0)]],
    canalId:     [null as number | null],
  });

  readonly editForm = this.fb.group({
    fechaInicio:   ['', Validators.required],
    fechaFin:      ['', Validators.required],
    nroAdultos:    [1,  [Validators.required, Validators.min(1)]],
    nroNinos:      [0,  [Validators.min(0)]],
    canalId:       [null as number | null],
    descuento:     [0,  Validators.min(0)],
    adelanto:      [0,  Validators.min(0)],
    impuesto:      [0,  Validators.min(0)],
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
    this.habitacionesSeleccionadas().reduce((s, h) => s + h.tarifaPactada * this.noches(), 0),
  );

  readonly total = computed(() =>
    Math.max(0, this.subtotal() - this.descuento() + this.impuesto()),
  );

  readonly resultadosBusqueda = computed(() => {
    const term = this.busquedaHuesped().toLowerCase().trim();
    if (term.length < 2) return [];
    const selIds = new Set(this.huespedesSeleccionados().map(h => h.cliente.huespedId));
    return this.clienteSvc.clientes()
      .filter(c =>
        !selIds.has(c.huespedId) &&
        c.estado === 'ACTIVO' &&
        (c.nombreCompleto.toLowerCase().includes(term) || c.numeroDocumento.includes(term)),
      )
      .slice(0, 5);
  });

  constructor() {
    effect(() => {
      const r = this.reserva();
      if (r) {
        this.editForm.patchValue({
          fechaInicio:   r.fechaInicio,
          fechaFin:      r.fechaFin,
          nroAdultos:    r.nroAdultos,
          nroNinos:      r.nroNinos,
          canalId:       r.canalId,
          descuento:     r.descuento,
          adelanto:      r.adelanto,
          impuesto:      r.impuesto,
          observaciones: r.observaciones,
        });
      }
    });

    effect(() => {
      if (!this.isOpen()) this.reset();
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
      }
    });

    this.paso1Form.get('fechaInicio')!.valueChanges.pipe(
      debounceTime(100), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef),
    ).subscribe(v => this._fechaInicio.set(v ?? ''));

    this.paso1Form.get('fechaFin')!.valueChanges.pipe(
      debounceTime(100), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef),
    ).subscribe(v => this._fechaFin.set(v ?? ''));
  }

  reset(): void {
    this.pasoActual.set(1);
    this.habitacionesSeleccionadas.set([]);
    this.huespedesSeleccionados.set([]);
    this.busquedaHuesped.set('');
    this.nuevoClienteAbierto.set(false);
    this.errorPaso.set(null);
    this.descuento.set(0);
    this.adelanto.set(0);
    this.impuesto.set(0);
    this.observaciones.set(null);
    this._fechaInicio.set('');
    this._fechaFin.set('');
    this.paso1Form.reset({ nroAdultos: 1, nroNinos: 0 });
    this.nuevoClienteForm.reset();
    this.disponibilidadSvc.limpiar();
  }

  // ── Step navigation ────────────────────────────────────────────────────────

  irAPaso(paso: number): void {
    if (paso >= this.pasoActual()) return;
    this.pasoActual.set(paso as 1 | 2 | 3 | 4);
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
      this.pasoActual.set(3);
    } else if (paso === 3) {
      if (this.huespedesSeleccionados().length === 0) {
        this.errorPaso.set('Agrega al menos un huésped para continuar.');
        return;
      }
      this.impuesto.set(Math.round(this.subtotal() * 0.18 * 100) / 100);
      this.pasoActual.set(4);
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
      this.habitacionesSeleccionadas.set(actual.filter((_, i) => i !== idx));
    } else {
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

  // ── Guest management ───────────────────────────────────────────────────────

  agregarHuesped(cliente: Cliente): void {
    if (this.huespedesSeleccionados().some(h => h.cliente.huespedId === cliente.huespedId)) return;
    const esPrincipal = this.huespedesSeleccionados().length === 0;
    this.huespedesSeleccionados.update(list => [...list, { cliente, esPrincipal }]);
    this.busquedaHuesped.set('');
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
    const f1  = this.paso1Form.value;
    const ts  = Date.now().toString().slice(-6);
    const payload: CreateReservaPayload = {
      codReserva:    `RSV-${new Date().getFullYear()}-${ts}`,
      fechaInicio:   f1.fechaInicio!,
      fechaFin:      f1.fechaFin!,
      nroAdultos:    f1.nroAdultos!,
      nroNinos:      f1.nroNinos ?? 0,
      descuento:     this.descuento(),
      adelanto:      this.adelanto(),
      impuesto:      this.impuesto(),
      observaciones: this.observaciones(),
      usuarioId:     this.authStore.user()?.usuarioId ?? null,
      canalId:       f1.canalId ?? null,
      habitaciones:  this.habitacionesSeleccionadas().map(h => ({
        habitacionId:     h.hab.habitacionId,
        tipoHabitacionId: h.tipoHabitacionId,
        tarifaPactada:    h.tarifaPactada,
      })),
      huespedes: this.huespedesSeleccionados().map(h => ({
        huespedId:   h.cliente.huespedId,
        esPrincipal: h.esPrincipal,
      })),
    };
    this.onSave.emit({ payload });
  }

  guardarEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const v = this.editForm.value;
    const payload: UpdateReservaPayload = {
      fechaInicio:   v.fechaInicio ?? undefined,
      fechaFin:      v.fechaFin ?? undefined,
      nroAdultos:    v.nroAdultos ?? undefined,
      nroNinos:      v.nroNinos ?? undefined,
      canalId:       v.canalId ?? null,
      descuento:     Number(v.descuento ?? 0),
      adelanto:      Number(v.adelanto ?? 0),
      impuesto:      Number(v.impuesto ?? 0),
      observaciones: v.observaciones?.trim() || null,
    };
    this.onSave.emit({ payload, id: this.reserva()!.reservaId });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  pasoLabel(paso: number): string {
    return ['', 'Fechas', 'Habitaciones', 'Huéspedes', 'Detalles'][paso] ?? '';
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
