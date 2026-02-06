/**
 * Formato estricto de dinero: S/ 1,234.56
 * @param amount - Valor a formatear
 */
export const formatMoneyStrict = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return "0.00"
    return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/**
 * Parsea un monto de forma robusta detectando separadores de miles y decimales
 */
export const parseMontoRobust = (v: any): number => {
    if (v === null || v === undefined || v === "") return 0

    // Si ya es un número (ej: de Excel raw:true), retornarlo directamente
    if (typeof v === "number") return isNaN(v) ? 0 : v

    let str = String(v).trim()
    if (!str) return 0

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
