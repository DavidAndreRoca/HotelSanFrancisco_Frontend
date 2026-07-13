/**
 * Lista cerrada de nacionalidades para selects (registro, clientes, etc.).
 * Mantener orden alfabético salvo "Peruana", que va primero por ser la más usada.
 */
export const NACIONALIDADES: readonly string[] = [
  'Peruana',
  'Alemana',
  'Argentina',
  'Australiana',
  'Boliviana',
  'Brasileña',
  'Británica',
  'Canadiense',
  'Chilena',
  'China',
  'Colombiana',
  'Coreana',
  'Costarricense',
  'Cubana',
  'Danesa',
  'Dominicana',
  'Ecuatoriana',
  'Española',
  'Estadounidense',
  'Francesa',
  'Guatemalteca',
  'Haitiana',
  'Holandesa',
  'Hondureña',
  'India',
  'Israelí',
  'Italiana',
  'Japonesa',
  'Mexicana',
  'Nicaragüense',
  'Noruega',
  'Panameña',
  'Paraguaya',
  'Polaca',
  'Portuguesa',
  'Puertorriqueña',
  'Rusa',
  'Salvadoreña',
  'Sueca',
  'Suiza',
  'Uruguaya',
  'Venezolana',
  'Otra',
];

/**
 * Opciones para un select considerando un valor guardado con texto libre:
 * si no está en la lista, se antepone para no romper la edición de registros antiguos.
 */
export function opcionesNacionalidad(valorGuardado?: string | null): readonly string[] {
  const v = valorGuardado?.trim();
  if (v && !NACIONALIDADES.includes(v)) return [v, ...NACIONALIDADES];
  return NACIONALIDADES;
}
