"use client"

import React, { useState, useMemo, useRef } from "react"
import { InventarioData } from "@/lib/inventario-data"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal, ConfirmationModal } from "@/components/ui/modal"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import * as XLSX from "xlsx-js-style"

function parseDateLocal(isoDateStr: string): Date {
  const parts = isoDateStr.trim().split("-").map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return new Date(NaN)
  const [y, m, d] = parts
  return new Date(y, m - 1, d)
}
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  FileDown,
  Trash2,
  RotateCcw,
  Upload,
  AlertTriangle,
  SlidersHorizontal,
  FileArchive,
  FolderInput,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Table2,
  Database,
  CalendarIcon,
} from "lucide-react"

export function ReportsPanel() {
  const { isOwner, hasSpecialPermission } = useAuth()
  const [reportType, setReportType] = useState<"entradas" | "salidas">("salidas")
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [reportGenerated, setReportGenerated] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showDeleteRangeConfirm, setShowDeleteRangeConfirm] = useState(false)
  const [csvImportText, setCsvImportText] = useState("")
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [adminMessage, setAdminMessage] = useState("")
  const [simulacroMode, setSimulacroMode] = useState(true)
  const [cleanupStartDate, setCleanupStartDate] = useState("")
  const [cleanupEndDate, setCleanupEndDate] = useState("")
  const fileBackupInputRef = useRef<HTMLInputElement>(null)
  const fileStockInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = isOwner?.() ?? hasSpecialPermission?.("reportes") ?? false

  const rangeHistory = useMemo(() => {
    const start = startOfDay(parseDateLocal(startDate))
    const endRequested = endOfDay(parseDateLocal(endDate))
    const todayEnd = endOfDay(new Date())
    const end = endRequested.getTime() > todayEnd.getTime() ? todayEnd : endRequested
    return InventarioData.getHistoryByDateRange(start, end)
  }, [startDate, endDate])

  const filteredByType = useMemo(() => {
    const action = reportType === "entradas" ? "Entrada" : "Salida"
    return rangeHistory.filter((l) => l.action === action)
  }, [rangeHistory, reportType])

  const generateReport = () => {
    setReportGenerated(true)
  }

  const exportReport = () => {
    const start = startOfDay(parseDateLocal(startDate))
    const endRequested = endOfDay(parseDateLocal(endDate))
    const todayEnd = endOfDay(new Date())
    const end = endRequested.getTime() > todayEnd.getTime() ? todayEnd : endRequested
    const logs = InventarioData.getHistoryByDateRange(start, end).filter(
      (l) => l.action === (reportType === "entradas" ? "Entrada" : "Salida")
    )
    const fechaGeneracion = format(new Date(), "dd/MM/yyyy", { locale: es })
    type Key = string
    const map = new Map<Key, { categoria: string; detalle: string; cantidad: number }>()
    for (const l of logs) {
      const tipoPrenda = l.metadata?.type?.trim() || ""
      const color = l.metadata?.color?.trim() || ""
      const size = l.metadata?.size?.trim() || ""
      let categoria = tipoPrenda
      let detalle = size ? `${color} - ${size}` : color || "-"
      if (!categoria && l.details) {
        const m = l.details.match(/^(.+?)\s*-\s*(.+?)\s*-\s*Talla\s*(.+?)\s*\(Cant:/)
        if (m) {
          categoria = m[1].trim()
          detalle = `${m[2].trim()} - ${m[3].trim()}`
        } else {
          categoria = l.details.split(" - ")[0]?.trim() || "Sin categoría"
          detalle = l.details.replace(/\(Cant:\s*\d+\)/, "").trim() || "-"
        }
      }
      if (!categoria) continue
      const key: Key = `${categoria}\t${detalle}`
      const prev = map.get(key)
      const qty = l.quantity ?? 0
      if (prev) prev.cantidad += qty
      else map.set(key, { categoria, detalle, cantidad: qty })
    }
    const rows: (string | number)[][] = [
      ["CATEGORÍA", "DETALLE (SKU)", "CANTIDAD", "FECHA GENERACIÓN"],
      ...Array.from(map.entries())
        .sort((a, b) => b[1].cantidad - a[1].cantidad)
        .map(([, v]) => [v.categoria, v.detalle, v.cantidad, fechaGeneracion]),
    ]
    try {
      const ws = XLSX.utils.aoa_to_sheet(rows)
      const headerStyle = {
        fill: { patternType: "solid", fgColor: { rgb: "2E7D32" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "left" as const },
      }
      const dataLeftStyle = { alignment: { horizontal: "left" as const } }
      const dataRightStyle = { alignment: { horizontal: "right" as const } }
      const cols = ["A", "B", "C", "D"]
      cols.forEach((col, c) => {
        const ref = `${col}1`
        if (ws[ref]) (ws[ref] as { s?: object }).s = headerStyle
      })
      for (let r = 2; r <= rows.length; r++) {
        cols.forEach((col, c) => {
          const ref = `${col}${r}`
          if (ws[ref]) (ws[ref] as { s?: object }).s = c < 2 ? dataLeftStyle : dataRightStyle
        })
      }
      const wb = XLSX.utils.book_new()
      const sheetTitle = reportType === "entradas" ? "Reporte ENTRADAS" : "Reporte SALIDAS"
      XLSX.utils.book_append_sheet(wb, ws, sheetTitle)
      const fileName = `Reporte ${reportType === "entradas" ? "ENTRADAS" : "SALIDAS"} (${startDate} al ${endDate}).xlsx`
      XLSX.writeFile(wb, fileName)
    } catch {
      const csv = [
        "CATEGORÍA,DETALLE (SKU),CANTIDAD,FECHA GENERACIÓN",
        ...Array.from(map.entries()).map(([, v]) => `${v.categoria},${v.detalle},${v.cantidad},${fechaGeneracion}`),
      ].join("\n")
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Reporte ${reportType === "entradas" ? "ENTRADAS" : "SALIDAS"} (${startDate} al ${endDate}).csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleResetAllStock = () => {
    const result = InventarioData.resetAllStock()
    if (result.success) {
      setAdminMessage(`Stock reseteado. ${result.count} ítems eliminados.`)
      setShowResetConfirm(false)
    } else {
      setAdminMessage("Error: " + result.error)
    }
  }

  const handleDeleteRange = () => {
    const startStr = cleanupStartDate?.trim() || startDate
    const endStr = cleanupEndDate?.trim() || endDate
    const start = startOfDay(parseDateLocal(startStr))
    const endRequested = endOfDay(parseDateLocal(endStr))
    const todayEnd = endOfDay(new Date())
    const end = endRequested.getTime() > todayEnd.getTime() ? todayEnd : endRequested
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setAdminMessage("Fechas inválidas. Usa el selector de fechas o elige un rango válido.")
      setShowDeleteRangeConfirm(false)
      return
    }
    if (start.getTime() > end.getTime()) {
      setAdminMessage("La fecha de inicio debe ser anterior a la fecha de fin.")
      setShowDeleteRangeConfirm(false)
      return
    }
    const result = InventarioData.deleteLogsByDateRange(start, end)
    setShowDeleteRangeConfirm(false)
    if (result.success) {
      setAdminMessage(`Historial borrado: ${result.count} registros.`)
      setReportGenerated(false)
      setCleanupStartDate("")
      setCleanupEndDate("")
    } else {
      setAdminMessage("Error: " + result.error)
    }
  }

  const handleCsvImport = () => {
    if (!csvImportText.trim()) return
    const result = simulacroMode
      ? { success: true as const, count: 0, totalUnits: 0 }
      : InventarioData.importStockFromCSV(csvImportText)
    if (result.success) {
      setAdminMessage(
        simulacroMode ? "Simulacro: no se aplicaron cambios." : `Importado: ${result.count} líneas, ${result.totalUnits} unidades.`
      )
      if (!simulacroMode) setCsvImportText("")
      setShowCsvImport(false)
    } else {
      setAdminMessage("Error: " + result.error)
    }
  }

  const handleBackup14Days = () => {
    const history = InventarioData.getHistory()
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const logs = history.filter((l) => new Date(l.timestamp).getTime() >= twoWeeksAgo.getTime())
    if (logs.length === 0) {
      setAdminMessage("No hay registros en los últimos 14 días.")
      return
    }
    const csv = InventarioData.exportHistoryToCSV(logs)
    const filename = `backup_inventory_${format(new Date(), "yyyy-MM-dd")}.csv`
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setAdminMessage(`Backup descargado: ${logs.length} registros.`)
  }

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = String(evt.target?.result ?? "")
      const logs = InventarioData.parseHistoryCSV(text)
      if (logs.length === 0) {
        setAdminMessage("No se pudieron leer registros del CSV. Verifique el formato (Fecha,Hora,Tipo,Usuario,Detalle,Cantidad).")
        e.target.value = ""
        return
      }
      if (window.confirm(`Se encontraron ${logs.length} registros. ¿Desea importarlos al historial?`)) {
        const result = InventarioData.importHistoryLogs(logs)
        if (result.success) {
          setAdminMessage(`Importación completada. ${result.count} registros añadidos.`)
        } else {
          setAdminMessage("Error: " + result.error)
        }
      }
      e.target.value = ""
    }
    reader.readAsText(file)
  }

  const handleOptimization = () => {
    if (!window.confirm("¿Ejecutar optimización? Se revisará la estructura del inventario.")) return
    const result = InventarioData.normalizeInventoryStats()
    if (result.success) {
      setAdminMessage(`Optimización aplicada. ${result.count} ítems revisados.`)
    } else {
      setAdminMessage("Error: " + result.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tipo de reporte */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={() => setReportType("salidas")}
          className={`w-52 h-[44px] min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm leading-none transition-all box-border ${
            reportType === "salidas"
              ? "bg-red-600 text-white shadow border-2 border-red-600"
              : "bg-red-50 border-2 border-red-300 text-slate-700 hover:bg-red-100"
          }`}
        >
          <TrendingDown className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">REPORTE DE SALIDAS</span>
        </button>
        <button
          type="button"
          onClick={() => setReportType("entradas")}
          className={`w-52 h-[44px] min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm leading-none transition-all box-border ${
            reportType === "entradas"
              ? "bg-green-600 text-white shadow border-2 border-green-600"
              : "bg-green-50 border-2 border-green-300 text-slate-700 hover:bg-green-100"
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">REPORTE DE ENTRADAS</span>
        </button>
      </div>

      {/* Filtro por fechas - contenedor más cuadrado */}
      <div className="glass-box-flujos rounded-2xl shadow-sm p-5 max-w-3xl mx-auto">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          FILTRO POR FECHAS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de Inicio</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-left text-sm hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <span className="flex-1 text-slate-800">
                    {format(parseDateLocal(startDate), "dd/MM/yyyy", { locale: es })}
                  </span>
                  <CalendarIcon className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseDateLocal(startDate)}
                  onSelect={(d) => {
                    if (d) setStartDate(format(d, "yyyy-MM-dd"))
                  }}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de Fin</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-left text-sm hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <span className="flex-1 text-slate-800">
                    {format(parseDateLocal(endDate), "dd/MM/yyyy", { locale: es })}
                  </span>
                  <CalendarIcon className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parseDateLocal(endDate)}
                  onSelect={(d) => {
                    if (d) setEndDate(format(d, "yyyy-MM-dd"))
                  }}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            onClick={generateReport}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            GENERAR REPORTE
          </Button>
          <Button
            variant="outline"
            onClick={exportReport}
            className="border-green-600 text-green-700 hover:bg-green-50"
          >
            <Table2 className="w-4 h-4 mr-2" />
            EXPORTAR A EXCEL
          </Button>
        </div>
      </div>

      {reportGenerated && (
        <div className="glass-box-flujos rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-white/30 bg-white/10 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-slate-800">
              {reportType === "entradas" ? "Reporte de Entradas" : "Reporte de Salidas"}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Desde: {format(parseDateLocal(startDate), "dd/MM/yyyy", { locale: es })} — Hasta: {format(parseDateLocal(endDate), "dd/MM/yyyy", { locale: es })}
            </p>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">Fecha / Hora</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">Acción</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase">Detalle</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 uppercase">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredByType.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No hay registros en el rango de fechas seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredByType.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 text-slate-700 whitespace-nowrap">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                      </td>
                      <td className="px-4 py-2 text-slate-800">{log.user}</td>
                      <td className="px-4 py-2">
                        <span className={log.action === "Entrada" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-800">{log.details}</td>
                      <td className={`px-4 py-2 text-right font-semibold ${log.action === "Entrada" ? "text-green-600" : "text-red-600"}`}>
                        {log.action === "Entrada" ? `+${log.quantity}` : `-${log.quantity}`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Zona Administrador - contenedor más cuadrado */}
      {isAdmin && (
        <div className="glass-box-flujos rounded-2xl p-6 max-w-3xl mx-auto border-2 border-dashed border-red-300/70">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            ZONA ADMINISTRADOR
          </h3>
          {adminMessage && (
            <p className="mb-4 text-sm text-slate-700 glass-box-flujos rounded-lg px-3 py-2">{adminMessage}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Copia de Seguridad */}
            <div className="glass-box-flujos rounded-xl p-4">
              <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                <FileArchive className="w-4 h-4 text-slate-500" />
                Copia de Seguridad
              </h4>
              <p className="text-sm text-slate-600 mb-3">Descarga o restaura los datos del historial.</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleBackup14Days}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Backup Últimos 14 Días
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileBackupInputRef}
                  className="hidden"
                  onChange={handleImportBackupFile}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-50"
                  onClick={() => fileBackupInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Backup (CSV)
                </Button>
              </div>
            </div>

            {/* Importar Stock Masivo */}
            <div className="glass-box-flujos rounded-xl p-4">
              <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                <FolderInput className="w-4 h-4 text-slate-500" />
                Importar Stock Masivo
              </h4>
              <p className="text-sm text-slate-600 mb-3">Carga stock inicial (Lista Simple o Matriz).</p>
              <label className="flex items-center gap-2 text-sm text-slate-700 mb-3">
                <input
                  type="checkbox"
                  checked={simulacroMode}
                  onChange={(e) => setSimulacroMode(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Modo Simulacro (Solo probar)
              </label>
              <button
                type="button"
                onClick={() => setShowCsvImport(true)}
                className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700"
              >
                <Upload className="w-4 h-4" />
                Cargar CSV de Stock
              </button>
            </div>

            {/* Limpieza de Historial */}
            <div className="glass-box-flujos rounded-xl p-4">
              <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                <Trash2 className="w-4 h-4 text-slate-500" />
                Limpieza de Historial
              </h4>
              <p className="text-sm text-slate-600 mb-3">Elimina registros permanentemente.</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Input
                  label="Fecha Inicio"
                  type="date"
                  value={cleanupStartDate}
                  onChange={(e) => setCleanupStartDate(e.target.value)}
                  placeholder="dd/mm/aaaa"
                />
                <Input
                  label="Fecha Fin"
                  type="date"
                  value={cleanupEndDate}
                  onChange={(e) => setCleanupEndDate(e.target.value)}
                  placeholder="dd/mm/aaaa"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() => setShowDeleteRangeConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                ELIMINAR REGISTROS
              </Button>
            </div>

            {/* Gestión de Stock */}
            <div className="glass-box-flujos rounded-xl p-4">
              <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                <RotateCcw className="w-4 h-4 text-slate-500" />
                Gestión de Stock
              </h4>
              <p className="text-sm text-slate-600 mb-3">Reinicia el contador de TODOS los productos a cero.</p>
              <Button
                size="sm"
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => setShowResetConfirm(true)}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                BORRAR TODO EL STOCK
              </Button>
            </div>

            {/* Optimización */}
            <div className="glass-box-flujos rounded-xl p-4 border-2 border-dashed border-violet-300/70">
              <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                Optimización
              </h4>
              <p className="text-sm text-slate-600 mb-3">Migrar datos a nueva estructura.</p>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleOptimization}>
                <Database className="w-4 h-4 mr-2" />
                RESCATAR DATOS (MIGRAR)
              </Button>
            </div>

          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetAllStock}
        title="Borrar todo el stock"
        message="¿Estás seguro? Se pondrá todo el inventario en 0. Esta acción no se puede deshacer."
        confirmText="Sí, borrar"
        cancelText="Cancelar"
      />
      <ConfirmationModal
        isOpen={showDeleteRangeConfirm}
        onClose={() => setShowDeleteRangeConfirm(false)}
        onConfirm={handleDeleteRange}
        title="Eliminar registros del historial"
        message={`¿Borrar todos los movimientos entre ${cleanupStartDate || startDate} y ${cleanupEndDate || endDate}? (${rangeHistory.length} registros)`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
      />

      {showCsvImport && (
        <Modal
          isOpen={showCsvImport}
          onClose={() => setShowCsvImport(false)}
          title="Importar stock desde CSV"
        >
          <p className="text-sm text-slate-600 mb-2">
            Formato (mismo que el proyecto original): cabecera TIPO, COLOR, TALLA, CANTIDAD. Una línea por fila.
          </p>
          {simulacroMode && (
            <p className="text-amber-700 text-sm mb-2 bg-amber-50 rounded-lg px-2 py-1">Modo simulacro: no se aplicarán cambios.</p>
          )}
          <input
            type="file"
            accept=".csv"
            ref={fileStockInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = (ev) => {
                setCsvImportText(String(ev.target?.result ?? ""))
              }
              reader.readAsText(file)
              e.target.value = ""
            }}
          />
          <div className="flex gap-2 mb-2">
            <Button type="button" size="sm" variant="outline" onClick={() => fileStockInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Seleccionar archivo CSV
            </Button>
          </div>
          <textarea
            className="w-full h-48 p-3 border border-slate-300 rounded-lg font-mono text-sm"
            value={csvImportText}
            onChange={(e) => setCsvImportText(e.target.value)}
            placeholder="TIPO,COLOR,TALLA,CANTIDAD&#10;Polera,Negro,M,50"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCsvImport(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCsvImport}>Importar</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
