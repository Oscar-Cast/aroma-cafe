'use client'

import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/lib/types'
import { 
  Coffee, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  BarChart3, 
  Users, 
  Utensils,
  GlassWater,
  LogOut,
  AlertTriangle,
  Home,
  LayoutGrid,
  Receipt,
  PanelLeftClose,   // ← Ícono para colapsar (flecha hacia la izquierda)
  PanelLeftOpen     // ← Ícono para expandir (flecha hacia la derecha)
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface NavItem {
  title: string
  icon: React.ReactNode
  href: string
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    title: 'Inicio',
    icon: <Home className="w-5 h-5" />,
    href: 'dashboard',
    roles: ['administrador', 'cajero', 'mesero', 'barra', 'cocina']
  },
  {
    title: 'Pedidos',
    icon: <ShoppingCart className="w-5 h-5" />,
    href: 'pedidos',
    roles: ['administrador', 'cajero', 'mesero']
  },
  {
    title: 'Barra',
    icon: <GlassWater className="w-5 h-5" />,
    href: 'barra',
    roles: ['administrador', 'barra']
  },
  {
    title: 'Cocina',
    icon: <Utensils className="w-5 h-5" />,
    href: 'cocina',
    roles: ['administrador', 'cocina']
  },
  {
    title: 'Cobros',
    icon: <Receipt className="w-5 h-5" />,
    href: 'cobros',
    roles: ['administrador', 'cajero']
  },
  {
    title: 'Mesas',
    icon: <LayoutGrid className="w-5 h-5" />,
    href: 'mesas',
    roles: ['administrador']
  },
  {
    title: 'Productos',
    icon: <Coffee className="w-5 h-5" />,
    href: 'productos',
    roles: ['administrador']
  },
  {
    title: 'Inventario',
    icon: <Package className="w-5 h-5" />,
    href: 'inventario',
    roles: ['administrador']
  },
  {
    title: 'Mermas',
    icon: <AlertTriangle className="w-5 h-5" />,
    href: 'mermas',
    roles: ['administrador']
  },
  {
    title: 'Caja',
    icon: <DollarSign className="w-5 h-5" />,
    href: 'caja',
    roles: ['administrador', 'cajero']
  },
  {
    title: 'Movimientos',
    icon: <DollarSign className="w-5 h-5" />,
    href: 'movimientos',
    roles: ['administrador', 'cajero']
  },
  {
    title: 'Reportes',
    icon: <BarChart3 className="w-5 h-5" />,
    href: 'reportes',
    roles: ['administrador']
  },
  {
    title: 'Usuarios',
    icon: <Users className="w-5 h-5" />,
    href: 'usuarios',
    roles: ['administrador']
  },
]

interface AppSidebarProps {
  currentView: string
  onViewChange: (view: string) => void
  // ===== NUEVAS PROPS PARA EL COLAPSO EN ESCRITORIO =====
  collapsed: boolean          // true → sidebar reducido (solo íconos) en pantallas lg+
  onToggleCollapse: () => void // función que alterna el estado collapsed
}

export function AppSidebar({ currentView, onViewChange, collapsed, onToggleCollapse }: AppSidebarProps) {
  const { user, logout, hasPermission } = useAuth()

  const filteredNavItems = navItems.filter(item => hasPermission(item.roles))

  const getRoleLabel = (rol: UserRole) => {
    const labels: Record<UserRole, string> = {
      administrador: 'Administrador',
      cajero: 'Cajero',
      mesero: 'Mesero',
      barra: 'Barra',
      cocina: 'Cocina'
    }
    return labels[rol]
  }

  return (
    // ===== ANCHO DINÁMICO: en escritorio colapsado se reduce a w-16 =====
    <aside className={cn(
      "bg-[#4C3D19] text-[#E5D7C4] flex flex-col h-screen fixed left-0 top-0 transition-all duration-300",
      collapsed ? "w-64 lg:w-16" : "w-64"
      //        ^^^^^^^^^^^^^^^^  ^^^^
      //        móvil: siempre w-64, desktop: w-16 si collapsed es true
    )}>
      {/* ===== HEADER: logo + botón de colapso ===== */}
      <div className="p-4 border-b border-[#354024] flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo (siempre visible) */}
          <div className="w-10 h-10 bg-[#E5D7C4] rounded-full flex items-center justify-center shrink-0">
            <Coffee className="w-6 h-6 text-[#4C3D19]" />
          </div>
          {/* Texto del título: se oculta al colapsar en escritorio */}
          <div className={cn(
            "transition-opacity duration-200",
            collapsed && "lg:opacity-0 lg:w-0 lg:hidden"
            //            ^^^^^^^^^^^^^^^^^^^^^^^^^
            //            Oculta el texto suavemente en lg+ cuando collapsed
          )}>
            <h1 className="font-bold text-lg whitespace-nowrap">Aroma Café</h1>
            <p className="text-xs text-[#CFBB99] whitespace-nowrap">Sistema de Gestión</p>
          </div>
        </div>
        {/* ===== BOTÓN DE COLAPSO (SOLO VISIBLE EN ESCRITORIO) ===== */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded hover:bg-[#354024] text-[#CFBB99] hover:text-[#E5D7C4] ml-2"
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          //    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          //    Tooltip nativo que indica la acción al usuario
        >
          {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          {/*         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                        Ícono cambia según estado: expandir o colapsar */}
        </button>
      </div>

      {/* ===== NAVEGACIÓN ===== */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => (
            <button
              key={item.href}
              onClick={() => onViewChange(item.href)}
              // Tooltip nativo cuando está colapsado (muy útil sin paquetes extra)
              title={collapsed ? item.title : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                "overflow-hidden",
                // Al colapsar, centra el ícono y elimina padding horizontal en desktop
                collapsed && "lg:justify-center lg:px-0",
                currentView === item.href
                  ? "bg-[#354024] text-[#E5D7C4]"
                  : "text-[#CFBB99] hover:bg-[#354024]/50 hover:text-[#E5D7C4]"
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {/* Texto del ítem: se oculta en desktop cuando collapsed */}
              <span className={cn(
                "transition-opacity duration-200",
                collapsed && "lg:hidden"
              )}>
                {item.title}
              </span>
            </button>
          ))}
        </nav>
      </ScrollArea>

      {/* ===== USUARIO & LOGOUT: se oculta al colapsar en escritorio ===== */}
      <div className={cn(
        "p-4 border-t border-[#354024] transition-opacity",
        collapsed && "lg:hidden"
        //            ^^^^^^^^^^
        //            Toda la sección de usuario desaparece en desktop colapsado
      )}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#889063] rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-[#E5D7C4]">
              {user?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nombre_completo || user?.nombre}</p>
            <p className="text-xs text-[#CFBB99]">{user?.rol && getRoleLabel(user.rol)}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full border-[#354024] bg-transparent text-[#E5D7C4] hover:bg-[#354024] hover:text-[#E5D7C4]"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  )
}
