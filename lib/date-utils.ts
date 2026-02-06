/**
 * Parsea una fecha de forma robusta manejando formatos comunes (DD/MM/YYYY, Excel, ISO)
 */
export const parseFechaRobust = (v: any): Date | null => {
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

export const obtenerFechaLocal = (fecha: Date | string): string => {
    if (!fecha) return ""
    const dateObj = typeof fecha === "string" ? new Date(fecha) : fecha
    return dateObj.toLocaleDateString("es-PE", { year: "numeric", month: "2-digit", day: "2-digit" })
}
