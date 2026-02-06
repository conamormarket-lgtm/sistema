"use client"

import { useState, useEffect } from "react"

/**
 * Devuelve un valor debounced: se actualiza solo después de `ms` ms sin cambios.
 * El valor mostrado en el input puede actualizarse de inmediato; el valor usado
 * para filtrar/calcular se actualiza con delay para mantener la UI fluida.
 */
export function useDebounce<T>(value: T, ms: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])

  return debouncedValue
}
