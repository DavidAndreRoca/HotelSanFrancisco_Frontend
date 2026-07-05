import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthUser } from './auth-user.interface';
import { WebSocketService } from '../websocket/websocket.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly ws = inject(WebSocketService);

  private readonly _user = signal<AuthUser | null>(null);
  private readonly _ready = signal<boolean>(false);

  readonly user = this._user.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly permisos = computed(() => this._user()?.permisos ?? []);
  readonly rol = computed(() => this._user()?.rol ?? null);

  setUser(user: AuthUser): void {
    this._user.set(user);
    this._ready.set(true);
    // Una sola conexión WS por sesión; connect() es idempotente.
    this.ws.connect();
  }

  markReady(): void {
    this._ready.set(true);
  }

  clear(): void {
    this._user.set(null);
    this._ready.set(true);
    this.ws.disconnect();
  }

  hasPermission(permission: string): boolean {
    return this.permisos().includes(permission);
  }

  hasAnyPermission(permissions: readonly string[]): boolean {
    const owned = this.permisos();
    return permissions.some((p) => owned.includes(p));
  }
}
