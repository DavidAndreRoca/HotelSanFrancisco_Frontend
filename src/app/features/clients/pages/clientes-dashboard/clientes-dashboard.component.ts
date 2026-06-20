import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ClienteService } from '../../services/cliente.service';
import { ClienteStatsComponent } from '../../components/cliente-stats/cliente-stats.component';
import { ClienteFiltersComponent } from '../../components/cliente-filters/cliente-filters.component';
import { ClienteTableComponent } from '../../components/cliente-table/cliente-table.component';
import { ClienteModalComponent, ClienteModalSaveEvent } from '../../components/cliente-modal/cliente-modal.component';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { RoomSidebarComponent } from '../../../rooms/components/room-sidebar/room-sidebar.component';
import { Cliente, EstadoActivo } from '../../models/cliente.model';

@Component({
  selector: 'app-clientes-dashboard',
  standalone: true,
  imports: [
    RoomSidebarComponent,
    ClienteStatsComponent,
    ClienteFiltersComponent,
    ClienteTableComponent,
    ClienteModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-layout">
      <app-room-sidebar />

      <main class="main-content">
        <div class="header">
          <div>
            <h1>Gestión de Clientes</h1>
            <p class="subtitle">Registro y administración de clientes / huéspedes</p>
          </div>
        </div>

        <app-cliente-stats [stats]="svc.stats()" />

        <app-cliente-filters
          [activosCount]="svc.activosCount()"
          [inactivosCount]="svc.inactivosCount()"
          (onSearch)="svc.setSearchTerm($event)"
          (onEstadoFilter)="svc.setEstadoFilter($event)" />

        <app-cliente-table
          [clientes]="svc.filteredClientes()"
          (onNuevoCliente)="abrirCrear()"
          (onVerCliente)="abrirVer($event)"
          (onEditarCliente)="abrirEditar($event)"
          (onToggleEstado)="toggleEstado($event)"
          (onEliminarCliente)="eliminar($event)" />
      </main>
    </div>

    <app-cliente-modal
      [isOpen]="modalAbierto()"
      [cliente]="clienteSeleccionado()"
      [mode]="modoModal()"
      (onClose)="cerrarModal()"
      (onSave)="guardar($event)" />
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');
    * { font-family: 'Inter', sans-serif; }

    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      background: #F9F5F0;
    }

    .main-content {
      flex: 1;
      margin-left: 260px;
      padding: 2rem;
      background: #F9F5F0;
      min-height: 100vh;
      animation: fadeIn 0.4s ease-out;
    }

    .header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #C5A048;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header h1 {
      margin: 0;
      font-size: 1.875rem;
      font-weight: 700;
      color: #2D2926;
      letter-spacing: -0.02em;
    }

    .header h1::before {
      content: '👤';
      font-size: 1.5rem;
      margin-right: 0.75rem;
      vertical-align: middle;
    }

    .subtitle { color: #8E6F2E; margin: 0.25rem 0 0; font-size: 1rem; }

    app-cliente-stats   { display: block; margin-bottom: 1.5rem; }
    app-cliente-filters { display: block; margin-bottom: 1.5rem; }
    app-cliente-table   { display: block; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    :focus-visible { outline: 2px solid #C5A048; outline-offset: 2px; }

    @media (max-width: 1024px) {
      .main-content { margin-left: 72px; padding: 1.5rem; }
      .header h1 { font-size: 1.5rem; }
    }

    @media (max-width: 768px) {
      .main-content { margin-left: 0; padding: 1rem; padding-bottom: 80px; }
      .header { flex-direction: column; align-items: flex-start; }
      .header h1 { font-size: 1.25rem; }
    }
  `
})
export class ClientesDashboardComponent {
  protected svc     = inject(ClienteService);
  private confirm   = inject(ConfirmDialogService);

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
    if (c) {
      this.clienteSeleccionado.set(c);
      this.modoModal.set('view');
      this.modalAbierto.set(true);
    }
  }

  abrirEditar(id: number): void {
    const c = this.svc.findById(id);
    if (c) {
      this.clienteSeleccionado.set(c);
      this.modoModal.set('edit');
      this.modalAbierto.set(true);
    }
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
      title: 'Eliminar cliente',
      message: '¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (ok) this.svc.delete(id).subscribe();
  }
}
