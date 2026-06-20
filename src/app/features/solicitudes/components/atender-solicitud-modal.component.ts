import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UiModalComponent } from '../../../shared/ui/modal/ui-modal.component';
import { AuthStore } from '../../../core/auth/auth.store';
import { SolicitudService } from '../services/solicitud.service';
import { UsuarioLookupService, UsuarioResumen } from '../../../core/usuarios/usuario-lookup.service';
import { EstadoSolicitud, SolicitudResponse } from '../models/solicitud.model';
import {
  ESTADO_LABEL,
  PRIORIDAD_LABEL,
  TIPO_LABEL,
  resolverTier,
  transicionesPermitidas,
} from '../utils/solicitud-ui';

@Component({
  selector: 'app-atender-solicitud-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Atender solicitud'"
      [subtitle]="solicitud()?.codigoSolicitud ?? ''"
      [size]="'md'"
      (closed)="cerrar.emit()">

      @if (solicitud(); as s) {
        <div class="space-y-4">

          <!-- Datos de contexto -->
          <div class="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p class="text-[11px] text-[#2D2926]/50 font-medium">Tipo</p>
              <p class="font-medium text-[#2D2926]">{{ tipoLabel(s) }}</p>
            </div>
            <div>
              <p class="text-[11px] text-[#2D2926]/50 font-medium">Solicitante</p>
              <p class="font-medium text-[#2D2926] truncate">{{ s.solicitanteNombre }}</p>
            </div>
            <div>
              <p class="text-[11px] text-[#2D2926]/50 font-medium">Prioridad</p>
              <p class="font-medium text-[#2D2926]">{{ prioridadLabel(s) }}</p>
            </div>
          </div>

          <!-- Asignar responsable (solo Tier 1) — autocomplete de usuarios activos -->
          @if (esTier1()) {
            <div class="relative">
              <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
                Asignar responsable
              </label>

              @if (responsableSel(); as r) {
                <!-- Responsable ya seleccionado -->
                <div class="flex items-center justify-between gap-2 h-10 px-3 rounded-lg
                            border border-[#C5A048] bg-[#C5A048]/5">
                  <span class="text-sm text-[#2D2926] truncate">
                    {{ r.nombreCompleto }}
                    <span class="text-[#2D2926]/45">· {{ r.rolNombre }}</span>
                  </span>
                  <button type="button" (click)="limpiarResponsable()"
                    class="text-[#2D2926]/45 hover:text-[#2D2926] text-lg leading-none shrink-0"
                    aria-label="Quitar responsable">×</button>
                </div>
              } @else {
                <input
                  type="text"
                  [ngModel]="busqueda()"
                  (ngModelChange)="onBuscar($event)"
                  placeholder="Buscar usuario por nombre…"
                  autocomplete="off"
                  class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                         text-[#2D2926] placeholder:text-[#2D2926]/35
                         focus:outline-none focus:border-[#C5A048]" />

                <!-- Dropdown de resultados -->
                @if (buscando() || resultados().length > 0) {
                  <ul class="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#EEE3D1]
                             rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    @if (buscando()) {
                      <li class="px-3 py-2 text-sm text-[#2D2926]/45">Buscando…</li>
                    } @else {
                      @for (u of resultados(); track u.usuarioId) {
                        <li>
                          <button type="button" (click)="seleccionarResponsable(u)"
                            class="w-full text-left px-3 py-2 hover:bg-[#F9F5F0] transition-colors">
                            <span class="text-sm text-[#2D2926]">{{ u.nombreCompleto }}</span>
                            <span class="block text-[11px] text-[#2D2926]/45">
                              {{ u.rolNombre }} · {{ u.correo }}
                            </span>
                          </button>
                        </li>
                      }
                    }
                  </ul>
                }
              }

              <p class="text-[11px] text-[#2D2926]/45 mt-1">
                Si la solicitud está registrada, asignar avanza automáticamente a “En evaluación”.
              </p>
            </div>
          }

          <!-- Cambiar estado -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Cambiar estado
            </label>
            @if (estadosPosibles().length > 0) {
              <select
                [(ngModel)]="nuevoEstado"
                class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                       text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
                <option value="">— Sin cambio de estado —</option>
                @for (e of estadosPosibles(); track e) {
                  <option [value]="e">{{ estadoLabel(e) }}</option>
                }
              </select>
            } @else {
              <p class="text-sm text-[#2D2926]/50 italic">
                No hay transiciones de estado disponibles para esta solicitud.
              </p>
            }
          </div>

          <!-- Observación -->
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Observación
              @if (nuevoEstado() === 'RECHAZADA') {
                <span class="text-red-500">*</span>
              }
            </label>
            <textarea
              [(ngModel)]="observacion"
              rows="3"
              maxlength="1000"
              [placeholder]="nuevoEstado() === 'RECHAZADA'
                ? 'Obligatoria al rechazar: motivo del rechazo'
                : 'Comentario opcional'"
              class="w-full px-3 py-2 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35 resize-none
                     focus:outline-none focus:border-[#C5A048]"></textarea>
          </div>

          <!-- Nota fija de notificación -->
          <div class="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700">
            <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-[11px] leading-relaxed">
              Al cambiar el estado se notificará automáticamente por correo al solicitante
              (si tiene correo registrado).
            </p>
          </div>
        </div>
      }

      <ng-container modal-footer>
        <button
          type="button"
          (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">
          Cancelar
        </button>
        <button
          type="button"
          (click)="guardar()"
          [disabled]="!puedeGuardar() || guardando()"
          class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ guardando() ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class AtenderSolicitudModalComponent {
  private readonly svc = inject(SolicitudService);
  private readonly usuarios = inject(UsuarioLookupService);
  private readonly auth = inject(AuthStore);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly solicitud = input<SolicitudResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<SolicitudResponse>();

  readonly responsableId = signal<number | null>(null);
  readonly nuevoEstado = signal<EstadoSolicitud | ''>('');
  readonly observacion = signal<string>('');
  readonly guardando = signal(false);

  // ── Autocomplete de responsable ─────────────────────────────────────────────
  readonly busqueda = signal('');
  readonly resultados = signal<UsuarioResumen[]>([]);
  readonly responsableSel = signal<UsuarioResumen | null>(null);
  readonly buscando = signal(false);
  private readonly busqueda$ = new Subject<string>();

  private readonly tier = computed(() => resolverTier(this.auth.rol()));
  readonly esTier1 = computed(() => this.tier() === 1);

  constructor() {
    this.busqueda$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => {
          if (q.trim().length < 2) {
            this.buscando.set(false);
            return of<UsuarioResumen[]>([]);
          }
          this.buscando.set(true);
          return this.usuarios.buscarEmpleadosActivos(q);
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (lista) => {
          this.resultados.set(lista);
          this.buscando.set(false);
        },
        error: () => {
          this.resultados.set([]);
          this.buscando.set(false);
        },
      });
  }

  onBuscar(texto: string): void {
    this.busqueda.set(texto);
    this.busqueda$.next(texto);
  }

  seleccionarResponsable(u: UsuarioResumen): void {
    this.responsableSel.set(u);
    this.responsableId.set(u.usuarioId);
    this.resultados.set([]);
    this.busqueda.set('');
  }

  limpiarResponsable(): void {
    this.responsableSel.set(null);
    this.responsableId.set(null);
    this.busqueda.set('');
    this.resultados.set([]);
  }

  readonly estadosPosibles = computed<EstadoSolicitud[]>(() => {
    const s = this.solicitud();
    return s ? transicionesPermitidas(s, this.tier()) : [];
  });

  readonly puedeGuardar = computed(() => {
    const cambiaEstado = this.nuevoEstado() !== '';
    const asigna = this.responsableId() != null && Number(this.responsableId()) > 0;
    if (!cambiaEstado && !asigna) return false;
    // RECHAZADA exige observación no vacía
    if (this.nuevoEstado() === 'RECHAZADA' && !this.observacion().trim()) return false;
    return true;
  });

  guardar(): void {
    const s = this.solicitud();
    if (!s || !this.puedeGuardar() || this.guardando()) return;

    this.guardando.set(true);

    const estado = this.nuevoEstado();
    const obs = this.observacion().trim();
    const respId = this.responsableId();
    const asigna = respId != null && Number(respId) > 0 && respId !== s.responsableId;

    // 1) Asignar responsable (si aplica) → 2) cambiar estado (si aplica)
    const asignar$ = asigna
      ? this.svc.asignarResponsable(s.solicitudId, {
          responsableId: Number(respId),
          observacion: obs || undefined,
        })
      : of(s);

    asignar$
      .pipe(
        switchMap((tras) =>
          estado
            ? this.svc.cambiarEstado(s.solicitudId, {
                nuevoEstado: estado,
                observacion: obs || undefined,
              })
            : of(tras),
        ),
      )
      .subscribe({
        next: (actualizada) => {
          this.guardando.set(false);
          this.toastr.success('Solicitud actualizada correctamente.');
          this.reset();
          this.guardado.emit(actualizada);
        },
        error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
          this.guardando.set(false);
          this.toastr.error(
            err.friendlyMessage ?? 'No se pudo actualizar la solicitud.',
            'Error',
          );
        },
      });
  }

  private reset(): void {
    this.responsableId.set(null);
    this.responsableSel.set(null);
    this.busqueda.set('');
    this.resultados.set([]);
    this.nuevoEstado.set('');
    this.observacion.set('');
  }

  estadoLabel(e: EstadoSolicitud): string { return ESTADO_LABEL[e]; }
  tipoLabel(s: SolicitudResponse): string { return TIPO_LABEL[s.tipoSolicitud]; }
  prioridadLabel(s: SolicitudResponse): string { return PRIORIDAD_LABEL[s.prioridad]; }
}
