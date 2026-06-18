import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  exact: boolean;
  sub?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
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

        <nav class="flex-1 px-3 py-4 text-[14px] overflow-y-auto">
          @for (group of navGroups(); track $index) {
            @if (group.title) {
              <p class="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-widest uppercase text-white/30">
                {{ group.title }}
              </p>
            }
            @for (item of group.items; track item.link) {
              <a
                [routerLink]="item.link"
                routerLinkActive="bg-white/10 text-[var(--color-primary-300)]"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                class="flex items-center gap-3 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors mb-0.5"
                [class]="item.sub ? 'px-3 py-2 pl-8 text-[13px]' : 'px-3 py-2.5'">
                <span class="text-base shrink-0" aria-hidden="true">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </a>
            }
          }
        </nav>

        <div class="px-4 py-4 border-t border-white/5">
          <div class="flex items-center gap-3 px-2 py-2">
            <div
              class="w-9 h-9 rounded-full bg-[var(--color-primary-500)]/20 text-[var(--color-primary-300)] flex items-center justify-center text-sm font-semibold">
              {{ initials() }}
            </div>
            <div class="flex-1 leading-tight min-w-0">
              <p class="text-[13px] font-medium truncate">{{ user()?.nombreCompleto }}</p>
              <p class="text-[11px] text-white/55 truncate">{{ user()?.rol }}</p>
            </div>
          </div>
          <button
            type="button"
            (click)="logout()"
            class="mt-3 w-full text-[13px] py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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
          <div class="text-xs text-[var(--color-ink-muted)] hidden sm:block">
            {{ user()?.correo }}
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
            <nav class="space-y-0.5 mt-6 text-[14px]">
              @for (group of navGroups(); track $index) {
                @if (group.title) {
                  <p class="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-widest uppercase text-white/30">
                    {{ group.title }}
                  </p>
                }
                @for (item of group.items; track item.link) {
                  <a
                    [routerLink]="item.link"
                    routerLinkActive="bg-white/10 text-[var(--color-primary-300)]"
                    [routerLinkActiveOptions]="{ exact: item.exact }"
                    (click)="toggleMobile()"
                    class="flex items-center gap-3 rounded-lg text-white/70 hover:bg-white/5 transition-colors"
                    [class]="item.sub ? 'px-3 py-2 pl-8 text-[13px]' : 'px-3 py-2.5'">
                    <span aria-hidden="true">{{ item.icon }}</span>
                    <span>{{ item.label }}</span>
                  </a>
                }
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

  readonly navGroups = signal<NavGroup[]>([
    {
      items: [
        { label: 'Dashboard',    icon: '📊', link: '/dashboard', exact: false },
      ],
    },
    {
      title: 'Recepción',
      items: [
        { label: 'Reservas',    icon: '📅', link: '/reservations',              exact: true  },
        { label: 'Mis Reservas',icon: '📋', link: '/reservations/mis-reservas', exact: true, sub: true },
        { label: 'Clientes',    icon: '👤', link: '/clients',                   exact: false },
      ],
    },
    {
      title: 'Hotel',
      items: [
        { label: 'Habitaciones',icon: '🛏️', link: '/rooms',   exact: false },
        { label: 'Huéspedes',  icon: '👥', link: '/guests',   exact: false },
      ],
    },
    {
      title: 'Administración',
      items: [
        { label: 'Empleados',      icon: '👔', link: '/employees',     exact: false },
        { label: 'Notificaciones', icon: '🔔', link: '/notifications', exact: false },
      ],
    },
  ]);

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
