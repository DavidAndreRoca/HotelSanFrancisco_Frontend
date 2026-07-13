import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiDatePickerComponent } from '../../../shared/ui/date-picker/ui-date-picker.component';
import { RoomTypesService } from '../../rooms/services/room-types.service';
import { RoomType } from '../../rooms/models/room-type.model';

import { mediaTipoHabitacion } from '../../../shared/constants/tipo-habitacion-media';

interface Service {
  image: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, UiButtonComponent, UiDatePickerComponent],
  templateUrl: './home.page.html',
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly roomTypesSvc = inject(RoomTypesService);

  readonly searchForm = this.fb.nonNullable.group({
    checkIn: ['', Validators.required],
    checkOut: ['', Validators.required],
    guests: ['2', Validators.required],
  });

  private readonly checkInValue = toSignal(this.searchForm.controls.checkIn.valueChanges, {
    initialValue: this.searchForm.controls.checkIn.value,
  });
  readonly minCheckOut = computed(() => this.checkInValue() || '');

  readonly roomTypes = this.roomTypesSvc.items;
  readonly loadingRooms = this.roomTypesSvc.loading;

  readonly currentYear = new Date().getFullYear();

  readonly services = signal<Service[]>([
    {
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
      title: 'Wi-Fi gratis',
      description: 'Conexión de alta velocidad en todo el hotel',
    },
    {
      image: 'https://images.unsplash.com/photo-1598908314732-07113901949e?auto=format&fit=crop&w=600&q=80',
      title: 'Room Service',
      description: 'Atención 24/7 directo a tu habitación',
    },
    {
      image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80',
      title: 'Estacionamiento',
      description: 'Privado, seguro y vigilado',
    },
    {
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      title: 'Recepción 24h',
      description: 'Equipo bilingüe a tu disposición',
    },
  ]);

  ngOnInit(): void {
    this.roomTypesSvc.load({ size: 6, sort: 'precioBase,asc' });
  }

  roomImage(room: RoomType): string {
    return mediaTipoHabitacion(room.nombre).imagen;
  }

  roomFeatures(room: RoomType): string[] {
    const features: string[] = [`Capacidad: ${room.capacidadMaxima} persona${room.capacidadMaxima > 1 ? 's' : ''}`];
    if (room.descripcion) {
      const parts = room.descripcion.split(',').map(s => s.trim()).filter(Boolean);
      features.push(...parts.slice(0, 2));
    } else {
      features.push(...mediaTipoHabitacion(room.nombre).info.slice(0, 2));
    }
    return features;
  }

  onSearch(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      this.toastr.warning('Completa fechas y cantidad de huéspedes.');
      return;
    }
    this.router.navigate(['/booking'], { queryParams: this.searchForm.getRawValue() });
  }

  onReserve(_room: RoomType): void {
    this.router.navigate(['/booking']);
  }

  scrollTo(id: string, event: Event): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
