import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-2xl border border-[#EEE3D1] overflow-hidden">

      @if (clientes().length === 0) {
        <div class="py-16 text-center">
          <p class="text-sm font-semibold text-[#2D2926]">Sin clientes</p>
          <p class="text-xs text-[#2D2926]/45 mt-1">No se encontraron clientes con los filtros aplicados.</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px] text-sm">
            <thead>
              <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase tracking-wide
                         text-[#2D2926]/50">
                <th class="px-4 py-3 font-semibold">Nombre</th>
                <th class="px-4 py-3 font-semibold">Documento</th>
                <th class="px-4 py-3 font-semibold">Nacionalidad</th>
                <th class="px-4 py-3 font-semibold">Correo</th>
                <th class="px-4 py-3 font-semibold">Teléfono</th>
                <th class="px-4 py-3 font-semibold">Estado</th>
                <th class="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (c of clientes(); track c.huespedId) {
                <tr class="border-b border-[#EEE3D1] last:border-0 hover:bg-[#F9F5F0] transition-colors">

                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full bg-[#C5A048] text-white shrink-0
                                  flex items-center justify-center font-bold text-xs">
                        {{ c.nombreCompleto.charAt(0) }}
                      </div>
                      <span class="font-semibold text-[#2D2926]">{{ c.nombreCompleto }}</span>
                    </div>
                  </td>

                  <td class="px-4 py-3">
                    <span class="font-mono text-xs text-[#2D2926]/60">{{ c.numeroDocumento }}</span>
                  </td>

                  <td class="px-4 py-3 text-[#2D2926]/70">{{ c.nacionalidad ?? '—' }}</td>

                  <td class="px-4 py-3 text-xs text-[#2D2926]/60">{{ c.correo ?? '—' }}</td>

                  <td class="px-4 py-3 text-[#2D2926]/70">{{ c.telefono ?? '—' }}</td>

                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                 text-[11px] font-semibold border"
                          [class]="c.estado === 'ACTIVO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'">
                      <span class="w-1.5 h-1.5 rounded-full"
                            [class]="c.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-red-500'">
                      </span>
                      {{ c.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>

                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1.5">
                      <button type="button"
                        (click)="onVerCliente.emit(c.huespedId)"
                        class="h-7 px-2.5 rounded-lg border border-[#EEE3D1] text-[11px] font-medium
                               text-[#2D2926]/60 hover:border-[#C5A048] hover:text-[#C5A048] transition-colors"
                        title="Ver detalles">
                        Ver
                      </button>
                      <button type="button"
                        (click)="onEditarCliente.emit(c.huespedId)"
                        class="h-7 px-2.5 rounded-lg border border-[#EEE3D1] text-[11px] font-medium
                               text-[#2D2926]/60 hover:border-[#C5A048] hover:text-[#C5A048] transition-colors"
                        title="Editar">
                        Editar
                      </button>
                      <button type="button"
                        (click)="onToggleEstado.emit(c.huespedId)"
                        class="h-7 px-2.5 rounded-lg border text-[11px] font-medium transition-colors"
                        [class]="c.estado === 'ACTIVO'
                          ? 'border-red-100 text-red-500 hover:bg-red-50'
                          : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'"
                        [title]="c.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'">
                        {{ c.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
                      </button>
                      <button type="button"
                        (click)="onEliminarCliente.emit(c.huespedId)"
                        class="h-7 px-2.5 rounded-lg border border-red-100 text-[11px] font-medium
                               text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar">
                        Eliminar
                      </button>
                    </div>
                  </td>

                </tr>
              }
            </tbody>
          </table>
        </div>
      }

    </div>
  `,
})
export class ClienteTableComponent {
  clientes = input.required<Cliente[]>();

  onVerCliente      = output<number>();
  onEditarCliente   = output<number>();
  onToggleEstado    = output<number>();
  onEliminarCliente = output<number>();
}
