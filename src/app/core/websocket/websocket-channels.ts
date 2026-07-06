export const WS_TOPICS = {
  reservas: '/topic/reservas',
  habitaciones: '/topic/habitaciones',
  incidencias: '/topic/incidencias',
  pagos: '/topic/pagos',
  // Cola personal por usuario (Spring resuelve el prefijo /user/ a la sesión
  // autenticada), no un broadcast: cada huésped recibe solo sus notificaciones.
  notificaciones: '/user/queue/notificaciones',
  asistencia: '/topic/asistencia',
  nomina: '/topic/nomina',
  compras: '/topic/compras',
  ventas: '/topic/ventas',
  inventario: '/topic/inventario',
  servicios: '/topic/servicios',
} as const;

export type WebSocketTopic = (typeof WS_TOPICS)[keyof typeof WS_TOPICS];

export interface WebSocketEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}
