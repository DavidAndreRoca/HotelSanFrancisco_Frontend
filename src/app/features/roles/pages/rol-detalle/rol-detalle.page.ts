import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, forkJoin, of, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { RolService } from '../../services/rol.service';
import { PermisoService } from '../../services/permiso.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { PermisoResponse, RolResponse } from '../../models/rol.model';

@Component({
  selector: 'app-rol-detalle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-5 max-w-3xl">

      <button type="button" (click)="volver()"
        class="inline-flex items-center gap-1.5 text-sm text-[#2D2926]/60
               hover:text-[#C5A048] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Roles
      </button>

      @if (loading()) {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] h-96 animate-pulse"></div>
      } @else if (rol(); as r) {
        <!-- Cabecera del rol -->
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-6">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 class="text-xl font-bold text-[#2D2926]">{{ r.nombre }}</h1>
              <p class="text-sm text-[#2D2926]/55 mt-0.5">{{ r.descripcion ?? 'Sin descripción' }}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-[11px] font-semibold"
                  [class]="estadoBadge(r.estado)">{{ estadoLabel(r.estado) }}</span>
          </div>
          <p class="text-xs text-[#2D2926]/45 mt-3">
            {{ r.permisos.length }} permiso(s) asignado(s)
          </p>
        </div>

        <!-- Catálogo de permisos con checklist -->
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-6">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h2 class="text-base font-bold text-[#2D2926]">Permisos</h2>
            @if (!soloLectura()) {
              <span class="text-[11px] text-[#2D2926]/45">
                Marca o desmarca para asignar / quitar permisos
              </span>
            }
          </div>

          <input type="text" [value]="busqueda()" (input)="busqueda.set($any($event.target).value)"
            placeholder="Filtrar permisos por nombre o código…"
            class="w-full h-9 px-3 mb-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] placeholder:text-[#2D2926]/35 focus:outline-none focus:border-[#C5A048]" />

          <div class="rounded-lg border border-[#EEE3D1] divide-y divide-[#EEE3D1] max-h-[420px] overflow-y-auto">
            @for (p of permisosFiltrados(); track p.permisoId) {
              <label class="flex items-center gap-3 px-3 py-2.5"
                     [class.cursor-pointer]="!soloLectura()"
                     [class.hover:bg-[#F9F5F0]]="!soloLectura()">
                <input type="checkbox" [checked]="asignados().has(p.permisoId)"
                  [disabled]="soloLectura() || procesando().has(p.permisoId)"
                  (change)="toggle(p)" class="accent-[#C5A048]" />
                <span class="text-sm text-[#2D2926]">{{ p.nombre }}</span>
                <span class="text-[11px] text-[#2D2926]/40 font-mono ml-auto">{{ p.codigo }}</span>
              </label>
            }
            @if (permisosFiltrados().length === 0) {
              <p class="px-3 py-6 text-center text-sm text-[#2D2926]/45">Sin coincidencias.</p>
            }
          </div>
        </div>
      } @else {
        <div class="bg-white rounded-2xl border border-[#EEE3D1] p-12 text-center">
          <p class="text-[#2D2926]/45 text-sm">No se encontró el rol.</p>
        </div>
      }
    </div>
  `,
})
export class RolDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly svc = inject(RolService);
  private readonly permisoSvc = inject(PermisoService);
  private readonly store = inject(AuthStore);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(true);
  readonly rol = signal<RolResponse | null>(null);
  readonly catalogo = signal<PermisoResponse[]>([]);
  readonly asignados = signal<Set<number>>(new Set());
  readonly procesando = signal<Set<number>>(new Set());
  readonly busqueda = signal('');

  /** Solo ADMIN (rol:update) puede modificar; el resto ve en solo lectura. */
  readonly soloLectura = computed(() => !this.store.hasPermission('rol:update'));

  readonly permisosFiltrados = computed(() => {
    const t = this.busqueda().trim().toLowerCase();
    const all = this.catalogo();
    if (!t) return all;
    return all.filter(
      (p) => p.nombre.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t),
    );
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }
    forkJoin([
      this.svc.obtenerPorId(id).pipe(catchError(() => of(null))),
      this.permisoSvc.listarTodos().pipe(catchError(() => of([] as PermisoResponse[]))),
    ]).subscribe(([rol, catalogo]) => {
      this.rol.set(rol);
      this.catalogo.set(catalogo);
      this.asignados.set(new Set((rol?.permisos ?? []).map((p) => p.permisoId)));
      this.loading.set(false);
    });
  }

  toggle(p: PermisoResponse): void {
    const r = this.rol();
    if (!r || this.soloLectura() || this.procesando().has(p.permisoId)) return;

    const yaAsignado = this.asignados().has(p.permisoId);
    this.procesando.update((s) => new Set(s).add(p.permisoId));

    const obs$: Observable<unknown> = yaAsignado
      ? this.svc.removerPermiso(r.rolId, p.permisoId)
      : this.svc.asignarPermisos(r.rolId, { permisoIds: [p.permisoId] });

    obs$.subscribe({
      next: () => {
        this.asignados.update((set) => {
          const next = new Set(set);
          yaAsignado ? next.delete(p.permisoId) : next.add(p.permisoId);
          return next;
        });
        this.quitarProcesando(p.permisoId);
        this.toastr.success(yaAsignado ? 'Permiso removido.' : 'Permiso asignado.');
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.quitarProcesando(p.permisoId);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo actualizar el permiso.', 'Error');
      },
    });
  }

  private quitarProcesando(id: number): void {
    this.procesando.update((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }

  volver(): void { this.location.back(); }

  estadoLabel(e: string): string { return e === 'ACTIVO' ? 'Activo' : 'Inactivo'; }
  estadoBadge(e: string): string {
    return e === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600';
  }
}
