"use client"

import React from "react"
import { InventarioData } from "@/lib/inventario-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { RefreshCw, ArrowLeft, ArrowRight } from "lucide-react"

export function HistoryPanel() {
  const history = InventarioData.getHistory()

  const entradas = history.filter((l) => l.action === "Entrada")
  const salidas = history.filter((l) => l.action === "Salida")

  const renderEntry = (log: (typeof history)[0], isEntrada: boolean) => (
    <li key={log.id} className="py-3 px-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800">{log.details}</p>
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-slate-600" />
        <h2 className="text-xl font-bold text-slate-800">Historial de Actividad</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel Entradas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white">
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <h3 className="font-semibold text-base">Entradas</h3>
          </div>
          <ScrollArea className="h-[320px]">
            <ul className="p-0">
              {entradas.length === 0 ? (
                <li className="py-8 text-center text-slate-500 text-sm">Sin registros</li>
              ) : (
                entradas.slice(0, 100).map((log) => renderEntry(log, true))
              )}
            </ul>
          </ScrollArea>
        </div>

        {/* Panel Salidas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white">
            <ArrowRight className="w-4 h-4 shrink-0" />
            <h3 className="font-semibold text-base">Salidas</h3>
          </div>
          <ScrollArea className="h-[320px]">
            <ul className="p-0">
              {salidas.length === 0 ? (
                <li className="py-8 text-center text-slate-500 text-sm">Sin registros</li>
              ) : (
                salidas.slice(0, 100).map((log) => renderEntry(log, false))
              )}
            </ul>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
