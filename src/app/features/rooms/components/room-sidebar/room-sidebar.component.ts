import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../../../core/auth/auth.store';
import { AuthService } from '../../../../core/auth/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact: boolean;
  sub?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-room-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  host: {
    role: 'navigation',
    'aria-label': 'Navegación principal',
  },
  template: `
    <!-- Mobile toggle button -->
    <button class="mobile-toggle" (click)="mobileOpen.set(!mobileOpen())" aria-label="Abrir menú">
      {{ mobileOpen() ? '✕' : '☰' }}
    </button>

    <!-- Mobile backdrop -->
    @if (mobileOpen()) {
      <div class="mobile-backdrop" (click)="mobileOpen.set(false)"></div>
    }

    <div class="sidebar" [class.mobile-open]="mobileOpen()">

      <!-- Brand -->
      <div class="brand">
        <div class="brand-logo">SF</div>
        <div class="brand-text">
          <span class="brand-name">Hotel San Francisco</span>
          <span class="brand-sub">Panel de gestión</span>
        </div>
      </div>

      <!-- Nav -->
      <nav class="nav-menu">
        @for (group of navGroups; track $index) {
          @if (group.title) {
            <div class="nav-section-title">{{ group.title }}</div>
          }
          @for (item of group.items; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              class="nav-item"
              [class.sub-item]="item.sub"
              [attr.aria-label]="item.label"
              (click)="mobileOpen.set(false)">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        }
      </nav>

      <!-- Spacer -->
      <div class="spacer"></div>

      <!-- User profile -->
      @if (auth.user()) {
        <div class="user-section">
          <div class="user-card">
            <div class="user-avatar">{{ initials() }}</div>
            <div class="user-info">
              <span class="user-name">{{ auth.user()!.nombreCompleto }}</span>
              <span class="user-role">{{ auth.user()!.rol }}</span>
            </div>
          </div>
          <button class="btn-logout" (click)="logout()" title="Cerrar sesión">
            <span>⏏</span>
            <span class="logout-label">Cerrar sesión</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap');
    * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

    /* ── Mobile toggle ─────────────────────────────────────────────── */
    .mobile-toggle {
      display: none;
      position: fixed; bottom: 1.25rem; right: 1.25rem;
      z-index: 201;
      width: 48px; height: 48px;
      background: #C5A048; color: white;
      border: none; border-radius: 50%;
      font-size: 1.25rem; cursor: pointer;
      box-shadow: 0 4px 16px rgba(197,160,72,0.4);
      align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .mobile-toggle:hover { background: #8E6F2E; transform: scale(1.05); }

    .mobile-backdrop {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 99;
    }

    /* ── Sidebar shell ─────────────────────────────────────────────── */
    .sidebar {
      width: 260px;
      background: #2D2926;
      color: #F9F5F0;
      height: 100vh;
      position: fixed;
      left: 0; top: 0;
      display: flex; flex-direction: column;
      overflow-y: auto;
      box-shadow: 2px 0 12px rgba(0,0,0,0.15);
      z-index: 100;
      transition: transform 0.3s ease;
    }

    .sidebar::-webkit-scrollbar { width: 4px; }
    .sidebar::-webkit-scrollbar-track { background: #3a3633; }
    .sidebar::-webkit-scrollbar-thumb { background: #C5A048; border-radius: 4px; }

    /* ── Brand ─────────────────────────────────────────────────────── */
    .brand {
      padding: 1.25rem 1rem 1.125rem;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex; align-items: center; gap: 0.75rem;
      flex-shrink: 0;
    }

    .brand-logo {
      width: 36px; height: 36px; border-radius: 0.5rem;
      background: #C5A048;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 800; color: #2D2926;
      flex-shrink: 0; letter-spacing: 0.5px;
    }

    .brand-text { display: flex; flex-direction: column; }
    .brand-name { font-size: 0.875rem; font-weight: 700; color: #F9F5F0; line-height: 1.2; }
    .brand-sub  { font-size: 0.65rem; color: rgba(255,255,255,0.4); margin-top: 0.1rem; }

    /* ── Navigation ─────────────────────────────────────────────────── */
    .nav-menu {
      padding: 0.75rem 0.5rem;
      display: flex; flex-direction: column; gap: 0.125rem;
    }

    .nav-section-title {
      font-size: 0.6rem; font-weight: 700; letter-spacing: 1.5px;
      color: rgba(255,255,255,0.28); text-transform: uppercase;
      padding: 0.875rem 0.875rem 0.375rem;
      margin-top: 0.25rem;
    }

    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      transition: all 0.18s ease;
      font-size: 0.875rem; font-weight: 500;
      border-radius: 0.5rem;
      position: relative;
    }

    .nav-item:hover {
      background: rgba(255,255,255,0.06);
      color: #F9F5F0;
      transform: translateX(3px);
    }

    .nav-item.active {
      background: #C5A048;
      color: #2D2926;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(197,160,72,0.3);
    }

    .nav-item.active::before {
      content: '';
      position: absolute; left: -0.5rem; top: 50%;
      transform: translateY(-50%);
      width: 3px; height: 60%;
      background: #F9F5F0;
      border-radius: 0 2px 2px 0;
    }

    /* Sub-item (Mis Reservas under Reservas) */
    .nav-item.sub-item {
      padding-left: 2.25rem;
      font-size: 0.8125rem;
      color: rgba(255,255,255,0.5);
    }
    .nav-item.sub-item::after {
      content: '';
      position: absolute; left: 1.375rem; top: 0; bottom: 0;
      width: 1px;
      background: rgba(255,255,255,0.08);
    }
    .nav-item.sub-item .nav-icon { font-size: 0.875rem; }
    .nav-item.sub-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
    .nav-item.sub-item.active {
      background: rgba(197,160,72,0.18);
      color: #C5A048;
      box-shadow: none;
    }
    .nav-item.sub-item.active::before { background: #C5A048; }

    .nav-icon { font-size: 1rem; width: 20px; text-align: center; flex-shrink: 0; }
    .nav-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* ── Spacer & User section ─────────────────────────────────────── */
    .spacer { flex: 1; }

    .user-section {
      padding: 0.75rem 0.5rem 1rem;
      border-top: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }

    .user-card {
      display: flex; align-items: center; gap: 0.625rem;
      padding: 0.5rem 0.625rem 0.625rem;
    }

    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(197,160,72,0.2);
      border: 1.5px solid rgba(197,160,72,0.4);
      color: #C5A048;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
    }

    .user-info { display: flex; flex-direction: column; min-width: 0; }
    .user-name { font-size: 0.8rem; font-weight: 600; color: #F9F5F0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 0.65rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; }

    .btn-logout {
      width: 100%; display: flex; align-items: center; gap: 0.625rem;
      padding: 0.5rem 0.875rem;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 0.5rem; cursor: pointer;
      color: rgba(255,255,255,0.45); font-size: 0.8rem;
      transition: all 0.2s;
    }
    .btn-logout:hover { background: rgba(220,38,38,0.15); color: #FCA5A5; border-color: rgba(220,38,38,0.25); }

    .logout-label { font-size: 0.8rem; }

    /* ── Tablet (768px) ────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .sidebar { width: 64px; }
      .brand-text, .nav-label, .nav-section-title, .user-info, .logout-label { display: none; }
      .brand { padding: 1rem; justify-content: center; }
      .brand-logo { margin: 0; }
      .nav-menu { padding: 0.75rem 0.375rem; }
      .nav-item { padding: 0.625rem; justify-content: center; }
      .nav-item.sub-item { padding-left: 0.625rem; }
      .nav-item.sub-item::after { display: none; }
      .nav-icon { width: auto; font-size: 1.125rem; }
      .nav-item:hover { transform: none; }
      .user-card { padding: 0.5rem; justify-content: center; }
      .btn-logout { padding: 0.5rem; justify-content: center; }

      .main-content { margin-left: 64px !important; }
    }

    /* ── Mobile (<480px) ───────────────────────────────────────────── */
    @media (max-width: 480px) {
      .mobile-toggle { display: flex; }
      .sidebar { transform: translateX(-100%); width: 260px; }
      .sidebar.mobile-open { transform: translateX(0); z-index: 200; }
      .mobile-backdrop { display: block; }
      .brand-text, .nav-label, .nav-section-title, .user-info, .logout-label { display: flex; }
      .brand { padding: 1.25rem 1rem; justify-content: flex-start; }
      .nav-menu { padding: 0.75rem 0.5rem; }
      .nav-item { padding: 0.625rem 0.875rem; justify-content: flex-start; }
      .nav-item.sub-item { padding-left: 2.25rem; }
      .nav-item.sub-item::after { display: block; }
      .nav-icon { width: 20px; font-size: 1rem; }
      .user-card { padding: 0.5rem 0.625rem; justify-content: flex-start; }
      .btn-logout { padding: 0.5rem 0.875rem; justify-content: flex-start; }
    }
  `
})
export class RoomSidebarComponent {
  protected readonly auth = inject(AuthStore);
  private  readonly authSvc = inject(AuthService);
  private  readonly router  = inject(Router);

  readonly mobileOpen = signal(false);

  readonly initials = computed(() => {
    const u = this.auth.user();
    if (!u) return '?';
    return ((u.nombre?.[0] ?? '') + (u.apellidoPaterno?.[0] ?? '')).toUpperCase();
  });

  readonly navGroups: NavGroup[] = [
    {
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: '📊', exact: false },
      ],
    },
    {
      title: 'Recepción',
      items: [
        { path: '/reservations',              label: 'Reservas',      icon: '📅', exact: true  },
        { path: '/reservations/mis-reservas', label: 'Mis Reservas',  icon: '📋', exact: true, sub: true },
        { path: '/guests',                    label: 'Huéspedes',     icon: '👥', exact: false },
      ],
    },
    {
      title: 'Hotel',
      items: [
        { path: '/rooms',        label: 'Tipos de habitación', icon: '🛏️', exact: false },
        { path: '/habitaciones', label: 'Habitaciones',        icon: '🚪', exact: false },
      ],
    },
    {
      title: 'Administración',
      items: [
        { path: '/employees',     label: 'Empleados',      icon: '👔', exact: false },
        { path: '/notifications', label: 'Notificaciones', icon: '🔔', exact: false },
      ],
    },
  ];

  logout(): void {
    this.authSvc.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
