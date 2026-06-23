import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../../services/notifications.service';
import {
  EmailLogEntry,
  EmailLogPlantilla,
  EmailStatus,
} from '../../models/notification.model';

const PAGE_SIZE = 20;

const PLANTILLA_LABEL: Record<EmailLogPlantilla, string> = {
  RESERVATION_CONFIRMATION: 'Confirmación de reserva',
  PAYMENT_CONFIRMATION: 'Confirmación de pago',
  RESERVATION_CANCELLATION: 'Cancelación de reserva',
  STAY_REMINDER: 'Recordatorio de estadía',
  PASSWORD_RESET: 'Restablecer contraseña',
  REQUEST_STATUS_CHANGED: 'Cambio de estado de solicitud',
};

const ESTADO_LABEL: Record<EmailStatus, string> = {
  ENVIADO: 'Enviado',
  PENDIENTE: 'Pendiente',
  FALLIDO: 'Fallido',
};

const ESTADO_BADGE: Record<EmailStatus, string> = {
  ENVIADO: 'bg-emerald-100 text-emerald-700',
  PENDIENTE: 'bg-amber-100 text-amber-800',
  FALLIDO: 'bg-red-100 text-red-600',
};

@Component({
  selector: 'app-email-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="space-y-6">

      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Log de correos</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">
            Correos enviados por el sistema y su estado de entrega. Reintenta los fallidos.
          </p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Buscar</label>
            <input type="text" [ngModel]="fSearch()" (ngModelChange)="onSearch($event)"
              placeholder="Destinatario o asunto"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] placeholder:text-[#2D2926]/35 focus:outline-none focus:border-[#C5A048]" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Estado</label>
            <select [value]="fEstado()" (change)="onEstado($any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todos</option>
              <option value="ENVIADO">Enviado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="FALLIDO">Fallido</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-[#2D2926]/55 mb-1.5">Plantilla</label>
            <select [value]="fPlantilla()" (change)="onPlantilla($any($event.target).value)"
              class="w-full h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm
                     text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
              <option value="">Todas</option>
              @for (p of plantillas; track p.value) {
                <option [value]="p.value">{{ p.label }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">
        @if (loading()) {
          <div class="p-5 space-y-3">
            @for (_ of [1,2,3,4,5]; track $index) {
              <div class="h-11 bg-[#EEE3D1] rounded-lg animate-pulse"></div>
            }
          </div>
        } @else if (filas().length === 0) {
          <div class="py-16 text-center">
            <p class="text-sm font-semibold text-[#2D2926]">Sin correos</p>
            <p class="text-xs text-[#2D2926]/45 mt-1">No hay correos con los filtros aplicados.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[920px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold w-8"></th>
                  <th class="px-4 py-3 font-semibold whitespace-nowrap">Fecha</th>
                  <th class="px-4 py-3 font-semibold">Destinatario</th>
                  <th class="px-4 py-3 font-semibold">Asunto</th>
                  <th class="px-4 py-3 font-semibold">Plantilla</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold text-right">Intentos</th>
                  <th class="px-4 py-3 font-semibold">Reserva</th>
                  <th class="px-4 py-3 font-semibold text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (e of filas(); track e.id) {
                  <tr class="border-b border-[#EEE3D1] hover:bg-[#F9F5F0] transition-colors"
                      [style.background-color]="expandido() === e.id ? '#F9F5F0' : null">
                    <td class="px-4 py-3 text-[#2D2926]/40">
                      @if (e.estado === 'FALLIDO' && e.error) {
                        <svg class="w-4 h-4 transition-transform cursor-pointer"
                             [class.rotate-90]="expandido() === e.id"
                             (click)="toggle(e.id)"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      }
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">
                      {{ e.enviadoEn ? (e.enviadoEn | date:'dd/MM/yyyy HH:mm') : '—' }}
                    </td>
                    <td class="px-4 py-3 text-[#2D2926] whitespace-nowrap">{{ e.destinatario }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 max-w-[260px] truncate" [title]="e.asunto">{{ e.asunto }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">{{ plantillaLabel(e.plantilla) }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
                            [class]="estadoBadge(e.estado)">{{ estadoLabel(e.estado) }}</span>
                    </td>
                    <td class="px-4 py-3 text-right text-[#2D2926]/70">{{ e.intentos }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 font-mono whitespace-nowrap">{{ e.codReserva ?? '—' }}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      @if (e.estado === 'FALLIDO') {
                        <button type="button" (click)="reintentar(e)" [disabled]="reintentandoId() === e.id"
                          class="h-7 px-2.5 rounded-lg border border-[#C5A048] text-[#C5A048]
                                 text-xs font-medium hover:bg-[#C5A048]/5 disabled:opacity-40
                                 disabled:cursor-not-allowed transition-colors">
                          {{ reintentandoId() === e.id ? 'Reintentando…' : 'Reintentar' }}
                        </button>
                      } @else {
                        <span class="text-xs text-[#2D2926]/40">—</span>
                      }
                    </td>
                  </tr>

                  @if (expandido() === e.id) {
                    <tr class="bg-[#F9F5F0]/60 border-b border-[#EEE3D1]">
                      <td colspan="9" class="px-6 py-4">
                        <p class="text-[11px] text-[#2D2926]/50 font-medium">Detalle del error</p>
                        <p class="text-sm text-red-600 mt-0.5 break-words">{{ e.error }}</p>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#EEE3D1]">
            <p class="text-xs text-[#2D2926]/50">
              {{ totalElements() }} correo(s) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
            </p>
            <div class="flex items-center gap-2">
              <button type="button" (click)="paginaAnterior()" [disabled]="pageIndex() === 0"
                class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                       text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors">Anterior</button>
              <button type="button" (click)="paginaSiguiente()" [disabled]="esUltima()"
                class="h-8 px-3 rounded-lg border border-[#EEE3D1] text-xs font-medium
                       text-[#2D2926]/70 hover:bg-[#F9F5F0] disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors">Siguiente</button>
            </div>
          </div>
        }
      </div>

    </div>
  `,
})
export class EmailLogPage {
  private readonly svc = inject(NotificationService);
  private readonly toastr = inject(ToastrService);

  readonly plantillas: { value: EmailLogPlantilla; label: string }[] = (
    Object.keys(PLANTILLA_LABEL) as EmailLogPlantilla[]
  ).map((value) => ({ value, label: PLANTILLA_LABEL[value] }));

  readonly fSearch = signal('');
  readonly fEstado = signal<EmailStatus | ''>('');
  readonly fPlantilla = signal<EmailLogPlantilla | ''>('');
  readonly pageIndex = signal(0);
  readonly expandido = signal<number | null>(null);
  readonly reintentandoId = signal<number | null>(null);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly loading = this.svc.logLoading;
  readonly filas = this.svc.logItems;
  readonly totalElements = computed(() => this.svc.logPage()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this.svc.logPage()?.totalPages ?? 1));
  readonly esUltima = computed(() => this.svc.logPage()?.last ?? true);

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.svc.loadLog({
      search: this.fSearch().trim(),
      estado: this.fEstado(),
      plantilla: this.fPlantilla(),
      page: this.pageIndex(),
      size: PAGE_SIZE,
      sort: 'enviadoEn,desc',
    });
  }

  private recargarDesdeInicio(): void {
    this.pageIndex.set(0);
    this.expandido.set(null);
    this.cargar();
  }

  onSearch(valor: string): void {
    this.fSearch.set(valor);
    // Debounce para no disparar una petición por cada tecla.
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.recargarDesdeInicio(), 350);
  }

  onEstado(valor: EmailStatus | ''): void {
    this.fEstado.set(valor);
    this.recargarDesdeInicio();
  }

  onPlantilla(valor: EmailLogPlantilla | ''): void {
    this.fPlantilla.set(valor);
    this.recargarDesdeInicio();
  }

  toggle(id: number): void {
    this.expandido.update((a) => (a === id ? null : id));
  }

  paginaAnterior(): void {
    if (this.pageIndex() === 0) return;
    this.pageIndex.update((p) => p - 1);
    this.expandido.set(null);
    this.cargar();
  }

  paginaSiguiente(): void {
    if (this.esUltima()) return;
    this.pageIndex.update((p) => p + 1);
    this.expandido.set(null);
    this.cargar();
  }

  reintentar(e: EmailLogEntry): void {
    if (this.reintentandoId() === e.id) return;
    this.reintentandoId.set(e.id);
    this.svc.retry(e.id).subscribe({
      next: () => {
        this.reintentandoId.set(null);
        this.toastr.success('Reenvío solicitado.');
        this.cargar();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.reintentandoId.set(null);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo reintentar el envío.', 'Error');
      },
    });
  }

  plantillaLabel(p: EmailLogPlantilla): string {
    return PLANTILLA_LABEL[p] ?? p;
  }

  estadoLabel(e: EmailStatus): string {
    return ESTADO_LABEL[e];
  }

  estadoBadge(e: EmailStatus): string {
    return ESTADO_BADGE[e];
  }
}
