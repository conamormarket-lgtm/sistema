"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { mockDatabase } from "@/lib/mock-firebase"
import { MovementForm } from "./MovementForm"
import { StatsPanel } from "./StatsPanel"
import { HistoryPanel } from "./HistoryPanel"
import { ReportsPanel } from "./ReportsPanel"
import { Package, BarChart3, History, FileText } from "lucide-react"

const INVENTARIO_TABS = [
  { key: "movimientos", name: "Entradas / Salidas", icon: <Package className="w-4 h-4 mr-2" /> },
  { key: "resumen", name: "Resumen", icon: <BarChart3 className="w-4 h-4 mr-2" /> },
  { key: "historial", name: "Historial", icon: <History className="w-4 h-4 mr-2" /> },
  { key: "reportes", name: "Reportes", icon: <FileText className="w-4 h-4 mr-2" /> },
]

const NOMBRES_TIPO: Record<string, string> = {
  prendas: "Prendas",
  productos: "Productos",
  insumos: "Insumos",
  activos: "Activos",
  historial: "Historial Movimientos",
}

type InventarioPortedProps = {
  inventarioSeleccionado?: string
  onInventarioTabChange?: (tab: string) => void
  compactLayout?: boolean
}

function resolveInventarioId(inventarioSeleccionado: string): string | null {
  if (inventarioSeleccionado === "prendas") return "inventario-prendas"
  const inventarios = (mockDatabase as any).inventarios || []
  const inv = inventarios.find((inv: any) => inv.tipo === inventarioSeleccionado)
  return inv?.id ?? null
}

export function InventarioPorted({ inventarioSeleccionado = "prendas", onInventarioTabChange, compactLayout = false }: InventarioPortedProps = {}) {
  const { userData } = useAuth()
  const [activeTab, setActiveTab] = useState("movimientos")
  const [, setRefresh] = useState(0)
  const [hideScrollbar, setHideScrollbar] = useState(false)
  const inventarioId = resolveInventarioId(inventarioSeleccionado)
  const nombreTipo = NOMBRES_TIPO[inventarioSeleccionado] ?? inventarioSeleccionado

  useEffect(() => {
    onInventarioTabChange?.(activeTab)
  }, [activeTab, onInventarioTabChange])

  useEffect(() => {
    setHideScrollbar(true)
    const t = setTimeout(() => setHideScrollbar(false), 320)
    return () => clearTimeout(t)
  }, [activeTab])

  const currentUser = {
    name: userData?.name ?? undefined,
    username: userData?.email ?? undefined,
  }

  const onMovementDone = useCallback(() => {
    setRefresh((n) => n + 1)
  }, [])

  // Historial Movimientos: solo vista de historial
  if (inventarioSeleccionado === "historial") {
    return (
      <div className={`px-6 pt-2 pb-6 flex flex-col ${compactLayout ? "flex-1 min-h-0 h-full" : "min-h-screen"}`}>
        <div className={`mb-2 ${compactLayout ? "flex-shrink-0" : ""}`}>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-8 rounded-full bg-blue-600" />
            Historial Movimientos
          </h2>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Consulta el historial de entradas y salidas de inventario.
          </p>
        </div>
        <div className={`${compactLayout ? "flex-1 min-h-0 overflow-y-auto overflow-x-hidden" : "flex-grow overflow-x-hidden"}`}>
          <HistoryPanel inventarioId={null} inventarioSeleccionado="historial" />
        </div>
      </div>
    )
  }

  // Prendas, Productos, Insumos, Activos: mismas pestañas y funciones (sin personalización de prendas cuando no es prendas)
  const renderContent = () => {
    switch (activeTab) {
      case "movimientos":
        return (
          <MovementForm
            currentUser={currentUser}
            onMovementDone={onMovementDone}
            inventarioId={inventarioId ?? undefined}
            inventarioSeleccionado={inventarioSeleccionado}
          />
        )
      case "resumen":
        return (
          <StatsPanel
            inventarioId={inventarioId ?? undefined}
            inventarioSeleccionado={inventarioSeleccionado}
          />
        )
      case "historial":
        return (
          <HistoryPanel
            inventarioId={inventarioId ?? undefined}
            inventarioSeleccionado={inventarioSeleccionado}
          />
        )
      case "reportes":
        return (
          <ReportsPanel
            inventarioId={inventarioId ?? undefined}
            inventarioSeleccionado={inventarioSeleccionado}
          />
        )
      default:
        return (
          <MovementForm
            currentUser={currentUser}
            onMovementDone={onMovementDone}
            inventarioId={inventarioId ?? undefined}
            inventarioSeleccionado={inventarioSeleccionado}
          />
        )
    }
  }

  return (
    <div className={`px-6 pt-2 pb-6 flex flex-col ${compactLayout ? "flex-1 min-h-0 h-full" : "min-h-screen"}`}>
      <div className={`mb-2 ${compactLayout ? "flex-shrink-0" : ""}`}>
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-8 rounded-full bg-blue-600" />
          Control de inventario ({nombreTipo})
        </h2>
        <p className="text-sm text-slate-600 mt-1 font-medium">
          Registra entradas y salidas, revisa resumen e historial. {inventarioSeleccionado !== "prendas" && "Configura tipos y características en Gestión de Inventarios."}
        </p>
      </div>
      <div className={`flex flex-wrap justify-center items-center gap-2 py-2 mb-4 ${compactLayout ? "flex-shrink-0" : ""}`} aria-label="Tabs Inventario">
        {INVENTARIO_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full inline-flex items-center gap-2 py-2.5 px-4 font-medium text-sm transition-all duration-200 border ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border-indigo-400/50 ring-2 ring-blue-400/30"
                : "bg-white/70 text-slate-600 border-slate-200/80 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 shadow-sm"
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>
      <div
        className={`${compactLayout ? "flex-1 min-h-0 overflow-y-auto overflow-x-hidden" : "flex-grow overflow-x-hidden"} ${hideScrollbar ? "inventario-hide-scrollbar" : ""}`}
      >
        <div key={activeTab} className="stage-transition-in min-h-full w-full">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
