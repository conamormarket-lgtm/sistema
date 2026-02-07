"use client"

import React, { useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { mockDatabase } from "@/lib/mock-firebase"
import { parseMontoRobust } from "@/lib/business-logic"
import { formatMoneyStrict } from "@/lib/utils"
import {
  initialTiposDePrendaInventario,
  initialTallasInventario,
} from "@/lib/constants"
import { InventarioPorted } from "@/components/inventario/InventarioPorted"
import { Button } from "@/components/ui/button"
import { Modal, ConfirmationModal } from "@/components/ui/modal"
import { Input, Select } from "@/components/ui/input"
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
} from "lucide-react"

const INVENTARIOS_TABS = {
  prendas: { name: "Prendas", icon: <Shirt className="w-4 h-4 mr-2" /> },
  productos: { name: "Productos", icon: <PackageSearch className="w-4 h-4 mr-2" /> },
  insumos: { name: "Insumos", icon: <Wrench className="w-4 h-4 mr-2" /> },
  activos: { name: "Activos", icon: <ArchiveRestore className="w-4 h-4 mr-2" /> },
  historial: { name: "Historial Movimientos", icon: <History className="w-4 h-4 mr-2" /> },
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-50 min-h-screen">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">{title}</h2>
      <div className="glass-box p-8 rounded-2xl text-center">
        <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <p className="text-slate-700 font-medium">Funcionalidad para &quot;{title}&quot; en desarrollo.</p>
      </div>
    </div>
  )
}

export function InventariosMatrix() {
  const [activeMainTab, setActiveMainTab] = useState("prendas")

  const renderMainTabContent = () => {
    switch (activeMainTab) {
      case "prendas":
        return <InventarioPorted />
      case "productos":
        return <PlaceholderTab title="Inventario de Productos" />
      case "insumos":
        return <PlaceholderTab title="Inventario de Insumos" />
      case "activos":
        return <PlaceholderTab title="Inventario de Activos" />
      case "historial":
        return <PlaceholderTab title="Historial de Movimientos" />
      default:
        return <InventarioPrendasTab />
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-purple-50/20">
      <div className="flex justify-center items-center px-6 py-2 shrink-0">
        <div className="rounded-full inline-flex items-center gap-0.5 p-1 bg-white/90 border border-slate-200 shadow-sm">
          {Object.entries(INVENTARIOS_TABS).map(([key, tab]: [string, any]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveMainTab(key)}
              className={`rounded-full inline-flex items-center gap-2 py-2 px-4 font-medium text-sm transition-all duration-200 ${
                activeMainTab === key
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <span className="w-4 h-4 shrink-0">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-grow overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/20">{renderMainTabContent()}</div>
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
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-50 min-h-screen">
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
