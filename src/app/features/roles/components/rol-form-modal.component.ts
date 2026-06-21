import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { catchError, of } from 'rxjs';
import { UiModalComponent } from '../../../shared/ui/modal/ui-modal.component';
import { RolService } from '../services/rol.service';
import { PermisoService } from '../services/permiso.service';
import { EstadoActivo, PermisoResponse, RolResponse } from '../models/rol.model';

@Component({
  selector: 'app-rol-form-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="esEdicion() ? 'Editar rol' : 'Nuevo rol'"
      [size]="esEdicion() ? 'sm' : 'md'"
      (closed)="cerrar.emit()">

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Nombre *</label>
          <input type="text" [(ngModel)]="nombre" maxlength="80" placeholder="Ej. SUPERVISOR"
            class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] placeholder:text-[#2D2926]/35
                   focus:outline-none focus:border-[#C5A048]" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Descripción</label>
          <textarea [(ngModel)]="descripcion" rows="2" placeholder="Opcional"
            class="w-full px-3 py-2 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] placeholder:text-[#2D2926]/35 resize-none
                   focus:outline-none focus:border-[#C5A048]"></textarea>
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Estado *</label>
          <select [(ngModel)]="estado"
            class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                   text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>

        <!-- Permisos (solo al crear) -->
        @if (!esEdicion()) {
          <div>
            <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">
              Permisos iniciales
              <span class="text-[#2D2926]/45 font-normal">({{ seleccionados().size }} seleccionados)</span>
            </label>
            <div class="max-h-52 overflow-y-auto rounded-lg border border-[#EEE3D1] divide-y divide-[#EEE3D1]">
              @for (p of permisos(); track p.permisoId) {
                <label class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F9F5F0]">
                  <input type="checkbox" [checked]="seleccionados().has(p.permisoId)"
                    (change)="toggle(p.permisoId)" class="accent-[#C5A048]" />
                  <span class="text-sm text-[#2D2926]">{{ p.nombre }}</span>
                  <span class="text-[11px] text-[#2D2926]/40 font-mono ml-auto">{{ p.codigo }}</span>
                </label>
              }
            </div>
          </div>
        }
      </div>

      <ng-container modal-footer>
        <button type="button" (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">Cancelar</button>
        <button type="button" (click)="guardar()" [disabled]="!nombre().trim() || guardando()"
          class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ guardando() ? 'Guardando…' : 'Guardar' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class RolFormModalComponent {
  private readonly svc = inject(RolService);
  private readonly permisoSvc = inject(PermisoService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly rol = input<RolResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<RolResponse>();

  readonly nombre = signal('');
  readonly descripcion = signal('');
  readonly estado = signal<EstadoActivo>('ACTIVO');
  readonly permisos = signal<PermisoResponse[]>([]);
  readonly seleccionados = signal<Set<number>>(new Set());
  readonly guardando = signal(false);

  readonly esEdicion = computed(() => this.rol() != null);

  constructor() {
    this.permisoSvc
      .listarTodos()
      .pipe(catchError(() => of([] as PermisoResponse[])))
      .subscribe((p) => this.permisos.set(p));

    effect(() => {
      const r = this.rol();
      this.nombre.set(r?.nombre ?? '');
      this.descripcion.set(r?.descripcion ?? '');
      this.estado.set(r?.estado ?? 'ACTIVO');
      this.seleccionados.set(new Set());
    });
  }

  toggle(id: number): void {
    this.seleccionados.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  guardar(): void {
    if (!this.nombre().trim() || this.guardando()) return;
    this.guardando.set(true);
    const r = this.rol();

    const obs$ = r
      ? this.svc.actualizar(r.rolId, {
          nombre: this.nombre().trim(),
          descripcion: this.descripcion().trim() || undefined,
          estado: this.estado(),
          // No enviamos permisoIds en edición: los permisos se gestionan en el detalle
        })
      : this.svc.crear({
          nombre: this.nombre().trim(),
          descripcion: this.descripcion().trim() || undefined,
          estado: this.estado(),
          permisoIds: [...this.seleccionados()],
        });

    obs$.subscribe({
      next: (saved) => {
        this.guardando.set(false);
        this.toastr.success(r ? 'Rol actualizado.' : 'Rol creado.');
        this.guardado.emit(saved);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar el rol.', 'Error');
      },
    });
  }
}
