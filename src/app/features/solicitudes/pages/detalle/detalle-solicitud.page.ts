import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SolicitudService } from '../../services/solicitud.service';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import {
  AccionSeguimiento,
  EstadoSolicitud,
  ModuloReferido,
  SeguimientoSolicitudResponse,
  SolicitudResponse,
} from '../../models/solicitud.model';
import {
  ACCION_LABEL,
  ESTADO_BADGE,
  ESTADO_LABEL,
  MODULO_LABEL,
  PRIORIDAD_BADGE,
  PRIORIDAD_LABEL,
  TIPO_BADGE,
  TIPO_LABEL,
  puedeAtender,
  resolverTier,
} from '../../utils/solicitud-ui';
import { AtenderSolicitudModalComponent } from '../../components/atender-solicitud-modal.component';
import { EditarSolicitudModalComponent } from '../../components/editar-solicitud-modal.component';

@Component({
  selector: 'app-detalle-solicitud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AtenderSolicitudModalComponent, EditarSolicitudModalComponent],
  template: `
    <div class="space-y-5 max-w-4xl">

      <!-- Volver -->
      <button
        type="button"
        (click)="volver()"
        class="inline-flex items-center gap-1.5 text-sm text-[#2D2926]/60
               hover:text-[#C5A048] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Volver
      </button>

      @if (loading()) {
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div class="bg-white rounded-2xl border border-[#EEE3D1] h-80 animate-pulse"></div>
          <div class="bg-white rounded-2xl border border-[#EEE3D1] h-60 animate-pulse"></div>
        </div>
      } @else if (solicitud(); as s) {
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">

          <!-- ───── Columna izquierda ───── -->
          <div class="space-y-5">

            <!-- Datos generales -->
            <div class="bg-white rounded-2xl border border-[#EEE3D1] p-6">
              <div class="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <span class="font-mono text-sm font-bold text-[#C5A048]">{{ s.codigoSolicitud }}</span>
                  <h1 class="text-xl font-bold text-[#2D2926] mt-1">{{ s.asunto }}</h1>
                </div>
                <span class="px-3 py-1 rounded-full text-[11px] font-semibold"
                      [class]="estadoBadge(s.estado)">
                  {{ estadoLabel(s.estado) }}
                </span>
              </div>

              <div class="flex flex-wrap gap-2 mt-3">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      [class]="tipoBadge(s)">{{ tipoLabel(s) }}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      [class]="prioridadBadge(s)">Prioridad {{ prioridadLabel(s) }}</span>
                @if (s.moduloReferido) {
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                               bg-[#F9F5F0] text-[#2D2926]/60 border border-[#EEE3D1]">
                    {{ moduloLabel(s.moduloReferido) }}
                  </span>
                }
              </div>

              <hr class="border-[#EEE3D1] my-4" />

              <div class="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p class="text-[11px] text-[#2D2926]/50 font-medium">Solicitante</p>
                  <p class="font-medium text-[#2D2926] mt-0.5">{{ s.solicitanteNombre }}</p>
                </div>
                <div>
                  <p class="text-[11px] text-[#2D2926]/50 font-medium">Fecha de registro</p>
                  <p class="font-medium text-[#2D2926] mt-0.5">{{ formatFechaHora(s.fechaRegistro) }}</p>
                </div>
                <div>
                  <p class="text-[11px] text-[#2D2926]/50 font-medium">Responsable</p>
                  <p class="font-medium text-[#2D2926] mt-0.5">{{ s.responsableNombre ?? '—' }}</p>
                </div>
                @if (s.fechaCierre) {
                  <div>
                    <p class="text-[11px] text-[#2D2926]/50 font-medium">Fecha de cierre</p>
                    <p class="font-medium text-[#2D2926] mt-0.5">{{ formatFechaHora(s.fechaCierre) }}</p>
                  </div>
                }
              </div>

              <!-- Bloque ACCESO -->
              @if (s.tipoSolicitud === 'ACCESO') {
                <hr class="border-[#EEE3D1] my-4" />
                <p class="text-[10px] font-bold text-[#C5A048] uppercase tracking-widest mb-3">
                  Detalles de acceso
                </p>
                <div class="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <p class="text-[11px] text-[#2D2926]/50 font-medium">Tipo de acceso</p>
                    <p class="font-medium text-[#2D2926] mt-0.5">{{ s.tipoAcceso ?? '—' }}</p>
                  </div>
                  <div>
                    <p class="text-[11px] text-[#2D2926]/50 font-medium">Rol solicitado</p>
                    <p class="font-medium text-[#2D2926] mt-0.5">{{ s.rolSolicitado ?? '—' }}</p>
                  </div>
                  @if (s.periodoInicio || s.periodoFin) {
                    <div class="col-span-2">
                      <p class="text-[11px] text-[#2D2926]/50 font-medium">Periodo</p>
                      <p class="font-medium text-[#2D2926] mt-0.5">
                        {{ s.periodoInicio ?? '—' }} → {{ s.periodoFin ?? '—' }}
                      </p>
                    </div>
                  }
                </div>
              }

              <hr class="border-[#EEE3D1] my-4" />

              <p class="text-[10px] font-bold text-[#C5A048] uppercase tracking-widest mb-2">
                Descripción
              </p>
              <p class="text-sm text-[#2D2926]/80 leading-relaxed whitespace-pre-line">
                {{ s.descripcion }}
              </p>

              <!-- Observación de resolución (último comentario de cambio de estado) -->
              @if (s.observaciones) {
                <div class="mt-4 px-4 py-3 rounded-lg bg-[#F9F5F0] border border-[#EEE3D1]">
                  <p class="text-[10px] font-bold text-[#C5A048] uppercase tracking-widest mb-1">
                    Última observación de resolución
                  </p>
                  <p class="text-sm text-[#2D2926]/80 leading-relaxed">{{ s.observaciones }}</p>
                </div>
              }
            </div>

            <!-- Timeline de seguimientos -->
            <div class="bg-white rounded-2xl border border-[#EEE3D1] p-6">
              <h2 class="text-base font-bold text-[#2D2926] mb-4">Historial de seguimiento</h2>

              @if (seguimientos().length === 0) {
                <p class="text-sm text-[#2D2926]/45">Sin movimientos registrados.</p>
              } @else {
                <ol class="relative border-l-2 border-[#EEE3D1] ml-2 space-y-5">
                  @for (ev of seguimientos(); track ev.seguimientoId) {
                    <li class="ml-5">
                      <span class="absolute -left-[7px] w-3 h-3 rounded-full bg-[#C5A048]
                                   border-2 border-white"></span>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-sm font-semibold text-[#2D2926]">
                          {{ accionLabel(ev.accion) }}
                        </span>
                        @if (ev.estadoAnterior) {
                          <span class="text-[11px] text-[#2D2926]/50">
                            {{ estadoLabel(ev.estadoAnterior) }} →
                            {{ estadoLabel(ev.estadoNuevo) }}
                          </span>
                        } @else {
                          <span class="text-[11px] text-[#2D2926]/50">
                            → {{ estadoLabel(ev.estadoNuevo) }}
                          </span>
                        }
                      </div>
                      @if (ev.observacion) {
                        <p class="text-sm text-[#2D2926]/70 mt-0.5">{{ ev.observacion }}</p>
                      }
                      <p class="text-[11px] text-[#2D2926]/40 mt-1">
                        {{ ev.responsableNombre }} · {{ formatFechaHora(ev.fechaAccion) }}
                      </p>
                    </li>
                  }
                </ol>
              }
            </div>
          </div>

          <!-- ───── Columna derecha: acciones ───── -->
          <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5 space-y-2.5">
            <h2 class="text-base font-bold text-[#2D2926] mb-1">Acciones</h2>

            @if (mostrarAtender()) {
              <button
                type="button"
                (click)="atenderAbierto.set(true)"
                class="w-full h-10 rounded-xl bg-[#C5A048] text-white text-sm font-medium
                       hover:bg-[#8E6F2E] transition-colors">
                Atender
              </button>
            }

            @if (mostrarEditar()) {
              <button
                type="button"
                (click)="editarAbierto.set(true)"
                class="w-full h-10 rounded-xl bg-[#F9F5F0] border border-[#EEE3D1]
                       text-[#2D2926] text-sm font-medium hover:bg-[#EEE3D1] transition-colors">
                Editar
              </button>
            }

            @if (esTier1()) {
              <button
                type="button"
                (click)="eliminar()"
                class="w-full h-10 rounded-xl bg-red-50 border border-red-200
                       text-red-600 text-sm font-medium hover:bg-red-100 transition-colors">
                Eliminar
              </button>
            }

            @if (!mostrarAtender() && !mostrarEditar() && !esTier1()) {
              <p class="text-sm text-[#2D2926]/45">No hay acciones disponibles.</p>
            }
          </div>
        </div>

        <!-- Modales -->
        <app-atender-solicitud-modal
          [open]="atenderAbierto()"
          [solicitud]="solicitud()"
          (cerrar)="atenderAbierto.set(false)"
          (guardado)="onActualizada($event); atenderAbierto.set(false)" />

        <app-editar-solicitud-modal
          [open]="editarAbierto()"
          [solicitud]="solicitud()"
          (cerrar)="editarAbierto.set(false)"
          (guardado)="onActualizada($event); editarAbierto.set(false)" />

      } @else {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-12 text-center">
          <p class="text-[#2D2926]/45 text-sm">
            No se encontró la solicitud (puede no existir o no tienes acceso).
          </p>
          <button
            type="button"
            (click)="volver()"
            class="mt-3 inline-block text-sm text-[#C5A048] hover:underline font-medium">
            Volver
          </button>
        </div>
      }

    </div>
  `,
})
export class DetalleSolicitudPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly svc = inject(SolicitudService);
  private readonly auth = inject(AuthStore);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly solicitud = signal<SolicitudResponse | null>(null);
  readonly seguimientos = signal<SeguimientoSolicitudResponse[]>([]);

  readonly atenderAbierto = signal(false);
  readonly editarAbierto = signal(false);

  private readonly tier = computed(() => resolverTier(this.auth.rol()));
  readonly esTier1 = computed(() => this.tier() === 1);

  readonly mostrarAtender = computed(() => {
    const s = this.solicitud();
    return s ? puedeAtender(s, this.tier()) : false;
  });

  readonly mostrarEditar = computed(() => {
    const s = this.solicitud();
    if (!s) return false;
    const esAutor = s.solicitanteId === this.auth.user()?.usuarioId;
    return esAutor && s.estado === 'REGISTRADA';
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.cargar(id);
  }

  private cargar(id: number): void {
    this.loading.set(true);
    forkJoin([
      this.svc.obtenerPorId(id).pipe(catchError(() => of(null))),
      this.svc.obtenerSeguimientos(id).pipe(catchError(() => of([] as SeguimientoSolicitudResponse[]))),
    ]).subscribe(([s, segs]) => {
      this.solicitud.set(s);
      this.seguimientos.set(segs);
      this.loading.set(false);
    });
  }

  onActualizada(s: SolicitudResponse): void {
    this.solicitud.set(s);
    // Recargar el historial: cualquier acción inserta un seguimiento nuevo
    this.svc
      .obtenerSeguimientos(s.solicitudId)
      .pipe(catchError(() => of(this.seguimientos())))
      .subscribe((segs) => this.seguimientos.set(segs));
  }

  async eliminar(): Promise<void> {
    const s = this.solicitud();
    if (!s) return;
    const ok = await this.confirm.ask({
      title: 'Eliminar solicitud',
      message: `¿Eliminar definitivamente ${s.codigoSolicitud}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;

    this.svc.eliminar(s.solicitudId).subscribe({
      next: () => {
        this.toastr.success('Solicitud eliminada.');
        this.router.navigate(['/solicitudes']);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo eliminar.', 'Error');
      },
    });
  }

  volver(): void {
    this.location.back();
  }

  formatFechaHora(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  estadoLabel(e: EstadoSolicitud): string { return ESTADO_LABEL[e]; }
  estadoBadge(e: EstadoSolicitud): string { return ESTADO_BADGE[e]; }
  accionLabel(a: AccionSeguimiento): string { return ACCION_LABEL[a]; }
  tipoLabel(s: SolicitudResponse): string { return TIPO_LABEL[s.tipoSolicitud]; }
  tipoBadge(s: SolicitudResponse): string { return TIPO_BADGE[s.tipoSolicitud]; }
  prioridadLabel(s: SolicitudResponse): string { return PRIORIDAD_LABEL[s.prioridad]; }
  prioridadBadge(s: SolicitudResponse): string { return PRIORIDAD_BADGE[s.prioridad]; }
  moduloLabel(m: ModuloReferido): string { return MODULO_LABEL[m]; }
}
