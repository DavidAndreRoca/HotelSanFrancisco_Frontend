import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';

interface NavItem {
  label: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)]">
      <!-- SIDEBAR -->
      <aside
        class="hidden lg:flex flex-col w-64 shrink-0 bg-[var(--color-ink)] text-[var(--color-surface)]"
        aria-label="Navegación principal">
        <div class="px-6 py-6 flex items-center gap-3 border-b border-white/5">
          <div
            class="w-10 h-10 rounded-full bg-[var(--color-primary-500)] text-[var(--color-ink)] flex items-center justify-center font-extrabold">
            SF
          </div>
          <div class="leading-tight">
            <p class="text-sm font-semibold tracking-wide">Hotel San Francisco</p>
            <p class="text-[11px] text-white/60">Panel administrativo</p>
          </div>
        </div>

        <nav class="flex-1 px-3 py-5 space-y-1 text-[14px]">
          @for (item of nav(); track item.link) {
            <a
              [routerLink]="item.link"
              routerLinkActive="bg-white/10 text-[var(--color-primary-300)]"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:text-white hover:bg-white/5 transition-colors">
              <span class="text-base" aria-hidden="true">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="px-4 py-4 border-t border-white/5">
          <button
            type="button"
            (click)="logout()"
            class="w-full text-[13px] py-2 rounded-lg bg-white/5 hover:bg-white/10
                   transition-colors flex items-center justify-center gap-2
                   text-white/70 hover:text-white">
            <span aria-hidden="true">⎋</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- CONTENT -->
      <div class="flex-1 flex flex-col min-w-0">
        <header
          class="sticky top-0 z-10 h-16 bg-white/85 backdrop-blur border-b border-[var(--color-border-soft)] px-6 flex items-center justify-between">
          <button
            type="button"
            class="lg:hidden p-2 rounded-md hover:bg-[var(--color-border-soft)]"
            (click)="toggleMobile()"
            aria-label="Abrir menú">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <h1 class="text-sm font-semibold tracking-wide text-[var(--color-ink-soft)]">
            Sistema de gestión hotelera
          </h1>
          <div class="hidden sm:flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-[var(--color-primary-500)]/15
                        text-[var(--color-primary-500)] flex items-center justify-center
                        text-xs font-bold shrink-0">
              {{ initials() }}
            </div>
            <div class="leading-tight text-right">
              <p class="text-[13px] font-semibold text-[var(--color-ink)] leading-none">
                {{ user()?.nombreCompleto }}
              </p>
              <p class="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                {{ user()?.rol }}
              </p>
            </div>
          </div>
        </header>

        <main class="flex-1 px-6 py-8 max-w-[1400px] w-full mx-auto">
          <router-outlet />
        </main>
      </div>

      @if (mobileOpen()) {
        <div
          class="lg:hidden fixed inset-0 z-40 bg-black/40 animate-fade-in"
          (click)="toggleMobile()"
          role="presentation">
          <aside
            class="absolute left-0 top-0 bottom-0 w-72 bg-[var(--color-ink)] text-[var(--color-surface)] p-5"
            (click)="$event.stopPropagation()">
            <nav class="space-y-1 mt-6 text-[14px]">
              @for (item of nav(); track item.link) {
                <a
                  [routerLink]="item.link"
                  routerLinkActive="bg-white/10 text-[var(--color-primary-300)]"
                  (click)="toggleMobile()"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:bg-white/5">
                  <span aria-hidden="true">{{ item.icon }}</span>
                  <span>{{ item.label }}</span>
                </a>
              }
            </nav>
          </aside>
        </div>
      }
    </div>
  `,
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  readonly user = this.store.user;
  readonly mobileOpen = signal(false);

  private readonly clienteNav: NavItem[] = [
    { label: 'Dashboard',       icon: '◆', link: '/dashboard-cliente' },
    { label: 'Mis Reservas',    icon: '☷', link: '/reservations/mis-reservas' },
    { label: 'Notificaciones',  icon: '✉', link: '/notifications' },
    { label: 'Pagos y facturas',icon: '✦', link: '/mis-pagos' },
    { label: 'Mi Perfil',       icon: '☺', link: '/mi-cuenta' },
  ];

  private readonly adminNav: NavItem[] = [
    { label: 'Dashboard',     icon: '◆', link: '/dashboard' },
    { label: 'Habitaciones',  icon: '◇', link: '/rooms' },
    { label: 'Reservas',      icon: '☷', link: '/reservations' },
    { label: 'Pagos',         icon: '✦', link: '/payments' },
    { label: 'Reportes',      icon: '▣', link: '/reports' },
    { label: 'Notificaciones',icon: '✉', link: '/notifications' },
    { label: 'Gerencial',     icon: '◈', link: '/management' },
    { label: 'Huéspedes',     icon: '☺', link: '/guests' },
    { label: 'Empleados',     icon: '✤', link: '/employees' },
    { label: 'Productos',     icon: '◫', link: '/products' },
    { label: 'Compras',       icon: '⇪', link: '/purchases' },
    { label: 'Incidencias',   icon: '⚠', link: '/incidencias' },
    { label: 'Usuarios',      icon: '⚙', link: '/users' },
  ];

  readonly nav = computed<NavItem[]>(() =>
    this.store.rol() === 'CLIENTE' ? this.clienteNav : this.adminNav
  );

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '··';
    return `${u.nombre?.[0] ?? ''}${u.apellidoPaterno?.[0] ?? ''}`.toUpperCase();
  });

  toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }

  logout(): void {
    this.auth.logout().subscribe(() => {
      this.toastr.success('Sesión cerrada correctamente.');
      this.router.navigate(['/login']);
    });
  }
}
