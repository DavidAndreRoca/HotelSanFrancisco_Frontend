// features/notifications/pages/notifications-settings/notifications-settings.component.ts
import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../../services/notifications.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiCardComponent } from '../../../../shared/ui/card/ui-card.component';
import { UiBadgeComponent, BadgeTone } from '../../../../shared/ui/badge/ui-badge.component';
import { UiEmptyStateComponent } from '../../../../shared/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../../shared/ui/skeleton/ui-skeleton.component';
import { EmailStatus, SmtpSecurity } from '../../models/notification.model';

const LOG_TONE: Record<EmailStatus, BadgeTone> = {
  ENVIADO: 'success',
  PENDIENTE: 'warning',
  FALLIDO: 'danger',
};

const LOG_LABEL: Record<EmailStatus, string> = {
  ENVIADO: 'Enviado',
  PENDIENTE: 'Pendiente',
  FALLIDO: 'Fallido',
};

@Component({
  selector: 'app-notifications-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    UiButtonComponent,
    UiCardComponent,
    UiBadgeComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
  ],
  template: `
    <div class="space-y-6">
      <header>
        <h1 class="text-2xl font-bold tracking-tight">Notificaciones y correo</h1>
        <p class="text-[13px] text-[var(--color-ink-muted)] mt-1">
          Configura el servidor SMTP, recordatorios automáticos y revisa el historial de envíos.
        </p>
      </header>

      <!-- Configuración SMTP (solo lectura) -->
      <ui-card title="Servidor SMTP" subtitle="Datos de conexión para el envío de correos transaccionales (solo lectura).">
        @if (notificationService.smtpLoading()) {
          <div class="space-y-3">
            <ui-skeleton height="2.5rem" />
            <ui-skeleton height="2.5rem" />
            <ui-skeleton height="2.5rem" />
          </div>
        } @else {
          <form [formGroup]="smtpForm" novalidate class="space-y-4">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label for="host" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Host SMTP <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input id="host" type="text" formControlName="host" placeholder="smtp.gmail.com"
                  class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
              <div>
                <label for="puerto" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Puerto <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input id="puerto" type="number" formControlName="puerto" placeholder="587"
                  class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label for="usuario" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Usuario <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input id="usuario" type="text" formControlName="usuario" placeholder="reservas@hotelsanfrancisco.pe"
                  class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
              <div>
                <label for="password" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Contraseña / App Password
                </label>
                <input id="password" type="password" formControlName="password" placeholder="Dejar vacío para no cambiar"
                  class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
            </div>

            <div class="grid sm:grid-cols-3 gap-4">
              <div>
                <label for="security" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Seguridad
                </label>
                <select id="security" formControlName="seguridad"
                  class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
                  <option value="TLS">TLS (STARTTLS)</option>
                  <option value="SSL">SSL</option>
                  <option value="NONE">Sin cifrado</option>
                </select>
              </div>
              <div>
                <label for="nombreRemitente" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Nombre remitente
                </label>
                <input id="nombreRemitente" type="text" formControlName="nombreRemitente" placeholder="Hotel San Francisco"
                  class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
              <div>
                <label for="correoRemitente" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Correo remitente <span class="text-[var(--color-danger-500)]">*</span>
                </label>
                <input id="correoRemitente" type="email" formControlName="correoRemitente" placeholder="no-responder@hotelsanfrancisco.pe"
                  class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4 items-end">
              <div>
                <label for="responderA" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
                  Responder a (opcional)
                </label>
                <input id="responderA" type="email" formControlName="responderA" placeholder="atencion@hotelsanfrancisco.pe"
                  class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>
              <label class="flex items-center gap-2.5 text-[13px] font-medium text-[var(--color-ink-soft)] h-11">
                <input type="checkbox" formControlName="habilitado" class="w-4 h-4 accent-[var(--color-primary-500)]" />
                Habilitar envío automático de correos
              </label>
            </div>

            <div class="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--color-border-soft)]">
              <p class="text-[12px] text-[var(--color-ink-muted)]">
                La edición de la configuración SMTP está deshabilitada. Se muestra en modo solo lectura.
              </p>

              <div class="flex items-center gap-2 ml-auto">
                <input type="email" [(ngModel)]="testEmail" [ngModelOptions]="{standalone: true}"
                  placeholder="correo@prueba.com"
                  class="h-10 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                <ui-button type="button" variant="outline" [loading]="testingSmtp()" (click)="testSmtp()">
                  Enviar prueba
                </ui-button>
              </div>
            </div>
          </form>
        }
      </ui-card>

      <!-- Recordatorios automáticos -->
      <ui-card title="Recordatorios automáticos" subtitle="Envío automático de recordatorios de estadía próxima.">
        <form [formGroup]="reminderForm" (ngSubmit)="saveReminders()" novalidate class="grid sm:grid-cols-3 gap-4 items-end">
          <div>
            <label for="horas" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Horas antes del check-in
            </label>
            <input id="horas" type="number" min="1" max="72" formControlName="horasAntesCheckIn"
              class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
          </div>
          <div>
            <label for="horaEnvio" class="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Hora de envío del job
            </label>
            <input id="horaEnvio" type="time" formControlName="horaEnvio"
              class="mt-1.5 w-full h-11 px-3 rounded-lg border border-[var(--color-border-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
          </div>
          <label class="flex items-center gap-2.5 text-[13px] font-medium text-[var(--color-ink-soft)] h-11">
            <input type="checkbox" formControlName="habilitado" class="w-4 h-4 accent-[var(--color-primary-500)]" />
            Habilitar recordatorios automáticos
          </label>

          <div class="sm:col-span-3 flex flex-wrap gap-3 pt-2 border-t border-[var(--color-border-soft)]">
            <ui-button type="submit" variant="primary" [loading]="savingReminders()">
              Guardar configuración
            </ui-button>
            <ui-button type="button" variant="outline" [loading]="runningReminders()" (click)="runRemindersNow()">
              Ejecutar ahora
            </ui-button>
          </div>
        </form>
      </ui-card>

      <!-- Log de correos -->
      <ui-card title="Historial de correos enviados" subtitle="Últimos correos transaccionales y su estado de entrega.">
        @if (notificationService.logLoading()) {
          <div class="space-y-3">
            @for (i of [1, 2, 3]; track i) {
              <ui-skeleton height="2.5rem" />
            }
          </div>
        } @else if (!notificationService.logItems().length) {
          <ui-empty-state icon="✉" title="Sin correos registrados" description="Aún no se han enviado correos transaccionales." />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-[var(--color-surface)] text-[12px] text-[var(--color-ink-muted)] uppercase tracking-wide">
                <tr>
                  <th class="text-left px-4 py-3 font-medium">Destinatario</th>
                  <th class="text-left px-4 py-3 font-medium">Asunto</th>
                  <th class="text-left px-4 py-3 font-medium">Reserva</th>
                  <th class="text-left px-4 py-3 font-medium">Estado</th>
                  <th class="text-left px-4 py-3 font-medium">Fecha</th>
                  <th class="text-right px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--color-border-soft)]">
                @for (entry of notificationService.logItems(); track entry.id) {
                  <tr class="hover:bg-[var(--color-surface)]/60 transition-colors">
                    <td class="px-4 py-3">{{ entry.destinatario }}</td>
                    <td class="px-4 py-3">{{ entry.asunto }}</td>
                    <td class="px-4 py-3">{{ entry.codReserva ?? '—' }}</td>
                    <td class="px-4 py-3">
                      <ui-badge [tone]="LOG_TONE[entry.estado]">{{ LOG_LABEL[entry.estado] }}</ui-badge>
                    </td>
                    <td class="px-4 py-3 text-[var(--color-ink-soft)]">
                      {{ entry.enviadoEn | date:'dd/MM/yyyy HH:mm' }}
                    </td>
                    <td class="px-4 py-3 text-right">
                      @if (entry.estado === 'FALLIDO') {
                        <button type="button"
                          class="text-[12px] font-medium text-[var(--color-primary-700)] hover:underline"
                          (click)="retry(entry.id)">
                          Reintentar
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </ui-card>
    </div>
  `,
})
export class NotificationsSettingsComponent implements OnInit {
  readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  readonly LOG_TONE = LOG_TONE;
  readonly LOG_LABEL = LOG_LABEL;

  readonly testingSmtp = signal(false);
  readonly savingReminders = signal(false);
  readonly runningReminders = signal(false);
  testEmail = '';

  readonly smtpForm = this.fb.group({
    host: this.fb.nonNullable.control('', Validators.required),
    puerto: this.fb.nonNullable.control<number>(587, [Validators.required, Validators.min(1)]),
    usuario: this.fb.nonNullable.control('', Validators.required),
    password: this.fb.control<string | null>(null),
    seguridad: this.fb.nonNullable.control<SmtpSecurity>('TLS', Validators.required),
    nombreRemitente: this.fb.nonNullable.control('', Validators.required),
    correoRemitente: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    responderA: this.fb.control<string | null>(null),
    habilitado: this.fb.nonNullable.control(true),
  });

  readonly reminderForm = this.fb.group({
    horasAntesCheckIn: this.fb.nonNullable.control<number>(24, [Validators.required, Validators.min(1), Validators.max(72)]),
    horaEnvio: this.fb.nonNullable.control('08:00', Validators.required),
    habilitado: this.fb.nonNullable.control(true),
  });

  // La edición de SMTP está deshabilitada: cuando llega la config la mostramos
  // en el formulario y lo dejamos en modo solo lectura (sin PUT).
  private readonly syncSmtpForm = effect(() => {
    const cfg = this.notificationService.smtpConfig();
    if (cfg) {
      this.smtpForm.patchValue({ ...cfg, password: null });
      this.smtpForm.disable({ emitEvent: false });
    }
  });

  ngOnInit(): void {
    this.notificationService.loadSmtpConfig();
    this.notificationService.loadReminderSettings();
    this.notificationService.loadLog();

    const reminders = this.notificationService.reminderSettings();
    if (reminders) this.reminderForm.patchValue(reminders);
  }

  testSmtp(): void {
    if (!this.testEmail) {
      this.toastr.warning('Ingresa un correo de destino para la prueba.');
      return;
    }
    this.testingSmtp.set(true);
    this.notificationService.testSmtpConfig(this.testEmail).subscribe({
      next: (res) => {
        this.testingSmtp.set(false);
        if (res.success) {
          this.toastr.success(res.message || 'Correo de prueba enviado correctamente.');
        } else {
          this.toastr.error(res.message || 'No se pudo enviar el correo de prueba.');
        }
      },
      error: (err: { friendlyMessage?: string }) => {
        this.testingSmtp.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo enviar el correo de prueba.');
      },
    });
  }

  saveReminders(): void {
    if (this.reminderForm.invalid) {
      this.reminderForm.markAllAsTouched();
      return;
    }
    this.savingReminders.set(true);
    this.notificationService.updateReminderSettings(this.reminderForm.getRawValue()).subscribe({
      next: () => {
        this.savingReminders.set(false);
        this.toastr.success('Configuración de recordatorios guardada.');
      },
      error: (err: { friendlyMessage?: string }) => {
        this.savingReminders.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo guardar la configuración.');
      },
    });
  }

  runRemindersNow(): void {
    this.runningReminders.set(true);
    this.notificationService.runReminderJobNow().subscribe({
      next: (res) => {
        this.runningReminders.set(false);
        this.toastr.success(`Recordatorios enviados: ${res.enviados}.`);
        this.notificationService.loadLog();
      },
      error: (err: { friendlyMessage?: string }) => {
        this.runningReminders.set(false);
        this.toastr.error(err.friendlyMessage ?? 'No se pudo ejecutar el job de recordatorios.');
      },
    });
  }

  retry(id: number): void {
    this.notificationService.retry(id).subscribe({
      next: () => this.toastr.success('Reintento de envío realizado.'),
      error: (err: { friendlyMessage?: string }) => {
        this.toastr.error(err.friendlyMessage ?? 'No se pudo reintentar el envío.');
      },
    });
  }
}
