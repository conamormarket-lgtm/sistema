"use client"

import React from "react"
import { InventarioData } from "@/lib/inventario-data"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react"

type HistoryPanelProps = {
  inventarioId?: string | null
  inventarioSeleccionado?: string
}

export function HistoryPanel({ inventarioId = null, inventarioSeleccionado = "prendas" }: HistoryPanelProps = {}) {
  const history =
    inventarioSeleccionado === "historial" || inventarioSeleccionado === "prendas" || !inventarioId
      ? InventarioData.getHistory()
      : InventarioData.getHistoryGenerico(inventarioId)

  const entradas = history.filter((l) => l.action === "Entrada")
  const salidas = history.filter((l) => l.action === "Salida")

  const renderEntry = (log: (typeof history)[0], isEntrada: boolean) => (
    <li key={log.id} className="py-3 px-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-medium text-slate-800 break-words">{log.details}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Por: {log.user} • {format(new Date(log.timestamp), "d/M/yyyy HH:mm", { locale: es })}
          </p>
        </div>
        <span
          className={`shrink-0 text-sm font-semibold ${isEntrada ? "text-green-600" : "text-red-600"}`}
        >
          {isEntrada ? `+${log.quantity}` : `-${log.quantity}`}
        </span>
      </div>
    </li>
  )

  return (
    <div className="space-y-4 overflow-x-hidden">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-slate-600" />
        <h2 className="text-xl font-bold text-slate-800">Historial de Actividad</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
        {/* Panel Entradas */}
        <div className="min-w-0 max-w-full">
          <p className="text-base font-semibold text-green-600 mb-2 flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-green-600 shrink-0" />
            <span>Entradas</span>
          </p>
          <div
            className={`glass-box rounded-2xl overflow-x-hidden min-w-0 ${entradas.length > 0 ? "max-h-[520px] overflow-y-auto" : ""}`}
          >
            <ul className="p-0 min-w-0">
              {entradas.length === 0 ? (
                <li className="py-8 text-center text-slate-500 text-sm">Sin registros</li>
              ) : (
                entradas.slice(0, 100).map((log) => renderEntry(log, true))
              )}
            </ul>
          </div>
        </div>

        {/* Panel Salidas */}
        <div className="min-w-0 max-w-full">
          <p className="text-base font-semibold text-red-600 mb-2 flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4 text-red-600 shrink-0" />
            <span>Salidas</span>
          </p>
          <div
            className={`glass-box rounded-2xl overflow-x-hidden min-w-0 ${salidas.length > 0 ? "max-h-[520px] overflow-y-auto" : ""}`}
          >
            <ul className="p-0 min-w-0">
              {salidas.length === 0 ? (
                <li className="py-8 text-center text-slate-500 text-sm">Sin registros</li>
              ) : (
                salidas.slice(0, 100).map((log) => renderEntry(log, false))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
