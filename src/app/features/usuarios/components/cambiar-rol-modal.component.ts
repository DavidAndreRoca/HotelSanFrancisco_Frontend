import {
  ChangeDetectionStrategy,
  Component,
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
import { RolService } from '../../../features/roles/services/rol.service';
import { RolResponse } from '../../../features/roles/models/rol.model';
import { UsuarioService } from '../services/usuario.service';
import { UsuarioResponse } from '../models/usuario.model';

@Component({
  selector: 'app-cambiar-rol-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Cambiar rol'"
      [subtitle]="usuario()?.nombreCompleto ?? ''"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      <div>
        <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Nuevo rol</label>
        <select [(ngModel)]="rolId"
          class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                 text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
          @for (r of roles(); track r.rolId) {
            <option [ngValue]="r.rolId">{{ r.nombre }}</option>
          }
        </select>
        <p class="text-[11px] text-[#2D2926]/45 mt-1">
          Al cambiar el rol se cierran las sesiones activas del usuario; el nuevo rol aplica
          en su próximo inicio de sesión.
        </p>
      </div>

      <ng-container modal-footer>
        <button type="button" (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">Cancelar</button>
        <button type="button" (click)="guardar()" [disabled]="rolId() == null || guardando()"
          class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ guardando() ? 'Guardando…' : 'Confirmar' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class CambiarRolModalComponent {
  private readonly svc = inject(UsuarioService);
  private readonly rolSvc = inject(RolService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly usuario = input<UsuarioResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<UsuarioResponse>();

  readonly roles = signal<RolResponse[]>([]);
  readonly rolId = signal<number | null>(null);
  readonly guardando = signal(false);

  constructor() {
    this.rolSvc
      .listarPorEstado('ACTIVO')
      .pipe(catchError(() => of([] as RolResponse[])))
      .subscribe((r) => this.roles.set(r));

    effect(() => {
      const u = this.usuario();
      this.rolId.set(u?.rolId ?? null);
    });
  }

  guardar(): void {
    const u = this.usuario();
    const rolId = this.rolId();
    if (!u || rolId == null || this.guardando()) return;
    this.guardando.set(true);
    this.svc.cambiarRol(u.usuarioId, { rolId }).subscribe({
      next: (saved) => {
        this.guardando.set(false);
        this.toastr.success('Rol actualizado.');
        this.guardado.emit(saved);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo cambiar el rol.', 'Error');
      },
    });
  }
}
