// features/usuarios/utils/usuario-ui.ts
import { EstadoUsuario } from '../models/usuario.model';

export const ESTADO_USUARIO_LABEL: Record<EstadoUsuario, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  BLOQUEADO: 'Bloqueado',
};

export const ESTADO_USUARIO_BADGE: Record<EstadoUsuario, string> = {
  ACTIVO: 'bg-emerald-100 text-emerald-700',
  INACTIVO: 'bg-gray-100 text-gray-600',
  BLOQUEADO: 'bg-red-100 text-red-600',
};

export const ESTADOS_USUARIO: EstadoUsuario[] = ['ACTIVO', 'INACTIVO', 'BLOQUEADO'];
