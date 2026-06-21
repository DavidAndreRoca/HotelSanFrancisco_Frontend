import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/guards/auth.guard';
import { usuariosGuard } from './features/usuarios/guards/usuarios.guard';
import { rolesGuard } from './features/roles/guards/roles.guard';
import { serviciosGuard, tiposServicioGuard } from './features/servicios/guards/servicios.guard';
import { posGuard, ventaCreateGuard } from './features/pos/guards/pos.guard';

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
        path: 'booking',
        loadComponent: () =>
          import('./features/booking/pages/booking-flow/booking-flow.page').then((m) => m.BookingFlowPage),
        title: 'Reservar · Hotel San Francisco',
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
        title: 'Tipos de habitación',
      },
      {
        path: 'habitaciones',
        loadComponent: () =>
          import('./features/habitaciones/pages/habitaciones-list/habitaciones-list.page').then(
            (m) => m.HabitacionesListPage,
          ),
        title: 'Habitaciones · Hotel San Francisco',
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
          import('./features/clients/pages/clientes-dashboard/clientes-dashboard.component').then(
            (m) => m.ClientesDashboardComponent,
          ),
        title: 'Huéspedes · Hotel San Francisco',
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./features/employees/pages/employees-dashboard/employees-dashboard.component').then(
            (m) => m.EmployeesDashboardComponent,
          ),
        title: 'Empleados',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/pages/products.page').then((m) => m.ProductsPage),
        title: 'Productos · Hotel San Francisco',
      },
      {
        path: 'purchases',
        loadComponent: () =>
          import('./features/purchases/pages/purchases.page').then((m) => m.PurchasesPage),
        title: 'Compras · Hotel San Francisco',
      },
      {
        path: 'incidencias',
        loadComponent: () =>
          import('./features/incidencias/pages/incidencias.page').then((m) => m.IncidenciasPage),
        title: 'Incidencias · Hotel San Francisco',
      },
      {
        path: 'users',
        canActivate: [usuariosGuard],
        loadComponent: () =>
          import('./features/usuarios/pages/usuarios-lista/usuarios-lista.page').then(
            (m) => m.UsuariosListaPage,
          ),
        title: 'Usuarios · Hotel San Francisco',
      },
      {
        path: 'roles',
        canActivate: [rolesGuard],
        loadComponent: () =>
          import('./features/roles/pages/roles-lista/roles-lista.page').then(
            (m) => m.RolesListaPage,
          ),
        title: 'Roles · Hotel San Francisco',
      },
      {
        path: 'roles/:id',
        canActivate: [rolesGuard],
        loadComponent: () =>
          import('./features/roles/pages/rol-detalle/rol-detalle.page').then(
            (m) => m.RolDetallePage,
          ),
        title: 'Detalle de rol · Hotel San Francisco',
      },
      {
        path: 'tipos-servicio',
        canActivate: [tiposServicioGuard],
        loadComponent: () =>
          import('./features/servicios/pages/tipos-servicio-lista/tipos-servicio-lista.page').then(
            (m) => m.TiposServicioListaPage,
          ),
        title: 'Tipos de servicio · Hotel San Francisco',
      },
      {
        path: 'servicios',
        canActivate: [serviciosGuard],
        loadComponent: () =>
          import('./features/servicios/pages/servicios-lista/servicios-lista.page').then(
            (m) => m.ServiciosListaPage,
          ),
        title: 'Consumos de servicio · Hotel San Francisco',
      },
      {
        path: 'pos',
        canActivate: [posGuard],
        loadComponent: () =>
          import('./features/pos/pages/ventas-lista/ventas-lista.page').then(
            (m) => m.VentasListaPage,
          ),
        title: 'Punto de venta · Hotel San Francisco',
      },
      {
        path: 'pos/nueva',
        canActivate: [ventaCreateGuard],
        loadComponent: () =>
          import('./features/pos/pages/venta-form/venta-form.page').then((m) => m.VentaFormPage),
        title: 'Nueva venta · Hotel San Francisco',
      },
      {
        path: 'pos/:id',
        canActivate: [posGuard],
        loadComponent: () =>
          import('./features/pos/pages/venta-detalle/venta-detalle.page').then(
            (m) => m.VentaDetallePage,
          ),
        title: 'Detalle de venta · Hotel San Francisco',
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./features/solicitudes/pages/gestion-global/gestion-global.page').then(
            (m) => m.GestionGlobalSolicitudesPage,
          ),
        title: 'Solicitudes de Servicio · Hotel San Francisco',
      },
    ],
  },

  { path: '**', redirectTo: 'home' },
];
