import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiClient } from '../http/http-client.service';
import { AuthStore } from './auth.store';
import {
  AuthUser,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponseBody,
  PublicDocumentType,
  RegisterRequest,
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
}
