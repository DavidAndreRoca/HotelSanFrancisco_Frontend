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
import { UiModalComponent } from '../../../shared/ui/modal/ui-modal.component';
import { UsuarioService } from '../services/usuario.service';
import { EstadoUsuario, UsuarioResponse } from '../models/usuario.model';
import { ESTADOS_USUARIO, ESTADO_USUARIO_LABEL } from '../utils/usuario-ui';

@Component({
  selector: 'app-cambiar-estado-usuario-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, FormsModule],
  template: `
    <ui-modal
      [open]="open()"
      [title]="'Cambiar estado'"
      [subtitle]="usuario()?.nombreCompleto ?? ''"
      [size]="'sm'"
      (closed)="cerrar.emit()">

      <div>
        <label class="block text-sm font-semibold text-[#2D2926] mb-1.5">Nuevo estado</label>
        <select [(ngModel)]="nuevoEstado"
          class="w-full h-10 px-3 rounded-lg border border-[#EEE3D1] bg-white text-sm
                 text-[#2D2926] focus:outline-none focus:border-[#C5A048]">
          @for (e of estados; track e) {
            <option [value]="e">{{ estadoLabel(e) }}</option>
          }
        </select>
      </div>

      <ng-container modal-footer>
        <button type="button" (click)="cerrar.emit()"
          class="h-9 px-4 rounded-lg text-sm font-medium text-[#2D2926]/70
                 hover:bg-[#F9F5F0] transition-colors">Cancelar</button>
        <button type="button" (click)="guardar()" [disabled]="guardando()"
          class="h-9 px-4 rounded-lg bg-[#C5A048] text-white text-sm font-medium
                 hover:bg-[#8E6F2E] transition-colors disabled:opacity-40
                 disabled:cursor-not-allowed">
          {{ guardando() ? 'Guardando…' : 'Confirmar' }}
        </button>
      </ng-container>
    </ui-modal>
  `,
})
export class CambiarEstadoUsuarioModalComponent {
  private readonly svc = inject(UsuarioService);
  private readonly toastr = inject(ToastrService);

  readonly open = input.required<boolean>();
  readonly usuario = input<UsuarioResponse | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<UsuarioResponse>();

  readonly estados = ESTADOS_USUARIO;
  readonly nuevoEstado = signal<EstadoUsuario>('ACTIVO');
  readonly guardando = signal(false);

  constructor() {
    effect(() => {
      const u = this.usuario();
      if (u) this.nuevoEstado.set(u.estado);
    });
  }

  estadoLabel(e: EstadoUsuario): string { return ESTADO_USUARIO_LABEL[e]; }

  guardar(): void {
    const u = this.usuario();
    if (!u || this.guardando()) return;
    this.guardando.set(true);
    this.svc.cambiarEstado(u.usuarioId, { nuevoEstado: this.nuevoEstado() }).subscribe({
      next: (saved) => {
        this.guardando.set(false);
        this.toastr.success('Estado actualizado.');
        this.guardado.emit(saved);
      },
      error: (err: HttpErrorResponse & { friendlyMessage?: string }) => {
        this.guardando.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo cambiar el estado.', 'Error');
      },
    });
  }
}
