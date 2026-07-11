import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { MiAsistenciaService } from '../../services/mi-asistencia.service';
import { MiAsistenciaResponse } from '../../models/mi-asistencia.model';
import { TIPO_BADGE, TIPO_LABEL } from '../../../asistencia/utils/asistencia-ui';
import { TipoAsistencia } from '../../../asistencia/models/asistencia.model';

@Component({
  selector: 'app-mi-asistencia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 max-w-4xl">
      <div>
        <h1 class="text-2xl font-bold text-[#2D2926]">Mi asistencia</h1>
        <p class="text-sm text-[#2D2926]/55 mt-0.5">Marca tu entrada y salida del día.</p>
      </div>

      <!-- Marcado -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-5">
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" (click)="marcarEntrada()" [disabled]="marcando()"
            class="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 text-white
                   text-sm font-semibold hover:bg-emerald-700 transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14"/>
            </svg>
            Marcar entrada
          </button>
          <button type="button" (click)="marcarSalida()" [disabled]="marcando()"
            class="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#2D2926] text-white
                   text-sm font-semibold hover:bg-[#463f39] transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
            Marcar salida
          </button>
        </div>
      </div>

      <!-- Mis marcas -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">
        <div class="px-5 py-3.5 border-b border-[#EEE3D1]">
          <p class="text-sm font-semibold text-[#2D2926]">Mis marcas</p>
        </div>

        @if (cargando()) {
          <div class="p-5 space-y-3">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-11 bg-[#EEE3D1] rounded-lg animate-pulse"></div>
            }
          </div>
        } @else if (marcas().length === 0) {
          <div class="py-12 text-center">
            <p class="text-sm text-[#2D2926]/45">Aún no tienes marcas registradas.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold">Fecha</th>
                  <th class="px-4 py-3 font-semibold">Entrada</th>
                  <th class="px-4 py-3 font-semibold">Salida</th>
                  <th class="px-4 py-3 font-semibold whitespace-nowrap">Horas</th>
                  <th class="px-4 py-3 font-semibold">Tipo</th>
                </tr>
              </thead>
              <tbody>
                @for (m of marcas(); track m.asistenciaId) {
                  <tr class="border-b border-[#EEE3D1] last:border-0 hover:bg-[#F9F5F0] transition-colors">
                    <td class="px-4 py-3 font-medium text-[#2D2926]">{{ m.fecha }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70">{{ m.horaIngreso.slice(0, 5) }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70">{{ m.horaEgreso?.slice(0, 5) ?? '—' }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">
                      {{ m.horasTrabajadas != null ? m.horasTrabajadas + ' h' : '—' }}
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="tipoBadge(m.tipo)">{{ tipoLabel(m.tipo) }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class MiAsistenciaPage {
  private readonly svc = inject(MiAsistenciaService);
  private readonly toastr = inject(ToastrService);

  readonly marcas = signal<MiAsistenciaResponse[]>([]);
  readonly cargando = signal(false);
  readonly marcando = signal(false);

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (lista) => { this.marcas.set(lista); this.cargando.set(false); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.cargando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron cargar tus marcas.', 'Error');
      },
    });
  }

  marcarEntrada(): void {
    if (this.marcando()) return;
    this.marcando.set(true);
    this.svc.marcarEntrada().subscribe({
      next: () => {
        this.marcando.set(false);
        this.toastr.success('Entrada registrada.');
        this.cargar();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.marcando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo marcar la entrada.', 'Error');
      },
    });
  }

  marcarSalida(): void {
    if (this.marcando()) return;
    this.marcando.set(true);
    this.svc.marcarSalida().subscribe({
      next: (m) => {
        this.marcando.set(false);
        const horas = m.horasTrabajadas != null ? ` (${m.horasTrabajadas} h)` : '';
        this.toastr.success(`Salida registrada${horas}.`);
        this.cargar();
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.marcando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo marcar la salida.', 'Error');
      },
    });
  }

  tipoLabel(t: TipoAsistencia): string { return TIPO_LABEL[t] ?? t; }
  tipoBadge(t: TipoAsistencia): string { return TIPO_BADGE[t] ?? 'bg-gray-100 text-gray-600'; }
}
