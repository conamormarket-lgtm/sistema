"use client"

import React, { useState, useCallback } from "react"
import { InventarioData } from "@/lib/inventario-data"
import { Button } from "@/components/ui/button"
import { ConfirmationModal } from "@/components/ui/modal"
import { Check, ArrowDownLeft, ArrowUpRight, Plus, Minus, Undo2 } from "lucide-react"

const QUICK_AMOUNTS = [10, 50, 100]

type MovementFormProps = {
  currentUser: { name?: string; username?: string }
  onMovementDone: () => void
}

function FieldWithActions({
  label,
  id,
  value,
  onChange,
  options,
  onAdd,
  onRemove,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onAdd}
            className="w-7 h-7 rounded-full border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors"
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
      </div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
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

export function MovementForm({ currentUser, onMovementDone }: MovementFormProps) {
  const meta = InventarioData.getMetadata()
  const [movementType, setMovementType] = useState<"entry" | "exit">("entry")
  const [type, setType] = useState(meta.garments[0] ?? "")
  const [color, setColor] = useState(meta.colors[0]?.name ?? "")
  const [size, setSize] = useState(meta.sizes[0] ?? "")
  const [quantity, setQuantity] = useState(0)
  const [error, setError] = useState("")
  const [undoStatus, setUndoStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [showUndoConfirm, setShowUndoConfirm] = useState(false)

  const optionsGarment = meta.garments.map((g) => ({ value: g, label: g }))
  const optionsColor = meta.colors.map((c) => ({ value: c.name, label: c.name }))
  const optionsSize = meta.sizes.map((s) => ({ value: s, label: s }))

  const applyMovement = useCallback(() => {
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

  return (
    <div className="flex justify-center">
      <div className="glass-box-flujos p-5 rounded-2xl w-full max-w-md shadow-md">
        {/* Tipo de movimiento: Entrada / Salida */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMovementType("entry")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all border ${
              movementType === "entry"
                ? "bg-emerald-500 text-white shadow-md border-emerald-600"
                : "glass-box-flujos border-slate-200/80 text-slate-600 hover:bg-blue-50/70 hover:border-slate-200"
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Entrada
          </button>
          <button
            type="button"
            onClick={() => setMovementType("exit")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all border ${
              movementType === "exit"
                ? "bg-red-500 text-white shadow-md border-red-600"
                : "glass-box-flujos border-slate-200/80 text-slate-600 hover:bg-blue-50/70 hover:border-slate-200"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Salida
          </button>
        </div>

        {/* Grid 2x2: Prenda, Color, Talla, Cantidad */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <FieldWithActions
            label="Prenda"
            id="mov-garment"
            value={type}
            onChange={setType}
            options={optionsGarment}
            onAdd={addGarment}
            onRemove={removeGarment}
          />
          <FieldWithActions
            label="Color"
            id="mov-color"
            value={color}
            onChange={setColor}
            options={optionsColor}
            onAdd={addColor}
            onRemove={removeColor}
          />
          <FieldWithActions
            label="Talla"
            id="mov-size"
            value={size}
            onChange={setSize}
            options={optionsSize}
            onAdd={addSize}
            onRemove={removeSize}
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
                className="flex-1 min-w-0 w-14 text-center bg-white text-slate-800 font-medium py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className="w-14 h-9 flex items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 font-medium text-sm transition-colors"
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
                className="w-14 h-9 flex items-center justify-center rounded-full border-2 border-red-400 text-red-600 bg-red-50 hover:bg-red-100 font-medium text-sm transition-colors"
              >
                -{n}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {/* Confirmar Movimiento (principal) */}
        <Button
          type="button"
          onClick={applyMovement}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirmar Movimiento
        </Button>

        {/* Deshacer última acción */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowUndoConfirm(true)}
          disabled={undoStatus === "loading"}
          className="w-full mt-2 py-2.5 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-xl text-sm"
        >
          <Undo2 className="w-4 h-4 mr-2" />
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
