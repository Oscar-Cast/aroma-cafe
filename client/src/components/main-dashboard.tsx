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
    <div className="min-h-screen bg-[#E5D7C4]">
      {/* ===== BOTÓN MÓVIL (no se modifica) ===== */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white border-[#CFBB99]"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay para cerrar menú en móvil */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <div className={`
        fixed lg:translate-x-0 z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AppSidebar 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view)
            setSidebarOpen(false) // cierra el menú móvil al seleccionar vista
          }} 
          // ===== PROPS DE COLAPSO =====
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* ===== CONTENIDO PRINCIPAL: margen adaptable al colapso ===== */}
      <main className={cn(
        "p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        //                 ^^^^^^^^^^   ^^^^^^^^^^
        //  Si collapsed → margen pequeño (ancho del sidebar colapsado)
        //  Si no        → margen normal (sidebar completo)
      )}>
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
