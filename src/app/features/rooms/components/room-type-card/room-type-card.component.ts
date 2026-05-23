import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { UiBadgeComponent } from '../../../../shared/ui/badge/ui-badge.component';
import { RoomType } from '../../models/room-type.model';

@Component({
  selector: 'app-room-type-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, UiBadgeComponent],
  template: `
    <article
      class="group flex flex-col h-full bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-[var(--shadow-card)] overflow-hidden hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] transition-all duration-200">
      <div class="relative">
        <div
          class="h-32 bg-gradient-to-br from-[var(--color-primary-500)]/15 via-[var(--color-primary-300)]/10 to-[var(--color-secondary-500)]/15 flex items-center justify-center text-[var(--color-primary-700)]"
          aria-hidden="true">
          <svg class="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 9.5 12 4l9 5.5V20a1 1 0 0 1-1 1h-4v-7h-8v7H4a1 1 0 0 1-1-1V9.5Z"/>
          </svg>
        </div>
        <div class="absolute top-3 right-3">
          <ui-badge [tone]="room().estado === 'ACTIVO' ? 'success' : 'neutral'">
            {{ room().estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
          </ui-badge>
        </div>
      </div>

      <div class="flex flex-col flex-1 p-5">
        <header class="flex items-start justify-between gap-3 mb-2">
          <h3 class="text-lg font-semibold tracking-tight leading-tight">
            {{ room().nombre }}
          </h3>
          <p class="text-right shrink-0">
            <span class="text-lg font-bold text-[var(--color-primary-700)]">
              {{ room().precioBase | currency:'PEN':'symbol-narrow':'1.2-2' }}
            </span>
            <span class="block text-[11px] text-[var(--color-ink-muted)]">por noche</span>
          </p>
        </header>

        <p class="text-[13px] text-[var(--color-ink-muted)] line-clamp-3 min-h-[3.5rem]">
          {{ room().descripcion || 'Sin descripción.' }}
        </p>

        <div class="mt-4 flex items-center gap-4 text-[12px] text-[var(--color-ink-soft)]">
          <span class="inline-flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/>
              <circle cx="10" cy="7" r="4"/>
              <path stroke-linecap="round" d="M21 21v-2a4 4 0 0 0-3-3.87M17 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Hasta {{ room().capacidadMaxima }} {{ room().capacidadMaxima === 1 ? 'huésped' : 'huéspedes' }}
          </span>
        </div>

        <div class="mt-5 flex items-center gap-2 pt-4 border-t border-[var(--color-border-soft)]">
          <button
            type="button"
            class="text-[13px] font-medium text-[var(--color-primary-700)] hover:text-[var(--color-primary-600)] hover:underline"
            (click)="view.emit(room())"
            [attr.aria-label]="'Ver detalle de ' + room().nombre">
            Ver detalle
          </button>
          <span class="flex-1"></span>
          <button
            type="button"
            class="p-2 rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary-700)] transition"
            (click)="edit.emit(room())"
            [attr.aria-label]="'Editar ' + room().nombre">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"/>
            </svg>
          </button>
          <button
            type="button"
            class="p-2 rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-danger-500)]/10 hover:text-[var(--color-danger-500)] transition"
            (click)="remove.emit(room())"
            [attr.aria-label]="'Eliminar ' + room().nombre">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            </svg>
          </button>
          <button
            type="button"
            class="ml-1 inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] rounded-lg border border-[var(--color-border-soft)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-700)] transition"
            (click)="toggleEstado.emit(room())">
            {{ room().estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
          </button>
        </div>
      </div>
    </article>
  `,
})
export class RoomTypeCardComponent {
  readonly room = input.required<RoomType>();
  readonly view = output<RoomType>();
  readonly edit = output<RoomType>();
  readonly remove = output<RoomType>();
  readonly toggleEstado = output<RoomType>();
}
