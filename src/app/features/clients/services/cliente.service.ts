import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiClient } from '../../../core/http/http-client.service';
import { PageResponse } from '../../../core/api/api-response.interface';
import {
  Cliente, ClienteStats, EstadoActivo,
  CreateClientePayload, UpdateClientePayload,
} from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly api = inject(ApiClient);

  private readonly _clientes     = signal<Cliente[]>([]);
  private readonly _searchTerm   = signal<string>('');
  private readonly _estadoFilter = signal<EstadoActivo | 'all'>('all');
  private readonly _loading      = signal(false);

  readonly clientes = this._clientes.asReadonly();
  readonly loading  = this._loading.asReadonly();

  readonly activosCount   = computed(() => this._clientes().filter(c => c.estado === 'ACTIVO').length);
  readonly inactivosCount = computed(() => this._clientes().filter(c => c.estado === 'INACTIVO').length);

  readonly filteredClientes = computed(() => {
    const term   = this._searchTerm().toLowerCase();
    const estado = this._estadoFilter();
    let list = this._clientes();

    if (term) {
      list = list.filter(c =>
        c.nombreCompleto.toLowerCase().includes(term) ||
        c.numeroDocumento.includes(term) ||
        (c.correo ?? '').toLowerCase().includes(term) ||
        (c.telefono ?? '').includes(term)
      );
    }

    if (estado !== 'all') {
      list = list.filter(c => c.estado === estado);
    }

    return list;
  });

  readonly stats = computed<ClienteStats>(() => {
    const list = this._clientes();
    return {
      total:     list.length,
      activos:   list.filter(c => c.estado === 'ACTIVO').length,
      inactivos: list.filter(c => c.estado === 'INACTIVO').length,
    };
  });

  constructor() {
    this.cargarTodos();
  }

  cargarTodos(): void {
    this._loading.set(true);
    this.api.get<PageResponse<Cliente>>('/api/v1/clientes', {
      params: { size: 500, sort: 'apellidoPaterno,asc' },
    }).subscribe({
      next: (page) => { this._clientes.set(page.content); this._loading.set(false); },
      error: ()     => { this._loading.set(false); },
    });
  }

  // ── Filtros ──────────────────────────────────────────────────────────────────
  setSearchTerm(term: string): void                { this._searchTerm.set(term); }
  setEstadoFilter(e: EstadoActivo | 'all'): void   { this._estadoFilter.set(e); }

  // ── Consultas (síncronas desde signal) ───────────────────────────────────────
  findById(id: number): Cliente | undefined        { return this._clientes().find(c => c.huespedId === id); }
  findByDocumento(doc: string): Cliente | undefined { return this._clientes().find(c => c.numeroDocumento === doc); }

  // ── Mutaciones (retornan Observable) ─────────────────────────────────────────
  create(payload: CreateClientePayload): Observable<Cliente> {
    return this.api.post<Cliente>('/api/v1/clientes', payload).pipe(
      tap(nuevo => this._clientes.update(list => [nuevo, ...list]))
    );
  }

  update(id: number, payload: UpdateClientePayload): Observable<Cliente> {
    return this.api.put<Cliente>(`/api/v1/clientes/${id}`, payload).pipe(
      tap(updated => this._clientes.update(list => list.map(c => c.huespedId === id ? updated : c)))
    );
  }

  cambiarEstado(id: number, estado: EstadoActivo): Observable<Cliente> {
    return this.api.patch<Cliente, null>(`/api/v1/clientes/${id}/estado`, null, {
      params: { estado },
    }).pipe(
      tap(updated => this._clientes.update(list => list.map(c => c.huespedId === id ? updated : c)))
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/api/v1/clientes/${id}`).pipe(
      tap(() => this._clientes.update(list => list.filter(c => c.huespedId !== id)))
    );
  }
}
