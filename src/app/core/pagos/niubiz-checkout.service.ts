import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../http/http-client.service';
import { environment } from '../../../environments/environment';

/** Datos de sesión que devuelve POST /api/v1/booking/{id}/pago/session. */
export interface SesionPagoNiubiz {
  reservaId: number;
  purchaseNumber: string;
  sessionKey: string;
  merchantId: string;
  monto: number;
  moneda: string;
  checkoutScriptUrl: string;
  expirationTime: number | null;
}

/** Datos opcionales del titular para pre-llenar el formulario del checkout. */
export interface TitularCheckout {
  nombres?: string;
  apellidos?: string;
  correo?: string;
}

declare global {
  interface Window {
    VisanetCheckout?: {
      configure(config: Record<string, unknown>): void;
      open(): void;
    };
  }
}

/**
 * Integración ÚNICA con el Botón de Pago de Niubiz, compartida por el booking
 * público (cliente) y el dashboard (recepcionista/admin). El checkout entrega
 * el transactionToken con un form-POST al backend (`action`), que autoriza el
 * cobro y redirige con el resultado; `origen` decide la pantalla de retorno.
 */
@Injectable({ providedIn: 'root' })
export class NiubizCheckoutService {
  private readonly api = inject(ApiClient);

  private scriptCargado: Promise<void> | null = null;
  private scriptUrl: string | null = null;

  /** Crea la sesión de pago de una reserva PENDIENTE (mismo endpoint para todos los roles). */
  crearSesion(reservaId: number): Observable<SesionPagoNiubiz> {
    return this.api.post<SesionPagoNiubiz>(`/api/v1/booking/${reservaId}/pago/session`, {});
  }

  /**
   * Abre el lightbox de Niubiz. Resuelve cuando el checkout quedó abierto
   * (el resultado del pago llega luego por el redirect de retorno del backend).
   */
  async abrirCheckout(
    sesion: SesionPagoNiubiz,
    origen: 'booking' | 'mis-reservas' | 'reservations' | 'mis-pagos',
    titular?: TitularCheckout,
  ): Promise<void> {
    await this.cargarScript(sesion.checkoutScriptUrl);
    const checkout = window.VisanetCheckout;
    if (!checkout) {
      throw new Error('No se pudo inicializar el checkout de Niubiz');
    }
    const action =
      `${environment.apiUrl}/api/v1/booking/pago/retorno/${sesion.purchaseNumber}` +
      (origen !== 'booking' ? `?origen=${origen}` : '');

    const timeoutPath =
      origen === 'mis-reservas' ? '/reservations/mis-reservas' :
      origen === 'reservations' ? '/reservations' :
      origen === 'mis-pagos' ? '/mis-pagos' :
      '/booking';

    checkout.configure({
      sessiontoken: sesion.sessionKey,
      channel: 'web',
      merchantid: sesion.merchantId,
      purchasenumber: sesion.purchaseNumber,
      amount: sesion.monto,
      expirationminutes: '15',
      timeouturl: `${window.location.origin}${timeoutPath}?pago=timeout`,
      merchantlogo: '',
      formbuttoncolor: '#C5A048',
      action,
      showamount: true,
      cardholdername: titular?.nombres ?? '',
      cardholderlastname: titular?.apellidos ?? '',
      cardholderemail: titular?.correo ?? '',
    });
    checkout.open();
  }

  private cargarScript(url: string): Promise<void> {
    if (this.scriptCargado && this.scriptUrl === url) {
      return this.scriptCargado;
    }
    this.scriptUrl = url;
    this.scriptCargado = new Promise<void>((resolve, reject) => {
      if (window.VisanetCheckout) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('checkout.js load error'));
      document.head.appendChild(script);
    });
    return this.scriptCargado;
  }
}
