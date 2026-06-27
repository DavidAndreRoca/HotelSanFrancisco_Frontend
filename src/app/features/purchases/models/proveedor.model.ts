/** Proveedor tal como lo devuelve el backend (`ProveedorResponse`). */
export interface Proveedor {
  proveedorId: number;
  rucNitCif: string;
  razonSocial: string;
  contactoNombre: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
}
