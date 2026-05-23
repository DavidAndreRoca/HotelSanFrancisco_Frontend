export const WS_TOPICS = {
  reservas: '/topic/reservas',
  habitaciones: '/topic/habitaciones',
  incidencias: '/topic/incidencias',
  pagos: '/topic/pagos',
  notificaciones: '/topic/notificaciones',
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
