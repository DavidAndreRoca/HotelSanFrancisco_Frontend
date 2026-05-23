import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <main class="min-h-screen bg-[var(--color-surface)]">
      <router-outlet />
    </main>
  `,
})
export class AuthLayoutComponent {}
