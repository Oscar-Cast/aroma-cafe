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
  Receipt
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
}

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
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
    <aside className="w-64 bg-[#4C3D19] text-[#E5D7C4] flex flex-col h-screen fixed left-0 top-0">
      {/* Header */}
      <div className="p-6 border-b border-[#354024]">
        <div className="flex items-center gap-3">
          {/* Logo placeholder */}
          <div className="w-10 h-10 bg-[#E5D7C4] rounded-full flex items-center justify-center">
            <Coffee className="w-6 h-6 text-[#4C3D19]" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Aroma Café</h1>
            <p className="text-xs text-[#CFBB99]">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => (
            <button
              key={item.href}
              onClick={() => onViewChange(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                currentView === item.href
                  ? "bg-[#354024] text-[#E5D7C4]"
                  : "text-[#CFBB99] hover:bg-[#354024]/50 hover:text-[#E5D7C4]"
              )}
            >
              {item.icon}
              {item.title}
            </button>
          ))}
        </nav>
      </ScrollArea>

      {/* User info & logout */}
      <div className="p-4 border-t border-[#354024]">
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
