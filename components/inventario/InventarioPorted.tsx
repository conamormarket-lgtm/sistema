"use client"

import React, { useState, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
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

export function InventarioPorted() {
  const { userData } = useAuth()
  const [activeTab, setActiveTab] = useState("movimientos")
  const [, setRefresh] = useState(0)

  const currentUser = {
    name: userData?.name ?? undefined,
    username: userData?.email ?? undefined,
  }

  const onMovementDone = useCallback(() => {
    setRefresh((n) => n + 1)
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case "movimientos":
        return <MovementForm currentUser={currentUser} onMovementDone={onMovementDone} />
      case "resumen":
        return <StatsPanel />
      case "historial":
        return <HistoryPanel />
      case "reportes":
        return <ReportsPanel />
      default:
        return <MovementForm currentUser={currentUser} onMovementDone={onMovementDone} />
    }
  }

  return (
    <div className="px-6 pt-2 pb-6 min-h-screen">
      <div className="mb-2">
        <h2 className="text-3xl font-bold text-slate-800">Control de inventario (Prendas)</h2>
        <p className="text-slate-600 mt-1">Registra entradas y salidas, revisa resumen e historial.</p>
      </div>
      <div className="flex flex-wrap justify-center items-center gap-2 py-2 mb-4" aria-label="Tabs Inventario">
        {INVENTARIO_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full inline-flex items-center gap-2 py-2.5 px-4 font-medium text-sm transition-all duration-200 border ${
              activeTab === tab.key
                ? "bg-blue-600 text-white shadow-md border-blue-500"
                : "bg-white/70 text-slate-600 border-slate-200/80 hover:bg-blue-50/80 hover:text-indigo-700 hover:border-slate-200 shadow-sm"
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>
      <div className="flex-grow">{renderContent()}</div>
    </div>
  )
}
