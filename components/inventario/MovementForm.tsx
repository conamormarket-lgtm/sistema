"use client"

import React, { useState, useCallback, useEffect } from "react"
import { InventarioData } from "@/lib/inventario-data"
import { Button } from "@/components/ui/button"
import { ConfirmationModal } from "@/components/ui/modal"
import { Check, ArrowDownLeft, ArrowUpRight, Plus, Minus, Undo2 } from "lucide-react"

const QUICK_AMOUNTS = [10, 50, 100]

type MovementFormProps = {
  currentUser: { name?: string; username?: string }
  onMovementDone: () => void
  inventarioId?: string
  inventarioSeleccionado?: string
}

function FieldWithActions({
  label,
  id,
  value,
  onChange,
  options,
  onAdd,
  onRemove,
  showActions = true,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  onAdd: () => void
  onRemove: () => void
  showActions?: boolean
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {showActions && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onAdd}
              className="w-7 h-7 rounded-full border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-red-600 transition-colors"
              title="Agregar"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="w-7 h-7 rounded-full border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-red-600 transition-colors"
              title="Eliminar"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function MovementForm({ currentUser, onMovementDone, inventarioId, inventarioSeleccionado = "prendas" }: MovementFormProps) {
  const esPrendas = inventarioSeleccionado === "prendas" || !inventarioId
  const metaPrendas = InventarioData.getMetadata()
  const metaGenerico = inventarioId ? InventarioData.getMetadataGenerico(inventarioId) : null

  const [movementType, setMovementType] = useState<"entry" | "exit">("entry")
  const [quantity, setQuantity] = useState(0)
  const [error, setError] = useState("")
  const [undoStatus, setUndoStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [showUndoConfirm, setShowUndoConfirm] = useState(false)

  const meta = metaPrendas
  const [type, setType] = useState(meta.garments[0] ?? "")
  const [color, setColor] = useState(meta.colors[0]?.name ?? "")
  const [size, setSize] = useState(meta.sizes[0] ?? "")
  const [tipoGenerico, setTipoGenerico] = useState("")
  const [attrsGenerico, setAttrsGenerico] = useState<Record<number, string>>({})

  useEffect(() => {
    if (metaGenerico?.tipos?.length) {
      setTipoGenerico((prev) => (metaGenerico.tipos.includes(prev) ? prev : metaGenerico.tipos[0] ?? ""))
    } else {
      setTipoGenerico("")
    }
    setAttrsGenerico({})
  }, [inventarioId, metaGenerico?.tipos?.length])

  const optionsGarment = meta.garments.map((g) => ({ value: g, label: g }))
  const optionsColor = meta.colors.map((c) => ({ value: c.name, label: c.name }))
  const optionsSize = meta.sizes.map((s) => ({ value: s, label: s }))

  const applyMovementPrendas = useCallback(() => {
    setError("")
    if (!type || !color || !size) {
      setError("Selecciona prenda, color y talla.")
      return
    }
    if (quantity <= 0) {
      setError("La cantidad debe ser mayor a 0.")
      return
    }
    const result = InventarioData.addMovement(
      movementType,
      { type, color, size },
      quantity,
      { name: currentUser.name, username: currentUser.username }
    )
    if (result.success) {
      onMovementDone()
      setQuantity(0)
    } else {
      setError(result.error)
    }
  }, [movementType, type, color, size, quantity, currentUser, onMovementDone])

  const applyMovementGenerico = useCallback(() => {
    setError("")
    if (!inventarioId || !metaGenerico) {
      setError("Configura tipos y características en Gestión de Inventarios.")
      return
    }
    if (!tipoGenerico) {
      setError("Selecciona un tipo.")
      return
    }
    const attrs: Record<string, string> = {}
    metaGenerico.caracteristicas.forEach((car, i) => {
      const v = attrsGenerico[i] ?? ""
      if (car.nombre) attrs[car.nombre] = v
    })
    if (quantity <= 0) {
      setError("La cantidad debe ser mayor a 0.")
      return
    }
    const result = InventarioData.addMovementGenerico(
      inventarioId,
      movementType,
      tipoGenerico,
      attrs,
      quantity,
      { name: currentUser.name, username: currentUser.username }
    )
    if (result.success) {
      onMovementDone()
      setQuantity(0)
    } else {
      setError(result.error)
    }
  }, [inventarioId, metaGenerico, movementType, tipoGenerico, attrsGenerico, quantity, currentUser, onMovementDone])

  const applyMovement = esPrendas ? applyMovementPrendas : applyMovementGenerico

  const handleUndo = useCallback(() => {
    setShowUndoConfirm(false)
    setUndoStatus("loading")
    setError("")
    const result = InventarioData.undoLastAction({
      name: currentUser.name,
      username: currentUser.username,
    })
    if (result.success) {
      setUndoStatus("success")
      onMovementDone()
      setTimeout(() => setUndoStatus("idle"), 1500)
    } else {
      setError(result.error)
      setUndoStatus("error")
      setTimeout(() => setUndoStatus("idle"), 2000)
    }
  }, [currentUser, onMovementDone])

  const addGarment = () => {
    const name = window.prompt("Nombre de la nueva prenda:")
    if (!name?.trim()) return
    const res = InventarioData.addGarmentType(name.trim())
    if (res.success) setType(name.trim())
    else window.alert(res.error)
  }
  const removeGarment = () => {
    if (!type || !window.confirm(`¿Eliminar "${type}" de la lista?`)) return
    const res = InventarioData.removeGarmentType(type)
    if (res.success) setType(meta.garments[0] ?? "")
    else window.alert(res.error)
  }
  const addColor = () => {
    const name = window.prompt("Nombre del nuevo color:")
    if (!name?.trim()) return
    const res = InventarioData.addColor(name.trim())
    if (res.success) setColor(name.trim())
    else window.alert(res.error)
  }
  const removeColor = () => {
    if (!color || !window.confirm(`¿Eliminar "${color}" de la lista?`)) return
    const res = InventarioData.removeColor(color)
    if (res.success) setColor(meta.colors[0]?.name ?? "")
    else window.alert(res.error)
  }
  const addSize = () => {
    const name = window.prompt("Nombre de la nueva talla:")
    if (!name?.trim()) return
    const res = InventarioData.addSize(name.trim())
    if (res.success) setSize(name.trim())
    else window.alert(res.error)
  }
  const removeSize = () => {
    if (!size || !window.confirm(`¿Eliminar la talla "${size}" de la lista?`)) return
    const res = InventarioData.removeSize(size)
    if (res.success) setSize(meta.sizes[0] ?? "")
    else window.alert(res.error)
  }

  // Formulario genérico (no prendas): tipos + características desde Gestión de Inventarios
  if (!esPrendas && inventarioId) {
    const nombreItem = metaGenerico?.nombreItem || "Tipo"
    const opcionesTipo = (metaGenerico?.tipos ?? []).length
      ? metaGenerico.tipos.map((t) => ({ value: t, label: t }))
      : [{ value: "", label: "— Configurar en Gestión de Inventarios —" }]
    return (
      <div className="flex justify-center">
        <div className="glass-box p-5 rounded-2xl w-full max-w-md">
          <div className="flex gap-2 mb-4">
            <span
              className="flex-1 flex rounded-xl overflow-hidden min-h-[44px] border-2 box-border"
              style={{
                borderColor: movementType === "entry" ? "rgb(22 163 74)" : "rgb(134 239 172)",
                backgroundColor: movementType === "entry" ? "rgb(22 163 74)" : "rgb(240 253 244)",
              }}
            >
              <button
                type="button"
                onClick={() => setMovementType("entry")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[10px] font-medium text-sm border-none outline-none shadow-none min-h-[40px] bg-transparent"
                style={movementType === "entry" ? { color: "white" } : { color: "rgb(51 65 85)" }}
              >
                <ArrowDownLeft className="w-4 h-4" />
                Entrada
              </button>
            </span>
            <span
              className="flex-1 flex rounded-xl overflow-hidden min-h-[44px] border-2 box-border"
              style={{
                borderColor: movementType === "exit" ? "rgb(220 38 38)" : "rgb(254 202 202)",
                backgroundColor: movementType === "exit" ? "rgb(220 38 38)" : "rgb(254 242 242)",
              }}
            >
              <button
                type="button"
                onClick={() => setMovementType("exit")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[10px] font-medium text-sm border-none outline-none shadow-none min-h-[40px] bg-transparent"
                style={movementType === "exit" ? { color: "white" } : { color: "rgb(51 65 85)" }}
              >
                <ArrowUpRight className="w-4 h-4" />
                Salida
              </button>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <FieldWithActions
              label={nombreItem}
              id="mov-tipo-gen"
              value={tipoGenerico}
              onChange={setTipoGenerico}
              options={opcionesTipo}
              onAdd={() => {}}
              onRemove={() => {}}
              showActions={false}
            />
            {(metaGenerico?.caracteristicas ?? []).map((car, i) => (
              <FieldWithActions
                key={i}
                label={car.nombre || `Característica ${i + 1}`}
                id={`mov-car-${i}`}
                value={attrsGenerico[i] ?? ""}
                onChange={(v) => setAttrsGenerico((prev) => ({ ...prev, [i]: v }))}
                options={car.valores.length ? car.valores.map((v) => ({ value: v, label: v })) : [{ value: "", label: "— Configurar en Gestión —" }]}
                onAdd={() => {}}
                onRemove={() => {}}
                showActions={false}
              />
            ))}
            <div className="mb-0">
              <label htmlFor="mov-qty-gen" className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
              <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden">
                <button type="button" onClick={() => setQuantity((q) => Math.max(0, q - 1))} className="w-10 h-10 flex items-center justify-center border-r border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <input id="mov-qty-gen" type="number" min={0} value={quantity} onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))} className="flex-1 min-w-0 w-14 text-center bg-white text-slate-800 font-medium py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <button type="button" onClick={() => setQuantity((q) => q + 1)} className="w-10 h-10 flex items-center justify-center border-l border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 mb-4">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_AMOUNTS.map((n) => (
                <button key={`+${n}`} type="button" onClick={() => setQuantity((q) => q + n)} className="w-14 h-9 flex items-center justify-center rounded-full border-2 bg-green-50 hover:bg-green-100 font-medium text-sm text-green-600" style={{ borderColor: "rgb(34 197 94)" }}>+{n}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_AMOUNTS.map((n) => (
                <button key={`-${n}`} type="button" onClick={() => setQuantity((q) => Math.max(0, q - n))} className="w-14 h-9 flex items-center justify-center rounded-full border-2 bg-red-50 hover:bg-red-100 font-medium text-sm text-red-600" style={{ borderColor: "rgb(239 68 68)" }}>-{n}</button>
              ))}
            </div>
          </div>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <Button type="button" variant="outline" size="lg" onClick={applyMovementGenerico} className="w-full py-3 rounded-xl border-2 border-transparent hover:border-transparent text-blue-700 hover:bg-blue-50 bg-white shadow-sm" iconLeft={<Check className="w-4 h-4" />}>
            Confirmar Movimiento
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="glass-box p-5 rounded-2xl w-full max-w-md">
        <div className="flex gap-2 mb-4">
          <span
            className="flex-1 flex rounded-xl overflow-hidden min-h-[44px] border-2 box-border"
            style={{
              borderColor: movementType === "entry" ? "rgb(22 163 74)" : "rgb(134 239 172)",
              backgroundColor: movementType === "entry" ? "rgb(22 163 74)" : "rgb(240 253 244)",
            }}
          >
            <button
              type="button"
              onClick={() => setMovementType("entry")}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[10px] font-medium text-sm border-none outline-none shadow-none min-h-[40px] bg-transparent"
              style={movementType === "entry" ? { color: "white" } : { color: "rgb(51 65 85)" }}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Entrada
            </button>
          </span>
          <span
            className="flex-1 flex rounded-xl overflow-hidden min-h-[44px] border-2 box-border"
            style={{
              borderColor: movementType === "exit" ? "rgb(220 38 38)" : "rgb(254 202 202)",
              backgroundColor: movementType === "exit" ? "rgb(220 38 38)" : "rgb(254 242 242)",
            }}
          >
            <button
              type="button"
              onClick={() => setMovementType("exit")}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[10px] font-medium text-sm border-none outline-none shadow-none min-h-[40px] bg-transparent"
              style={movementType === "exit" ? { color: "white" } : { color: "rgb(51 65 85)" }}
            >
              <ArrowUpRight className="w-4 h-4" />
              Salida
            </button>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <FieldWithActions
            label="Prenda"
            id="mov-garment"
            value={type}
            onChange={setType}
            options={optionsGarment}
            onAdd={addGarment}
            onRemove={removeGarment}
            showActions={true}
          />
          <FieldWithActions
            label="Color"
            id="mov-color"
            value={color}
            onChange={setColor}
            options={optionsColor}
            onAdd={addColor}
            onRemove={removeColor}
            showActions={true}
          />
          <FieldWithActions
            label="Talla"
            id="mov-size"
            value={size}
            onChange={setSize}
            options={optionsSize}
            onAdd={addSize}
            onRemove={removeSize}
            showActions={true}
          />
          <div className="mb-0">
            <label htmlFor="mov-qty" className="block text-sm font-medium text-slate-700 mb-1">
              Cantidad
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                className="w-10 h-10 flex items-center justify-center border-r border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                id="mov-qty"
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="flex-1 min-w-0 w-14 text-center bg-white text-slate-800 font-medium py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 flex items-center justify-center border-l border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Atajos de cantidad: +10/+50/+100 (verde) y -10/-50/-100 (rojo) */}
        <div className="space-y-1.5 mb-4">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {QUICK_AMOUNTS.map((n) => (
              <button
                key={`+${n}`}
                type="button"
                onClick={() => setQuantity((q) => q + n)}
                className="w-14 h-9 flex items-center justify-center rounded-full border-2 bg-green-50 hover:bg-green-100 font-medium text-sm transition-colors text-green-600"
                style={{ borderColor: "rgb(34 197 94)" }}
              >
                +{n}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {QUICK_AMOUNTS.map((n) => (
              <button
                key={`-${n}`}
                type="button"
                onClick={() => setQuantity((q) => Math.max(0, q - n))}
                className="w-14 h-9 flex items-center justify-center rounded-full border-2 bg-red-50 hover:bg-red-100 font-medium text-sm transition-colors text-red-600"
                style={{ borderColor: "rgb(239 68 68)" }}
              >
                -{n}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {/* Confirmar Movimiento: borde solo al hacer foco (tras clic), sin borde en hover */}
        <Button
          type="button"
          variant="outline"
          onClick={applyMovement}
          size="lg"
          className="w-full py-3 rounded-xl border-2 border-transparent hover:border-transparent text-blue-700 hover:bg-blue-50 bg-white shadow-sm hover:shadow focus:border-blue-300 focus-visible:border-blue-300 focus:ring-blue-500"
          iconLeft={<Check className="w-4 h-4" />}
        >
          Confirmar Movimiento
        </Button>

        {/* Deshacer última acción - outline con color rojo */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setShowUndoConfirm(true)}
          disabled={undoStatus === "loading"}
          className="w-full mt-2 py-2.5 rounded-xl border-2 border-transparent hover:border-transparent text-red-600 hover:bg-red-50 bg-white shadow-sm hover:shadow focus:border-red-400 focus-visible:border-red-400 focus:ring-red-500"
          iconLeft={<Undo2 className="w-4 h-4" />}
        >
          {undoStatus === "loading" ? "..." : "Deshacer Última Acción"}
        </Button>
      </div>

      <ConfirmationModal
        isOpen={showUndoConfirm}
        onClose={() => setShowUndoConfirm(false)}
        onConfirm={handleUndo}
        title="Deshacer última acción"
        message="¿Estás seguro de que deseas deshacer la última entrada o salida registrada?"
        confirmText="Sí, deshacer"
        cancelText="Cancelar"
      />
    </div>
  )
}
