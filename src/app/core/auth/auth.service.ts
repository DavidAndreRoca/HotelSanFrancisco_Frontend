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
  RegisterResponseBody,
  ResendVerificationRequest,
  ResetPasswordRequest,
  UpdatePerfilRequest,
  VerifyEmailRequest,
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

  /**
   * Registro con verificación de correo obligatoria: ya NO inicia sesión.
   * Devuelve el mensaje del backend; el usuario debe verificar su correo antes
   * de poder loguearse. No se setean cookies ni se toca el store.
   */
  register(payload: RegisterRequest): Observable<RegisterResponseBody> {
    return this.api.post<RegisterResponseBody, RegisterRequest>('/auth/register', payload);
  }

  /** Confirma la cuenta con el código de 6 dígitos enviado por correo. No inicia sesión. */
  verifyEmail(payload: VerifyEmailRequest): Observable<void> {
    return this.api.post<void, VerifyEmailRequest>('/auth/verify-email', payload);
  }

  /**
   * Reenvía el código de verificación (invalida el anterior). Siempre responde 200.
   * Devuelve el `message` neutro del backend (vive en el sobre, no en `data`).
   */
  resendVerification(payload: ResendVerificationRequest): Observable<string> {
    return this.api
      .postFull<void, ResendVerificationRequest>('/auth/resend-verification', payload)
      .pipe(
        map(
          (res) =>
            res.message ??
            'Si existe una cuenta sin verificar con ese correo, recibirás un nuevo código.',
        ),
      );
  }

  getDocumentTypes(): Observable<readonly PublicDocumentType[]> {
    return this.api.get<readonly PublicDocumentType[]>('/auth/document-types');
  }

  // Responsabilidad única: rota el token y setea el usuario en éxito. NO limpia
  // la sesión en fallo: el clear() + redirect vive en un solo lugar
  // (errorInterceptor), que es el que ve el 401 definitivo cuando el refresh
  // falla. Único consumidor: refreshInterceptor.
  refresh(): Observable<AuthUser | null> {
    return this.api.post<LoginResponseBody, null>('/auth/refresh', null).pipe(
      map((res) => res.user),
      tap((user) => this.store.setUser(user)),
      catchError(() => of(null)),
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
