// features/mi-asistencia/models/mi-asistencia.model.ts
// Marcado self-service — el empleado logueado marca su propia entrada/salida.
// El usuario sale del JWT: los POST de marcar no llevan body.

import { TipoAsistencia } from '../../asistencia/models/asistencia.model';

export interface MiAsistenciaResponse {
  asistenciaId: number;
  fecha: string; // "YYYY-MM-DD"
  horaIngreso: string; // "HH:mm:ss"
  horaEgreso: string | null;
  horasTrabajadas: number | null;
  tipo: TipoAsistencia; // NORMAL | TARDANZA | …
  observaciones: string | null;
  usuarioId: number;
  usuarioNombreCompleto: string;
  turnoId: number | null;
  fechaCreacion: string; // ISO LocalDateTime
  fechaModificacion: string | null;
}
