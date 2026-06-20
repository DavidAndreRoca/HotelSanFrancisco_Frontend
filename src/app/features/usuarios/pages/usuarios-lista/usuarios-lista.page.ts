import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { catchError, of } from 'rxjs';
import { UsuarioService } from '../../services/usuario.service';
import { RolService } from '../../../roles/services/rol.service';
import { RolResponse } from '../../../roles/models/rol.model';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { PageResponse } from '../../../../core/api/api-response.interface';
import {
  EstadoUsuario,
  UsuarioFilterRequest,
  UsuarioResponse,
} from '../../models/usuario.model';
import { ESTADOS_USUARIO, ESTADO_USUARIO_BADGE, ESTADO_USUARIO_LABEL } from '../../utils/usuario-ui';
import { UsuarioFormModalComponent } from '../../components/usuario-form-modal.component';
import { CambiarEstadoUsuarioModalComponent } from '../../components/cambiar-estado-usuario-modal.component';
import { CambiarRolModalComponent } from '../../components/cambiar-rol-modal.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-usuarios-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UsuarioFormModalComponent,
    CambiarEstadoUsuarioModalComponent,
    CambiarRolModalComponent,
  ],
  template: `
    <div class="space-y-6">

      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-[#2D2926]">Usuarios</h1>
          <p class="text-sm text-[#2D2926]/55 mt-0.5">Cuentas del sistema (staff y clientes)</p>
        </div>
        @if (puedeCrear()) {
          <button type="button" (click)="abrirNuevo()"
            class="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C5A048] text-white
                   text-sm font-medium hover:bg-[#8E6F2E] transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo usuario
          </button>
        }
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-[#EEE3D1] p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input type="text" [value]="fNombre()" (change)="onFiltro('nombre', $any($event.target).value)"
            placeholder="Nombre…"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   placeholder:text-[#2D2926]/35 focus:outline-none focus:border-[#C5A048]" />
          <input type="text" [value]="fCorreo()" (change)="onFiltro('correo', $any($event.target).value)"
            placeholder="Correo…"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   placeholder:text-[#2D2926]/35 focus:outline-none focus:border-[#C5A048]" />
          <select [value]="fEstado()" (change)="onFiltro('estado', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   focus:outline-none focus:border-[#C5A048]">
            <option value="">Estado: todos</option>
            @for (e of estadosOpts; track e) { <option [value]="e">{{ estadoLabel(e) }}</option> }
          </select>
          <select [value]="fRolId()" (change)="onFiltro('rol', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   focus:outline-none focus:border-[#C5A048]">
            <option value="">Rol: todos</option>
            @for (r of roles(); track r.rolId) { <option [value]="r.rolId">{{ r.nombre }}</option> }
          </select>
          <select [value]="fEsEmpleado()" (change)="onFiltro('esEmpleado', $any($event.target).value)"
            class="h-9 px-2.5 rounded-lg border border-[#EEE3D1] bg-white text-sm text-[#2D2926]
                   focus:outline-none focus:border-[#C5A048]">
            <option value="">Todos</option>
            <option value="true">Solo staff</option>
            <option value="false">Solo clientes</option>
          </select>
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
            <p class="text-sm font-semibold text-[#2D2926]">Sin usuarios</p>
            <p class="text-xs text-[#2D2926]/45 mt-1">No hay usuarios con los filtros aplicados.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[920px] text-sm">
              <thead>
                <tr class="border-b border-[#EEE3D1] text-left text-[11px] uppercase
                           tracking-wide text-[#2D2926]/50">
                  <th class="px-4 py-3 font-semibold">Nombre</th>
                  <th class="px-4 py-3 font-semibold">Correo</th>
                  <th class="px-4 py-3 font-semibold">Documento</th>
                  <th class="px-4 py-3 font-semibold">Rol</th>
                  <th class="px-4 py-3 font-semibold">Estado</th>
                  <th class="px-4 py-3 font-semibold text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (u of filas(); track u.usuarioId) {
                  <tr class="border-b border-[#EEE3D1] last:border-0 hover:bg-[#F9F5F0] transition-colors">
                    <td class="px-4 py-3 whitespace-nowrap">
                      <span class="font-medium text-[#2D2926]">{{ u.nombreCompleto }}</span>
                      @if (u.cargo) {
                        <span class="block text-[11px] text-[#2D2926]/45">{{ u.cargo }}</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">{{ u.correo }}</td>
                    <td class="px-4 py-3 text-[#2D2926]/70 whitespace-nowrap">
                      {{ u.tipoDocumentoAcronimo }} {{ u.numeroDocumento }}
                    </td>
                    <td class="px-4 py-3 text-[#2D2926]/70">{{ u.rolNombre }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            [class]="estadoBadge(u.estado)">{{ estadoLabel(u.estado) }}</span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      <div class="flex items-center justify-end gap-2">
                        @if (puedeEditar()) {
                          <button type="button" (click)="abrirEditar(u)"
                            class="h-7 px-2.5 rounded-lg border border-[#C5A048] text-[#C5A048]
                                   text-xs font-medium hover:bg-[#C5A048]/5 transition-colors">
                            Editar
                          </button>
                        }
                        @if (puedeCambiarRol()) {
                          <button type="button" (click)="abrirRol(u)"
                            class="h-7 px-2.5 rounded-lg border border-[#EEE3D1] text-[#2D2926]/70
                                   text-xs font-medium hover:bg-[#F9F5F0] transition-colors">
                            Rol
                          </button>
                        }
                        @if (puedeCambiarEstado()) {
                          <button type="button" (click)="abrirEstado(u)"
                            class="h-7 px-2.5 rounded-lg border border-[#EEE3D1] text-[#2D2926]/70
                                   text-xs font-medium hover:bg-[#F9F5F0] transition-colors">
                            Estado
                          </button>
                        }
                        @if (puedeEliminar() && u.estado !== 'INACTIVO') {
                          <button type="button" (click)="eliminar(u)"
                            class="h-7 px-2.5 rounded-lg border border-red-200 text-red-600
                                   text-xs font-medium hover:bg-red-50 transition-colors">
                            Desactivar
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#EEE3D1]">
            <p class="text-xs text-[#2D2926]/50">
              {{ totalElements() }} usuario(s) · Página {{ pageIndex() + 1 }} de {{ totalPages() }}
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

      <!-- Modales -->
      <app-usuario-form-modal
        [open]="formAbierto()"
        [usuario]="usuarioSel()"
        (cerrar)="formAbierto.set(false)"
        (guardado)="onMutacion()" />
      <app-cambiar-estado-usuario-modal
        [open]="estadoAbierto()"
        [usuario]="usuarioSel()"
        (cerrar)="estadoAbierto.set(false)"
        (guardado)="onMutacion()" />
      <app-cambiar-rol-modal
        [open]="rolAbierto()"
        [usuario]="usuarioSel()"
        (cerrar)="rolAbierto.set(false)"
        (guardado)="onMutacion()" />

    </div>
  `,
})
export class UsuariosListaPage {
  private readonly svc = inject(UsuarioService);
  private readonly rolSvc = inject(RolService);
  private readonly store = inject(AuthStore);
  private readonly toastr = inject(ToastrService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly page = signal<PageResponse<UsuarioResponse> | null>(null);
  readonly pageIndex = signal(0);
  readonly roles = signal<RolResponse[]>([]);

  readonly fNombre = signal('');
  readonly fCorreo = signal('');
  readonly fEstado = signal<EstadoUsuario | ''>('');
  readonly fRolId = signal<string>('');
  readonly fEsEmpleado = signal<string>('');

  readonly formAbierto = signal(false);
  readonly estadoAbierto = signal(false);
  readonly rolAbierto = signal(false);
  readonly usuarioSel = signal<UsuarioResponse | null>(null);

  readonly estadosOpts = ESTADOS_USUARIO;

  readonly filas = computed(() => this.page()?.content ?? []);
  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages = computed(() => Math.max(1, this.page()?.totalPages ?? 1));
  readonly esUltima = computed(() => this.page()?.last ?? true);

  // Gating de acciones por permiso
  readonly puedeCrear = computed(() => this.store.hasPermission('usuario:create'));
  readonly puedeEditar = computed(() => this.store.hasPermission('usuario:update'));
  readonly puedeCambiarRol = computed(() => this.store.hasPermission('usuario:update'));
  readonly puedeCambiarEstado = computed(() => this.store.hasPermission('usuario:change-status'));
  readonly puedeEliminar = computed(() => this.store.hasPermission('usuario:delete'));

  constructor() {
    this.rolSvc
      .listarPorEstado('ACTIVO')
      .pipe(catchError(() => of([] as RolResponse[])))
      .subscribe((r) => this.roles.set(r));
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    const filtros: UsuarioFilterRequest = {
      nombre: this.fNombre().trim() || undefined,
      correo: this.fCorreo().trim() || undefined,
      estado: this.fEstado() || undefined,
      rolId: this.fRolId() ? Number(this.fRolId()) : undefined,
      esEmpleado: this.fEsEmpleado() === '' ? undefined : this.fEsEmpleado() === 'true',
      page: this.pageIndex(),
      size: PAGE_SIZE,
      sort: 'apellidoPaterno,asc',
    };
    this.svc.listar(filtros).subscribe({
      next: (p) => { this.page.set(p); this.loading.set(false); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.loading.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudieron cargar los usuarios.', 'Error');
      },
    });
  }

  onFiltro(campo: 'nombre' | 'correo' | 'estado' | 'rol' | 'esEmpleado', valor: string): void {
    switch (campo) {
      case 'nombre':     this.fNombre.set(valor); break;
      case 'correo':     this.fCorreo.set(valor); break;
      case 'estado':     this.fEstado.set(valor as EstadoUsuario | ''); break;
      case 'rol':        this.fRolId.set(valor); break;
      case 'esEmpleado': this.fEsEmpleado.set(valor); break;
    }
    this.pageIndex.set(0);
    this.cargar();
  }

  paginaAnterior(): void {
    if (this.pageIndex() === 0) return;
    this.pageIndex.update((p) => p - 1);
    this.cargar();
  }

  paginaSiguiente(): void {
    if (this.esUltima()) return;
    this.pageIndex.update((p) => p + 1);
    this.cargar();
  }

  abrirNuevo(): void { this.usuarioSel.set(null); this.formAbierto.set(true); }
  abrirEditar(u: UsuarioResponse): void { this.usuarioSel.set(u); this.formAbierto.set(true); }
  abrirEstado(u: UsuarioResponse): void { this.usuarioSel.set(u); this.estadoAbierto.set(true); }
  abrirRol(u: UsuarioResponse): void { this.usuarioSel.set(u); this.rolAbierto.set(true); }

  onMutacion(): void {
    this.formAbierto.set(false);
    this.estadoAbierto.set(false);
    this.rolAbierto.set(false);
    this.cargar();
  }

  async eliminar(u: UsuarioResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Desactivar usuario',
      message: `¿Desactivar a ${u.nombreCompleto}? Pasará a estado Inactivo y se cerrarán sus sesiones.`,
      confirmText: 'Sí, desactivar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminar(u.usuarioId).subscribe({
      next: () => { this.toastr.success('Usuario desactivado.'); this.cargar(); },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo desactivar.', 'Error');
      },
    });
  }

  estadoLabel(e: EstadoUsuario): string { return ESTADO_USUARIO_LABEL[e]; }
  estadoBadge(e: EstadoUsuario): string { return ESTADO_USUARIO_BADGE[e]; }
}
