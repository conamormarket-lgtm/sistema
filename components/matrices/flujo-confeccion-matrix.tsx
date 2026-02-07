"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { mockFirestore, mockDatabase } from "@/lib/mock-firebase"
import { VentasTab } from "@/components/tabs/ventas-tab"
import { DiseñoTab } from "@/components/tabs/diseno-tab"
import { CobranzaTab } from "@/components/tabs/cobranza-tab"
import { PreparacionTab } from "@/components/tabs/preparacion-tab"
import { EstampadoTab } from "@/components/tabs/estampado-tab"
import { EmpaquetadoTab } from "@/components/tabs/empaquetado-tab"
import { RepartoTab } from "@/components/tabs/reparto-tab"
import { FinalizadosTab } from "@/components/tabs/finalizados-tab"
import { EtapaFormModal, FlujoFormModal, EtapasDragDropList } from "@/components/modals/flow-components"
import { Button } from "@/components/ui/button"
import {
  Plus,
  ShoppingCart,
  Palette,
  DollarSign,
  Printer,
  Tag,
  Box,
  Truck,
  CheckCircle2,
  Scissors,
  Shirt,
  Sparkles,
  FileText,
  AlertTriangle,
  User,
  Settings,
  Archive,
  PackageSearch,
  Wrench,
  ArchiveRestore,
  History,
  Home,
  Database,
  FileSpreadsheet,
  BarChart3,
  Download,
  Menu,
  MoreVertical,
  LogOut,
  Edit,
  UserPlus,
  Eye,
  Upload,
  X,
  FileImage,
  PlusCircle,
  Save,
  Search,
  Trash2,
  XCircle,
  ImageIcon,
  CreditCard,
  Percent,
  CalendarIcon,
  ListOrdered,
  MinusCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Trash,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Move,
  Video,
  Megaphone,
  Lightbulb,
  Rocket,
  Beaker,
  TrendingUp,
} from "lucide-react"

const ROLES_TABS = {
  ventas: { name: "Ventas", icon: <ShoppingCart className="w-4 h-4 mr-2" /> },
  diseño: { name: "Diseño", icon: <Palette className="w-4 h-4 mr-2" /> },
  cobranza: { name: "Cobranza", icon: <DollarSign className="w-4 h-4 mr-2" /> },
  pre_estampado: { name: "Preparación", icon: <Printer className="w-4 h-4 mr-2" /> },
  estampado: { name: "Estampado", icon: <Tag className="w-4 h-4 mr-2" /> },
  empaquetado: { name: "Empaquetado", icon: <Box className="w-4 h-4 mr-2" /> },
  reparto: { name: "Reparto", icon: <Truck className="w-4 h-4 mr-2" /> },
  finalizados: { name: "Finalizados", icon: <CheckCircle2 className="w-4 h-4 mr-2" /> },
}

const CONFECCION_TABS = {
  corte: { name: "Corte", icon: <Scissors className="w-4 h-4 mr-2" /> },
  confeccion: { name: "Confección", icon: <Shirt className="w-4 h-4 mr-2" /> },
  limpieza: { name: "Limpieza", icon: <Sparkles className="w-4 h-4 mr-2" /> },
  registro: { name: "Registro", icon: <FileText className="w-4 h-4 mr-2" /> },
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-50 min-h-screen">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">{title}</h2>
      <div className="glass-box p-8 rounded-2xl text-center">
        <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <p className="text-slate-700 font-medium">En desarrollo.</p>
      </div>
    </div>
  )
}

export function GestionFlujosTab() {
  const { isOwner } = useAuth()
  const [flujos, setFlujos] = useState<any[]>([])
  const [etapas, setEtapas] = useState<any[]>([])
  const [selectedFlujo, setSelectedFlujo] = useState<any>(null)
  const [showFlujoModal, setShowFlujoModal] = useState(false)
  const [showEtapaModal, setShowEtapaModal] = useState(false)
  const [editingFlujo, setEditingFlujo] = useState<any>(null)
  const [editingEtapa, setEditingEtapa] = useState<any>(null)

  useEffect(() => {
    const unsubscribeFlujos = mockFirestore.collection("flujos").onSnapshot((snapshot: any) => {
      const flujosData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      setFlujos(flujosData.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0)))
    })
    // Etapas: cargar una vez desde la misma fuente que escribe el modal; actualizaciones vía onSave/refreshEtapas
    const list = (mockDatabase.etapas || []).map((e: any) => ({ id: e.id, ...e }))
    setEtapas(list)
  }, [])

  if (!isOwner()) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">No tienes permisos para acceder a esta sección</p>
        </div>
      </div>
    )
  }

  const etapasDelFlujo = selectedFlujo
    ? etapas.filter((e: any) => e.flujoId === selectedFlujo.id).sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
    : []

  const refreshFlujos = () => {
    const list = (mockDatabase.flujos || []).map((f: any) => ({ id: f.id, ...f }))
    setFlujos(list.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0)))
  }
  const refreshEtapas = () => {
    const list = (mockDatabase.etapas || []).map((e: any) => ({ id: e.id, ...e }))
    setEtapas(list)
  }

  const handleCreateFlujo = () => {
    setEditingFlujo(null)
    setShowFlujoModal(true)
  }

  const handleEditFlujo = (flujo: any) => {
    setEditingFlujo(flujo)
    setShowFlujoModal(true)
  }

  const handleDesactivarFlujo = async (flujo: any) => {
    if (!confirm(`¿Está seguro de que desea desactivar el flujo "${flujo.nombre}"?`)) return
    try {
      await mockFirestore.doc("flujos", flujo.id).update({ activo: false })
      refreshFlujos()
    } catch (error: any) {
      console.error("Error al desactivar flujo:", error)
      alert("Error al desactivar el flujo")
    }
  }

  const handleEliminarFlujo = async (flujo: any) => {
    if (!confirm(`¿Está seguro de que desea eliminar el flujo "${flujo.nombre}"? Se eliminarán también todas sus etapas.`)) return
    try {
      const etapasDelFlujo = etapas.filter((e: any) => e.flujoId === flujo.id)
      for (const etapa of etapasDelFlujo) {
        await mockFirestore.doc("etapas", etapa.id).delete()
      }
      await mockFirestore.doc("flujos", flujo.id).delete()
      refreshFlujos()
      refreshEtapas()
      if (selectedFlujo?.id === flujo.id) setSelectedFlujo(null)
    } catch (error: any) {
      console.error("Error al eliminar flujo:", error)
      alert("Error al eliminar el flujo")
    }
  }

  const handleToggleFlujo = async (flujo: any) => {
    try {
      await mockFirestore.doc("flujos", flujo.id).update({ activo: !flujo.activo })
    } catch (error: any) {
      console.error("Error al cambiar estado del flujo:", error)
      alert("Error al cambiar el estado del flujo")
    }
  }

  const handleCreateEtapa = () => {
    if (!selectedFlujo) {
      alert("Por favor, seleccione un flujo primero")
      return
    }
    setEditingEtapa(null)
    setShowEtapaModal(true)
  }

  const handleEditEtapa = (etapa: any) => {
    setEditingEtapa(etapa)
    setShowEtapaModal(true)
  }

  const handleDeleteEtapa = async (etapa: any) => {
    if (etapa.obligatoria) {
      alert("No se puede eliminar una etapa obligatoria")
      return
    }
    if (!confirm(`¿Está seguro de que desea eliminar la etapa "${etapa.nombre}"?`)) return

    try {
      await mockFirestore.doc("etapas", etapa.id).delete()
      refreshEtapas()
    } catch (error: any) {
      console.error("Error al eliminar etapa:", error)
      alert("Error al eliminar la etapa")
    }
  }

  const handleReorderEtapas = async (nuevasEtapas: any) => {
    try {
      for (const etapa of nuevasEtapas) {
        await mockFirestore.doc("etapas", etapa.id).update({ orden: etapa.orden })
      }
      refreshEtapas()
    } catch (error: any) {
      console.error("Error al reordenar etapas:", error)
      alert("Error al reordenar las etapas")
    }
  }

  const getIconComponent = (iconName: any) => {
    const iconMap = {
      ShoppingCart, Palette, DollarSign, Printer, Tag, Box, Truck, CheckCircle2,
      Scissors, Shirt, Sparkles, FileText, User, Settings, Archive, PackageSearch,
      Wrench, ArchiveRestore, History, Home, Database, FileSpreadsheet, BarChart3,
      Download, Menu, MoreVertical, LogOut, Edit, UserPlus, Eye, Upload, X,
      FileImage, AlertTriangle, PlusCircle, Save, Search, Trash2, XCircle, ImageIcon,
      CreditCard, Percent, CalendarIcon, ListOrdered, MinusCircle, SlidersHorizontal,
      ChevronDown, ChevronUp, GripVertical, Plus, Pencil, Trash, EyeOff, ArrowUp,
      ArrowDown, Move, Video, Megaphone, Lightbulb, Rocket, Beaker, TrendingUp,
    }
    const IconComponent = (iconMap as Record<string, React.ComponentType<{ className?: string }>>)[String(iconName)]
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-800">Gestión de Flujos</h2>
        <Button onClick={handleCreateFlujo} iconLeft={<Plus className="w-4 h-4" />}>
          Crear Nuevo Flujo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Flujos */}
        <div className="lg:col-span-1">
          <div className="glass-box rounded-2xl p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Flujos Disponibles</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {flujos.map((flujo: any) => {
                const IconComponent = getIconComponent(flujo.icono)
                const numEtapas = etapas.filter((e: any) => e.flujoId === flujo.id).length
                return (
                  <div
                    key={flujo.id}
                    onClick={() => setSelectedFlujo(flujo)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedFlujo?.id === flujo.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                      } ${!flujo.activo ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {IconComponent && <div style={{ color: flujo.color }}>{IconComponent}</div>}
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{flujo.nombre}</div>
                        {!flujo.activo && (
                          <span className="text-xs text-slate-500">Inactivo</span>
                        )}
                      </div>
                    </div>
                    {flujo.descripcion && (
                      <p className="text-sm text-slate-600 mb-2">{flujo.descripcion}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{numEtapas} etapa{numEtapas !== 1 ? "s" : ""}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e: any) => {
                            e.stopPropagation()
                            handleEditFlujo(flujo)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e: any) => {
                            e.stopPropagation()
                            handleToggleFlujo(flujo)
                          }}
                          className="p-1 text-slate-600 hover:bg-slate-50 rounded"
                          title={flujo.activo ? "Desactivar" : "Activar"}
                        >
                          {flujo.activo ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={(e: any) => {
                            e.stopPropagation()
                            handleEliminarFlujo(flujo)
                          }}
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
              {flujos.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Box className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No hay flujos creados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detalles del Flujo y Etapas */}
        <div className="lg:col-span-2">
          {selectedFlujo ? (
            <div className="glass-box rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {getIconComponent(selectedFlujo.icono) && (
                    <div style={{ color: selectedFlujo.color }}>
                      {getIconComponent(selectedFlujo.icono)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{selectedFlujo.nombre}</h3>
                    {selectedFlujo.descripcion && (
                      <p className="text-sm text-slate-600">{selectedFlujo.descripcion}</p>
                    )}
                  </div>
                </div>
                <Button onClick={handleCreateEtapa} iconLeft={<Plus className="w-4 h-4" />} size="sm">
                  Agregar Etapa
                </Button>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-slate-700 mb-3">Etapas del Flujo</h4>
                {etapasDelFlujo.length >= 2 ? (
                  <EtapasDragDropList
                    etapas={etapasDelFlujo}
                    onReorder={handleReorderEtapas}
                    onEdit={handleEditEtapa}
                    onDelete={handleDeleteEtapa}
                    flujoId={selectedFlujo.id}
                  />
                ) : (
                  <div className="space-y-2">
                    {etapasDelFlujo.map((etapa: any) => (
                      <div
                        key={etapa.id}
                        className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3"
                      >
                        {getIconComponent(etapa.icono) && (
                          <div style={{ color: etapa.color }}>{getIconComponent(etapa.icono)}</div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-slate-800">{etapa.nombre}</div>
                          {etapa.descripcion && (
                            <div className="text-sm text-slate-500">{etapa.descripcion}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditEtapa(etapa)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {!etapa.obligatoria && (
                            <button
                              onClick={() => handleDeleteEtapa(etapa)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {etapasDelFlujo.length < 2 && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                      Se requiere mínimo 2 etapas para este flujo. Agregue más etapas.
                    </p>
                  </div>
                )}
                {etapasDelFlujo.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Box className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>No hay etapas en este flujo</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-box rounded-2xl p-12 text-center">
              <Box className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600">Seleccione un flujo para ver sus etapas</p>
            </div>
          )}
        </div>
      </div>

      <FlujoFormModal
        isOpen={showFlujoModal}
        onClose={() => {
          setShowFlujoModal(false)
          setEditingFlujo(null)
        }}
        flujo={editingFlujo}
        onSave={() => {
          refreshFlujos()
        }}
      />

      <EtapaFormModal
        isOpen={showEtapaModal}
        onClose={() => {
          setShowEtapaModal(false)
          setEditingEtapa(null)
        }}
        etapa={editingEtapa ? (mockDatabase.etapas?.find((e: any) => e.id === editingEtapa.id) || editingEtapa) : null}
        flujoId={selectedFlujo?.id}
        onSave={(list: any) => {
          if (Array.isArray(list)) setEtapas(list)
          else refreshEtapas()
        }}
      />
    </div>
  )
}

const FLUJO_TABS_LIST = Object.entries(ROLES_TABS).map(([key, value]: [string, any]) => ({ id: key, ...value }))

export function FlujoMatrix({ totalesPorEtapa = {}, onStageChange }: any) {
  const { hasPermission } = useAuth()
  // Filtrar pestañas según permisos del usuario; si no hay ninguna (auth cargando), mostrar todas para que la UI no quede vacía
  const filteredTabs = Object.entries(ROLES_TABS)
    .filter(([key]) => {
      const moduleMap: Record<string, string> = {
        ventas: "ventas",
        diseño: "diseño",
        cobranza: "cobranza",
        pre_estampado: "preparacion",
        estampado: "estampado",
        empaquetado: "empaquetado",
        reparto: "reparto",
        finalizados: "finalizados",
      }
      const module = moduleMap[key]
      return module ? hasPermission(module, "ver") : false
    })
    .map(([key, value]: [string, any]) => ({ id: key, ...value }))
  const availableTabs = filteredTabs.length > 0 ? filteredTabs : FLUJO_TABS_LIST
  const [activeTab, setActiveTab] = useState(availableTabs.length > 0 ? availableTabs[0].id : "")

  useEffect(() => {
    if (availableTabs.length > 0 && !activeTab) setActiveTab(availableTabs[0].id)
  }, [availableTabs.length, activeTab])

  useEffect(() => {
    if (activeTab) onStageChange?.(activeTab)
  }, [activeTab, onStageChange])

  const renderTabContent = () => {
    switch (activeTab) {
      case "ventas":
        return <VentasTab />
      case "diseño":
        return <DiseñoTab />
      case "cobranza":
        return <CobranzaTab />
      case "pre_estampado":
        return <PreparacionTab />
      case "estampado":
        return <EstampadoTab />
      case "empaquetado":
        return <EmpaquetadoTab />
      case "reparto":
        return <RepartoTab />
      case "finalizados":
        return <FinalizadosTab />
      default:
        return <div className="p-6">Seleccione una pestaña.</div>
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'transparent' }}>
      <div className="px-4 pt-4 pb-2 flex-shrink-0 flex justify-center">
        <div className="w-fit rounded-2xl glass-box">
          <nav className="flex justify-center items-center px-6 py-4 overflow-x-auto" aria-label="Etapas del flujo">
            <div className="flex gap-2 items-end flex-wrap justify-center">
              {availableTabs.map((tab: any) => {
                const count = tab.id === "pre_estampado" ? totalesPorEtapa.preparacion : (totalesPorEtapa as Record<string, number>)[tab.id] || 0
                const isActive = activeTab === tab.id
                const colorClass = ({
                  ventas: "text-blue-600",
                  diseño: "text-rose-500",
                  cobranza: "text-green-600",
                  pre_estampado: "text-[#835378]",
                  estampado: "text-violet-700",
                  empaquetado: "text-teal-500",
                  reparto: "text-amber-700",
                  finalizados: "text-lime-500",
                } as Record<string, string>)[tab.id] || "text-slate-600"

                return (
                  <div key={tab.id} className="flex flex-col items-center group">
                    <span className={`text-4xl font-bold ${colorClass} mb-2 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>{count}</span>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`${isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-indigo-400/50 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30"
                        : "bg-white/70 text-slate-600 border-slate-200/80 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md active:scale-[0.98]"
                        } whitespace-nowrap py-3 px-6 border font-medium text-sm inline-flex items-center gap-2 transition-all duration-300 ease-out rounded-xl`}
                    >
                      <span className={`w-4 h-4 transition-transform duration-300 ${isActive ? "" : "group-hover:scale-110"}`}>{tab.icon}</span>
                      {tab.name}
                    </button>
                  </div>
                )
              })}
            </div>
          </nav>
        </div>
      </div>
      <div key={activeTab} className="flex-grow overflow-y-auto text-slate-800 stage-transition-in">
        {renderTabContent()}
      </div>
    </div>
  )
}

export function DynamicFlujoMatrix({ flujoId }: any) {
  const { hasPermission } = useAuth()
  const [etapas, setEtapas] = useState<any[]>([])
  const [flujo, setFlujo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("")

  // Cargar etapas del flujo
  useEffect(() => {
    const unsubscribeEtapas = mockFirestore.collection("etapas").onSnapshot((snapshot: any) => {
      const etapasData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      const etapasDelFlujo = etapasData
        .filter((e: any) => e.flujoId === flujoId)
        .sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
      setEtapas(etapasDelFlujo)

      // Establecer la primera etapa como activa si no hay ninguna seleccionada
      if (etapasDelFlujo.length > 0 && !activeTab) {
        setActiveTab(etapasDelFlujo[0].id)
      }
    })

    const unsubscribeFlujo = mockFirestore.collection("flujos").onSnapshot((snapshot: any) => {
      const flujosData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      const flujoActual = flujosData.find((f: any) => f.id === flujoId)
      setFlujo(flujoActual)
    })

    return () => {
      unsubscribeEtapas()
      unsubscribeFlujo()
    }
  }, [flujoId])

  // Función para obtener el componente de icono
  const getIconComponent = (iconName: any) => {
    const iconMap = {
      ShoppingCart, Palette, DollarSign, Printer, Tag, Box, Truck, CheckCircle2,
      Scissors, Shirt, Sparkles, FileText, User, Settings, Archive, PackageSearch,
      Wrench, ArchiveRestore, History, Home, Database, FileSpreadsheet, BarChart3,
      Download, Menu, MoreVertical, LogOut, Edit, UserPlus, Eye, Upload, X,
      FileImage, AlertTriangle, PlusCircle, Save, Search, Trash2, XCircle, ImageIcon,
      CreditCard, Percent, CalendarIcon, ListOrdered, MinusCircle, SlidersHorizontal,
      ChevronDown, ChevronUp, GripVertical, Plus, Pencil, Trash, EyeOff, ArrowUp,
      ArrowDown, Move, Video, Megaphone, Lightbulb, Rocket, Beaker, TrendingUp,
    }
    const IconComponent = (iconMap as any)[iconName]
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Box className="w-4 h-4" />
  }

  // Filtrar etapas según permisos
  const availableTabs = etapas.filter((etapa: any) => {
    if (!etapa.moduloPermisos) return true // Si no tiene módulo, permitir acceso
    return hasPermission(etapa.moduloPermisos, "ver")
  })

  const renderTabContent = () => {
    const etapaActual = etapas.find((e: any) => e.id === activeTab)
    if (!etapaActual) {
      return availableTabs.length > 0 ? <div className="p-6">Seleccione una pestaña.</div> : null
    }

    // Por ahora mostrar PlaceholderTab, pero se puede extender para mostrar contenido específico
    return <PlaceholderTab title={etapaActual.nombre} />
  }

  if (!flujo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Box className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-600">Cargando flujo...</p>
        </div>
      </div>
    )
  }

  if (etapas.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-400" />
          <p className="text-slate-700 font-medium">Este flujo no tiene etapas configuradas</p>
          <p className="text-sm text-slate-500 mt-2">Agrega etapas desde la gestión de flujos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <div className="border-b border-indigo-100/80 bg-gradient-to-r from-white/95 via-indigo-50/30 to-white/95 backdrop-blur-md shadow-sm">
        <nav className="flex justify-center items-center px-6 py-3 overflow-x-auto" aria-label="Tabs">
          <div className="flex gap-2">
            {availableTabs.map((etapa: any) => {
              const IconComponent = getIconComponent(etapa.icono)
              const isActive = activeTab === etapa.id
              return (
                <button
                  key={etapa.id}
                  onClick={() => setActiveTab(etapa.id)}
                  className={`${isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-indigo-400/50 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30"
                    : "bg-white/70 text-slate-600 border-slate-200/80 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md active:scale-[0.98]"
                    } whitespace-nowrap py-3 px-6 border font-medium text-sm inline-flex items-center gap-2 transition-all duration-300 ease-out rounded-xl`}
                  style={isActive ? {} : { color: etapa.color }}
                >
                  <span className="w-4 h-4 transition-transform duration-300 hover:scale-110" style={{ color: isActive ? "white" : etapa.color }}>
                    {IconComponent}
                  </span>
                  {etapa.nombre}
                </button>
              )
            })}
          </div>
        </nav>
      </div>
      <div key={activeTab} className="flex-grow overflow-y-auto bg-gradient-to-b from-slate-100/90 to-white text-slate-800 stage-transition-in">
        {renderTabContent()}
      </div>
    </div>
  )
}

export function ConfeccionMatrix({ totalesPorEtapa = {} }: any) {
  const { hasPermission } = useAuth()
  // Filtrar pestañas según permisos del usuario
  const availableTabs = Object.entries(CONFECCION_TABS)
    .filter(([key]) => {
      // Mapear nombres de pestañas a módulos (por ahora usar el mismo módulo "confeccion" para todas)
      const moduleMap: any = {
        corte: "confeccion",
        confeccion: "confeccion",
        limpieza: "confeccion",
        registro: "confeccion",
      }
      const module = moduleMap[key]
      return module ? hasPermission(module, "ver") : false
    })
    .map(([key, value]: [string, any]) => ({ id: key, ...value }))
  const [activeTab, setActiveTab] = useState(availableTabs.length > 0 ? availableTabs[0].id : "")

  const renderTabContent = () => {
    switch (activeTab) {
      case "corte":
        return <PlaceholderTab title="Corte" />
      case "confeccion":
        return <PlaceholderTab title="Confección" />
      case "limpieza":
        return <PlaceholderTab title="Limpieza" />
      case "registro":
        return <PlaceholderTab title="Registro" />
      default:
        return availableTabs.length > 0 ? <div className="p-6">Seleccione una pestaña.</div> : null
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <div className="border-b border-indigo-100/80 bg-gradient-to-r from-white/95 via-indigo-50/30 to-white/95 backdrop-blur-md shadow-sm">
        <nav className="flex justify-center items-center px-6 py-3 overflow-x-auto" aria-label="Tabs">
          <div className="flex gap-2 items-end">
            {availableTabs.map((tab: any) => {
              const count = totalesPorEtapa[tab.id] || 0
              const isActive = activeTab === tab.id
              const colorClass = ({
                corte: "text-orange-600",
                confeccion: "text-purple-600",
                limpieza: "text-cyan-600",
                registro: "text-green-600",
              } as any)[tab.id] || "text-slate-600"

              return (
                <div key={tab.id} className="flex flex-col items-center group">
                  <span className={`text-4xl font-bold ${colorClass} mb-2 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>{count}</span>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`${isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-indigo-400/50 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30"
                      : "bg-white/70 text-slate-600 border-slate-200/80 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md active:scale-[0.98]"
                      } whitespace-nowrap py-3 px-6 border font-medium text-sm inline-flex items-center gap-2 transition-all duration-300 ease-out rounded-xl`}
                  >
                    <span className={`w-4 h-4 transition-transform duration-300 ${isActive ? "" : "group-hover:scale-110"}`}>{tab.icon}</span>
                    {tab.name}
                  </button>
                </div>
              )
            })}
          </div>
        </nav>
      </div>
      <div className="flex-grow overflow-y-auto bg-gradient-to-b from-slate-100/90 to-white text-slate-800">{renderTabContent()}</div>
    </div>
  )
}