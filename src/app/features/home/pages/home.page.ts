import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';

interface Room {
  name: string;
  price: number;
  description: string;
  image: string;
  features: readonly string[];
}

interface Service {
  image: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, UiButtonComponent],
  templateUrl: './home.page.html',
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  readonly searchForm = this.fb.nonNullable.group({
    checkIn: ['', Validators.required],
    checkOut: ['', Validators.required],
    guests: ['2', Validators.required],
  });

  readonly rooms = signal<Room[]>([
    {
      name: 'Habitación Simple',
      price: 60,
      description: 'Ideal para viajeros individuales',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
      features: ['1 cama individual', 'Baño privado', 'Wi-Fi gratis'],
    },
    {
      name: 'Habitación Matrimonial',
      price: 80,
      description: 'Confort para dos personas',
      image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
      features: ['1 cama queen', 'Baño privado', 'TV smart'],
    },
    {
      name: 'Habitación Doble',
      price: 100,
      description: 'Espacio amplio y luminoso',
      image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
      features: ['2 camas', 'Baño privado', 'Vista a la ciudad'],
    },
  ]);

  readonly currentYear = new Date().getFullYear();

  readonly services = signal<Service[]>([
    { image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80', title: 'Wi-Fi gratis', description: 'Conexión de alta velocidad en todo el hotel' },
    { image: 'https://images.unsplash.com/photo-1598908314732-07113901949e?auto=format&fit=crop&w=600&q=80', title: 'Room Service', description: 'Atención 24/7 directo a tu habitación' },
    { image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80', title: 'Estacionamiento', description: 'Privado, seguro y vigilado' },
    { image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80', title: 'Recepción 24h', description: 'Equipo bilingüe a tu disposición' },
  ]);

  onSearch(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      this.toastr.warning('Completa fechas y cantidad de huéspedes.');
      return;
    }
    this.router.navigate(['/rooms'], { queryParams: this.searchForm.getRawValue() });
  }

  onReserve(room: Room): void {
    this.router.navigate(['/reservations/new'], { queryParams: { habitacion: room.name } });
  }

  scrollTo(id: string, event: Event): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
