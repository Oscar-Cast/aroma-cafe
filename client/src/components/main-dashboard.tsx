'use client'

import { useState } from 'react'
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

export function MainDashboard() {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Determine initial view based on role
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

  // Set initial view on mount
  useState(() => {
    const initial = getInitialView()
    if (initial !== 'dashboard') {
      setCurrentView(initial)
    }
  })

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
      {/* Mobile menu button */}
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

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:translate-x-0 z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AppSidebar 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view)
            setSidebarOpen(false)
          }} 
        />
      </div>

      {/* Main content */}
      <main className="lg:ml-64 p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
