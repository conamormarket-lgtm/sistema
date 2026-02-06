
import React, { useState, useEffect, useRef } from "react"
import { parseMontoRobust } from "@/lib/utils"

// Componente: Celda Editable
export function EditableCell({
    value,
    onChange,
    onBlur,
    type = "text",
    options = [],
    className = "",
    autoFocus = false,
    placeholder = "",
    disabled = false,
}: {
    value: any
    onChange: (val: any) => void
    onBlur?: () => void
    type?: string
    options?: any[]
    className?: string
    autoFocus?: boolean
    placeholder?: string
    disabled?: boolean
}) {
    const [localValue, setLocalValue] = useState(value || "")
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const debounceTimerRef = useRef<any>(null)

    useEffect(() => {
        setLocalValue(value || "")
    }, [value])

    const handleChange = (newValue: any) => {
        setLocalValue(newValue)
        setIsSaved(false)

        // Limpiar timer anterior
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        // Mostrar indicador de guardando
        setIsSaving(true)

        // Debounce de 500ms
        debounceTimerRef.current = setTimeout(() => {
            onChange(newValue)
            setIsSaving(false)
            setIsSaved(true)
            // Ocultar indicador de guardado después de 2 segundos
            setTimeout(() => setIsSaved(false), 2000)
        }, 500)
    }

    if (type === "select" || type === "dropdown") {
        return (
            <div className="relative">
                <select
                    value={localValue}
                    onChange={(e: any) => handleChange(e.target.value)}
                    disabled={disabled}
                    className={`w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className} ${disabled ? "bg-slate-100 cursor-not-allowed" : "bg-white"}`}
                >
                    <option value="">{placeholder || "Seleccionar..."}</option>
                    {options.map((opt: any) => (
                        <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
                            {typeof opt === "string" ? opt : opt.label}
                        </option>
                    ))}
                </select>
                {isSaving && (
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500">
                        Guardando...
                    </span>
                )}
                {isSaved && (
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-green-500">

                    </span>
                )}
            </div>
        )
    }

    if (type === "number") {
        return (
            <div className="relative">
                <input
                    type="number"
                    value={localValue}
                    onChange={(e: any) => handleChange(e.target.value === "" ? "" : parseMontoRobust(e.target.value) || 0)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className} ${disabled ? "bg-slate-100 cursor-not-allowed" : "bg-white"}`}
                />
                {isSaving && (
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500">
                        Guardando...
                    </span>
                )}
                {isSaved && (
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-green-500">

                    </span>
                )}
            </div>
        )
    }

    if (type === "textarea") {
        return (
            <div className="relative">
                <textarea
                    value={localValue}
                    onChange={(e: any) => handleChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    rows={3}
                    className={`w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[60px] ${className} ${disabled ? "bg-slate-100 cursor-not-allowed" : "bg-white"}`}
                />
                {isSaving && (
                    <span className="absolute right-2 top-2 text-xs text-blue-500">
                        Guardando...
                    </span>
                )}
                {isSaved && (
                    <span className="absolute right-2 top-2 text-xs text-green-500">

                    </span>
                )}
            </div>
        )
    }

    // Text input (default)
    return (
        <div className="relative">
            <input
                type="text"
                value={localValue}
                onChange={(e: any) => handleChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className={`w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className} ${disabled ? "bg-slate-100 cursor-not-allowed" : "bg-white"}`}
            />
            {isSaving && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500">
                    Guardando...
                </span>
            )}
            {isSaved && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-green-500">

                </span>
            )}
        </div>
    )
}
