import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { BookingApiService, BookingStateService } from '../../../services/booking.service';
import { HabitacionDisponible } from '../../../models/booking.model';

@Component({
  selector: 'app-step1-seleccionar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="space-y-6">
      <!-- Filtro de fechas / huéspedes -->
      <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-6 shadow-[var(--shadow-card)]">
        <h2 class="text-lg font-bold text-[#2D2926] mb-4">Buscar disponibilidad</h2>
        <form [formGroup]="filterForm" (ngSubmit)="buscar()" class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1">
              Fecha de entrada
            </label>
            <input type="date" formControlName="checkIn"
              class="w-full h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048]" />
          </div>
          <div>
            <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1">
              Fecha de salida
            </label>
            <input type="date" formControlName="checkOut"
              class="w-full h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048]" />
          </div>
          <div>
            <label class="block text-[13px] font-medium text-[var(--color-ink-soft)] mb-1">
              Huéspedes
            </label>
            <select formControlName="guests"
              class="w-full h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A048]">
              @for (n of [1,2,3,4]; track n) {
                <option [value]="n">{{ n }} persona{{ n > 1 ? 's' : '' }}</option>
              }
            </select>
          </div>
          <div class="flex items-end">
            <button type="submit"
              [disabled]="buscando()"
              class="w-full h-10 bg-[#C5A048] hover:bg-[#b8923e] disabled:opacity-60 text-white font-semibold rounded-lg text-[14px] transition-colors">
              {{ buscando() ? 'Buscando...' : 'Buscar' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Grid de habitaciones -->
      @if (buscando()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5 animate-pulse h-48"></div>
          }
        </div>
      } @else if (disponibles().length > 0) {
        <div>
          <p class="text-[13px] text-[var(--color-ink-muted)] mb-4">
            {{ disponibles().length }} habitacion{{ disponibles().length > 1 ? 'es' : '' }} disponible{{ disponibles().length > 1 ? 's' : '' }}
            para las fechas seleccionadas.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (hab of disponibles(); track hab.habitacionId) {
              <div
                (click)="seleccionar(hab)"
                (keydown.enter)="seleccionar(hab)"
                tabindex="0"
                role="button"
                class="bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md"
                [class]="habSeleccionada()?.habitacionId === hab.habitacionId
                  ? 'border-[#C5A048] shadow-md'
                  : 'border-[var(--color-border-soft)] hover:border-[#C5A048]'">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <p class="font-semibold text-[#2D2926] text-[15px]">{{ hab.tipoHabitacionNombre }}</p>
                    <p class="text-[12px] text-[var(--color-ink-muted)]">Hab. {{ hab.numero }} — Piso {{ hab.piso }}</p>
                  </div>
                  @if (habSeleccionada()?.habitacionId === hab.habitacionId) {
                    <div class="w-5 h-5 rounded-full bg-[#C5A048] flex items-center justify-center flex-shrink-0">
                      <svg class="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                  }
                </div>
                @if (hab.descripcion) {
                  <p class="text-[12px] text-[var(--color-ink-muted)] mb-3 line-clamp-2">{{ hab.descripcion }}</p>
                }
                <div class="flex items-center justify-between text-[12px] text-[var(--color-ink-muted)] mb-4">
                  <span>Capacidad: {{ hab.capacidadMaxima }} pers.</span>
                </div>
                <div class="border-t border-[var(--color-border-soft)] pt-3 flex items-baseline justify-between">
                  <span class="text-xl font-bold text-[#C5A048]">S/ {{ hab.precioBase | number:'1.2-2' }}</span>
                  <span class="text-[11px] text-[var(--color-ink-muted)]">por noche</span>
                </div>
                @if (noches() > 0) {
                  <p class="text-[12px] text-[var(--color-ink-muted)] mt-1">
                    Total {{ noches() }} noche{{ noches() > 1 ? 's' : '' }}:
                    <strong class="text-[#2D2926]">
                      S/ {{ (hab.precioBase * noches() * 1.18) | number:'1.2-2' }}
                    </strong>
                    <span class="text-[10px]"> (inc. IGV)</span>
                  </p>
                }
              </div>
            }
          </div>
        </div>
      } @else if (buscado()) {
        <div class="bg-white rounded-2xl border border-[var(--color-border-soft)] p-10 text-center">
          <p class="text-[var(--color-ink-muted)] text-sm">No hay habitaciones disponibles para las fechas indicadas.</p>
          <p class="text-[12px] text-[var(--color-ink-muted)] mt-1">Intente con otras fechas o cantidad de huéspedes.</p>
        </div>
      }

      <!-- Botón continuar -->
      @if (habSeleccionada()) {
        <div class="flex justify-end">
          <button
            (click)="continuar()"
            class="px-8 h-11 bg-[#C5A048] hover:bg-[#b8923e] text-white font-semibold rounded-lg text-[14px] transition-colors">
            Continuar
          </button>
        </div>
      }
    </div>
  `,
})
export class Step1SeleccionarComponent implements OnInit {
  @Output() next = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly bookingApi = inject(BookingApiService);
  private readonly state = inject(BookingStateService);
  private readonly toastr = inject(ToastrService);

  readonly disponibles = signal<HabitacionDisponible[]>([]);
  readonly buscando = signal(false);
  readonly buscado = signal(false);
  readonly habSeleccionada = this.state.habitacionSeleccionada;
  readonly noches = this.state.noches;

  readonly filterForm = this.fb.nonNullable.group({
    checkIn: ['', Validators.required],
    checkOut: ['', Validators.required],
    guests: [2, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    const params = this.state.searchParams();
    if (params) {
      this.filterForm.patchValue({
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: params.guests,
      });
      this.buscar();
    }
  }

  buscar(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      this.toastr.warning('Completa las fechas y la cantidad de huéspedes.');
      return;
    }
    const { checkIn, checkOut, guests } = this.filterForm.getRawValue();
    if (new Date(checkOut) <= new Date(checkIn)) {
      this.toastr.warning('La fecha de salida debe ser posterior a la de entrada.');
      return;
    }
    this.state.setSearch({ checkIn, checkOut, guests });
    this.buscando.set(true);
    this.buscado.set(false);
    this.disponibles.set([]);
    this.bookingApi.findDisponibles(checkIn, checkOut, guests).subscribe({
      next: (res) => {
        this.disponibles.set(res);
        this.buscando.set(false);
        this.buscado.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.buscando.set(false);
        this.toastr.error(err.error?.message ?? 'Error al buscar habitaciones.');
      },
    });
  }

  seleccionar(hab: HabitacionDisponible): void {
    this.state.selectHabitacion(hab);
  }

  continuar(): void {
    if (!this.state.habitacionSeleccionada()) return;
    this.next.emit();
  }
}
