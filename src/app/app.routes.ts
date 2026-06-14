import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  {
    path: '',
    loadComponent: () =>
      import('./core/layouts/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/pages/home.page').then((m) => m.HomeComponent),
        title: 'Hotel San Francisco',
      },
      {
        path: 'login',
        canActivate: [publicOnlyGuard],
        loadComponent: () =>
          import('./features/auth/pages/login.page').then((m) => m.LoginPage),
        title: 'Iniciar sesión · Hotel San Francisco',
      },
      {
        path: 'register',
        canActivate: [publicOnlyGuard],
        loadComponent: () =>
          import('./features/auth/pages/register.page').then((m) => m.RegisterComponent),
        title: 'Registro · Hotel San Francisco',
      },
    ],
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layouts/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard.page').then((m) => m.DashboardPage),
        title: 'Dashboard',
      },
      {
        path: 'rooms',
        loadComponent: () =>
          import('./features/rooms/pages/room-list.page').then((m) => m.RoomsListPage),
        title: 'Habitaciones',
      },
      {
        path: 'rooms/:id',
        loadComponent: () =>
          import('./features/rooms/pages/room-detail.page').then((m) => m.RoomDetailPage),
        title: 'Detalle de habitación',
      },
      {
        path: 'reservations',
        loadComponent: () =>
          import('./features/reservations/pages/reservation-dashboard/reservation-dashboard.component').then(
            (m) => m.ReservationsDashboardComponent,
          ),
        title: 'Reservas',
      },
      {
        path: 'guests',
        loadComponent: () =>
          import('./features/guests/pages/guests-dashboard/guests-dashboard.component').then(
            (m) => m.GuestsDashboardComponent,
          ),
        title: 'Huéspedes',
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./features/employees/pages/employees-dashboard/employees-dashboard.component').then(
            (m) => m.EmployeesDashboardComponent,
          ),
        title: 'Empleados',
      },

      // ── Habitaciones (operaciones) ─────────────────────────────────────────
      {
        path: 'habitaciones',
        loadComponent: () =>
          import('./features/habitaciones/pages/habitacion-dashboard/habitacion-dashboard.component').then(
            (m) => m.HabitacionDashboardComponent,
          ),
        title: 'Panel de habitaciones',
      },
      {
        path: 'habitaciones/checkin',
        loadComponent: () =>
          import('./features/habitaciones/pages/checkin/checkin.page').then(
            (m) => m.CheckInPage,
          ),
        title: 'Check-in',
      },
      {
        path: 'habitaciones/checkout',
        loadComponent: () =>
          import('./features/habitaciones/pages/checkout/checkout.page').then(
            (m) => m.CheckOutPage,
          ),
        title: 'Check-out',
      },
      {
        path: 'habitaciones/limpieza',
        loadComponent: () =>
          import('./features/habitaciones/pages/limpieza/limpieza.page').then(
            (m) => m.LimpiezaPage,
          ),
        title: 'Cola de limpieza',
      },
      {
        path: 'habitaciones/mantenimiento',
        loadComponent: () =>
          import('./features/habitaciones/pages/mantenimiento/mantenimiento.page').then(
            (m) => m.MantenimientoPage,
          ),
        title: 'Mantenimiento e Incidencias',
      },
    ],
  },

  { path: '**', redirectTo: 'home' },
];
