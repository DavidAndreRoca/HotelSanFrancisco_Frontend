import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Cliente, EstadoActivo } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <div class="table-header">
        <span class="table-title">Listado de clientes</span>
        <button class="add-btn" (click)="onNuevoCliente.emit()">
          ➕ Nuevo Cliente
        </button>
      </div>

      <table class="cliente-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Nacionalidad</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (cliente of clientes(); track cliente.huespedId) {
            <tr>
              <td class="name-cell">
                <div class="cliente-nombre">{{ cliente.nombreCompleto }}</div>
              </td>
              <td>
                <span class="doc-text">{{ cliente.numeroDocumento }}</span>
              </td>
              <td>{{ cliente.nacionalidad ?? '—' }}</td>
              <td>
                <span class="correo-text">{{ cliente.correo ?? '—' }}</span>
              </td>
              <td>{{ cliente.telefono ?? '—' }}</td>
              <td>
                <span [className]="getEstadoClass(cliente.estado)">
                  {{ cliente.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="action-btn view-btn"
                    (click)="onVerCliente.emit(cliente.huespedId)"
                    title="Ver detalles">
                    👁️
                  </button>
                  <button
                    class="action-btn edit-btn"
                    (click)="onEditarCliente.emit(cliente.huespedId)"
                    title="Editar cliente">
                    ✏️
                  </button>
                  <button
                    class="action-btn toggle-btn"
                    (click)="onToggleEstado.emit(cliente.huespedId)"
                    [title]="cliente.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'">
                    {{ cliente.estado === 'ACTIVO' ? '🔴' : '🟢' }}
                  </button>
                  <button
                    class="action-btn delete-btn"
                    (click)="onEliminarCliente.emit(cliente.huespedId)"
                    title="Eliminar cliente">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7" class="empty-table">No se encontraron clientes</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');
    * { font-family: 'Inter', sans-serif; }

    .table-container {
      background: white;
      border-radius: 0.75rem;
      overflow-x: auto;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      border: 1px solid #EEE3D1;
    }

    .table-header {
      padding: 1rem 1.25rem;
      border-bottom: 2px solid #C5A048;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      background: #F9F5F0;
    }

    .table-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #2D2926;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .add-btn {
      padding: 0.5rem 1.25rem;
      background: #C5A048;
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.8125rem;
      font-weight: 600;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .add-btn:hover {
      background: #8E6F2E;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(197,160,72,0.3);
    }

    .cliente-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;
    }

    .cliente-table th {
      text-align: left;
      padding: 0.875rem 1rem;
      background: #F9F5F0;
      font-weight: 600;
      font-size: 0.75rem;
      color: #8E6F2E;
      border-bottom: 1px solid #EEE3D1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cliente-table td {
      padding: 1rem;
      border-bottom: 1px solid #EEE3D1;
      vertical-align: middle;
      font-size: 0.875rem;
      color: #2D2926;
    }

    .cliente-table tr { transition: background 0.2s ease; }
    .cliente-table tr:hover { background: #F9F5F0; }

    .name-cell { min-width: 200px; }

    .cliente-nombre {
      font-weight: 600;
      color: #2D2926;
    }

    .doc-text {
      font-family: monospace;
      font-size: 0.8125rem;
      color: #6B7280;
    }

    .correo-text {
      font-size: 0.8125rem;
      color: #6B7280;
    }

    .estado-ACTIVO {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 2rem;
      font-size: 0.7rem;
      font-weight: 600;
      background: #E8F5E9;
      color: #2E7D32;
    }

    .estado-INACTIVO {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 2rem;
      font-size: 0.7rem;
      font-weight: 600;
      background: #FFEBEE;
      color: #C62828;
    }

    .action-buttons { display: flex; gap: 0.5rem; }

    .action-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.375rem;
      transition: all 0.2s ease;
      border-radius: 0.375rem;
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
    }

    .action-btn:hover { transform: scale(1.05); }
    .view-btn:hover   { background: #E3F2FD; }
    .edit-btn:hover   { background: #FFF8E1; }
    .toggle-btn:hover { background: #F3E5F5; }
    .delete-btn:hover { background: #FFEBEE; }

    .empty-table {
      text-align: center;
      padding: 3rem !important;
      color: #8E6F2E;
    }

    @media (max-width: 768px) {
      .cliente-table th, .cliente-table td { padding: 0.75rem; }
      .action-buttons { flex-direction: column; gap: 0.25rem; }
    }
  `
})
export class ClienteTableComponent {
  clientes = input.required<Cliente[]>();

  onNuevoCliente   = output<void>();
  onVerCliente     = output<number>();
  onEditarCliente  = output<number>();
  onToggleEstado   = output<number>();
  onEliminarCliente = output<number>();

  getEstadoClass(estado: EstadoActivo): string {
    return `estado-${estado}`;
  }
}
