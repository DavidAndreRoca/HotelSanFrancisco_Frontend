import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/guards/auth.guard';
import { solicitudGestionGuard } from './features/solicitudes/guards/solicitud-gestion.guard';
import { auditoriaGuard } from './features/auditoria/guards/auditoria.guard';

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
      {
        path: 'recuperar-contrasena',
        canActivate: [publicOnlyGuard],
        loadComponent: () =>
          import('./features/auth/pages/forgot-password.page').then((m) => m.ForgotPasswordPage),
        title: 'Recuperar contraseña · Hotel San Francisco',
      },
      {
        path: 'reset-password',
        canActivate: [publicOnlyGuard],
        loadComponent: () =>
          import('./features/auth/pages/reset-password.page').then((m) => m.ResetPasswordPage),
        title: 'Restablecer contraseña · Hotel San Francisco',
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
        path: 'dashboard-cliente',
        loadComponent: () =>
          import('./features/account/pages/dashboard-cliente/dashboard-cliente.page')
            .then((m) => m.DashboardClientePage),
        title: 'Dashboard · Hotel San Francisco',
      },
      {
        path: 'mi-dashboard',
        loadComponent: () =>
          import('./features/account/pages/dashboard-cliente/dashboard-cliente.page').then(
            (m) => m.DashboardClientePage,
          ),
        title: 'Dashboard · Hotel San Francisco',
      },
      {
        path: 'mi-cuenta',
        loadComponent: () =>
          import('./features/account/pages/mi-cuenta/mi-cuenta.page').then((m) => m.MiCuentaPage),
        title: 'Mi cuenta · Hotel San Francisco',
      },
      {
        path: 'rooms',
        loadComponent: () =>
          import('./features/rooms/pages/room-list.page').then((m) => m.RoomsListPage),
        title: 'Habitaciones',
      },
      {
        path: 'rooms/calendar',
        loadComponent: () =>
          import('./features/rooms/pages/room-calendar/room-calendar.page').then(
            (m) => m.RoomCalendarPage,
          ),
        title: 'Calendario de habitaciones · Hotel San Francisco',
      },
      {
        path: 'rooms/:id',
        loadComponent: () =>
          import('./features/rooms/pages/room-detail.page').then((m) => m.RoomDetailPage),
        title: 'Detalle de habitación',
      },
      {
        path: 'reservations/mis-reservas',
        loadComponent: () =>
          import('./features/reservations/pages/mis-reservas/mis-reservas.component').then(
            (m) => m.MisReservasComponent,
          ),
        title: 'Mis Reservas',
      },
      {
        path: 'reservations/:id',
        loadComponent: () =>
          import('./features/reservations/pages/reservation-detail/reservation-detail.page').then(
            (m) => m.ReservationDetailPage,
          ),
        title: 'Detalle de reserva · Hotel San Francisco',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/pages/reports-dashboard/reports-dashboard.component').then(
            (m) => m.ReportsDashboardComponent,
          ),
        title: 'Reportes',
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/clients/pages/clientes-dashboard/clientes-dashboard.component').then(
            (m) => m.ClientesDashboardComponent,
          ),
        title: 'Clientes',
      },
      {
        path: 'management',
        loadComponent: () =>
          import('./features/reports/pages/management-dashboard/management-dashboard.component').then(
            (m) => m.ManagementDashboardComponent,
          ),
        title: 'Dashboard Gerencial',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/pages/notifications-list/notifications-list.page').then(
            (m) => m.NotificationsListPage,
          ),
        title: 'Notificaciones · Hotel San Francisco',
      },
      {
        path: 'notifications/settings',
        loadComponent: () =>
          import('./features/notifications/pages/notifications-settings/notifications-settings.component').then(
            (m) => m.NotificationsSettingsComponent,
          ),
        title: 'Configuración de notificaciones · Hotel San Francisco',
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/pages/payment-dashboard/payment-dashboard.component').then(
            (m) => m.PaymentsDashboardComponent,
          ),
        title: 'Pagos · Hotel San Francisco',
      },
      {
        path: 'mis-pagos',
        loadComponent: () =>
          import('./features/payments/pages/pagos-cliente/pagos-factura-cliente.page').then(
            (m) => m.PagosFacturasClientePage,
          ),
        title: 'Pagos y facturas · Hotel San Francisco',
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./features/solicitudes/pages/mis-solicitudes/mis-solicitudes.page').then(
            (m) => m.MisSolicitudesPage,
          ),
        title: 'Mis Solicitudes · Hotel San Francisco',
      },
      {
        path: 'solicitudes/nueva',
        loadComponent: () =>
          import('./features/solicitudes/pages/nueva/nueva-solicitud.page').then(
            (m) => m.NuevaSolicitudPage,
          ),
        title: 'Nueva solicitud · Hotel San Francisco',
      },
      {
        path: 'solicitudes/gestion',
        canActivate: [solicitudGestionGuard],
        loadComponent: () =>
          import('./features/solicitudes/pages/gestion-global/gestion-global.page').then(
            (m) => m.GestionGlobalSolicitudesPage,
          ),
        title: 'Gestión de Solicitudes · Hotel San Francisco',
      },
      {
        path: 'solicitudes/:id',
        loadComponent: () =>
          import('./features/solicitudes/pages/detalle/detalle-solicitud.page').then(
            (m) => m.DetalleSolicitudPage,
          ),
        title: 'Detalle de solicitud · Hotel San Francisco',
      },
      {
        path: 'auditoria',
        canActivate: [auditoriaGuard],
        loadComponent: () =>
          import('./features/auditoria/pages/auditoria-lista/auditoria-lista.page').then(
            (m) => m.AuditoriaListaPage,
          ),
        title: 'Auditoría · Hotel San Francisco',
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
    ],
  },

  { path: '**', redirectTo: 'home' },
];
