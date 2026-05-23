import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { UiButtonComponent } from '../button/ui-button.component';
import { UiModalComponent } from '../modal/ui-modal.component';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

@Component({
  selector: 'ui-confirm-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, UiButtonComponent],
  template: `
    <ui-modal
      [open]="visible()"
      [title]="options().title"
      [size]="'sm'"
      (closed)="reject()">
      <p class="text-sm text-[var(--color-ink-soft)] leading-relaxed">
        {{ options().message }}
      </p>
      <ng-container modal-footer>
        <ui-button variant="ghost" (click)="reject()">
          {{ options().cancelText ?? 'Cancelar' }}
        </ui-button>
        <ui-button
          [variant]="options().variant === 'danger' ? 'danger' : 'primary'"
          (click)="accept()">
          {{ options().confirmText ?? 'Confirmar' }}
        </ui-button>
      </ng-container>
    </ui-modal>
  `,
})
export class ConfirmHostComponent {
  readonly options = input.required<ConfirmOptions>();
  readonly visible = signal(true);
  readonly result = output<boolean>();

  accept(): void {
    this.visible.set(false);
    this.result.emit(true);
  }

  reject(): void {
    this.visible.set(false);
    this.result.emit(false);
  }
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const host = document.createElement('div');
      document.body.appendChild(host);

      const ref: ComponentRef<ConfirmHostComponent> = createComponent(ConfirmHostComponent, {
        hostElement: host,
        environmentInjector: this.injector,
      });
      ref.setInput('options', options);
      ref.instance.result.subscribe((value) => {
        resolve(value);
        // Defer destroy so close animation can finish
        setTimeout(() => {
          this.appRef.detachView(ref.hostView);
          ref.destroy();
          host.remove();
        }, 200);
      });

      this.appRef.attachView(ref.hostView);
    });
  }
}
