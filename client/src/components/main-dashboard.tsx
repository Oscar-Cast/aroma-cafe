'use client'

import { useState, useEffect } from 'react' // ← se añadió useEffect para la vista inicial
import { useAuth } from '@/providers/AuthProvider';
import { AppSidebar } from './app-sidebar'
import { DashboardView } from './views/dashboard-view'
import { PedidosView } from './views/pedidos-view'
import { BarraView } from './views/barra-view'
import { CocinaView } from './views/cocina-view'
import { ProductosView } from './views/productos-view'
import { InventarioView } from './views/inventario-view'
import { MermasView } from './views/mermas-view'
import { CajaView } from './views/caja-view'
import { ReportesView } from './views/reportes-view'
import { UsuariosView } from './views/usuarios-view'
import { MesasView } from './views/mesas-view'
import { CobrosView } from './views/cobros-view'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils' // ← utilidad para concatenar clases condicionales
import { MovimientosFinancierosView } from './views/movimientos-financieros-view'

export function MainDashboard() {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false) // controla menú móvil (overlay)
  
  // ===== NUEVO ESTADO: colapso del sidebar en escritorio =====
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Vista inicial según el rol del usuario
  const getInitialView = () => {
    if (!user) return 'dashboard'
    
    switch (user.rol) {
      case 'barra':
        return 'barra'
      case 'cocina':
        return 'cocina'
      case 'mesero':
        return 'pedidos'
      default:
        return 'dashboard'
    }
  }

  // Establece la vista inicial solo al montar el componente
  useEffect(() => {
    const initial = getInitialView()
    if (initial !== 'dashboard') {
      setCurrentView(initial)
    }
  }, []) // ← array vacío: se ejecuta una sola vez

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />
      case 'pedidos':
        return <PedidosView />
      case 'barra':
        return <BarraView />
      case 'cocina':
        return <CocinaView />
      case 'productos':
        return <ProductosView />
      case 'inventario':
        return <InventarioView />
      case 'mermas':
        return <MermasView />
      case 'caja':
        return <CajaView />
      case 'movimientos':
        return <MovimientosFinancierosView />
      case 'reportes':
        return <ReportesView />
      case 'usuarios':
        return <UsuariosView />
      case 'mesas':
        return <MesasView />
      case 'cobros':
        return <CobrosView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="min-h-screen bg-[#E5D7C4] flex">
      {/* ===== BOTÓN MÓVIL ===== */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="border-[#CFBB99]"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={cn(
        // Posicionamiento y comportamiento de scroll
        "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out",
        "bg-[#4C3D19] border-r border-[#CFBB99] flex flex-col",
        "overflow-y-auto overflow-x-hidden", // Scroll vertical interno si el contenido no cabe
        
        // Manejo de visibilidad en móvil
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        
        // ANCHOS PROPORCIONALES (Deben coincidir con los márgenes del main)
        sidebarCollapsed 
          ? "w-16" 
          : "w-[70vw] sm:w-[280px] lg:w-[20vw] xl:w-[16vw]"
      )}>
        <AppSidebar 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view)
            setSidebarOpen(false)
          }} 
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300",
        "p-6 lg:p-8 pt-20 lg:pt-8",
        
        // MARGEN DINÁMICO (Espejo del ancho del Sidebar)
        sidebarCollapsed 
          ? "lg:ml-16" 
          : "lg:ml-[20vw] xl:ml-[16vw]" 
      )}>
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
