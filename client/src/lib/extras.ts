export interface Extra {
  id: string;
  nombre: string;
  precio: number; // 0 = gratis
  categoria?: string; // opcional: 'bebidas', 'alimentos', etc.
}

// Lista de extras comunes (puedes ampliarla)
export const extrasDisponibles: Extra[] = [
  // Lácteos y sustitutos
  { id: 'leche_deslactosada', nombre: 'Leche deslactosada', precio: 5, categoria: 'bebidas' },
  { id: 'leche_almendras', nombre: 'Leche de almendras', precio: 8, categoria: 'bebidas' },
  { id: 'leche_soya', nombre: 'Leche de soya', precio: 6, categoria: 'bebidas' },
  { id: 'leche_coco', nombre: 'Leche de coco', precio: 7, categoria: 'bebidas' },
  { id: 'leche_avena', nombre: 'Leche de avena', precio: 7, categoria: 'bebidas' },

  // Café y extras de bebidas
  { id: 'shot_extra', nombre: 'Shot extra de espresso', precio: 10, categoria: 'bebidas' },
  { id: 'doble_cafe', nombre: 'Doble carga de café', precio: 8, categoria: 'bebidas' },
  { id: 'crema_batida', nombre: 'Crema batida', precio: 12, categoria: 'bebidas' },
  { id: 'caramelo', nombre: 'Splash de caramelo', precio: 6, categoria: 'bebidas' },
  { id: 'vainilla', nombre: 'Shot de vainilla', precio: 5, categoria: 'bebidas' },
  { id: 'chispas_chocolate', nombre: 'Chispas de chocolate', precio: 4, categoria: 'bebidas' },
  { id: 'canela_extra', nombre: 'Canela extra', precio: 0, categoria: 'bebidas' },
  { id: 'hielo_separado', nombre: 'Hielo separado', precio: 0, categoria: 'bebidas' },

  // Salsas y complementos para alimentos
  { id: 'chilaquiles_rojos', nombre: 'Salsa roja', precio: 0, categoria: 'alimentos' },
  { id: 'chilaquiles_verdes', nombre: 'Salsa verde', precio: 0, categoria: 'alimentos' },
  { id: 'salsa_extra', nombre: 'Salsa extra picante', precio: 0, categoria: 'alimentos' },
  { id: 'queso_extra', nombre: 'Queso extra', precio: 15, categoria: 'alimentos' },
  { id: 'guacamole', nombre: 'Guacamole', precio: 12, categoria: 'alimentos' },
  { id: 'crema', nombre: 'Crema', precio: 5, categoria: 'alimentos' },
  { id: 'jalapeños', nombre: 'Jalapeños', precio: 3, categoria: 'alimentos' },
  { id: 'tocino', nombre: 'Tocino extra', precio: 18, categoria: 'alimentos' },
  { id: 'huevo_extra', nombre: 'Huevo extra', precio: 10, categoria: 'alimentos' },
  { id: 'fruta_extra', nombre: 'Fruta extra', precio: 15, categoria: 'alimentos' },
  { id: 'pan_artesanal', nombre: 'Pan artesanal', precio: 8, categoria: 'alimentos' },
];
