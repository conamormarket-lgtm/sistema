
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper auxiliar para formateo estricto de dinero con comas
 */
export const formatMoneyStrict = (amount: any) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "0.00"
  return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/**
 * Parsea un monto de forma robusta detectando separadores de miles y decimales
 */
export const parseMontoRobust = (v: any) => {
  if (v === null || v === undefined || v === "") return 0

  // Si ya es un número (ej: de Excel raw:true), retornarlo directamente
  if (typeof v === "number") return isNaN(v) ? 0 : v

  let str = String(v).trim()
  if (!str) return 0

  // Si el valor viene de Excel y es 180, a veces se recibe como "180.00" o similar
  // Pero el usuario reporta que 180 se lee como 0.18.
  // Esto suele suceder si el sistema espera miles pero recibe decimales o viceversa.

  // Limpieza: solo números, puntos, comas y signo menos
  str = str.replace(/[^0-9.,-]/g, "")
  if (!str) return 0

  const hasDot = str.includes(".")
  const hasComma = str.includes(",")

  // Lógica de desambiguación basada en cultura (Perú/Latinoamérica común)
  if (hasDot && hasComma) {
    if (str.lastIndexOf(".") > str.lastIndexOf(",")) {
      // Formato USA: 1,234.56 -> 1234.56
      str = str.replace(/,/g, "")
    } else {
      // Formato ES: 1.234,56 -> 1234.56
      str = str.replace(/\./g, "").replace(/,/g, ".")
    }
  } else if (hasComma) {
    // Solo coma. Si tiene 1 o 2 decimales, es probable que sea decimal.
    if (str.match(/,\d{1,2}$/)) {
      str = str.replace(/,/g, ".")
    } else {
      // Caso miles: 1,234
      str = str.replace(/,/g, "")
    }
  } else if (hasDot) {
    // Esto suele pasar si el archivo tiene ".180" o "0.180" (separador de miles).
    if (!str.match(/\.\d{1,2}$/) && str.match(/\.\d{3}$/)) {
      str = str.replace(/\./g, "")
    }
  }

  const finalNum = parseFloat(str)
  return isNaN(finalNum) ? 0 : finalNum
}

/**
 * Parsea una fecha de forma robusta manejando formatos comunes (DD/MM/YYYY, Excel, ISO)
 */
export const parseFechaRobust = (v: any) => {
  if (!v) return null

  // Si ya es un objeto Date
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v

  // Si es un número (probablemente serial de Excel)
  if (typeof v === "number") {
    const fechaExcel = new Date((v - 25569) * 86400 * 1000)
    return isNaN(fechaExcel.getTime()) ? null : fechaExcel
  }

  const str = String(v).trim()
  if (!str) return null

  // Intentar parsear formato DD/MM/YYYY (muy común en Perú)
  const matchDMY = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (matchDMY) {
    let dia = parseInt(matchDMY[1], 10)
    let mes = parseInt(matchDMY[2], 10) - 1 // JS meses son 0-11
    let año = parseInt(matchDMY[3], 10)

    if (año < 100) año += 2000 // Asumir siglo 21 para años de 2 dígitos

    const fecha = new Date(año, mes, dia)
    if (!isNaN(fecha.getTime())) return fecha
  }

  // Intentar parsear formato YYYY-MM-DD
  const matchYMD = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (matchYMD) {
    const año = parseInt(matchYMD[1], 10)
    const mes = parseInt(matchYMD[2], 10) - 1
    const dia = parseInt(matchYMD[3], 10)

    const fecha = new Date(año, mes, dia)
    if (!isNaN(fecha.getTime())) return fecha
  }

  // Fallback a parser nativo (maneja ISO, formatos USA, etc.)
  const fallback = new Date(str)
  if (!isNaN(fallback.getTime())) return fallback

  return null
}

export function convertirValorSegunTipo(valor: any, tipo: string, formato?: string) {
  if (valor === null || valor === undefined || valor === "") {
    if (tipo === "numero") return 0
    return null
  }

  switch (tipo) {
    case "numero":
      return parseMontoRobust(valor)
    case "fecha":
      return parseFechaRobust(valor)
    default:
      return valor
  }
}

/** Indica si un pedido está marcado como mostacero (true, "Mostacero", "Sí", "1", etc.) */
export function esPedidoMostacero(pedido: any): boolean {
  const v = pedido?.esMostacero
  if (v === true || v === 1) return true
  const s = String(v ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  return ["mostacero", "si", "yes", "1", "true", "verdadero"].includes(s)
}

/**
 * Indica si un pedido cuenta como mostacero para resúmenes (ventas/cobranza).
 * - Importados: se usa el campo esMostacero (checkbox/columna).
 * - Pedidos nuevos: mostacero si el pago total (adelanto + pago1 + pago2) es &lt; 30% del monto total.
 *   Al hacer un pago que lleve el total pagado ≥ 30%, deja de contar como mostacero.
 */
export function cuentaComoMostaceroEnResumen(pedido: any): boolean {
  if (pedido?.importado === true) return esPedidoMostacero(pedido)
  const montoTotal = parseMontoRobust(pedido?.montoTotal)
  if (montoTotal <= 0) return false
  const totalPagado =
    parseMontoRobust(pedido?.montoAdelanto) +
    parseMontoRobust(pedido?.cobranza?.pago1) +
    parseMontoRobust(pedido?.cobranza?.pago2)
  return totalPagado < 0.3 * montoTotal
}
