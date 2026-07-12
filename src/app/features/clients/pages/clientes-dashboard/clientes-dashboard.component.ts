import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ClienteService } from '../../services/cliente.service';
import { ClienteStatsComponent } from '../../components/cliente-stats/cliente-stats.component';
import { ClienteFiltersComponent } from '../../components/cliente-filters/cliente-filters.component';
import { ClienteTableComponent } from '../../components/cliente-table/cliente-table.component';
import { ClienteModalComponent, ClienteModalSaveEvent } from '../../components/cliente-modal/cliente-modal.component';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { Cliente, EstadoActivo } from '../../models/cliente.model';

@Component({
  selector: 'app-clientes-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ClienteStatsComponent,
    ClienteFiltersComponent,
    ClienteTableComponent,
    ClienteModalComponent,
  ],
  template: `
    <div class="space-y-6">

      <!-- Cabecera -->
      <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-[11px] uppercase tracking-[0.3em] text-[#C5A048] font-semibold mb-1">
            Recepción
          </p>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[#2D2926]">
            Gestión de clientes
          </h1>
          <p class="text-[15px] text-[#2D2926]/55 mt-1">
            Registro y administración de clientes / huéspedes.
          </p>
        </div>
        @if (puedeCrear()) {
          <button type="button" (click)="abrirCrear()"
            class="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#C5A048] text-white
                   text-sm font-semibold hover:bg-[#8E6F2E] transition-colors shrink-0">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" d="M12 5v14M5 12h14"/>
            </svg>
            Nuevo cliente
          </button>
        }
      </header>

      <!-- Stats -->
      <app-cliente-stats [stats]="svc.stats()" />

      <!-- Filtros -->
      <app-cliente-filters
        [activosCount]="svc.activosCount()"
        [inactivosCount]="svc.inactivosCount()"
        (onSearch)="svc.setSearchTerm($event)"
        (onEstadoFilter)="svc.setEstadoFilter($event)" />

      <!-- Tabla -->
      <app-cliente-table
        [clientes]="svc.filteredClientes()"
        [canEditar]="puedeEditar()"
        [canCambiarEstado]="puedeCambiarEstado()"
        [canEliminar]="puedeEliminar()"
        (onVerCliente)="abrirVer($event)"
        (onEditarCliente)="abrirEditar($event)"
        (onToggleEstado)="toggleEstado($event)"
        (onEliminarCliente)="eliminar($event)" />

    </div>

    <!-- Modal -->
    <app-cliente-modal
      [isOpen]="modalAbierto()"
      [cliente]="clienteSeleccionado()"
      [mode]="modoModal()"
      (onClose)="cerrarModal()"
      (onSave)="guardar($event)" />
  `,
})
export class ClientesDashboardComponent {
  protected svc   = inject(ClienteService);
  private confirm = inject(ConfirmDialogService);
  private readonly auth = inject(AuthStore);

  readonly puedeCrear         = computed(() => this.auth.hasPermission('cliente:create'));
  readonly puedeEditar        = computed(() => this.auth.hasPermission('cliente:update'));
  readonly puedeCambiarEstado = computed(() => this.auth.hasPermission('cliente:change-status'));
  readonly puedeEliminar      = computed(() => this.auth.hasPermission('cliente:delete'));

  modalAbierto        = signal(false);
  clienteSeleccionado = signal<Cliente | null>(null);
  modoModal           = signal<'view' | 'edit' | 'create'>('create');

  abrirCrear(): void {
    this.clienteSeleccionado.set(null);
    this.modoModal.set('create');
    this.modalAbierto.set(true);
  }

  abrirVer(id: number): void {
    const c = this.svc.findById(id);
    if (c) { this.clienteSeleccionado.set(c); this.modoModal.set('view'); this.modalAbierto.set(true); }
  }

  abrirEditar(id: number): void {
    const c = this.svc.findById(id);
    if (c) { this.clienteSeleccionado.set(c); this.modoModal.set('edit'); this.modalAbierto.set(true); }
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.clienteSeleccionado.set(null);
  }

  guardar(event: ClienteModalSaveEvent): void {
    const obs$ = event.id != null
      ? this.svc.update(event.id, event.payload)
      : this.svc.create(event.payload as any);
    obs$.subscribe(() => this.cerrarModal());
  }

  toggleEstado(id: number): void {
    const c = this.svc.findById(id);
    if (!c) return;
    const nuevoEstado: EstadoActivo = c.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.svc.cambiarEstado(id, nuevoEstado).subscribe();
  }

  async eliminar(id: number): Promise<void> {
    const ok = await this.confirm.ask({
      title:       'Eliminar cliente',
      message:     '¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText:  'Cancelar',
      variant:     'danger',
    });
    if (ok) this.svc.delete(id).subscribe();
  }
}
