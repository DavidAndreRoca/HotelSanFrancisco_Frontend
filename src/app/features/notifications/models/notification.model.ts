// features/notifications/models/notification.model.ts

// ── Notificaciones inbox del huésped ──────────────────────────────────────────

export type TipoNotificacion =
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'PAGO'
  | 'SERVICIO'
  | 'CONFIRMACION'
  | 'FACTURA';

export interface NotificacionHuesped {
  notificacionId: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
  referenciaId?: number | null;
}

// ── Admin: configuración SMTP / email ─────────────────────────────────────────

export type SmtpSecurity = 'NONE' | 'SSL' | 'TLS';

/** Coincide con SmtpConfigResponse del backend */
export interface SmtpConfig {
  host: string;
  puerto: number;
  usuario: string;
  seguridad: SmtpSecurity;
  nombreRemitente: string;
  correoRemitente: string;
  responderA: string | null;
  habilitado: boolean;
}

/** Coincide con UpdateSmtpConfigRequest del backend */
export interface SmtpConfigUpdatePayload {
  host: string;
  puerto: number;
  usuario: string;
  /** Solo se envía si se desea cambiar; el backend no la devuelve nunca en lecturas. */
  password?: string;
  seguridad: SmtpSecurity;
  nombreRemitente: string;
  correoRemitente: string;
  responderA?: string | null;
  habilitado: boolean;
}

export interface SmtpTestResult {
  success: boolean;
  message: string;
  sentAt: string;
}

// ---------------------------------------------------------------------
// Plantillas y tipos de correo
// ---------------------------------------------------------------------

export type EmailTemplateKey =
  | 'RESERVATION_CONFIRMATION'
  | 'PAYMENT_CONFIRMATION'
  | 'RESERVATION_CANCELLATION'
  | 'STAY_REMINDER';

/** Coincide con EmailTemplateResponse del backend */
export interface EmailTemplate {
  clave: EmailTemplateKey;
  nombre: string;
  asunto: string;
  cuerpoHtml: string;
  activo: boolean;
  variables: string[];
}

export type EmailTemplateUpdatePayload = Partial<Pick<EmailTemplate, 'asunto' | 'cuerpoHtml' | 'activo'>>;

// ---------------------------------------------------------------------
// Log de correos enviados
// ---------------------------------------------------------------------

export type EmailStatus = 'ENVIADO' | 'PENDIENTE' | 'FALLIDO';

/** Coincide con EmailLogResponse del backend */
export interface EmailLogEntry {
  id: number;
  destinatario: string;
  asunto: string;
  plantilla: EmailTemplateKey;
  estado: EmailStatus;
  reservaId: number | null;
  codReserva: string | null;
  pagoId: number | null;
  enviadoEn: string; // ISO datetime
  error: string | null;
  intentos: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/** Coincide con EmailLogFilterRequest del backend */
export interface EmailLogFilters {
  search: string;
  estado: EmailStatus | '';
  plantilla: EmailTemplateKey | '';
  page: number;
  size: number;
  sort: string;
}

export const DEFAULT_EMAIL_LOG_FILTERS: EmailLogFilters = {
  search: '',
  estado: '',
  plantilla: '',
  page: 0,
  size: 10,
  sort: 'enviadoEn,desc',
};

// ---------------------------------------------------------------------
// Recordatorios automáticos
// ---------------------------------------------------------------------

/** Coincide con ReminderSettingsResponse del backend */
export interface ReminderSettings {
  horasAntesCheckIn: number;
  habilitado: boolean;
  horaEnvio: string;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  horasAntesCheckIn: 24,
  habilitado: true,
  horaEnvio: '08:00',
};

// ---------------------------------------------------------------------
// Payloads de envío manual / triggers
// ---------------------------------------------------------------------

export interface SendReservationConfirmationPayload {
  reservaId: number;
}

export interface SendPaymentConfirmationPayload {
  pagoId: number;
}

export interface SendCancellationPayload {
  reservaId: number;
  motivo?: string;
}

export interface RunReminderJobResult {
  enviados: number;
}
