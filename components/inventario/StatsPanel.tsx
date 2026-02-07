"use client"

import React, { useMemo, useState, useEffect } from "react"
import { InventarioData } from "@/lib/inventario-data"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { Shirt, Palette, LayoutGrid, RefreshCw, ArrowLeft, FileDown } from "lucide-react"
import { Input, Select } from "@/components/ui/input"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const DONUT_COLORS = [
  "#8b5cf6", "#ec4899", "#22c55e", "#eab308", "#3b82f6",
  "#a78bfa", "#14b8a6", "#f43f5e", "#f97316", "#06b6d4",
  "#84cc16", "#6366f1",
]

const chartConfig = {
  cantidad: { label: "Unidades", color: "hsl(var(--chart-1))" },
  name: { label: "Nombre", color: "hsl(var(--chart-2))" },
}

const FALLBACK_BAR_COLOR = "#94a3b8"

export function StatsPanel() {
  const [subView, setSubView] = useState<"color" | "talla" | "prenda">("color")
  const [selectedPrendaType, setSelectedPrendaType] = useState<string | null>(null)
  const [prendaFilterColor, setPrendaFilterColor] = useState("")
  const [prendaFilterTalla, setPrendaFilterTalla] = useState("")
  const [prendaFilterStockMin, setPrendaFilterStockMin] = useState<string>("0")
  const [prendaFilterStockMax, setPrendaFilterStockMax] = useState<string>("∞")
  const inventory = InventarioData.getInventory()
  const meta = InventarioData.getMetadata()

  useEffect(() => {
    if (subView !== "prenda") setSelectedPrendaType(null)
  }, [subView])

  const colorNameToHex = useMemo(() => {
    const map: Record<string, string> = {}
    meta.colors.forEach((c) => {
      map[c.name] = c.hex
      map[c.name.toLowerCase().replace(/\s+/g, "")] = c.hex
    })
    return (name: string) => map[name] ?? map[name.toLowerCase().replace(/\s+/g, "")] ?? FALLBACK_BAR_COLOR
  }, [meta.colors])

  const byType = useMemo(() => {
    const metaTypes = meta.garments ?? []
    const inventoryTypes = Array.from(new Set(inventory.map((i) => i.type)))
    const allTypes = [...metaTypes]
    inventoryTypes.forEach((t) => {
      if (!allTypes.includes(t)) allTypes.push(t)
    })
    const map: Record<string, number> = {}
    allTypes.forEach((t) => { map[t] = 0 })
    inventory.forEach((item) => {
      map[item.type] = (map[item.type] ?? 0) + item.quantity
    })
    return allTypes.map((name) => ({ name, cantidad: map[name] ?? 0 })).sort((a, b) => b.cantidad - a.cantidad)
  }, [inventory, meta.garments])

  const totalStock = useMemo(() => byType.reduce((s, t) => s + t.cantidad, 0), [byType])

  const byColor = useMemo(() => {
    const map: Record<string, number> = {}
    inventory.forEach((item) => {
      map[item.color] = (map[item.color] ?? 0) + item.quantity
    })
    return Object.entries(map)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
  }, [inventory])

  const detailByColor = useMemo(() => {
    const metaTypes = meta.garments ?? []
    const inventoryTypes = Array.from(new Set(inventory.map((i) => i.type)))
    const allTypes = [...metaTypes]
    inventoryTypes.forEach((t) => { if (!allTypes.includes(t)) allTypes.push(t) })
    const byColorMap: Record<string, { total: number; breakdown: Record<string, number> }> = {}
    inventory.forEach((item) => {
      if (!byColorMap[item.color]) {
        byColorMap[item.color] = { total: 0, breakdown: {} }
      }
      byColorMap[item.color].total += item.quantity
      byColorMap[item.color].breakdown[item.type] = (byColorMap[item.color].breakdown[item.type] ?? 0) + item.quantity
    })
    allTypes.forEach((t) => {
      Object.keys(byColorMap).forEach((color) => {
        if (byColorMap[color].breakdown[t] === undefined) byColorMap[color].breakdown[t] = 0
      })
    })
    return Object.entries(byColorMap)
      .map(([color, data]) => ({ color, ...data }))
      .sort((a, b) => b.total - a.total)
  }, [inventory, meta.garments])


  const matrixBySize = useMemo(() => {
    return inventory
      .filter((item) => item.quantity !== 0)
      .sort((a, b) => a.type.localeCompare(b.type) || a.color.localeCompare(b.color) || a.size.localeCompare(b.size))
  }, [inventory])

  const sizeMatrix = useMemo(() => {
    const fromMeta = meta.sizes ?? []
    const fromInventory = Array.from(new Set(inventory.map((i) => i.size)))
    const sizesOrder = [...fromMeta]
    fromInventory.forEach((s) => {
      if (!sizesOrder.includes(s)) sizesOrder.push(s)
    })
    const metaTypes = meta.garments ?? []
    const inventoryTypes = Array.from(new Set(inventory.map((i) => i.type)))
    const typesOrder = [...metaTypes]
    inventoryTypes.forEach((t) => {
      if (!typesOrder.includes(t)) typesOrder.push(t)
    })
    const cell: Record<string, Record<string, number>> = {}
    sizesOrder.forEach((s) => { cell[s] = {} })
    let globalTotal = 0
    inventory.forEach((item) => {
      if (!cell[item.size]) cell[item.size] = {}
      cell[item.size][item.type] = (cell[item.size][item.type] ?? 0) + item.quantity
      globalTotal += item.quantity
    })
    const rowTotals: Record<string, number> = {}
    sizesOrder.forEach((size) => {
      rowTotals[size] = typesOrder.reduce((sum, type) => sum + (cell[size]?.[type] ?? 0), 0)
    })
    return { sizesOrder, typesOrder, cell, rowTotals, globalTotal }
  }, [inventory, meta.sizes, meta.garments])

  const prendaDetailData = useMemo(() => {
    if (!selectedPrendaType) return { total: 0, rows: [] }
    const byType = inventory.filter((i) => i.type === selectedPrendaType)
    const total = byType.reduce((s, i) => s + i.quantity, 0)
    let rows = byType.map((item) => ({ sku: `${item.type} - ${item.color} - ${item.size}`, quantity: item.quantity, color: item.color, size: item.size }))
    if (prendaFilterColor) rows = rows.filter((r) => r.color === prendaFilterColor)
    if (prendaFilterTalla.trim()) rows = rows.filter((r) => r.size === prendaFilterTalla.trim())
    const min = prendaFilterStockMin === "" || prendaFilterStockMin === "∞" ? -Infinity : Number(prendaFilterStockMin)
    const max = prendaFilterStockMax === "" || prendaFilterStockMax === "∞" ? Infinity : Number(prendaFilterStockMax)
    if (!Number.isNaN(min)) rows = rows.filter((r) => r.quantity >= min)
    if (!Number.isNaN(max)) rows = rows.filter((r) => r.quantity <= max)
    rows = rows.sort((a, b) => a.color.localeCompare(b.color) || a.size.localeCompare(b.size))
    return { total, rows }
  }, [inventory, selectedPrendaType, prendaFilterColor, prendaFilterTalla, prendaFilterStockMin, prendaFilterStockMax])

  const colorsForPrendaFilter = useMemo(() => {
    const allColors = (meta.colors ?? []).map((c) => ({ value: c.name, label: c.name }))
    const inventoryColors = Array.from(new Set(inventory.map((i) => i.color))).filter((c) => !allColors.some((a) => a.value === c))
    const extra = inventoryColors.map((c) => ({ value: c, label: c }))
    return [{ value: "", label: "Todos" }, ...allColors, ...extra]
  }, [meta.colors, inventory])

  const handleExportPdf = async () => {
    if (!selectedPrendaType) return
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" })
      const pageW = doc.internal.pageSize.getWidth()
      const margin = 14
      const centerX = pageW / 2
      const colDetalleW = pageW - margin * 2 - 28
      let y = 22

      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text(`REPORTE DE INVENTARIO: ${selectedPrendaType.toUpperCase()}`, centerX, y, { align: "center" })
      y += 10

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      doc.text(`Generado el: ${format(new Date(), "d/M/yyyy, h:mm:ss a", { locale: es })}`, centerX, y, { align: "center" })
      y += 8

      doc.setDrawColor(220, 38, 38)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageW - margin, y)
      y += 10

      const boxTop = y
      const boxW = pageW - margin * 2
      const boxH = 38
      doc.setFillColor(245, 245, 245)
      doc.setDrawColor(220, 220, 220)
      doc.rect(margin, boxTop, boxW, boxH, "FD")
      y = boxTop + 12

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.text("STOCK TOTAL FILTRADO", centerX, y, { align: "center" })
      y += 12

      doc.setFont("helvetica", "bold")
      doc.setFontSize(32)
      doc.setTextColor(220, 38, 38)
      doc.text(String(prendaDetailData.total), centerX, y, { align: "center" })
      y = boxTop + boxH + 14

      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.text("Detalle de Items", margin, y)
      y += 8

      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      doc.text("DETALLE (SKU)", margin, y)
      doc.text("STOCK", pageW - margin - 20, y)
      y += 5

      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(margin, y, pageW - margin, y)
      y += 7

      doc.setFont("helvetica", "normal")
      const lineHeight = 6
      for (const row of prendaDetailData.rows) {
        if (y > 277) {
          doc.addPage()
          y = 20
        }
        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)
        const skuLines = doc.splitTextToSize(row.sku, colDetalleW)
        doc.text(skuLines, margin, y)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(row.quantity === 0 ? 220 : 0, row.quantity === 0 ? 38 : 0, row.quantity === 0 ? 38 : 0)
        doc.text(String(row.quantity), pageW - margin - 20, y)
        doc.setFont("helvetica", "normal")
        y += Math.max(7, skuLines.length * lineHeight)
        doc.setDrawColor(220, 220, 220)
        doc.line(margin, y, pageW - margin, y)
        y += 4
      }

      doc.save(`Reporte_Inventario_${selectedPrendaType.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`)
    } catch (err) {
      console.error("Error generando PDF:", err)
      alert("Error al generar el PDF. Intenta de nuevo.")
    }
  }

  if (inventory.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-slate-500" />
          <h2 className="text-2xl font-bold text-slate-800">Resumen de Stock</h2>
        </div>
        <div className="glass-box-flujos p-8 rounded-2xl text-center text-slate-600">
          No hay datos de stock. Registra entradas o salidas en Movimientos.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-slate-500" />
        <h2 className="text-2xl font-bold text-slate-800">Resumen de Stock</h2>
      </div>

      {/* Top row: dos cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card izquierda: Distribución por Tipo de Prenda (donut) */}
        <div className="glass-box-flujos rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Distribución por Tipo de Prenda</h3>
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[280px] h-[220px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <PieChart>
                  <Pie
                    data={byType}
                    dataKey="cantidad"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={80}
                    paddingAngle={1}
                    stroke="none"
                  >
                    {byType.map((_, index) => (
                      <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
            <p className="text-slate-600 font-semibold -mt-2">Total: {totalStock}</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs">
              {byType.map((t, i) => (
                <span key={t.name} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className="text-slate-700">{t.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card derecha: Top Colores con más Stock (barras horizontales) */}
        <div className="glass-box-flujos rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Top Colores con más Stock</h3>
          <p className="text-sm text-slate-500 mb-3">Top Colores</p>
          <div className="h-[260px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
                data={byColor.slice(0, 12)}
                layout="vertical"
                margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                  {byColor.slice(0, 12).map((entry, index) => (
                    <Cell key={entry.name} fill={colorNameToHex(entry.name)} stroke={entry.name === "Blanco" ? "#e2e8f0" : undefined} strokeWidth={entry.name === "Blanco" ? 1 : 0} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>

      {/* Tabs: Por Color | Por Talla (Matriz) | Por Prenda */}
      <div className="flex justify-center">
        <div className="flex flex-wrap gap-0 p-1 rounded-xl glass-box-flujos shadow-sm w-fit">
        <button
          type="button"
          onClick={() => setSubView("color")}
          className={`inline-flex items-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
            subView === "color"
              ? "bg-violet-600 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Palette className="w-4 h-4" />
          Por Color
        </button>
        <button
          type="button"
          onClick={() => setSubView("talla")}
          className={`inline-flex items-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
            subView === "talla"
              ? "bg-violet-600 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Por Talla (Matriz)
        </button>
        <button
          type="button"
          onClick={() => setSubView("prenda")}
          className={`inline-flex items-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
            subView === "prenda"
              ? "bg-violet-600 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Shirt className="w-4 h-4" />
          Por Prenda
        </button>
        </div>
      </div>

      {/* Tabla / contenido según vista */}
      <div className="glass-box-flujos rounded-2xl shadow-sm overflow-hidden">
        {subView === "color" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase">Color</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detailByColor.map((row) => (
                  <tr key={row.color} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.color}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 text-lg">{row.total}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        {Object.entries(row.breakdown)
                          .filter(([, qty]) => qty > 0)
                          .sort((a, b) => b[1] - a[1])
                          .map(([tipo, qty]) => (
                            <span key={tipo}>{tipo}: {qty}</span>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {subView === "talla" && (
          <div className="overflow-x-auto overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600 uppercase whitespace-nowrap">Talla / Prenda</th>
                  {sizeMatrix.typesOrder.map((type) => (
                    <th key={type} className="px-2 py-3 text-center font-semibold text-slate-600 uppercase whitespace-nowrap">
                      {type.toUpperCase()}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-semibold text-slate-600 uppercase whitespace-nowrap">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sizeMatrix.sizesOrder.map((size) => (
                  <tr key={size} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-center font-medium text-slate-800 whitespace-nowrap">{size}</td>
                    {sizeMatrix.typesOrder.map((type) => {
                      const qty = sizeMatrix.cell[size]?.[type] ?? 0
                      return (
                        <td key={type} className="px-2 py-2 text-center text-slate-700">
                          {qty === 0 ? "-" : qty}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2 text-center font-semibold text-blue-600 whitespace-nowrap">
                      {sizeMatrix.rowTotals[size] ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-right border-t border-slate-100">
              <span className="font-semibold text-green-600">Stock Global: {sizeMatrix.globalTotal}</span>
            </div>
          </div>
        )}

        {subView === "prenda" && !selectedPrendaType && (
          <div className="py-4">
            <h3 className="text-center text-lg font-semibold text-slate-800 mb-6">Selecciona una Prenda</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {byType.map((row) => (
                <button
                  key={row.name}
                  type="button"
                  onClick={() => {
                    setSelectedPrendaType(row.name)
                    setPrendaFilterColor("")
                    setPrendaFilterTalla("")
                    setPrendaFilterStockMin("0")
                    setPrendaFilterStockMax("∞")
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl glass-box-flujos shadow-sm hover:shadow-md transition-all text-violet-700"
                >
                  <Shirt className="w-10 h-10 shrink-0" />
                  <span className="font-medium text-sm text-center">{row.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {subView === "prenda" && selectedPrendaType && (
          <div className="overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedPrendaType(null)}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-4 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Cambiar Prenda
            </button>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800">TOTAL: {selectedPrendaType.toUpperCase()}</h3>
              <p className="text-4xl font-bold text-green-600 mt-1">{prendaDetailData.total}</p>
            </div>
            <div className="glass-box-flujos rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Filtrar Detalles</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Select
                  label="Color (Opcional)"
                  value={prendaFilterColor}
                  onChange={(e) => setPrendaFilterColor(e.target.value)}
                  options={colorsForPrendaFilter}
                />
                <Input
                  label="Talla (Opcional)"
                  value={prendaFilterTalla}
                  onChange={(e) => setPrendaFilterTalla(e.target.value)}
                  placeholder="Ej: M, L"
                />
                <Input
                  label="Stock Mín"
                  type="number"
                  value={prendaFilterStockMin}
                  onChange={(e) => setPrendaFilterStockMin(e.target.value)}
                  min={0}
                />
                <Input
                  label="Stock Máx"
                  value={prendaFilterStockMax}
                  onChange={(e) => setPrendaFilterStockMax(e.target.value)}
                  placeholder="∞"
                />
              </div>
            </div>
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium"
              >
                <FileDown className="w-4 h-4" />
                EXPORTAR PDF
              </button>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase">Detalle (SKU)</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 uppercase">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prendaDetailData.rows.map((row) => (
                  <tr
                    key={row.sku}
                    className={row.quantity === 0 ? "bg-red-50" : "hover:bg-slate-50/50"}
                  >
                    <td className="px-4 py-2 text-slate-800">{row.sku}</td>
                    <td className={`px-4 py-2 text-right font-medium ${row.quantity === 0 ? "text-red-600" : "text-green-600"}`}>
                      {row.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {prendaDetailData.rows.length === 0 && (
              <p className="text-center py-6 text-slate-500">No hay SKUs que coincidan con los filtros.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
