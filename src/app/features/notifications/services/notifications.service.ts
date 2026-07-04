// features/notifications/services/notification.service.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, Subject, catchError, finalize, switchMap, tap } from 'rxjs';
import { ApiClient, QueryParams } from '../../../core/http/http-client.service';
import {
  EmailLogEntry,
  EmailLogFilters,
  EmailTemplate,
  EmailTemplateKey,
  EmailTemplateUpdatePayload,
  PageResponse,
  ReminderSettings,
  RunReminderJobResult,
  SendCancellationPayload,
  SendPaymentConfirmationPayload,
  SendReservationConfirmationPayload,
  SmtpConfig,
  SmtpConfigUpdatePayload,
  SmtpTestResult,
} from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiClient);
  private readonly base = '/api/v1/notificaciones';

  // ---------------------------------------------------------------------
  // SMTP
  // ---------------------------------------------------------------------

  private readonly _smtpConfig = signal<SmtpConfig | null>(null);
  private readonly _smtpLoading = signal(false);
  private readonly _smtpError = signal<string | null>(null);

  readonly smtpConfig = this._smtpConfig.asReadonly();
  readonly smtpLoading = this._smtpLoading.asReadonly();
  readonly smtpError = this._smtpError.asReadonly();
  readonly smtpEnabled = computed(() => this._smtpConfig()?.habilitado ?? false);

  loadSmtpConfig(): void {
    this._smtpLoading.set(true);
    this._smtpError.set(null);
    this.api
      .get<SmtpConfig>(`${this.base}/smtp-config`)
      .pipe(finalize(() => this._smtpLoading.set(false)))
      .subscribe({
        next: (cfg) => this._smtpConfig.set(cfg),
        error: (err: { friendlyMessage?: string }) => {
          this._smtpError.set(err.friendlyMessage ?? 'No se pudo cargar la configuración SMTP.');
        },
      });
  }

  updateSmtpConfig(payload: SmtpConfigUpdatePayload): Observable<SmtpConfig> {
    return this.api
      .put<SmtpConfig, SmtpConfigUpdatePayload>(`${this.base}/smtp-config`, payload)
      .pipe(tap((cfg) => this._smtpConfig.set(cfg)));
  }

  /** Envía un correo de prueba usando la configuración SMTP actual */
  testSmtpConfig(destinatario: string): Observable<SmtpTestResult> {
    return this.api.post<SmtpTestResult, { destinatario: string }>(
      `${this.base}/smtp-config/test`,
      { destinatario },
    );
  }

  // ---------------------------------------------------------------------
  // Plantillas
  // ---------------------------------------------------------------------

  private readonly _templates = signal<EmailTemplate[]>([]);
  private readonly _templatesLoading = signal(false);

  readonly templates = this._templates.asReadonly();
  readonly templatesLoading = this._templatesLoading.asReadonly();

  loadTemplates(): void {
    this._templatesLoading.set(true);
    this.api
      .get<EmailTemplate[]>(`${this.base}/plantillas`)
      .pipe(finalize(() => this._templatesLoading.set(false)))
      .subscribe({
        next: (templates) => this._templates.set(templates),
        error: () => this._templates.set([]),
      });
  }

  updateTemplate(key: EmailTemplateKey, payload: EmailTemplateUpdatePayload): Observable<EmailTemplate> {
    return this.api
      .put<EmailTemplate, EmailTemplateUpdatePayload>(`${this.base}/plantillas/${key}`, payload)
      .pipe(
        tap((updated) =>
          this._templates.update((arr) => arr.map((t) => (t.clave === key ? updated : t))),
        ),
      );
  }

  // ---------------------------------------------------------------------
  // Envío de correos transaccionales
  // ---------------------------------------------------------------------

  /** Punto 9: Enviar correo de confirmación de reserva */
  sendReservationConfirmation(payload: SendReservationConfirmationPayload): Observable<EmailLogEntry> {
    return this.api.post<EmailLogEntry, SendReservationConfirmationPayload>(
      `${this.base}/reservas/confirmacion`,
      payload,
    );
  }

  /** Punto 10: Enviar correo de confirmación de pago */
  sendPaymentConfirmation(payload: SendPaymentConfirmationPayload): Observable<EmailLogEntry> {
    return this.api.post<EmailLogEntry, SendPaymentConfirmationPayload>(
      `${this.base}/pagos/confirmacion`,
      payload,
    );
  }

  /** Punto 11 (parcial): Enviar correo de cancelación */
  sendCancellationEmail(payload: SendCancellationPayload): Observable<EmailLogEntry> {
    return this.api.post<EmailLogEntry, SendCancellationPayload>(
      `${this.base}/reservas/cancelacion`,
      payload,
    );
  }

  // ---------------------------------------------------------------------
  // Recordatorios automáticos
  // ---------------------------------------------------------------------

  private readonly _reminderSettings = signal<ReminderSettings | null>(null);

  readonly reminderSettings = this._reminderSettings.asReadonly();

  loadReminderSettings(): void {
    this.api.get<ReminderSettings>(`${this.base}/recordatorios/config`).subscribe({
      next: (cfg) => this._reminderSettings.set(cfg),
      error: () => this._reminderSettings.set(null),
    });
  }

  updateReminderSettings(payload: ReminderSettings): Observable<ReminderSettings> {
    return this.api
      .put<ReminderSettings, ReminderSettings>(`${this.base}/recordatorios/config`, payload)
      .pipe(tap((cfg) => this._reminderSettings.set(cfg)));
  }

  /** Ejecuta manualmente el job de recordatorios automáticos (check-ins próximos) */
  runReminderJobNow(): Observable<RunReminderJobResult> {
    return this.api.post<RunReminderJobResult, null>(`${this.base}/recordatorios/ejecutar`, null);
  }

  // ---------------------------------------------------------------------
  // Log de correos enviados
  // ---------------------------------------------------------------------

  private readonly _logItems = signal<EmailLogEntry[]>([]);
  private readonly _logPage = signal<Omit<PageResponse<EmailLogEntry>, 'content'> | null>(null);
  private readonly _logLoading = signal(false);

  readonly logItems = this._logItems.asReadonly();
  readonly logPage = this._logPage.asReadonly();
  readonly logLoading = this._logLoading.asReadonly();

  // switchMap cancela la petición anterior si llega una nueva carga: evita que
  // una respuesta lenta y obsoleta pise a la más reciente al cambiar filtros.
  private readonly logRequest$ = new Subject<QueryParams>();
  private readonly logRequestSub = this.logRequest$
    .pipe(
      switchMap((params) =>
        this.api.get<PageResponse<EmailLogEntry>>(`${this.base}/log`, { params }).pipe(
          catchError(() => {
            this._logItems.set([]);
            this._logLoading.set(false);
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe((res) => {
      this._logItems.set(res.content);
      const { content: _content, ...rest } = res;
      this._logPage.set(rest);
      this._logLoading.set(false);
    });

  loadLog(params: Partial<EmailLogFilters> = {}): void {
    this._logLoading.set(true);
    this.logRequest$.next({
      search: params.search ?? '',
      estado: params.estado ?? '',
      plantilla: params.plantilla ?? '',
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: params.sort ?? 'enviadoEn,desc',
    });
  }

  /** Reintenta el envío de un correo fallido */
  retry(id: number): Observable<EmailLogEntry> {
    return this.api
      .post<EmailLogEntry, null>(`${this.base}/log/${id}/reintentar`, null)
      .pipe(
        tap((updated) =>
          this._logItems.update((arr) => arr.map((e) => (e.id === id ? updated : e))),
        ),
      );
  }
}
