export interface Producto {
    id_producto?: number;
    nombre_producto: string;
    descripcion?: string;
    precio: number;
    categoria: string;
    disponible: 'activo' | 'inactivo';
}
