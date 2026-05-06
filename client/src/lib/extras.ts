export interface Extra {
  id: string;
  nombre: string;
  precio: number; // 0 = gratis
  categoria?: string; // opcional: 'bebidas', 'alimentos', etc.
}

// Lista de extras comunes (puedes ampliarla)
export const extrasDisponibles: Extra[] = [
  // Lácteos
  { id: 'leche_deslactosada', nombre: 'Leche deslactosada', precio: 5, categoria: 'bebidas' },
  { id: 'leche_almendras', nombre: 'Leche de almendras', precio: 8, categoria: 'bebidas' },
  { id: 'leche_soya', nombre: 'Leche de soya', precio: 6, categoria: 'bebidas' },
  // Café
  { id: 'shot_extra', nombre: 'Shot extra de espresso', precio: 10, categoria: 'bebidas' },
  { id: 'crema_batida', nombre: 'Crema batida', precio: 12, categoria: 'bebidas' },
  // Salsas / Complementos
  { id: 'chilaquiles_rojos', nombre: 'Chilaquiles rojos', precio: 0, categoria: 'alimentos' },
  { id: 'chilaquiles_verdes', nombre: 'Chilaquiles verdes', precio: 0, categoria: 'alimentos' },
  { id: 'salsa_extra', nombre: 'Salsa extra picante', precio: 0, categoria: 'alimentos' },
  { id: 'queso_extra', nombre: 'Queso extra', precio: 15, categoria: 'alimentos' },
  // General
  { id: 'sin_azucar', nombre: 'Sin azúcar', precio: 0 },
  { id: 'hielo_separado', nombre: 'Hielo separado', precio: 0 },
];
