import {
  Component, input, output, inject, signal, computed, effect,
  ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ReservationService } from '../../services/reservation.service';
import { DisponibilidadService, HabitacionDisponible } from '../../services/disponibilidad.service';
import { ClienteService } from '../../../clients/services/cliente.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import {
  Reserva, CreateReservaPayload, UpdateReservaPayload,
} from '../../models/reservation.model';
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

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'isOpen() && onClose.emit()',
    role: 'dialog',
    'aria-modal': 'true',
  },
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="onClose.emit()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="onClose.emit()" aria-label="Cerrar">✕</button>

          <!-- Header -->
          <div class="modal-header">
            <h2>{{ esEdicion() ? 'Editar reserva' : 'Nueva reserva' }}</h2>
            @if (esEdicion()) {
              <span class="cod-badge">{{ reserva()!.codReserva }}</span>
            }
          </div>

          <!-- ═══════════════ CREATE MODE (multi-step) ═══════════════ -->
          @if (!esEdicion()) {
            <!-- Step indicator -->
            <div class="step-bar">
              @for (p of [1,2,3,4]; track p) {
                <button
                  class="step-btn"
                  [class.active]="pasoActual() === p"
                  [class.done]="pasoActual() > p"
                  [disabled]="pasoActual() < p"
                  (click)="irAPaso(p)">
                  <span class="step-num">{{ pasoActual() > p ? '✓' : p }}</span>
                  <span class="step-label">{{ pasoLabel(p) }}</span>
                </button>
                @if (p < 4) {
                  <div class="step-connector" [class.done]="pasoActual() > p"></div>
                }
              }
            </div>

            @if (errorPaso()) {
              <div class="error-banner">⚠️ {{ errorPaso() }}</div>
            }

            <!-- ── PASO 1: Fechas ── -->
            @if (pasoActual() === 1) {
              <div class="modal-body">
                <form [formGroup]="paso1Form">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="fi">Check-in <span class="req">*</span></label>
                      <input id="fi" type="date" formControlName="fechaInicio"
                        class="form-control" [class.is-invalid]="inv1('fechaInicio')"
                        (change)="onFechaChange()">
                      @if (inv1('fechaInicio')) { <span class="error-msg">Requerido</span> }
                    </div>
                    <div class="form-group">
                      <label for="ff">Check-out <span class="req">*</span></label>
                      <input id="ff" type="date" formControlName="fechaFin"
                        class="form-control" [class.is-invalid]="inv1('fechaFin')"
                        (change)="onFechaChange()">
                      @if (inv1('fechaFin')) { <span class="error-msg">Requerido</span> }
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="adults">Adultos <span class="req">*</span></label>
                      <input id="adults" type="number" formControlName="nroAdultos"
                        class="form-control" [class.is-invalid]="inv1('nroAdultos')" min="1">
                      @if (inv1('nroAdultos')) { <span class="error-msg">Mínimo 1 adulto</span> }
                    </div>
                    <div class="form-group">
                      <label for="ninos">Niños</label>
                      <input id="ninos" type="number" formControlName="nroNinos"
                        class="form-control" min="0">
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="canal">Canal de reserva</label>
                    <select id="canal" formControlName="canalId" class="form-control">
                      <option [value]="null">Sin canal específico</option>
                      @for (c of canales; track c.canalId) {
                        <option [value]="c.canalId">{{ c.nombre }}</option>
                      }
                    </select>
                  </div>

                  @if (noches() > 0) {
                    <div class="info-chip">
                      🌙 {{ noches() }} noche{{ noches() === 1 ? '' : 's' }}
                    </div>
                  }
                </form>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="onClose.emit()">Cancelar</button>
                <button type="button" class="btn btn-primary" (click)="buscarDisponibilidad()">
                  Buscar disponibilidad →
                </button>
              </div>
            }

            <!-- ── PASO 2: Habitaciones ── -->
            @if (pasoActual() === 2) {
              <div class="modal-body">
                <div class="step-description">
                  <strong>{{ formatFecha(paso1Form.value.fechaInicio!) }}</strong>
                  → <strong>{{ formatFecha(paso1Form.value.fechaFin!) }}</strong>
                  · {{ noches() }} noche{{ noches() !== 1 ? 's' : '' }}
                  · {{ paso1Form.value.nroAdultos }} adulto{{ paso1Form.value.nroAdultos !== 1 ? 's' : '' }}
                </div>

                @if (disponiblesCargando()) {
                  <div class="loading-state">Buscando habitaciones disponibles...</div>
                } @else if (disponibles().length === 0) {
                  <div class="empty-state">No hay habitaciones disponibles para las fechas seleccionadas.</div>
                } @else {
                  <div class="rooms-grid">
                    @for (hab of disponibles(); track hab.habitacionId) {
                      <div class="room-card"
                        [class.selected]="estaSeleccionada(hab.habitacionId)"
                        (click)="toggleHabitacion(hab)">
                        <div class="room-card-header">
                          <span class="room-number">N° {{ hab.numero }}</span>
                          <span class="room-piso">Piso {{ hab.piso }}</span>
                          @if (estaSeleccionada(hab.habitacionId)) {
                            <span class="check-icon">✓</span>
                          }
                        </div>
                        @if (hab.descripcion) {
                          <div class="room-desc">{{ hab.descripcion }}</div>
                        }
                        @if (estaSeleccionada(hab.habitacionId)) {
                          <div class="room-tipo-select" (click)="$event.stopPropagation()">
                            <label class="tipo-label">Tipo de habitación</label>
                            @if (tiposCargando()) {
                              <div class="tipo-loading">Cargando tipos...</div>
                            } @else {
                              <select class="form-control"
                                [value]="getTipoId(hab.habitacionId)"
                                (change)="setTipoHabitacion(hab.habitacionId, +$any($event.target).value)">
                                <option [value]="0">-- Seleccionar tipo --</option>
                                @for (t of tipos(); track t.tipoHabitacionId) {
                                  <option [value]="t.tipoHabitacionId">
                                    {{ t.nombre }} · S/ {{ t.precioBase | number:'1.2-2' }}/noche · 👥{{ t.capacidadMaxima }}
                                  </option>
                                }
                              </select>
                            }
                            @if (getTarifa(hab.habitacionId) > 0) {
                              <div class="room-subtotal">
                                Subtotal: S/ {{ getTarifa(hab.habitacionId) * noches() | number:'1.2-2' }}
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }

                @if (habitacionesSeleccionadas().length > 0) {
                  <div class="selection-summary">
                    {{ habitacionesSeleccionadas().length }} habitación{{ habitacionesSeleccionadas().length !== 1 ? 'es' : '' }} seleccionada{{ habitacionesSeleccionadas().length !== 1 ? 's' : '' }}
                    · Subtotal estimado: S/ {{ subtotal() | number:'1.2-2' }}
                  </div>
                }
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="irAPaso(1)">← Volver</button>
                <button type="button" class="btn btn-primary"
                  [disabled]="habitacionesSeleccionadas().length === 0"
                  (click)="avanzarPaso()">
                  Continuar →
                </button>
              </div>
            }

            <!-- ── PASO 3: Huéspedes ── -->
            @if (pasoActual() === 3) {
              <div class="modal-body">
                <!-- Search -->
                <div class="form-group">
                  <label>Buscar cliente por nombre o documento</label>
                  <input type="text" class="form-control"
                    [value]="busquedaHuesped()"
                    (input)="busquedaHuesped.set($any($event.target).value)"
                    placeholder="Ej: García, 45678901...">
                </div>

                @if (resultadosBusqueda().length > 0) {
                  <div class="search-results">
                    @for (c of resultadosBusqueda(); track c.huespedId) {
                      <button class="result-item" (click)="agregarHuesped(c)">
                        <span class="result-avatar">{{ c.nombreCompleto[0] }}</span>
                        <div class="result-info">
                          <span class="result-nombre">{{ c.nombreCompleto }}</span>
                          <span class="result-doc">{{ c.numeroDocumento }}</span>
                        </div>
                        <span class="result-add">＋</span>
                      </button>
                    }
                  </div>
                } @else if (busquedaHuesped().length >= 2) {
                  <div class="no-results">No se encontraron clientes con ese criterio.</div>
                }

                <!-- New client mini-form -->
                @if (!nuevoClienteAbierto()) {
                  <button type="button" class="btn-link-gold" (click)="nuevoClienteAbierto.set(true)">
                    ➕ Registrar nuevo cliente
                  </button>
                } @else {
                  <div class="mini-form-box">
                    <div class="mini-form-title">Nuevo cliente</div>
                    <form [formGroup]="nuevoClienteForm" (ngSubmit)="guardarNuevoCliente()">
                      <div class="form-row">
                        <div class="form-group">
                          <label>Nombre <span class="req">*</span></label>
                          <input type="text" formControlName="nombre" class="form-control"
                            [class.is-invalid]="invNC('nombre')" maxlength="80" placeholder="Nombre">
                        </div>
                        <div class="form-group">
                          <label>Apellido paterno <span class="req">*</span></label>
                          <input type="text" formControlName="apellidoPaterno" class="form-control"
                            [class.is-invalid]="invNC('apellidoPaterno')" maxlength="80">
                        </div>
                      </div>
                      <div class="form-row">
                        <div class="form-group">
                          <label>Apellido materno</label>
                          <input type="text" formControlName="apellidoMaterno" class="form-control" maxlength="80">
                        </div>
                        <div class="form-group">
                          <label>N° documento <span class="req">*</span></label>
                          <input type="text" formControlName="numeroDocumento" class="form-control"
                            [class.is-invalid]="invNC('numeroDocumento')" maxlength="20">
                        </div>
                      </div>
                      <div class="mini-form-actions">
                        <button type="button" class="btn btn-secondary btn-sm"
                          (click)="nuevoClienteAbierto.set(false); nuevoClienteForm.reset()">
                          Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary btn-sm"
                          [disabled]="nuevoClienteForm.invalid">
                          Registrar y agregar
                        </button>
                      </div>
                    </form>
                  </div>
                }

                <!-- Selected guests -->
                @if (huespedesSeleccionados().length > 0) {
                  <div class="section-divider">Huéspedes agregados</div>
                  <div class="guests-list">
                    @for (h of huespedesSeleccionados(); track h.cliente.huespedId) {
                      <div class="guest-item" [class.principal]="h.esPrincipal">
                        <span class="guest-avatar">{{ h.cliente.nombreCompleto[0] }}</span>
                        <div class="guest-info">
                          <span class="guest-name">{{ h.cliente.nombreCompleto }}</span>
                          <span class="guest-doc">{{ h.cliente.numeroDocumento }}</span>
                        </div>
                        @if (h.esPrincipal) {
                          <span class="tag-principal">Principal</span>
                        } @else {
                          <button type="button" class="btn-mark-principal"
                            (click)="marcarPrincipal(h.cliente.huespedId)"
                            title="Marcar como principal">★</button>
                        }
                        <button type="button" class="btn-remove"
                          (click)="quitarHuesped(h.cliente.huespedId)"
                          aria-label="Quitar">✕</button>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="irAPaso(2)">← Volver</button>
                <button type="button" class="btn btn-primary"
                  [disabled]="huespedesSeleccionados().length === 0"
                  (click)="avanzarPaso()">
                  Continuar →
                </button>
              </div>
            }

            <!-- ── PASO 4: Detalles + resumen ── -->
            @if (pasoActual() === 4) {
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label>Descuento (S/)</label>
                    <input type="number" class="form-control" min="0" step="0.01"
                      [value]="descuento()"
                      (input)="descuento.set(+$any($event.target).value || 0)">
                  </div>
                  <div class="form-group">
                    <label>Adelanto / Pago inicial (S/)</label>
                    <input type="number" class="form-control" min="0" step="0.01"
                      [value]="adelanto()"
                      (input)="adelanto.set(+$any($event.target).value || 0)">
                  </div>
                </div>
                <div class="form-group">
                  <label>Impuesto (S/) <span class="hint-inline">Auto-calculado al 18%</span></label>
                  <input type="number" class="form-control" min="0" step="0.01"
                    [value]="impuesto()"
                    (input)="impuesto.set(+$any($event.target).value || 0)">
                </div>
                <div class="form-group">
                  <label>Observaciones</label>
                  <textarea class="form-control" rows="2" maxlength="500"
                    [value]="observaciones() ?? ''"
                    (input)="observaciones.set($any($event.target).value || null)"
                    placeholder="Notas adicionales..."></textarea>
                </div>

                <!-- Resumen -->
                <div class="section-divider">Resumen de la reserva</div>
                <div class="resumen-grid">
                  <div class="resumen-col">
                    <div class="resumen-label">Fechas</div>
                    <div class="resumen-value">
                      {{ formatFecha(paso1Form.value.fechaInicio!) }} → {{ formatFecha(paso1Form.value.fechaFin!) }}
                      ({{ noches() }} noche{{ noches() !== 1 ? 's' : '' }})
                    </div>
                  </div>
                  <div class="resumen-col">
                    <div class="resumen-label">Habitaciones</div>
                    @for (h of habitacionesSeleccionadas(); track h.hab.habitacionId) {
                      <div class="resumen-value">
                        N° {{ h.hab.numero }} – {{ h.tipoHabitacionNombre }}
                        (S/ {{ h.tarifaPactada | number:'1.2-2' }}/noche)
                      </div>
                    }
                  </div>
                  <div class="resumen-col">
                    <div class="resumen-label">Huéspedes</div>
                    @for (h of huespedesSeleccionados(); track h.cliente.huespedId) {
                      <div class="resumen-value">
                        {{ h.cliente.nombreCompleto }}{{ h.esPrincipal ? ' (Principal)' : '' }}
                      </div>
                    }
                  </div>
                </div>

                <div class="montos-box">
                  <div class="monto-row">
                    <span>Subtotal</span>
                    <span>S/ {{ subtotal() | number:'1.2-2' }}</span>
                  </div>
                  <div class="monto-row">
                    <span>Descuento</span>
                    <span class="green">- S/ {{ descuento() | number:'1.2-2' }}</span>
                  </div>
                  <div class="monto-row">
                    <span>Impuesto</span>
                    <span>S/ {{ impuesto() | number:'1.2-2' }}</span>
                  </div>
                  <div class="monto-row total">
                    <span>Total</span>
                    <span>S/ {{ total() | number:'1.2-2' }}</span>
                  </div>
                  <div class="monto-row">
                    <span>Adelanto</span>
                    <span>S/ {{ adelanto() | number:'1.2-2' }}</span>
                  </div>
                  <div class="monto-row saldo">
                    <span>Saldo pendiente</span>
                    <span>S/ {{ (total() - adelanto()) | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="irAPaso(3)">← Volver</button>
                <button type="button" class="btn btn-primary" (click)="guardarCreate()">
                  ✓ Crear reserva
                </button>
              </div>
            }
          }

          <!-- ═══════════════ EDIT MODE ═══════════════ -->
          @if (esEdicion()) {
            <div class="modal-body">
              <form [formGroup]="editForm" (ngSubmit)="guardarEdit()">
                <div class="form-row">
                  <div class="form-group">
                    <label for="efi">Check-in <span class="req">*</span></label>
                    <input id="efi" type="date" formControlName="fechaInicio"
                      class="form-control" [class.is-invalid]="invEdit('fechaInicio')">
                    @if (invEdit('fechaInicio')) { <span class="error-msg">Requerido</span> }
                  </div>
                  <div class="form-group">
                    <label for="eff">Check-out <span class="req">*</span></label>
                    <input id="eff" type="date" formControlName="fechaFin"
                      class="form-control" [class.is-invalid]="invEdit('fechaFin')">
                    @if (invEdit('fechaFin')) { <span class="error-msg">Requerido</span> }
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Adultos <span class="req">*</span></label>
                    <input type="number" formControlName="nroAdultos"
                      class="form-control" [class.is-invalid]="invEdit('nroAdultos')" min="1">
                  </div>
                  <div class="form-group">
                    <label>Niños</label>
                    <input type="number" formControlName="nroNinos" class="form-control" min="0">
                  </div>
                </div>

                <div class="form-group">
                  <label>Canal de reserva</label>
                  <select formControlName="canalId" class="form-control">
                    <option [value]="null">Sin canal específico</option>
                    @for (c of canales; track c.canalId) {
                      <option [value]="c.canalId">{{ c.nombre }}</option>
                    }
                  </select>
                </div>

                <div class="section-divider">Datos económicos</div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Descuento (S/)</label>
                    <input type="number" formControlName="descuento" class="form-control" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label>Adelanto (S/)</label>
                    <input type="number" formControlName="adelanto" class="form-control" min="0" step="0.01">
                  </div>
                </div>

                <div class="form-group">
                  <label>Impuesto (S/)</label>
                  <input type="number" formControlName="impuesto" class="form-control" min="0" step="0.01">
                </div>

                <div class="form-group">
                  <label>Observaciones</label>
                  <textarea formControlName="observaciones" class="form-control" rows="2"
                    maxlength="500" placeholder="Notas adicionales..."></textarea>
                </div>
              </form>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="onClose.emit()">Cancelar</button>
              <button type="button" class="btn btn-primary"
                [disabled]="editForm.invalid" (click)="guardarEdit()">
                Guardar cambios
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');
    * { font-family: 'Inter', sans-serif; }

    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(45,41,38,0.75);
      display: flex; align-items: center; justify-content: center;
      z-index: 1050; animation: overlayIn 0.2s ease;
    }
    @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-content {
      background: #F9F5F0; border-radius: 1rem;
      max-width: 720px; width: 95%; max-height: 92vh;
      display: flex; flex-direction: column;
      position: relative; overflow: hidden;
      animation: slideIn 0.25s ease;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
    }
    @keyframes slideIn {
      from { transform: translateY(-30px); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }

    .modal-close {
      position: absolute; top: 1rem; right: 1rem;
      background: white; border: 1px solid #EEE3D1;
      font-size: 1.125rem; cursor: pointer; color: #8E6F2E;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%; transition: all 0.2s; z-index: 10;
    }
    .modal-close:hover { background: #C5A048; border-color: #C5A048; color: white; }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 2px solid #C5A048;
      display: flex; align-items: center; gap: 0.75rem;
      background: white; flex-shrink: 0;
    }
    .modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #2D2926; }
    .cod-badge { font-family: monospace; font-size: 0.8rem; color: #C5A048; font-weight: 600; }

    /* Step bar */
    .step-bar {
      display: flex; align-items: center; padding: 0.875rem 1.5rem;
      background: white; border-bottom: 1px solid #EEE3D1; flex-shrink: 0;
      gap: 0;
    }

    .step-btn {
      display: flex; align-items: center; gap: 0.375rem;
      background: none; border: none; cursor: pointer;
      padding: 0.25rem 0; color: #8E6F2E; opacity: 0.5;
      transition: all 0.2s; font-size: 0.8125rem; font-weight: 500;
    }
    .step-btn.active { opacity: 1; color: #C5A048; }
    .step-btn.done   { opacity: 1; color: #2E7D32; cursor: pointer; }
    .step-btn:disabled { cursor: not-allowed; }

    .step-num {
      width: 24px; height: 24px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
      background: #EEE3D1; color: #8E6F2E;
      transition: all 0.2s;
    }
    .step-btn.active .step-num { background: #C5A048; color: white; }
    .step-btn.done .step-num   { background: #2E7D32; color: white; }

    .step-label { font-size: 0.75rem; }

    .step-connector {
      flex: 1; height: 2px; background: #EEE3D1;
      margin: 0 0.375rem; transition: background 0.2s;
    }
    .step-connector.done { background: #2E7D32; }

    .error-banner {
      background: #FFEBEE; border-bottom: 1px solid #FECACA;
      color: #C62828; padding: 0.625rem 1.5rem;
      font-size: 0.875rem; flex-shrink: 0;
    }

    .modal-body {
      flex: 1; overflow-y: auto; padding: 1.5rem;
    }

    .modal-footer {
      display: flex; gap: 0.75rem; justify-content: flex-end;
      padding: 1rem 1.5rem; border-top: 1px solid #EEE3D1;
      background: white; flex-shrink: 0;
    }

    .step-description {
      font-size: 0.875rem; color: #8E6F2E;
      background: white; border-radius: 0.5rem;
      padding: 0.625rem 1rem; margin-bottom: 1rem;
      border: 1px solid #EEE3D1;
    }

    /* Forms */
    .form-group { margin-bottom: 1.125rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    label {
      display: block; margin-bottom: 0.3rem;
      font-weight: 600; color: #8E6F2E;
      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;
    }

    .req { color: #DC2626; }
    .hint-inline { font-size: 0.7rem; color: #8E6F2E; font-weight: 400; text-transform: none; letter-spacing: 0; }

    .form-control {
      width: 100%; padding: 0.5625rem 0.875rem;
      border: 1.5px solid #EEE3D1; border-radius: 0.5rem;
      font-size: 0.875rem; background: white; color: #2D2926;
      transition: all 0.2s; box-sizing: border-box;
    }
    .form-control:focus { outline: none; border-color: #C5A048; box-shadow: 0 0 0 3px rgba(197,160,72,0.12); }
    .form-control.is-invalid { border-color: #DC2626; }
    textarea.form-control { resize: vertical; min-height: 64px; }
    select.form-control {
      cursor: pointer; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238E6F2E' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 1rem;
      padding-right: 2.5rem;
    }
    .error-msg { font-size: 0.72rem; color: #DC2626; margin-top: 0.2rem; display: block; }

    .info-chip {
      display: inline-flex; align-items: center;
      background: #FFF8E1; border: 1px solid #FDE68A;
      color: #C5A048; padding: 0.375rem 0.875rem;
      border-radius: 2rem; font-size: 0.875rem; font-weight: 600;
      margin-top: 0.5rem;
    }

    /* Rooms grid */
    .loading-state, .empty-state {
      text-align: center; padding: 2rem; color: #8E6F2E; font-size: 0.875rem;
    }

    .rooms-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem; margin-bottom: 1rem;
    }

    .room-card {
      background: white; border: 1.5px solid #EEE3D1;
      border-radius: 0.75rem; padding: 0.875rem; cursor: pointer;
      transition: all 0.2s; position: relative;
    }
    .room-card:hover { border-color: #C5A048; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(197,160,72,0.15); }
    .room-card.selected { border-color: #C5A048; border-width: 2px; background: #FFFDF5; }

    .room-card-header { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.375rem; }
    .room-number { font-weight: 700; font-size: 1rem; color: #2D2926; }
    .room-piso { font-size: 0.7rem; color: #8E6F2E; background: #EEE3D1; padding: 0.1rem 0.4rem; border-radius: 0.25rem; }
    .check-icon { margin-left: auto; color: #2E7D32; font-weight: 700; font-size: 1.125rem; }

    .room-desc { font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem; font-style: italic; }
    .room-subtotal { font-size: 0.8rem; color: #2E7D32; font-weight: 600; margin-top: 0.375rem; padding-top: 0.375rem; border-top: 1px dashed #EEE3D1; }

    .room-tipo-select { margin-top: 0.625rem; padding-top: 0.625rem; border-top: 1px solid #EEE3D1; }
    .tipo-label {
      display: block; margin-bottom: 0.25rem;
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.5px; color: #8E6F2E;
    }
    .tipo-loading { font-size: 0.75rem; color: #8E6F2E; padding: 0.25rem 0; }

    .selection-summary {
      background: #E8F5E9; border: 1px solid #A5D6A7;
      border-radius: 0.5rem; padding: 0.625rem 1rem;
      color: #2E7D32; font-size: 0.875rem; font-weight: 600;
    }

    /* Guest search */
    .search-results {
      background: white; border: 1px solid #EEE3D1;
      border-radius: 0.5rem; overflow: hidden; margin-bottom: 0.75rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }

    .result-item {
      width: 100%; display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1rem; background: none; border: none;
      cursor: pointer; transition: background 0.15s; text-align: left;
      border-bottom: 1px solid #EEE3D1;
    }
    .result-item:last-child { border-bottom: none; }
    .result-item:hover { background: #F9F5F0; }

    .result-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: #C5A048; color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; font-weight: 700; flex-shrink: 0;
    }
    .result-info { flex: 1; }
    .result-nombre { display: block; font-size: 0.875rem; font-weight: 600; color: #2D2926; }
    .result-doc { font-size: 0.75rem; color: #8E6F2E; }
    .result-add { font-size: 1.25rem; color: #C5A048; font-weight: 700; }

    .no-results { font-size: 0.8rem; color: #8E6F2E; padding: 0.5rem 0; margin-bottom: 0.75rem; }

    .btn-link-gold {
      background: none; border: 1.5px dashed #C5A048;
      color: #C5A048; cursor: pointer; padding: 0.5rem 1rem;
      border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;
      width: 100%; transition: all 0.2s; margin-bottom: 1rem;
    }
    .btn-link-gold:hover { background: #FFF8E1; }

    .mini-form-box {
      background: #FFF8E1; border: 1.5px solid #FDE68A;
      border-radius: 0.75rem; padding: 1rem; margin-bottom: 1rem;
    }
    .mini-form-title { font-weight: 700; color: #C5A048; font-size: 0.875rem; margin-bottom: 0.75rem; }
    .mini-form-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.75rem; }

    .section-divider {
      font-size: 0.7rem; font-weight: 700; color: #C5A048;
      text-transform: uppercase; letter-spacing: 1px;
      padding: 0.75rem 0 0.5rem;
      border-bottom: 1px solid #EEE3D1; margin-bottom: 0.875rem;
    }

    .guests-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .guest-item {
      display: flex; align-items: center; gap: 0.625rem;
      background: white; border-radius: 0.5rem;
      border: 1px solid #EEE3D1; padding: 0.625rem 0.875rem;
    }
    .guest-item.principal { border-color: #C5A048; border-width: 1.5px; }

    .guest-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: #C5A048; color: white; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; font-weight: 700;
    }
    .guest-info { flex: 1; }
    .guest-name { display: block; font-size: 0.85rem; font-weight: 600; color: #2D2926; }
    .guest-doc { font-size: 0.72rem; color: #8E6F2E; }

    .tag-principal {
      background: #FFF8E1; color: #C5A048; font-size: 0.65rem;
      font-weight: 700; padding: 0.125rem 0.4rem;
      border-radius: 2rem; border: 1px solid #FDE68A;
    }

    .btn-mark-principal {
      background: none; border: none; cursor: pointer;
      color: #EEE3D1; font-size: 1rem; transition: color 0.2s; padding: 0.25rem;
    }
    .btn-mark-principal:hover { color: #C5A048; }

    .btn-remove {
      background: none; border: none; cursor: pointer;
      color: #DC2626; font-size: 0.875rem; padding: 0.25rem;
      border-radius: 50%; transition: all 0.2s;
    }
    .btn-remove:hover { background: #FFEBEE; }

    /* Resumen */
    .resumen-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 1rem; margin-bottom: 1rem;
      background: white; border-radius: 0.625rem;
      border: 1px solid #EEE3D1; padding: 1rem;
    }
    .resumen-col {}
    .resumen-label { font-size: 0.7rem; font-weight: 700; color: #C5A048; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem; }
    .resumen-value { font-size: 0.8rem; color: #2D2926; line-height: 1.5; }

    .montos-box { background: white; border-radius: 0.625rem; border: 1px solid #EEE3D1; overflow: hidden; }
    .monto-row {
      display: flex; justify-content: space-between;
      padding: 0.5rem 1rem; font-size: 0.875rem; color: #2D2926;
      border-bottom: 1px solid #F9F5F0;
    }
    .monto-row:last-child { border-bottom: none; }
    .monto-row.total { font-weight: 700; font-size: 1rem; background: #F9F5F0; border-top: 2px solid #EEE3D1; }
    .monto-row.saldo { color: #C5A048; font-weight: 600; }
    .green { color: #2E7D32; }

    /* Buttons */
    .btn {
      padding: 0.625rem 1.5rem; border-radius: 0.5rem;
      font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s; border: none;
      display: inline-flex; align-items: center; gap: 0.375rem;
    }
    .btn-sm { padding: 0.4rem 0.875rem; font-size: 0.8rem; }
    .btn-primary { background: #C5A048; color: white; }
    .btn-primary:hover:not(:disabled) { background: #8E6F2E; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(197,160,72,0.3); }
    .btn-primary:disabled { background: #EEE3D1; color: #8E6F2E; cursor: not-allowed; }
    .btn-secondary { background: white; color: #2D2926; border: 1.5px solid #EEE3D1; }
    .btn-secondary:hover { background: #F9F5F0; border-color: #C5A048; }

    .modal-body::-webkit-scrollbar { width: 5px; }
    .modal-body::-webkit-scrollbar-track { background: #EEE3D1; }
    .modal-body::-webkit-scrollbar-thumb { background: #C5A048; border-radius: 3px; }

    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; }
      .resumen-grid { grid-template-columns: 1fr; }
      .step-label { display: none; }
      .modal-body { padding: 1rem; }
    }
  `
})
export class ReservationFormComponent {
  private readonly fb             = inject(FormBuilder);
  private readonly disponibilidadSvc = inject(DisponibilidadService);
  private readonly clienteSvc     = inject(ClienteService);
  private readonly reservaSvc     = inject(ReservationService);
  private readonly authStore      = inject(AuthStore);
  private readonly destroyRef     = inject(DestroyRef);

  isOpen  = input.required<boolean>();
  reserva = input<Reserva | null>(null);

  onClose = output<void>();
  onSave  = output<ReservaFormSaveEvent>();

  readonly canales = CANALES;

  // ── State ──────────────────────────────────────────────────────────────────
  readonly pasoActual = signal<1 | 2 | 3 | 4>(1);
  readonly habitacionesSeleccionadas = signal<Array<{
    hab: HabitacionDisponible;
    tipoHabitacionId: number;
    tipoHabitacionNombre: string;
    tarifaPactada: number;
  }>>([]);
  readonly huespedesSeleccionados    = signal<Array<{ cliente: Cliente; esPrincipal: boolean }>>([]);
  readonly busquedaHuesped           = signal('');
  readonly nuevoClienteAbierto       = signal(false);
  readonly errorPaso                 = signal<string | null>(null);

  // Tracked form date values for reactive computed signals
  private readonly _fechaInicio = signal('');
  private readonly _fechaFin    = signal('');

  // Detalles económicos (signals para reactividad en template OnPush)
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

  readonly disponibles          = this.disponibilidadSvc.disponibles;
  readonly disponiblesCargando  = this.disponibilidadSvc.loading;
  readonly tipos                = this.disponibilidadSvc.tipos;
  readonly tiposCargando        = this.disponibilidadSvc.loadingTipos;

  readonly noches = computed(() => {
    const fi = this._fechaInicio();
    const ff = this._fechaFin();
    if (!fi || !ff) return 0;
    const ms = new Date(ff).getTime() - new Date(fi).getTime();
    return Math.max(0, Math.round(ms / 86_400_000));
  });

  readonly subtotal = computed(() =>
    this.habitacionesSeleccionadas().reduce((s, h) => s + h.tarifaPactada * this.noches(), 0)
  );

  readonly total = computed(() =>
    Math.max(0, this.subtotal() - this.descuento() + this.impuesto())
  );

  readonly resultadosBusqueda = computed(() => {
    const term = this.busquedaHuesped().toLowerCase().trim();
    if (term.length < 2) return [];
    const selIds = new Set(this.huespedesSeleccionados().map(h => h.cliente.huespedId));
    return this.clienteSvc.clientes()
      .filter(c => !selIds.has(c.huespedId) && c.estado === 'ACTIVO' && (
        c.nombreCompleto.toLowerCase().includes(term) ||
        c.numeroDocumento.includes(term)
      ))
      .slice(0, 5);
  });

  constructor() {
    // Patch edit form when reserva changes
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

    // Reset on close
    effect(() => {
      if (!this.isOpen()) this.reset();
    });

    // Watch paso1Form dates for noches signal
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
    if (v.fechaInicio! >= v.fechaFin!) {
      this.errorPaso.set('La fecha de salida debe ser posterior a la fecha de entrada');
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
        this.errorPaso.set('Selecciona al menos una habitación para continuar');
        return;
      }
      const sinTipo = this.habitacionesSeleccionadas().some(h => h.tipoHabitacionId === 0);
      if (sinTipo) {
        this.errorPaso.set('Asigna un tipo de habitación a cada habitación seleccionada');
        return;
      }
      this.pasoActual.set(3);
    } else if (paso === 3) {
      if (this.huespedesSeleccionados().length === 0) {
        this.errorPaso.set('Agrega al menos un huésped para continuar');
        return;
      }
      // Auto-calculate impuesto at 18%
      this.impuesto.set(Math.round(this.subtotal() * 0.18 * 100) / 100);
      this.pasoActual.set(4);
    }
  }

  onFechaChange(): void {
    const fi = this.paso1Form.get('fechaInicio')?.value ?? '';
    const ff = this.paso1Form.get('fechaFin')?.value ?? '';
    this._fechaInicio.set(fi);
    this._fechaFin.set(ff);
  }

  // ── Room selection ─────────────────────────────────────────────────────────

  toggleHabitacion(hab: HabitacionDisponible): void {
    const actual = this.habitacionesSeleccionadas();
    const idx = actual.findIndex(h => h.hab.habitacionId === hab.habitacionId);
    if (idx >= 0) {
      this.habitacionesSeleccionadas.set(actual.filter((_, i) => i !== idx));
    } else {
      this.habitacionesSeleccionadas.set([...actual, {
        hab,
        tipoHabitacionId: 0,
        tipoHabitacionNombre: '',
        tarifaPactada: 0,
      }]);
    }
  }

  estaSeleccionada(habitacionId: number): boolean {
    return this.habitacionesSeleccionadas().some(h => h.hab.habitacionId === habitacionId);
  }

  setTipoHabitacion(habitacionId: number, tipoId: number): void {
    const tipo = this.tipos().find(t => t.tipoHabitacionId === tipoId);
    this.habitacionesSeleccionadas.update(list => list.map(h =>
      h.hab.habitacionId === habitacionId
        ? { ...h, tipoHabitacionId: tipoId, tipoHabitacionNombre: tipo?.nombre ?? '', tarifaPactada: tipo?.precioBase ?? 0 }
        : h
    ));
  }

  getTipoId(habitacionId: number): number {
    return this.habitacionesSeleccionadas().find(h => h.hab.habitacionId === habitacionId)?.tipoHabitacionId ?? 0;
  }

  getTarifa(habitacionId: number): number {
    return this.habitacionesSeleccionadas().find(h => h.hab.habitacionId === habitacionId)?.tarifaPactada ?? 0;
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
      this.huespedesSeleccionados().map(h => ({ ...h, esPrincipal: h.cliente.huespedId === huespedId }))
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
    const f1   = this.paso1Form.value;
    const year = new Date().getFullYear();
    const ts   = Date.now().toString().slice(-6);
    const payload: CreateReservaPayload = {
      codReserva:    `RSV-${year}-${ts}`,
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

  formatFecha(fecha: string): string {
    if (!fecha) return '—';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  inv1(field: string): boolean {
    const ctrl = this.paso1Form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  invEdit(field: string): boolean {
    const ctrl = this.editForm.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  invNC(field: string): boolean {
    const ctrl = this.nuevoClienteForm.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
