'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Producto, ProductCategory } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Coffee, Plus, Edit2, Trash2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const categorias: ProductCategory[] = ['Bebidas Calientes', 'Bebidas Frías', 'Alimentos', 'Postres', 'Cafetería']

export function ProductosView() {
  const { toast } = useToast()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState<string>('todas')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [formData, setFormData] = useState({
    nombre_producto: '',
    descripcion: '',
    precio: '',
    categoria: '' as ProductCategory | '',
    disponible: 'activo' as 'activo' | 'inactivo'
  })

  // Cargar productos desde la API
  const cargarProductos = async () => {
    try {
      const data = await api.getProductos()
      setProductos(data)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los productos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  const resetForm = () => {
    setFormData({
      nombre_producto: '',
      descripcion: '',
      precio: '',
      categoria: '',
      disponible: 'activo'
    })
    setEditingProducto(null)
  }

  const openEditDialog = (producto: Producto) => {
    setEditingProducto(producto)
    setFormData({
      nombre_producto: producto.nombre_producto,
      descripcion: producto.descripcion,
      precio: producto.precio.toString(),
      categoria: producto.categoria,
      disponible: producto.disponible
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.nombre_producto || !formData.precio || !formData.categoria) {
      toast({ title: 'Error', description: 'Por favor completa los campos requeridos', variant: 'destructive' })
      return
    }

    const productoData = {
      nombre_producto: formData.nombre_producto,
      descripcion: formData.descripcion,
      precio: parseFloat(formData.precio),
      categoria: formData.categoria as ProductCategory,
      disponible: formData.disponible
    }

    try {
      if (editingProducto) {
        await api.updateProducto(editingProducto.id_producto, productoData)
        toast({ title: 'Producto actualizado', description: `${formData.nombre_producto} ha sido actualizado` })
      } else {
        await api.createProducto(productoData)
        toast({ title: 'Producto creado', description: `${formData.nombre_producto} ha sido agregado al catálogo` })
      }
      cargarProductos() // recargar la lista
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el producto', variant: 'destructive' })
    }
  }

  const handleDelete = async (producto: Producto) => {
    if (!confirm(`¿Estás seguro de eliminar "${producto.nombre_producto}"?`)) return
    try {
      await api.deleteProducto(producto.id_producto)
      toast({ title: 'Producto eliminado', description: `${producto.nombre_producto} ha sido eliminado` })
      cargarProductos()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el producto', variant: 'destructive' })
    }
  }

  const toggleDisponible = async (producto: Producto) => {
    const nuevoEstado = producto.disponible === 'activo' ? 'inactivo' : 'activo'
    try {
      await api.updateProducto(producto.id_producto, { disponible: nuevoEstado })
      toast({ title: 'Estado actualizado', description: `${producto.nombre_producto} ahora está ${nuevoEstado}` })
      cargarProductos()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cambiar el estado', variant: 'destructive' })
    }
  }

  const filteredProductos = productos.filter(p => {
    const matchesSearch = p.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategoria === 'todas' || p.categoria === filterCategoria
    return matchesSearch && matchesCategory
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando productos...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#4C3D19]">Productos</h1>
          <p className="text-[#889063] mt-1">Gestiona el catálogo de productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[#4C3D19]">
                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <DialogDescription className="text-[#889063]">
                {editingProducto ? 'Modifica los datos del producto' : 'Agrega un nuevo producto al catálogo'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#4C3D19]">Nombre *</Label>
                <Input
                  value={formData.nombre_producto}
                  onChange={(e) => setFormData({ ...formData, nombre_producto: e.target.value })}
                  placeholder="Ej: Cappuccino"
                  className="border-[#CFBB99]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#4C3D19]">Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del producto"
                  className="border-[#CFBB99]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#4C3D19]">Precio *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="0.00"
                    className="border-[#CFBB99]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#4C3D19]">Categoría *</Label>
                  <Select 
                    value={formData.categoria} 
                    onValueChange={(value) => setFormData({ ...formData, categoria: value as ProductCategory })}
                  >
                    <SelectTrigger className="border-[#CFBB99]">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[#4C3D19]">Disponible</Label>
                <Switch
                  checked={formData.disponible === 'activo'}
                  onCheckedChange={(checked) => setFormData({ ...formData, disponible: checked ? 'activo' : 'inactivo' })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]" onClick={handleSubmit}>
                {editingProducto ? 'Guardar Cambios' : 'Crear Producto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-[#CFBB99]">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#889063]" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-[#CFBB99]"
              />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[200px] border-[#CFBB99]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products table */}
      <Card className="border-[#CFBB99]">
        <CardHeader>
          <CardTitle className="text-[#4C3D19]">Catálogo de Productos</CardTitle>
          <CardDescription className="text-[#889063]">
            {filteredProductos.length} productos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#CFBB99]">
                <TableHead className="text-[#4C3D19]">Producto</TableHead>
                <TableHead className="text-[#4C3D19]">Categoría</TableHead>
                <TableHead className="text-[#4C3D19] text-right">Precio</TableHead>
                <TableHead className="text-[#4C3D19] text-center">Estado</TableHead>
                <TableHead className="text-[#4C3D19] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductos.map(producto => (
                <TableRow key={producto.id_producto} className="border-[#CFBB99]">
                  <TableCell>
                    <div>
                      <p className="font-medium text-[#4C3D19]">{producto.nombre_producto}</p>
                      <p className="text-sm text-[#889063]">{producto.descripcion}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-[#889063] text-[#354024]">
                      {producto.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-[#4C3D19]">
                    {formatCurrency(producto.precio)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={producto.disponible === 'activo'}
                      onCheckedChange={() => toggleDisponible(producto)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-[#889063] hover:text-[#4C3D19] hover:bg-[#CFBB99]/30"
                        onClick={() => openEditDialog(producto)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(producto)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProductos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#889063]">
                    <Coffee className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No se encontraron productos</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
