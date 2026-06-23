import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  /** Si se define, el ítem solo aparece si el usuario tiene este permiso. */
  permiso?: string;
}

interface NavSection {
  /** Encabezado de la sección; si se omite, los ítems se muestran sin título. */
  title?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen overflow-hidden bg-[var(--color-surface)] text-[var(--color-ink)]">
      <!-- SIDEBAR -->
      <aside
        class="hidden lg:flex flex-col w-64 shrink-0 bg-[var(--color-ink)] text-[var(--color-surface)]"
        aria-label="Navegación principal"
      >
        <div class="px-6 py-6 flex items-center gap-3 border-b border-white/5">
          <div
            class="w-10 h-10 rounded-full bg-[var(--color-primary-500)] text-[var(--color-ink)] flex items-center justify-center font-extrabold"
          >
            SF
          </div>
          <div class="leading-tight">
            <p class="text-sm font-semibold tracking-wide">Hotel San Francisco</p>
            <p class="text-[11px] text-white/60">Panel administrativo</p>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-5 space-y-1 text-[14px]">
          @for (section of nav(); track $index) {
            @if (section.title) {
              <p class="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                {{ section.title }}
              </p>
            }
            @for (item of section.items; track item.link) {
              <a
                [routerLink]="item.link"
                routerLinkActive="bg-white/10 text-[var(--color-primary-300)]"
                [routerLinkActiveOptions]="{ exact: false }"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:text-white hover:bg-white/5 transition-colors"
              >
                <span class="text-base" aria-hidden="true">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </a>
            }
          }
        </nav>

        <div class="px-4 py-4 border-t border-white/5">
          <button
            type="button"
            (click)="logout()"
            class="w-full text-[13px] py-2 rounded-lg bg-white/5 hover:bg-white/10
                   transition-colors flex items-center justify-center gap-2
                   text-white/70 hover:text-white"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25
                       2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- CONTENT -->
      <div class="flex-1 flex flex-col min-w-0">
        <header
          class="sticky top-0 z-10 h-16 bg-white/85 backdrop-blur border-b border-[var(--color-border-soft)] px-6 flex items-center justify-between"
        >
          <button
            type="button"
            class="lg:hidden p-2 rounded-md hover:bg-[var(--color-border-soft)]"
            (click)="toggleMobile()"
            aria-label="Abrir menú"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div class="flex items-center gap-3 ml-auto min-w-0">
            <div
              class="w-8 h-8 rounded-full bg-[var(--color-primary-500)]/15
                        text-[var(--color-primary-500)] flex items-center justify-center
                        text-xs font-bold shrink-0"
            >
              {{ initials() }}
            </div>
            <div class="leading-tight min-w-0">
              <p class="text-[13px] font-semibold text-[var(--color-ink)] leading-none truncate">
                {{ user()?.nombreCompleto }}
              </p>
              <p class="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                {{ user()?.rol }}
              </p>
            </div>
          </div>
        </header>

        <main class="flex-1 min-h-0 overflow-y-auto">
          <div class="px-6 py-8 max-w-[1400px] w-full mx-auto">
            <router-outlet />
          </div>
        </main>
      </div>

      @if (mobileOpen()) {
        <div
          class="lg:hidden fixed inset-0 z-40 bg-black/40 animate-fade-in"
          (click)="toggleMobile()"
          role="presentation"
        >
          <aside
            class="absolute left-0 top-0 bottom-0 w-72 bg-[var(--color-ink)] text-[var(--color-surface)] p-5 flex flex-col"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center gap-3 pb-4 mb-2 border-b border-white/5">
              <div
                class="w-10 h-10 rounded-full bg-[var(--color-primary-500)] text-[var(--color-ink)] flex items-center justify-center font-extrabold shrink-0"
              >
                SF
              </div>
              <div class="leading-tight">
                <p class="text-sm font-semibold tracking-wide">Hotel San Francisco</p>
                <p class="text-[11px] text-white/60">Panel administrativo</p>
              </div>
            </div>

            <nav class="flex-1 overflow-y-auto space-y-1 text-[14px]">
              @for (section of nav(); track $index) {
                @if (section.title) {
                  <p class="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    {{ section.title }}
                  </p>
                }
                @for (item of section.items; track item.link) {
                  <a
                    [routerLink]="item.link"
                    routerLinkActive="bg-white/10 text-[var(--color-primary-300)]"
                    (click)="toggleMobile()"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:bg-white/5"
                  >
                    <span aria-hidden="true">{{ item.icon }}</span>
                    <span>{{ item.label }}</span>
                  </a>
                }
              }
            </nav>

            <div class="pt-4 mt-2 border-t border-white/5">
              <button
                type="button"
                (click)="logout()"
                class="w-full text-[13px] py-2 rounded-lg bg-white/5 hover:bg-white/10
                       transition-colors flex items-center justify-center gap-2
                       text-white/70 hover:text-white"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25
                       2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"/>
            </svg>
                Cerrar sesión
              </button>
            </div>
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

  private readonly clienteNav: NavSection[] = [
    {
      items: [
        { label: 'Dashboard', icon: '◆', link: '/dashboard-cliente' },
        { label: 'Mis Reservas', icon: '☷', link: '/reservations/mis-reservas' },
        { label: 'Notificaciones', icon: '✉', link: '/notifications' },
        { label: 'Servicios', icon: '★', link: '/servicios-catalogo' },
        { label: 'Mis pedidos', icon: '☷', link: '/mis-pedidos' },
        { label: 'Pagos y facturas', icon: '✦', link: '/mis-pagos' },
        { label: 'Mi Perfil', icon: '☺', link: '/mi-cuenta' },
      ],
    },
  ];

  private readonly adminNav: NavSection[] = [
    {
      items: [{ label: 'Dashboard', icon: '◆', link: '/dashboard' }],
    },
    {
      title: 'Operación',
      items: [
        { label: 'Reservas',     icon: '☷', link: '/reservations' },
        { label: 'Huéspedes',    icon: '☺', link: '/guests' },
        { label: 'Pedidos serv.',icon: '☑', link: '/pedidos-servicio', permiso: 'servicio:read' },
        { label: 'Incidencias',  icon: '⚠', link: '/incidencias' },
      ],
    },
    {
      title: 'Servicios y ventas',
      items: [
        { label: 'Servicios',     icon: '✦', link: '/servicios', permiso: 'servicio:read' },
        { label: 'Catálogo serv.',icon: '☰', link: '/tipos-servicio', permiso: 'tipo-servicio:read' },
        { label: 'Punto de venta',icon: '✚', link: '/pos', permiso: 'venta:read' },
        { label: 'Productos',     icon: '◫', link: '/products' },
        { label: 'Compras',       icon: '⇪', link: '/purchases' },
      ],
    },
    {
      title: 'Finanzas',
      items: [
        { label: 'Pagos',     icon: '✦', link: '/payments' },
        { label: 'Reportes',  icon: '▣', link: '/reports' },
        { label: 'Gerencial', icon: '◈', link: '/management' },
      ],
    },
    {
      title: 'Alojamiento',
      items: [
        { label: 'Tipos de hab.', icon: '◇', link: '/rooms' },
        { label: 'Habitaciones',  icon: '▣', link: '/habitaciones', permiso: 'habitacion:read' },
      ],
    },
    {
      title: 'Comunicación',
      items: [
        { label: 'Log de correos', icon: '✉', link: '/notifications/log', permiso: 'usuario:read' },
      ],
    },
    {
      title: 'Administración',
      items: [
        { label: 'Empleados', icon: '✤', link: '/employees' },
        { label: 'Usuarios',  icon: '⚙', link: '/users', permiso: 'usuario:read' },
        { label: 'Roles',     icon: '⛨', link: '/roles', permiso: 'rol:read' },
      ],
    },
  ];

  readonly nav = computed<NavSection[]>(() => {
    const source = this.store.rol() === 'CLIENTE' ? this.clienteNav : this.adminNav;
    // Ítems con `permiso` solo aparecen si el usuario lo tiene; el resto siempre.
    // Las secciones que quedan sin ítems visibles no se muestran.
    return source
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => !item.permiso || this.store.hasPermission(item.permiso),
        ),
      }))
      .filter((section) => section.items.length > 0);
  });

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
