import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

export function bootstrapSession(): () => Promise<void> {
  return async () => {
    const auth = inject(AuthService);
    const store = inject(AuthStore);
    try {
      await firstValueFrom(auth.me());
    } catch {
      store.clear();
    } finally {
      store.markReady();
    }
  };
}
