"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { mockDatabase, mockFirestore } from "@/lib/mock-firebase"
import { saveInventarioConfig } from "@/lib/inventario-config-persistence"
import { parseMontoRobust } from "@/lib/business-logic"
import { formatMoneyStrict } from "@/lib/utils"
import {
  initialTiposDePrendaInventario,
  initialTallasInventario,
  COLOR_PALETTE,
} from "@/lib/constants"
import { InventarioPorted } from "@/components/inventario/InventarioPorted"
import { Button } from "@/components/ui/button"
import { Modal, ConfirmationModal } from "@/components/ui/modal"
import { Input, Select } from "@/components/ui/input"
import { IconSelector, ColorSelector } from "@/components/modals/flow-components"
import {
  Shirt,
  PackageSearch,
  Wrench,
  ArchiveRestore,
  History,
  Search,
  PlusCircle,
  MinusCircle,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Trash,
  Save,
  Box,
} from "lucide-react"

const INVENTARIOS_TABS = {
  prendas: { name: "Prendas", icon: <Shirt className="w-4 h-4 mr-2" /> },
  productos: { name: "Productos", icon: <PackageSearch className="w-4 h-4 mr-2" /> },
  insumos: { name: "Insumos", icon: <Wrench className="w-4 h-4 mr-2" /> },
  activos: { name: "Activos", icon: <ArchiveRestore className="w-4 h-4 mr-2" /> },
  historial: { name: "Historial Movimientos", icon: <History className="w-4 h-4 mr-2" /> },
}

type InventariosMatrixProps = {
  inventarioSeleccionado?: string
  onInventarioTabChange?: (tab: string) => void
  compactLayout?: boolean
}

export function InventariosMatrix({ inventarioSeleccionado = "prendas", onInventarioTabChange, compactLayout = false }: InventariosMatrixProps) {
  return (
    <div className={compactLayout ? "flex flex-col h-full min-h-0 flex-1" : "flex flex-col"}>
      <div className={compactLayout ? "flex-1 min-h-0 overflow-hidden" : "flex-grow overflow-y-auto"}>
        <InventarioPorted
          inventarioSeleccionado={inventarioSeleccionado}
          onInventarioTabChange={onInventarioTabChange}
          compactLayout={compactLayout}
        />
      </div>
    </div>
  )
}

export const INVENTARIOS_TABS_HEADER = INVENTARIOS_TABS

const TIPOS_INVENTARIO_OPTIONS = [
  { value: "prendas", label: "Prendas" },
  { value: "productos", label: "Productos" },
  { value: "insumos", label: "Insumos" },
  { value: "activos", label: "Activos" },
]

function getIconComponent(iconName: string) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Shirt, PackageSearch, Wrench, ArchiveRestore, History, Box, Plus, Pencil, Trash, Save,
  }
  const C = iconMap[iconName]
  return C ? <C className="w-5 h-5" /> : null
}

function InventarioFormModal({
  isOpen,
  onClose,
  inventario,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  inventario: any
  onSave: () => void
}) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo: "prendas",
    activo: true,
    orden: 0,
    color: COLOR_PALETTE[0].value,
    icono: "Shirt",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (inventario) {
      setFormData({
        nombre: inventario.nombre || "",
        descripcion: inventario.descripcion || "",
        tipo: inventario.tipo || "prendas",
        activo: inventario.activo !== undefined ? inventario.activo : true,
        orden: inventario.orden ?? 0,
        color: inventario.color || COLOR_PALETTE[0].value,
        icono: inventario.icono || "Shirt",
      })
    } else {
      const list = (mockDatabase.inventarios || []) as any[]
      setFormData({
        nombre: "",
        descripcion: "",
        tipo: "prendas",
        activo: true,
        orden: list.length,
        color: COLOR_PALETTE[0].value,
        icono: "Shirt",
      })
    }
    setErrors({})
  }, [inventario, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio"
    else {
      const list = (mockDatabase.inventarios || []) as any[]
      const exists = list.some(
        (inv: any) =>
          inv.nombre?.toLowerCase() === formData.nombre.trim().toLowerCase() && inv.id !== inventario?.id
      )
      if (exists) newErrors.nombre = "Ya existe un inventario con este nombre"
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    try {
      const payload: any = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        tipo: formData.tipo,
        activo: formData.activo,
        orden: formData.orden,
        color: formData.color,
        icono: formData.icono,
        fechaModificacion: new Date(),
      }
      if (inventario) {
        payload.fechaCreacion = inventario.fechaCreacion
        payload.creadoPor = inventario.creadoPor
        await mockFirestore.doc("inventarios", inventario.id).update(payload)
      } else {
        payload.id = `inventario-${formData.tipo}-${Date.now()}`
        payload.fechaCreacion = new Date()
        payload.creadoPor = (currentUser as any)?.uid || "system"
        await mockFirestore.collection("inventarios").add(payload)
      }
      onSave()
      onClose()
    } catch (err: any) {
      console.error("Error al guardar inventario:", err)
      alert("Error al guardar el inventario. Intente de nuevo.")
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={inventario ? "Editar Inventario" : "Crear Nuevo Inventario"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre del inventario"
          value={formData.nombre}
          onChange={(e: any) => setFormData((p: any) => ({ ...p, nombre: e.target.value }))}
          required
          error={errors.nombre}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
          <textarea
            value={formData.descripcion}
            onChange={(e: any) => setFormData((p: any) => ({ ...p, descripcion: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
          <select
            value={formData.tipo}
            onChange={(e: any) => setFormData((p: any) => ({ ...p, tipo: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIPOS_INVENTARIO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Orden</label>
            <input
              type="number"
              min={0}
              value={formData.orden}
              onChange={(e: any) => setFormData((p: any) => ({ ...p, orden: parseInt(e.target.value, 10) || 0 }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="activo-inv"
              checked={formData.activo}
              onChange={(e: any) => setFormData((p: any) => ({ ...p, activo: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="activo-inv" className="text-sm font-medium text-slate-700">
              Inventario activo
            </label>
          </div>
        </div>
        <ColorSelector
          selectedColor={formData.color}
          onSelect={(color: string) => setFormData((p: any) => ({ ...p, color }))}
        />
        <IconSelector
          selectedIcon={formData.icono}
          onSelect={(icono: string) => setFormData((p: any) => ({ ...p, icono }))}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" iconLeft={<Save className="w-4 h-4" />}>
            {inventario ? "Guardar cambios" : "Crear inventario"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function GestionInventariosTab() {
  const { isOwner } = useAuth()
  const [inventarios, setInventarios] = useState<any[]>([])
  const [selectedInventario, setSelectedInventario] = useState<any>(null)
  const [showInventarioModal, setShowInventarioModal] = useState(false)
  const [editingInventario, setEditingInventario] = useState<any>(null)

  useEffect(() => {
    const list = (mockDatabase.inventarios || []).map((inv: any) => ({ id: inv.id, ...inv }))
    setInventarios(list.sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0)))
  }, [showInventarioModal])

  if (!isOwner?.()) {
    return (
      <div className="p-6">
        <div className="glass-box rounded-2xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  const refreshInventarios = () => {
    const list = (mockDatabase.inventarios || []).map((inv: any) => ({ id: inv.id, ...inv }))
    setInventarios(list.sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0)))
  }

  const handleCreateInventario = () => {
    setEditingInventario(null)
    setShowInventarioModal(true)
  }

  const handleEditInventario = (inv: any) => {
    setEditingInventario(inv)
    setShowInventarioModal(true)
  }

  const handleToggleInventario = async (inv: any) => {
    try {
      await mockFirestore.doc("inventarios", inv.id).update({ activo: !inv.activo })
      refreshInventarios()
      if (selectedInventario?.id === inv.id) setSelectedInventario((prev: any) => (prev ? { ...prev, activo: !prev.activo } : null))
    } catch (err: any) {
      console.error("Error al cambiar estado:", err)
      alert("Error al cambiar el estado del inventario.")
    }
  }

  const handleEliminarInventario = async (inv: any) => {
    if (!confirm(`¿Está seguro de que desea eliminar el inventario "${inv.nombre}"?`)) return
    try {
      await mockFirestore.doc("inventarios", inv.id).delete()
      refreshInventarios()
      if (selectedInventario?.id === inv.id) setSelectedInventario(null)
    } catch (err: any) {
      console.error("Error al eliminar inventario:", err)
      alert("Error al eliminar el inventario.")
    }
  }

  const configPrendas = (mockDatabase as any).configInventarioPrendas as
    | { tiposPrenda: string[]; colores: string[]; tallas: string[] }
    | undefined

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-800">Gestión de Inventarios</h2>
        <Button onClick={handleCreateInventario} iconLeft={<Plus className="w-4 h-4" />}>
          Crear Nuevo Inventario
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de inventarios */}
        <div className="lg:col-span-1">
          <div className="glass-box rounded-2xl p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Inventarios disponibles</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {inventarios.map((inv: any) => {
                const IconC = getIconComponent(inv.icono)
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInventario(inv)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedInventario?.id === inv.id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    } ${!inv.activo ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {IconC && <div style={{ color: inv.color }}>{IconC}</div>}
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{inv.nombre}</div>
                        {!inv.activo && <span className="text-xs text-slate-500">Inactivo</span>}
                      </div>
                    </div>
                    {inv.descripcion && <p className="text-sm text-slate-600 mb-2">{inv.descripcion}</p>}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{inv.tipo}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleEditInventario(inv) }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleInventario(inv) }}
                          className="p-1 text-slate-600 hover:bg-slate-50 rounded"
                          title={inv.activo ? "Desactivar" : "Activar"}
                        >
                          {inv.activo ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleEliminarInventario(inv) }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {inventarios.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Box className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No hay inventarios creados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detalle y configuración del inventario seleccionado */}
        <div className="lg:col-span-2">
          {selectedInventario ? (
            selectedInventario.tipo === "prendas" ? (
              <ConfigPanelPrendas
                config={configPrendas}
                selectedInventario={selectedInventario}
                getIconComponent={getIconComponent}
                onRefresh={refreshInventarios}
              />
            ) : (
              <ConfigPanelInventarioGenerico
                selectedInventario={selectedInventario}
                getIconComponent={getIconComponent}
                onRefresh={refreshInventarios}
              />
            )
          ) : (
            <div className="glass-box rounded-2xl p-12 text-center">
              <Box className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600">Seleccione un inventario para ver su configuración</p>
            </div>
          )}
        </div>
      </div>

      <InventarioFormModal
        isOpen={showInventarioModal}
        onClose={() => { setShowInventarioModal(false); setEditingInventario(null) }}
        inventario={editingInventario}
        onSave={refreshInventarios}
      />
    </div>
  )
}

function ConfigPanelPrendas({
  config,
  selectedInventario,
  getIconComponent,
  onRefresh,
}: {
  config: { tiposPrenda: string[]; colores: string[]; tallas: string[] } | undefined
  selectedInventario: any
  getIconComponent: (name: string) => React.ReactNode
  onRefresh: () => void
}) {
  const [tiposPrenda, setTiposPrenda] = useState<string[]>([])
  const [colores, setColores] = useState<string[]>([])
  const [tallas, setTallas] = useState<string[]>([])
  const [newTipo, setNewTipo] = useState("")
  const [newColor, setNewColor] = useState("")
  const [newTalla, setNewTalla] = useState("")

  useEffect(() => {
    const c = (mockDatabase as any).configInventarioPrendas
    if (c) {
      setTiposPrenda(c.tiposPrenda || [])
      setColores(c.colores || [])
      setTallas(c.tallas || [])
    }
  }, [config, selectedInventario?.id])

  const persistConfig = (nextTipos: string[], nextColores: string[], nextTallas: string[]) => {
    const c = (mockDatabase as any).configInventarioPrendas
    if (!c) return
    c.tiposPrenda = nextTipos
    c.colores = nextColores
    c.tallas = nextTallas
    ;(mockDatabase as any).inventoryMetadata = null
    saveInventarioConfig(mockDatabase)
    onRefresh()
  }

  const addTipo = () => {
    const v = newTipo.trim()
    if (!v || tiposPrenda.includes(v)) return
    const next = [...tiposPrenda, v].sort()
    setTiposPrenda(next)
    setNewTipo("")
    persistConfig(next, colores, tallas)
  }

  const addColor = () => {
    const v = newColor.trim()
    if (!v || colores.includes(v)) return
    const next = [...colores, v].sort()
    setColores(next)
    setNewColor("")
    persistConfig(tiposPrenda, next, tallas)
  }

  const addTalla = () => {
    const v = newTalla.trim()
    if (!v || tallas.includes(v)) return
    const next = [...tallas, v].sort()
    setTallas(next)
    setNewTalla("")
    persistConfig(tiposPrenda, colores, next)
  }

  const removeTipo = (valor: string) => {
    const next = tiposPrenda.filter((x) => x !== valor)
    setTiposPrenda(next)
    persistConfig(next, colores, tallas)
  }

  const removeColor = (valor: string) => {
    const next = colores.filter((x) => x !== valor)
    setColores(next)
    persistConfig(tiposPrenda, next, tallas)
  }

  const removeTalla = (valor: string) => {
    const next = tallas.filter((x) => x !== valor)
    setTallas(next)
    persistConfig(tiposPrenda, colores, next)
  }

  const listSection = (
    title: string,
    items: string[],
    newVal: string,
    setNewVal: (s: string) => void,
    onAdd: () => void,
    onRemove: (v: string) => void
  ) => (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-800 text-sm"
          >
            {v}
            <button
              type="button"
              onClick={() => onRemove(v)}
              className="p-0.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
              aria-label={`Quitar ${v}`}
            >
              <Trash className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())}
          placeholder={`Agregar ${title.toLowerCase()}`}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button type="button" size="sm" onClick={onAdd} iconLeft={<Plus className="w-3 h-3" />}>
          Agregar
        </Button>
      </div>
    </div>
  )

  return (
    <div className="glass-box rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        {getIconComponent(selectedInventario.icono) && (
          <div style={{ color: selectedInventario.color }}>
            {getIconComponent(selectedInventario.icono)}
          </div>
        )}
        <div>
          <h3 className="text-2xl font-bold text-slate-800">{selectedInventario.nombre}</h3>
          {selectedInventario.descripcion && (
            <p className="text-sm text-slate-600">{selectedInventario.descripcion}</p>
          )}
        </div>
      </div>
      <h4 className="text-lg font-semibold text-slate-700 mb-3">Configuración: Tipos, colores y tallas</h4>
      {listSection("Tipos de prenda", tiposPrenda, newTipo, setNewTipo, addTipo, removeTipo)}
      {listSection("Colores", colores, newColor, setNewColor, addColor, removeColor)}
      {listSection("Tallas", tallas, newTalla, setNewTalla, addTalla, removeTalla)}
    </div>
  )
}

type ConfigGenerico = {
  nombreItem: string
  tipos: string[]
  caracteristicas: { nombre: string; valores: string[] }[]
}

function getConfigGenerico(inventarioId: string): ConfigGenerico {
  const config = (mockDatabase as any).configInventarioGenerico
  if (config && config[inventarioId]) {
    const c = config[inventarioId]
    return {
      nombreItem: c.nombreItem ?? "",
      tipos: Array.isArray(c.tipos) ? [...c.tipos] : [],
      caracteristicas: Array.isArray(c.caracteristicas)
        ? c.caracteristicas.map((x: any) => ({ nombre: x.nombre ?? "", valores: Array.isArray(x.valores) ? [...x.valores] : [] }))
        : [],
    }
  }
  return { nombreItem: "", tipos: [], caracteristicas: [] }
}

function ConfigPanelInventarioGenerico({
  selectedInventario,
  getIconComponent,
  onRefresh,
}: {
  selectedInventario: any
  getIconComponent: (name: string) => React.ReactNode
  onRefresh: () => void
}) {
  const id = selectedInventario?.id ?? ""
  const [nombreItem, setNombreItem] = useState("")
  const [tipos, setTipos] = useState<string[]>([])
  const [caracteristicas, setCaracteristicas] = useState<{ nombre: string; valores: string[] }[]>([])
  const [newTipo, setNewTipo] = useState("")
  const [newCaracNombre, setNewCaracNombre] = useState("")
  const [newValorByCarac, setNewValorByCarac] = useState<Record<number, string>>({})

  useEffect(() => {
    const c = getConfigGenerico(id)
    setNombreItem(c.nombreItem)
    setTipos(c.tipos)
    setCaracteristicas(c.caracteristicas)
    setNewValorByCarac({})
  }, [id])

  const persist = (data: ConfigGenerico) => {
    let config = (mockDatabase as any).configInventarioGenerico
    if (!config) config = (mockDatabase as any).configInventarioGenerico = {}
    config[id] = { ...data }
    saveInventarioConfig(mockDatabase)
    onRefresh()
  }

  const handleNombreItemBlur = () => {
    persist({ nombreItem: nombreItem.trim(), tipos, caracteristicas })
  }

  const addTipo = () => {
    const v = newTipo.trim()
    if (!v || tipos.includes(v)) return
    const next = [...tipos, v].sort()
    setTipos(next)
    setNewTipo("")
    persist({ nombreItem: nombreItem.trim(), tipos: next, caracteristicas })
  }

  const removeTipo = (valor: string) => {
    const next = tipos.filter((x) => x !== valor)
    setTipos(next)
    persist({ nombreItem: nombreItem.trim(), tipos: next, caracteristicas })
  }

  const addCaracteristica = () => {
    const nombre = newCaracNombre.trim()
    if (!nombre || caracteristicas.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) return
    const next = [...caracteristicas, { nombre, valores: [] }]
    setCaracteristicas(next)
    setNewCaracNombre("")
    persist({ nombreItem: nombreItem.trim(), tipos, caracteristicas: next })
  }

  const removeCaracteristica = (index: number) => {
    const next = caracteristicas.filter((_, i) => i !== index)
    setCaracteristicas(next)
    setNewValorByCarac((prev) => {
      const p = { ...prev }
      delete p[index]
      return p
    })
    persist({ nombreItem: nombreItem.trim(), tipos, caracteristicas: next })
  }

  const addValorCaracteristica = (index: number, valor: string) => {
    const v = valor.trim()
    if (!v) return
    const car = caracteristicas[index]
    if (car.valores.includes(v)) return
    const nextValores = [...car.valores, v].sort()
    const next = caracteristicas.map((c, i) => (i === index ? { ...c, valores: nextValores } : c))
    setCaracteristicas(next)
    setNewValorByCarac((prev) => ({ ...prev, [index]: "" }))
    persist({ nombreItem: nombreItem.trim(), tipos, caracteristicas: next })
  }

  const removeValorCaracteristica = (indexCar: number, valor: string) => {
    const next = caracteristicas.map((c, i) =>
      i === indexCar ? { ...c, valores: c.valores.filter((x) => x !== valor) } : c
    )
    setCaracteristicas(next)
    persist({ nombreItem: nombreItem.trim(), tipos, caracteristicas: next })
  }

  const updateCaracteristicaNombre = (index: number, nuevoNombre: string) => {
    const n = nuevoNombre.trim()
    if (!n) return
    const next = caracteristicas.map((c, i) => (i === index ? { ...c, nombre: n } : c))
    setCaracteristicas(next)
    persist({ nombreItem: nombreItem.trim(), tipos, caracteristicas: next })
  }

  return (
    <div className="glass-box rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        {getIconComponent(selectedInventario.icono) && (
          <div style={{ color: selectedInventario.color }}>
            {getIconComponent(selectedInventario.icono)}
          </div>
        )}
        <div>
          <h3 className="text-2xl font-bold text-slate-800">{selectedInventario.nombre}</h3>
          {selectedInventario.descripcion && (
            <p className="text-sm text-slate-600">{selectedInventario.descripcion}</p>
          )}
        </div>
      </div>

      <h4 className="text-lg font-semibold text-slate-700 mb-4">Configuración del inventario</h4>
      <p className="text-sm text-slate-600 mb-6">
        Define qué se va a inventariar, sus tipos (categorías) y las características que tendrá cada ítem (por ejemplo: Color, Talla, Marca). Así podrás armar un inventario flexible para cualquier tipo de producto.
      </p>

      {/* Nombre de lo que se inventaría */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre de lo que se inventaría</label>
        <input
          type="text"
          value={nombreItem}
          onChange={(e) => setNombreItem(e.target.value)}
          onBlur={handleNombreItemBlur}
          placeholder="Ej: Ropa, Producto, Insumo, Activo"
          className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tipos */}
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-slate-700 mb-2">Tipos (categorías)</h5>
        <p className="text-xs text-slate-500 mb-2">
          Ej: Polera, Casaca, Polo (para ropa); Electrónico, Papelería (para productos).
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          {tipos.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-800 text-sm"
            >
              {v}
              <button
                type="button"
                onClick={() => removeTipo(v)}
                className="p-0.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                aria-label={`Quitar ${v}`}
              >
                <Trash className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTipo}
            onChange={(e) => setNewTipo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTipo())}
            placeholder="Agregar tipo"
            className="flex-1 max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="button" size="sm" onClick={addTipo} iconLeft={<Plus className="w-3 h-3" />}>
            Agregar tipo
          </Button>
        </div>
      </div>

      {/* Características */}
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-slate-700 mb-2">Características (atributos con valores)</h5>
        <p className="text-xs text-slate-500 mb-3">
          Cada característica tiene un nombre (ej: Color, Talla) y una lista de valores posibles.
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCaracNombre}
            onChange={(e) => setNewCaracNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCaracteristica())}
            placeholder="Nombre de la característica (ej: Color, Talla, Marca)"
            className="flex-1 max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="button" size="sm" onClick={addCaracteristica} iconLeft={<Plus className="w-3 h-3" />}>
            Agregar característica
          </Button>
        </div>

        <div className="space-y-4">
          {caracteristicas.map((car, indexCar) => (
            <div key={indexCar} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={car.nombre}
                  onChange={(e) => setCaracteristicas((prev) => prev.map((c, i) => (i === indexCar ? { ...c, nombre: e.target.value } : c)))}
                  onBlur={(e) => updateCaracteristicaNombre(indexCar, e.target.value)}
                  placeholder="Nombre"
                  className="flex-1 max-w-[180px] px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeCaracteristica(indexCar)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  title="Eliminar característica"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {car.valores.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-sm"
                  >
                    {v}
                    <button
                      type="button"
                      onClick={() => removeValorCaracteristica(indexCar, v)}
                      className="p-0.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                      aria-label={`Quitar ${v}`}
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newValorByCarac[indexCar] ?? ""}
                  onChange={(e) => setNewValorByCarac((prev) => ({ ...prev, [indexCar]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addValorCaracteristica(indexCar, (newValorByCarac[indexCar] ?? "").trim())
                    }
                  }}
                  placeholder={`Agregar valor para ${car.nombre || "esta característica"}`}
                  className="flex-1 max-w-xs px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => addValorCaracteristica(indexCar, (newValorByCarac[indexCar] ?? "").trim())}
                  iconLeft={<Plus className="w-3 h-3" />}
                >
                  Agregar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// PESTAÑA INVENTARIO DE PRENDAS
function InventarioPrendasTab() {
  const [inventoryItems, setInventoryItems] = useState<any[]>(mockDatabase.inventarioPrendas)
  const [showConfigInventarioModal, setShowConfigInventarioModal] = useState(false)
  const [configModalView, setConfigModalView] = useState("crear")
  const [newGarment, setNewGarment] = useState<any>({ tipoPrenda: "", color: "", talla: "", cantidad: 0, costoUnitario: 0 })
  const [confirmCreateData, setConfirmCreateData] = useState<any>({ isOpen: false, garmentData: null })
  const [filters, setFilters] = useState<any>({ tipoPrenda: "", color: "", talla: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [showDetailedSummary, setShowDetailedSummary] = useState(false)

  const { hasPermission } = useAuth()

  const filteredInventoryItems = useMemo(() => {
    let items = [...inventoryItems]
    if (filters.tipoPrenda) {
      items = items.filter((item: any) => item.tipoPrenda === filters.tipoPrenda)
    }
    if (filters.color) {
      items = items.filter((item: any) => item.color === filters.color)
    }
    if (filters.talla) {
      items = items.filter((item: any) => item.talla === filters.talla)
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      items = items.filter((item: any) =>
        item.codigoPrenda?.toLowerCase().includes(lowerSearchTerm) ||
        item.tipoPrenda.toLowerCase().includes(lowerSearchTerm) ||
        item.color.toLowerCase().includes(lowerSearchTerm) ||
        item.talla.toLowerCase().includes(lowerSearchTerm),
      )
    }
    return items
  }, [inventoryItems, filters, searchTerm])

  const dynamicPrendaTypesForFilter = useMemo(() => {
    const types = new Set(inventoryItems.map((item: any) => item.tipoPrenda))
    return Array.from(types)
      .sort()
      .map((type: any) => ({ value: type, label: type }))
  }, [inventoryItems])

  const dynamicColorsForFilter = useMemo(() => {
    const colors = new Set(inventoryItems.map((item: any) => item.color))
    return Array.from(colors)
      .sort()
      .map((color: any) => ({ value: color, label: color }))
  }, [inventoryItems])

  const dynamicSizesForFilter = useMemo(() => {
    const sizes = new Set(inventoryItems.map((item: any) => item.talla))
    return Array.from(sizes)
      .sort((a: any, b: any) => {
        const numA = Number.parseInt(a)
        const numB = Number.parseInt(b)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        if (!isNaN(numA)) return -1
        if (!isNaN(numB)) return 1
        return a.localeCompare(b)
      })
      .map((size: any) => ({ value: size, label: size }))
  }, [inventoryItems])

  const summaryGarmentTypes = useMemo(
    () => Array.from(new Set(inventoryItems.map((item: any) => item.tipoPrenda))).sort(),
    [inventoryItems],
  )

  const generalTotalsData = useMemo(() => {
    const totals: any = {}
    let grandTotal = 0
    summaryGarmentTypes.forEach((tipo: any) => (totals[tipo] = 0))
    inventoryItems.forEach((item: any) => {
      if (totals[item.tipoPrenda] !== undefined) {
        totals[item.tipoPrenda] += item.cantidad
      }
      grandTotal += item.cantidad
    })
    totals["TOTAL PREN."] = grandTotal
    return totals
  }, [inventoryItems, summaryGarmentTypes])

  function handleCreateGarmentChange(e: any) {
    const { name, value, type } = e.target
    setNewGarment((prev: any) => ({
      ...prev,
      [name]: type === "number" ? parseMontoRobust(value) || 0 : value,
    }))
  }

  async function prepareCreateGarment() {
    if (
      !newGarment.tipoPrenda ||
      !newGarment.color.trim() ||
      !newGarment.talla ||
      newGarment.cantidad < 0 ||
      newGarment.costoUnitario <= 0
    ) {
      alert(
        "Por favor, complete todos los campos (Tipo, Color, Talla, Cantidad, Costo Unitario) y asegúrese que las cantidades no sean negativas y el costo sea mayor a cero.",
      )
      return
    }

    const garmentDataToCreate = {
      tipoPrenda: newGarment.tipoPrenda,
      color: newGarment.color.trim(),
      talla: newGarment.talla,
      cantidad: Number.parseInt(newGarment.cantidad),
      costoUnitario: parseMontoRobust(newGarment.costoUnitario),
    }
    setShowConfigInventarioModal(false)
    setConfirmCreateData({ isOpen: true, garmentData: garmentDataToCreate })
  }

  async function executeActualCreateGarment() {
    const { garmentData } = confirmCreateData
    if (!garmentData) return

    const garmentDocId = `${garmentData.tipoPrenda.replace(/\s+/g, "-")}_${garmentData.color.replace(/\s+/g, "-")}_${garmentData.talla.replace(/\s+/g, "-")}`

    // Verificar si ya existe
    const existingItem = mockDatabase.inventarioPrendas.find((item: any) =>
      item.tipoPrenda === garmentData.tipoPrenda &&
      item.color === garmentData.color &&
      item.talla === garmentData.talla,
    )

    if (existingItem) {
      alert("Esta combinación de prenda, color y talla ya existe en el inventario.")
      setConfirmCreateData({ isOpen: false, garmentData: null })
      return
    }

    try {
      const nuevoCodigoPrenda = `P${String(mockDatabase.counters.prendaCodigoCounter.lastCodeNumber + 1).padStart(4, "0")}`
      mockDatabase.counters.prendaCodigoCounter.lastCodeNumber += 1

      const newItem = {
        id: garmentDocId,
        ...garmentData,
        codigoPrenda: nuevoCodigoPrenda,
        entradas: garmentData.cantidad,
        salidas: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDatabase.inventarioPrendas.push(newItem)
      setInventoryItems([...mockDatabase.inventarioPrendas])

      setConfirmCreateData({ isOpen: false, garmentData: null })
      setNewGarment({ tipoPrenda: "", color: "", talla: "", cantidad: 0, costoUnitario: 0 })
      alert(`Prenda ${nuevoCodigoPrenda} creada exitosamente.`)
    } catch (error: any) {
      console.error("Error creando prenda:", error)
      alert("Error al crear la prenda: " + error.message)
      setConfirmCreateData({ isOpen: false, garmentData: null })
    }
  }

  function handleInventoryFilterChange(e: any) {
    const { name, value } = e.target
    setFilters((prev: any) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
        <h2 className="text-3xl font-bold text-slate-800">Stock Actual de Prendas</h2>
        <div className="flex flex-col sm:items-end space-y-2">
          {hasPermission("inventarios", "ajustar-stock") && (
            <div className="flex space-x-2">
              <Button variant="successSoft" iconLeft={<PlusCircle />}>
                Agregar Stock
              </Button>
              <Button variant="dangerSoft" iconLeft={<MinusCircle />}>
                Restar Stock
              </Button>
            </div>
          )}
          {hasPermission("inventarios", "agregar") && (
            <Button
              onClick={() => {
                setConfigModalView("crear")
                setShowConfigInventarioModal(true)
              }}
              iconLeft={<SlidersHorizontal />}
              className="w-full"
            >
              Configuración de Inventario
            </Button>
          )}
        </div>
      </div>

      {/* Resumen General de Totales */}
      <div className="glass-box p-4 rounded-2xl mb-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-slate-800">TOTALES GENERALES</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetailedSummary(!showDetailedSummary)}
            iconLeft={showDetailedSummary ? <ChevronUp /> : <ChevronDown />}
          >
            {showDetailedSummary ? "Ocultar Detalle" : "Ver Detalle"}
          </Button>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">TOTALES</th>
              {summaryGarmentTypes.map((tipo: any) => (
                <th key={tipo} className="px-3 py-2 text-right font-semibold text-gray-600 uppercase">
                  {tipo}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-semibold text-gray-600 uppercase">TOTAL PREN.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 font-medium text-gray-700">CANTIDAD</td>
              {summaryGarmentTypes.map((tipo: any) => (
                <td key={tipo} className="px-3 py-2 text-right font-semibold text-blue-600">
                  {generalTotalsData[tipo] || 0}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-bold text-blue-700">{generalTotalsData["TOTAL PREN."] || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Filtros y Buscador */}
      <div className="glass-box p-4 rounded-2xl mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-3">Filtros y Búsqueda Detallada</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Tipo de Prenda"
            name="tipoPrenda"
            value={filters.tipoPrenda}
            onChange={handleInventoryFilterChange}
            options={dynamicPrendaTypesForFilter}
            placeholder="Todas las prendas"
          />
          <Select
            label="Color"
            name="color"
            value={filters.color}
            onChange={handleInventoryFilterChange}
            options={dynamicColorsForFilter}
            placeholder="Todos los colores"
          />
          <Select
            label="Talla"
            name="talla"
            value={filters.talla}
            onChange={handleInventoryFilterChange}
            options={dynamicSizesForFilter}
            placeholder="Todas las tallas"
          />
          <Input
            label="Buscar (COD, Prenda, Color, Talla)"
            name="searchTerm"
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            icon={<Search className="w-4 h-4 text-gray-400" />}
          />
        </div>
      </div>

      {/* Tabla de Inventario Detallada */}
      <div className="glass-box p-4 rounded-2xl overflow-x-auto">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Inventario Detallado de Prendas</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">COD</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prenda</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talla</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Unit.</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Stock</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entradas</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salidas</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white/50 divide-y divide-indigo-100">
            {filteredInventoryItems.map((item: any) => (
              <tr key={item.id}>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-800">{item.codigoPrenda}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">{item.tipoPrenda}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">{item.color}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">{item.talla}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">S/ {formatMoneyStrict(item.costoUnitario || 0)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold">{item.cantidad}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold">
                  S/ {formatMoneyStrict((item.cantidad || 0) * (item.costoUnitario || 0))}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600">{item.entradas || 0}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600">{item.salidas || 0}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm space-x-1">
                  {hasPermission("inventarios", "ajustar-stock") && (
                    <>
                      <Button size="sm" variant="successSoft" iconLeft={<PlusCircle className="w-3 h-3" />} />
                      <Button
                        size="sm"
                        variant="dangerSoft"
                        iconLeft={<MinusCircle className="w-3 h-3" />}
                        disabled={item.cantidad === 0}
                      />
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredInventoryItems.length === 0 && (
          <p className="text-center py-4 text-gray-500">No hay prendas que coincidan con los filtros.</p>
        )}
      </div>

      {/* Modal Configuración de Inventario */}
      <Modal
        isOpen={showConfigInventarioModal}
        onClose={() => setShowConfigInventarioModal(false)}
        title="Configuración de Inventario de Prendas"
        size="xl"
      >
        <div className="space-y-4 mt-6">
          <Select
            label="Tipo de Prenda"
            name="tipoPrenda"
            value={newGarment.tipoPrenda}
            onChange={handleCreateGarmentChange}
            options={initialTiposDePrendaInventario.map((t: any) => ({ value: t, label: t }))}
            placeholder="Seleccione tipo de prenda"
            required
          />
          <Input
            label="Color"
            name="color"
            value={newGarment.color}
            onChange={handleCreateGarmentChange}
            placeholder="Ej: Negro, Azul Marino"
            required
          />
          <Select
            label="Talla"
            name="talla"
            value={newGarment.talla}
            onChange={handleCreateGarmentChange}
            options={initialTallasInventario.map((t: any) => ({ value: t, label: t }))}
            placeholder="Seleccione talla"
            required
          />
          <Input
            label="Cantidad Inicial"
            name="cantidad"
            type="number"
            value={newGarment.cantidad}
            onChange={handleCreateGarmentChange}
            min="0"
            required
          />
          <Input
            label="Costo Unitario (S/)"
            name="costoUnitario"
            type="number"
            value={newGarment.costoUnitario}
            onChange={handleCreateGarmentChange}
            min="0.01"
            step="0.01"
            required
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="ghost" onClick={() => setShowConfigInventarioModal(false)}>
              Cancelar
            </Button>
            <Button onClick={prepareCreateGarment}>Crear Prenda</Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={confirmCreateData.isOpen}
        onClose={() => setConfirmCreateData({ isOpen: false, garmentData: null })}
        onConfirm={executeActualCreateGarment}
        title="Confirmar Creación de Prenda"
        message={`¿Está seguro de que desea crear la prenda: ${confirmCreateData.garmentData?.tipoPrenda} ${confirmCreateData.garmentData?.color} Talla ${confirmCreateData.garmentData?.talla} con cantidad ${confirmCreateData.garmentData?.cantidad}?`}
        confirmText="Sí, Crear"
      />
    </div>
  )
}

// =================================================================
// COMPONENTES DE GESTIÓN DE FLUJOS
// =================================================================

// Variable para controlar si ya se ejecutó la migración
let migracionEjecutada = false
