// features/rooms/components/room-sidebar/room-sidebar.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-room-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  host: {
    class: 'block',
    role: 'navigation',
    'aria-label': 'Main navigation'
  },
  template: `
    <div class="sidebar">
      <div class="logo">
        <h2>🏨 Hotel Manager</h2>
      </div>
      
      <nav class="nav-menu">
        @for (item of menuItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            class="nav-item"
            [attr.aria-label]="'Navigate to ' + item.label">
            {{ item.icon }} {{ item.label }}
          </a>
        }
      </nav>
    </div>
  `,
  styles: `
    /* Importar fuente Inter */
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');

    * {
      font-family: 'Inter', sans-serif;
    }

    .sidebar {
      width: 260px;
      background: #2D2926; /* Sidebar/Contrast: Gris Carbón */
      color: #F9F5F0; /* Blanco Hueso para texto */
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      overflow-y: auto;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
      z-index: 100;
    }

    /* Scrollbar personalizada para sidebar */
    .sidebar::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar::-webkit-scrollbar-track {
      background: #3a3633;
    }

    .sidebar::-webkit-scrollbar-thumb {
      background: #C5A048; /* Primary: Dorado Principal */
      border-radius: 4px;
    }

    .sidebar::-webkit-scrollbar-thumb:hover {
      background: #8E6F2E; /* Secondary: Ocre Oscuro */
    }

    .logo {
      padding: 1.5rem;
      border-bottom: 1px solid #3a3633;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      font-size: 1.75rem;
    }

    .logo h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #F9F5F0;
    }

    .logo h2 span {
      color: #C5A048; /* Primary: Dorado Principal */
      font-weight: 600;
    }

    .nav-menu {
      padding: 1rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem 1.5rem;
      color: #CBD5E1;
      text-decoration: none;
      transition: all 0.2s ease;
      font-size: 0.875rem; /* Small (14px) para sidebar items */
      font-weight: 500;
      margin: 0 0.5rem;
      border-radius: 0.5rem;
      position: relative;
    }

    .nav-icon {
      font-size: 1.25rem;
      width: 24px;
      text-align: center;
    }

    .nav-label {
      flex: 1;
    }

    .nav-item:hover {
      background: #3a3633;
      color: #F9F5F0;
      transform: translateX(4px);
    }

    .nav-item.active {
      background: #C5A048; /* Primary: Dorado Principal */
      color: white;
      box-shadow: 0 2px 8px rgba(197, 160, 72, 0.3);
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 70%;
      background: #F9F5F0;
      border-radius: 0 2px 2px 0;
    }

    /* Responsive para tablets */
    @media (max-width: 768px) {
      .sidebar {
        width: 72px;
        transition: width 0.3s ease;
      }

      .sidebar:hover {
        width: 240px;
      }

      .logo h2 {
        display: none;
      }

      .sidebar:hover .logo h2 {
        display: block;
      }

      .nav-label {
        display: none;
      }

      .sidebar:hover .nav-label {
        display: block;
      }

      .nav-item {
        justify-content: center;
        padding: 0.75rem;
      }

      .sidebar:hover .nav-item {
        justify-content: flex-start;
        padding: 0.75rem 1.5rem;
      }

      .nav-icon {
        font-size: 1.25rem;
        margin: 0;
      }
    }

    /* Responsive para móviles */
    @media (max-width: 480px) {
      .sidebar {
        width: 100%;
        height: auto;
        bottom: 0;
        top: auto;
        transform: translateY(100%);
        transition: transform 0.3s ease;
        z-index: 1000;
      }

      .sidebar.open {
        transform: translateY(0);
      }

      .nav-menu {
        flex-direction: row;
        justify-content: space-around;
        padding: 0.5rem;
        gap: 0;
      }

      .nav-item {
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
        font-size: 0.7rem;
      }

      .nav-icon {
        font-size: 1rem;
      }

      .logo {
        display: none;
      }
    }
  `
})
export class RoomSidebarComponent {
  menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/rooms', label: 'Habitaciones', icon: '🛏️' },
    { path: '/reservations', label: 'Reservas', icon: '📅' },
    { path: '/guests', label: 'Huéspedes', icon: '👥' },
    { path: '/employees', label: 'Empleados', icon: '👔' },
    { path: '/notifications', label: 'Notificaciones', icon: '🔔' }
  ];
}