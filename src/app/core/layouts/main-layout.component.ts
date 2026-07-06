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

/**
 * Paths SVG (estilo Heroicons outline, viewBox 24x24, stroke) para los iconos
 * del sidebar. Cuando `NavItem.icon` coincide con una clave de aquí se pinta el
 * SVG; si no, se usa el carácter Unicode como fallback (sidebar admin).
 */
const ICON_PATHS: Record<string, string> = {
  dashboard: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  bell: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  bag: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z',
  card: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
  user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  clipboard: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
  warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  sparkles: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z',
  list: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  cart: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
  box: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  truck: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
  chart: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  briefcase: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 6.006a2.18 2.18 0 01-.75 1.661m-16.5 0v-4.25m16.5 4.25v-2.59m-16.5 2.59a2.18 2.18 0 01-.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z',
  tag: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z',
  key: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z',
  envelope: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  idcard: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  cog: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
};

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
                @if (iconPath(item.icon); as d) {
                  <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.7" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="d" />
                  </svg>
                } @else {
                  <span class="inline-flex items-center justify-center w-5 shrink-0 text-base leading-none" aria-hidden="true">{{ item.icon }}</span>
                }
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
                    @if (iconPath(item.icon); as d) {
                      <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="1.7" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="d" />
                      </svg>
                    } @else {
                      <span class="inline-flex items-center justify-center w-5 shrink-0 text-base leading-none" aria-hidden="true">{{ item.icon }}</span>
                    }
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

  /** Devuelve el path SVG del icono, o null si es un glifo Unicode (fallback). */
  iconPath(icon: string): string | null {
    return ICON_PATHS[icon] ?? null;
  }

  private readonly clienteNav: NavSection[] = [
    {
      items: [
        { label: 'Dashboard', icon: 'dashboard', link: '/dashboard-cliente' },
        { label: 'Mis Reservas', icon: 'calendar', link: '/reservations/mis-reservas' },
        { label: 'Notificaciones', icon: 'bell', link: '/notifications' },
        { label: 'Servicios', icon: 'star', link: '/servicios-catalogo' },
        { label: 'Mis pedidos', icon: 'bag', link: '/mis-pedidos' },
        { label: 'Pagos y facturas', icon: 'card', link: '/mis-pagos' },
        { label: 'Mi Perfil', icon: 'user', link: '/mi-cuenta' },
      ],
    },
  ];

  private readonly adminNav: NavSection[] = [
    {
      items: [{ label: 'Dashboard', icon: 'dashboard', link: '/dashboard' }],
    },
    {
      title: 'Operación',
      items: [
        { label: 'Reservas',     icon: 'calendar',  link: '/reservations' },
        { label: 'Huéspedes',    icon: 'users',     link: '/guests' },
        { label: 'Pedidos serv.',icon: 'clipboard', link: '/pedidos-servicio', permiso: 'servicio:read' },
        { label: 'Incidencias',  icon: 'warning',   link: '/incidencias' },
      ],
    },
    {
      title: 'Servicios y ventas',
      items: [
        { label: 'Servicios',     icon: 'sparkles', link: '/servicios', permiso: 'servicio:read' },
        { label: 'Catálogo serv.',icon: 'list',     link: '/tipos-servicio', permiso: 'tipo-servicio:read' },
        { label: 'Punto de venta',icon: 'cart',     link: '/pos', permiso: 'venta:read' },
        { label: 'Productos',     icon: 'box',      link: '/products' },
        { label: 'Compras',       icon: 'truck',    link: '/purchases' },
      ],
    },
    {
      title: 'Finanzas',
      items: [
        { label: 'Pagos',     icon: 'card',      link: '/payments' },
        { label: 'Reportes',  icon: 'chart',     link: '/reports' },
        { label: 'Gerencial', icon: 'briefcase', link: '/management' },
      ],
    },
    {
      title: 'Alojamiento',
      items: [
        { label: 'Tipos de hab.', icon: 'tag', link: '/rooms' },
        { label: 'Habitaciones',  icon: 'key', link: '/habitaciones', permiso: 'habitacion:read' },
      ],
    },
    {
      title: 'Comunicación',
      items: [
        { label: 'Log de correos', icon: 'envelope', link: '/notifications/log', permiso: 'usuario:read' },
      ],
    },
    {
      title: 'Personal',
      items: [
        { label: 'Nómina',     icon: 'card',   link: '/nomina',     permiso: 'nomina:read' },
        { label: 'Asistencia', icon: 'idcard', link: '/asistencia', permiso: 'asistencia:read' },
      ],
    },
    {
      title: 'Administración',
      items: [
        { label: 'Empleados', icon: 'idcard', link: '/employees' },
        { label: 'Usuarios',  icon: 'cog',    link: '/users', permiso: 'usuario:read' },
        { label: 'Roles',     icon: 'shield', link: '/roles', permiso: 'rol:read' },
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
