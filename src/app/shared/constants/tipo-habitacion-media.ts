/**
 * Imagen referencial e información destacada por tipo de habitación.
 * El backend aún no entrega URL de imagen por tipo: mientras tanto se usan
 * estas referencias. Para usar fotos reales del hotel, colocar los archivos
 * en public/rooms/ y actualizar las rutas.
 */
export interface TipoHabitacionMedia {
  imagen: string;
  info: string[];
}

const MEDIA: Record<string, TipoHabitacionMedia> = {
  simple: {
    imagen: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    info: ['1 cama individual', 'Ideal para viajeros de negocios', 'Baño privado y TV por cable'],
  },
  doble: {
    imagen: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
    info: ['2 camas individuales', 'Perfecta para amigos o colegas', 'Baño privado y escritorio'],
  },
  matrimonial: {
    imagen: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    info: ['1 cama de dos plazas', 'Pensada para parejas', 'Baño privado y agua caliente'],
  },
};

const FALLBACK: TipoHabitacionMedia = {
  imagen: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  info: ['Habitación cómoda y bien equipada'],
};

/** Busca por nombre del tipo (Simple, Doble, Matrimonial), tolerante a variantes. */
export function mediaTipoHabitacion(nombreTipo: string | null | undefined): TipoHabitacionMedia {
  const n = (nombreTipo ?? '').toLowerCase();
  for (const key of Object.keys(MEDIA)) {
    if (n.includes(key)) return MEDIA[key];
  }
  return FALLBACK;
}
