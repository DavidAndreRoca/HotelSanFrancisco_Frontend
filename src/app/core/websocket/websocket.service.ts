import { DestroyRef, Injectable, NgZone, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export type WebSocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private readonly zone = inject(NgZone);
  private client: Client | null = null;

  private readonly _status = signal<WebSocketStatus>('idle');
  readonly status = this._status.asReadonly();

  connect(): void {
    if (this.client?.active) return;

    this._status.set('connecting');
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl) as unknown as WebSocket,
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => undefined,
      onConnect: () => this.zone.run(() => this._status.set('connected')),
      onWebSocketClose: () => this.zone.run(() => this._status.set('disconnected')),
      onStompError: () => this.zone.run(() => this._status.set('disconnected')),
    });
    this.client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
    this._status.set('idle');
  }

  subscribe<T>(destination: string): Observable<T> {
    const subject = new Subject<T>();
    let stompSub: StompSubscription | undefined;

    const tryBind = () => {
      if (!this.client?.active) return;
      stompSub = this.client.subscribe(destination, (msg: IMessage) => {
        try {
          const payload = msg.body ? (JSON.parse(msg.body) as T) : (null as unknown as T);
          this.zone.run(() => subject.next(payload));
        } catch {
          this.zone.run(() => subject.next(msg.body as unknown as T));
        }
      });
    };

    if (this.client?.active) {
      tryBind();
    } else {
      this.connect();
      const orig = this.client?.onConnect;
      if (this.client) {
        this.client.onConnect = (frame) => {
          this.zone.run(() => this._status.set('connected'));
          tryBind();
          orig?.(frame);
        };
      }
    }

    return new Observable<T>((observer) => {
      const sub = subject.subscribe(observer);
      return () => {
        stompSub?.unsubscribe();
        sub.unsubscribe();
      };
    });
  }

  /**
   * Suscripción a un topic ya atada al ciclo de vida del componente.
   * La conexión WS es única por sesión (ver AuthStore); aquí solo se libera
   * la suscripción STOMP cuando el componente se destruye, sin tumbar el socket.
   */
  onTopic<T>(destination: string, destroyRef: DestroyRef): Observable<T> {
    return this.subscribe<T>(destination).pipe(takeUntilDestroyed(destroyRef));
  }
}
