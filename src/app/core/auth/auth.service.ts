import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiClient } from '../http/http-client.service';
import { AuthStore } from './auth.store';
import {
  AuthUser,
  ChangePasswordRequest,
  DashboardClienteResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponseBody,
  MiDashboardResponse,
  MiReservaItem,
  PerfilUsuarioResponse,
  PublicDocumentType,
  RegisterRequest,
  ResetPasswordRequest,
  UpdatePerfilRequest,
} from './auth-user.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly store = inject(AuthStore);

  login(credentials: LoginRequest): Observable<AuthUser> {
    return this.api.post<LoginResponseBody, LoginRequest>('/auth/login', credentials).pipe(
      map((res) => res.user),
      tap((user) => this.store.setUser(user)),
    );
  }

  register(payload: RegisterRequest): Observable<AuthUser> {
    return this.api.post<LoginResponseBody, RegisterRequest>('/auth/register', payload).pipe(
      map((res) => res.user),
      tap((user) => this.store.setUser(user)),
    );
  }

  getDocumentTypes(): Observable<readonly PublicDocumentType[]> {
    return this.api.get<readonly PublicDocumentType[]>('/auth/document-types');
  }

  refresh(): Observable<AuthUser | null> {
    return this.api.post<LoginResponseBody, null>('/auth/refresh', null).pipe(
      map((res) => res.user),
      tap((user) => this.store.setUser(user)),
      catchError(() => {
        this.store.clear();
        return of(null);
      }),
    );
  }

  me(): Observable<AuthUser | null> {
    return this.api.get<AuthUser>('/auth/me').pipe(
      tap((user) => this.store.setUser(user)),
      catchError(() => {
        this.store.clear();
        return of(null);
      }),
    );
  }

  logout(): Observable<void> {
    return this.api.post<void, null>('/auth/logout', null).pipe(
      tap(() => this.store.clear()),
      catchError(() => {
        this.store.clear();
        return of(undefined as unknown as void);
      }),
    );
  }

  changePassword(payload: ChangePasswordRequest): Observable<void> {
    return this.api.post<void, ChangePasswordRequest>('/auth/change-password', payload);
  }

  /** Resumen del dashboard para el cliente (stats + próxima reserva). */
  getMiDashboard(): Observable<MiDashboardResponse> {
    return this.api.get<MiDashboardResponse>('/auth/me/dashboard');
  }

  /** Lista de reservas del cliente logueado. */
  getMisReservas(params?: { estado?: string }): Observable<MiReservaItem[]> {
    return this.api.get<MiReservaItem[]>('/api/v1/mis-reservas', { params });
  }

  /** Perfil extendido del usuario logueado (teléfono, doc, dirección, fechaCreacion). */
  getMyProfile(): Observable<PerfilUsuarioResponse> {
    return this.api.get<PerfilUsuarioResponse>('/auth/me');
  }

  /** Editar datos personales propios sin permisos administrativos. */
  updateMyProfile(payload: UpdatePerfilRequest): Observable<PerfilUsuarioResponse> {
    return this.api.patch<PerfilUsuarioResponse, UpdatePerfilRequest>('/auth/me', payload);
  }

  /** Resumen del dashboard para el cliente logueado. */
  getMyDashboard(): Observable<DashboardClienteResponse> {
    return this.api.get<DashboardClienteResponse>('/auth/me/dashboard');
  }

  /** Paso 1: solicita el envío del enlace de recuperación al correo. */
  forgotPassword(payload: ForgotPasswordRequest): Observable<void> {
    return this.api.post<void, ForgotPasswordRequest>('/auth/forgot-password', payload);
  }

  /** Paso 2: establece la nueva contraseña usando el token recibido por correo. */
  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.api.post<void, ResetPasswordRequest>('/auth/reset-password', payload);
  }
}
