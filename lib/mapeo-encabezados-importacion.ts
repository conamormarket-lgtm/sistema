/**
 * Mapeo de encabezados de archivo de importación a campos del sistema.
 * Centraliza sinónimos, normalización y detección de columnas (Producto N, Cantidad N, comentarios, etc.).
 */

import { mockDatabase } from "./mock-firebase"

export function normalizarTexto(texto: string): string {
    if (!texto) return ""
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .replace(/[^\w]/g, "")
}

/** Sinónimos: encabezado normalizado -> campo del sistema */
const SINONIMOS: Record<string, string> = {
    fecha: "createdAt",
    estadogeneral: "estadoGeneral",
    estado: "estadoGeneral",
    estadodelpedido: "estadoGeneral",
    situacion: "estadoGeneral",
    clientenombre: "clienteNombre",
    nombrecliente: "clienteNombre",
    nombre: "clienteNombre",
    clienteapellidos: "clienteApellidos",
    apellidos: "clienteApellidos",
    telefono: "clienteContacto",
    celular: "clienteContacto",
    contacto: "clienteContacto",
    clientetelefono: "clienteContacto",
    whatsapp: "whatsappOrigen",
    clientecorreo: "clienteCorreo",
    email: "clienteCorreo",
    correo: "clienteCorreo",
    correoelectronico: "clienteCorreo",
    fechaentrega: "reparto.fechaEntrega",
    entrega: "reparto.fechaEntrega",
    fechareparto: "reparto.fechaEntrega",
    direccion: "envioDireccion",
    direccionentrega: "envioDireccion",
    ubicacion: "envioDireccion",
    distrito: "clienteDistrito",
    clientedistrito: "clienteDistrito",
    clientedepartamento: "clienteDepartamento",
    departamento: "clienteDepartamento",
    pago1: "cobranza.pago1",
    pago2: "cobranza.pago2",
    montototal: "montoTotal",
    total: "montoTotal",
    monto: "montoTotal",
    montos: "montoTotal",
    totales: "montoTotal",
    importe: "montoTotal",
    soles: "montoTotal",
    precio: "montoTotal",
    preciototal: "montoTotal",
    montoapagar: "montoTotal",
    cobrar: "montoTotal",
    vendido: "montoTotal",
    adelanto: "montoAdelanto",
    anticipo: "montoAdelanto",
    pago: "montoAdelanto",
    pagado: "montoAdelanto",
    montoadelanto: "montoAdelanto",
    debe: "montoPendiente",
    pendiente: "montoPendiente",
    montopendiente: "montoPendiente",
    saldo: "montoPendiente",
    saldopendiente: "montoPendiente",
    esmostacero: "esMostacero",
    esmostacero_: "esMostacero",
    mostacero: "montoMostacero",
    montomostacero: "montoMostacero",
    mostaceros: "montoMostacero",
    faltaadelanto: "montoMostacero",
    operadorpreparacion: "preparacion.operador",
    operadorestampado: "estampado.operador",
    operadorempaquetado: "empaquetado.operador",
    repartidor: "reparto.repartidor",
    npedido: "id",
    numeropedido: "id",
    act: "activador",
    canaldeventa: "canalVenta",
    cliente: "clienteContacto",
    whatsapporigen: "whatsappOrigen",
    urlimagendiseno: "diseño.urlImagen",
    urldiseno: "diseño.urlImagen",
    imagendiseno: "diseño.urlImagen",
    linkdiseno: "diseño.urlImagen",
    diseñador: "diseño.diseñadorAsignado",
    diseñadorasignado: "diseño.diseñadorAsignado",
    disenador: "diseño.diseñadorAsignado",
    disenadorasignado: "diseño.diseñadorAsignado",
    autorc1: "comentarios.0.autor",
    fechac1: "comentarios.0.fecha",
    comentario1: "comentarios.0.texto",
    textoc1: "comentarios.0.texto",
    autorc2: "comentarios.1.autor",
    fechac2: "comentarios.1.fecha",
    comentario2: "comentarios.1.texto",
    textoc2: "comentarios.1.texto",
    cantidad: "cantidad",
    cant: "cantidad",
    producto: "productos",
}

export interface MapeoCampo {
    campo: string
    tipo: string
    nombre: string
    puntuacion?: number
    manual?: boolean
}

export function mapearEncabezadosACampos(
    headers: string[],
    mapeosManuales: Record<string, { campo: string; tipo?: string; nombre?: string }> = {}
): { mapeo: Record<string, MapeoCampo>; noMapeados: string[] } {
    const mapeo: Record<string, MapeoCampo> = {}
    const noMapeados: string[] = []
    const columnas = mockDatabase.columnasPedidos || []
    let fechaCount = 0

    for (const header of headers) {
        if (mapeosManuales[header]) {
            const mapeoManual = mapeosManuales[header]
            if (mapeoManual.campo && mapeoManual.campo !== "no-mapear") {
                const columna = columnas.find((c: any) => c.campo === mapeoManual.campo)
                if (columna) {
                    mapeo[header] = {
                        campo: columna.campo,
                        tipo: columna.tipo,
                        nombre: columna.nombre,
                        puntuacion: 100,
                        manual: true,
                    }
                }
            }
            continue
        }

        const headerNormalizado = normalizarTexto(header)

        if (header.trim() === "#" || header.trim().toLowerCase() === "n") {
            mapeo[header] = {
                campo: "id",
                tipo: "texto",
                nombre: "N Pedido",
                puntuacion: 100,
                manual: false,
            }
            continue
        }

        if (headerNormalizado.startsWith("fecha")) {
            const match = headerNormalizado.match(/^fecha(?:_(\d+))?$/)
            if (match) {
                fechaCount++
                const campoMapeo = fechaCount === 1 ? "createdAt" : "fechaEnvio"
                const columna = columnas.find((c: any) => c.campo === campoMapeo)
                if (columna) {
                    mapeo[header] = {
                        campo: columna.campo,
                        tipo: columna.tipo,
                        nombre: columna.nombre,
                        puntuacion: 100,
                        manual: false,
                    }
                    continue
                }
            }
        }

        if (header.trim().toUpperCase() === "ACT") {
            mapeo[header] = {
                campo: "activador",
                tipo: "texto",
                nombre: "Activador",
                puntuacion: 100,
                manual: false,
            }
            continue
        }

        let mejorCoincidencia: any = null
        let mejorPuntuacion = 0

        const sinonimoEncontrado = SINONIMOS[headerNormalizado]
        if (sinonimoEncontrado) {
            const columna = columnas.find((c: any) => c.campo === sinonimoEncontrado)
            if (columna) {
                mapeo[header] = {
                    campo: columna.campo,
                    tipo: columna.tipo,
                    nombre: columna.nombre,
                    puntuacion: 95,
                    manual: false,
                }
                continue
            }
            // Si el sinónimo es un campo anidado (ej. cobranza.pago1) y no está en columnas, mapear igual
            if (sinonimoEncontrado.includes(".")) {
                mapeo[header] = {
                    campo: sinonimoEncontrado,
                    tipo: "texto",
                    nombre: header,
                    puntuacion: 95,
                    manual: false,
                }
                continue
            }
        }

        columnas.forEach((columna: any) => {
            const nombreNormalizado = normalizarTexto(columna.nombre)
            const campoNormalizado = normalizarTexto(columna.campo)

            if (headerNormalizado === nombreNormalizado) {
                mejorCoincidencia = columna
                mejorPuntuacion = 100
                return
            }

            const campoSimple = columna.campo.split(".").pop()
            if (normalizarTexto(campoSimple) === headerNormalizado) {
                mejorCoincidencia = columna
                mejorPuntuacion = 95
                return
            }

            if (nombreNormalizado.includes(headerNormalizado) || headerNormalizado.includes(nombreNormalizado)) {
                const longitudComun = Math.min(nombreNormalizado.length, headerNormalizado.length)
                const longitudMax = Math.max(nombreNormalizado.length, headerNormalizado.length)
                const puntuacion = (longitudComun / longitudMax) * 80
                if (puntuacion > mejorPuntuacion) {
                    mejorPuntuacion = puntuacion
                    mejorCoincidencia = columna
                }
            }

            if (campoNormalizado.includes(headerNormalizado) || headerNormalizado.includes(campoNormalizado)) {
                const longitudComun = Math.min(campoNormalizado.length, headerNormalizado.length)
                const longitudMax = Math.max(campoNormalizado.length, headerNormalizado.length)
                const puntuacion = (longitudComun / longitudMax) * 75
                if (puntuacion > mejorPuntuacion) {
                    mejorPuntuacion = puntuacion
                    mejorCoincidencia = columna
                }
            }
        })

        const regexProducto = /(?:producto|prod)[\s_.:]*(\d+)/i
        const matchProducto = headerNormalizado.match(regexProducto)
        if (matchProducto) {
            const index = parseInt(matchProducto[1]) - 1
            mapeo[header] = {
                campo: `productos.${index}.producto`,
                tipo: "texto",
                nombre: `Producto ${index + 1}`,
                puntuacion: 100,
                manual: false,
            }
            continue
        }

        const regexCantidad = /(?:cantidad|cant)[\s_.:]*(\d+)/i
        const matchCantidad = headerNormalizado.match(regexCantidad)
        if (matchCantidad) {
            const index = parseInt(matchCantidad[1]) - 1
            mapeo[header] = {
                campo: `productos.${index}.cantidad`,
                tipo: "numero",
                nombre: `Cantidad ${index + 1}`,
                puntuacion: 100,
                manual: false,
            }
            continue
        }

        const matchAutor =
            header.match(/(?:autor|usuario)[\s_]*(?:comentario|c|msg)?[\s_]*(\d+)/i) ||
            headerNormalizado.match(/autor(\d+)/)
        if (matchAutor) {
            const index = parseInt(matchAutor[1]) - 1
            mapeo[header] = {
                campo: `comentarios.${index}.autor`,
                tipo: "texto",
                nombre: `Autor Comentario ${index + 1}`,
                puntuacion: 100,
                manual: false,
            }
            continue
        }

        const matchFecha =
            header.match(/(?:fecha|date)[\s_]*(?:comentario|c|msg)?[\s_]*(\d+)/i) ||
            headerNormalizado.match(/fecha(\d+)/)
        if (matchFecha) {
            const index = parseInt(matchFecha[1]) - 1
            mapeo[header] = {
                campo: `comentarios.${index}.fecha`,
                tipo: "fecha",
                nombre: `Fecha Comentario ${index + 1}`,
                puntuacion: 100,
                manual: false,
            }
            continue
        }

        const matchTexto =
            header.match(/(?:texto|comentario|mensaje|c|msg)[\s_]*(?:comentario|c|msg)?[\s_]*(\d+)/i) ||
            headerNormalizado.match(/texto(\d+)/)
        if (matchTexto) {
            const index = parseInt(matchTexto[1]) - 1
            mapeo[header] = {
                campo: `comentarios.${index}.texto`,
                tipo: "texto",
                nombre: `Comentario ${index + 1}`,
                puntuacion: 100,
                manual: false,
            }
            continue
        }

        if (mejorCoincidencia && mejorPuntuacion >= 50) {
            mapeo[header] = {
                campo: mejorCoincidencia.campo,
                tipo: mejorCoincidencia.tipo,
                nombre: mejorCoincidencia.nombre,
                puntuacion: mejorPuntuacion,
                manual: false,
            }
        } else {
            noMapeados.push(header)
        }
    }

    return { mapeo, noMapeados }
}
