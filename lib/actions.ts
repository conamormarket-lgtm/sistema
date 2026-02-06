
import { mockDatabase, mockFirestore } from "@/lib/mock-firebase"
import { parseProductosDesdeTexto } from "@/lib/business-logic"

// Función helper: Guardar campo individual
export async function handleGuardarCampo(pedidoId: any, campo: any, valor: any, etapa: any = null, currentUser: any = null) {
    try {
        const pedido = mockDatabase.pedidos.find((p: any) => p.id === pedidoId)
        if (!pedido) {
            console.error("Pedido no encontrado:", pedidoId)
            return
        }

        let valorGuardar = valor
        if (!etapa && (campo === "productos" || campo === "regalos" || campo === "productosRegalo")) {
            if (typeof valor === "string") valorGuardar = parseProductosDesdeTexto(valor)
            else if (!Array.isArray(valor)) valorGuardar = []
        }

        // Construir el objeto de actualización según el campo
        let updates: any = {}

        if (etapa) {
            // Si es un campo de una etapa específica
            updates[etapa] = {
                ...pedido[etapa],
                [campo]: valorGuardar
            }
        } else {
            // Campo directo del pedido
            updates[campo] = valorGuardar
        }

        // Agregar historial de modificación
        updates.historialModificaciones = [
            ...(pedido.historialModificaciones || []),
            {
                timestamp: new Date(),
                usuarioId: currentUser?.uid || "system",
                usuarioEmail: currentUser?.email || "system",
                accion: `Campo ${campo} actualizado`,
                detalle: `Valor anterior: ${etapa ? (pedido[etapa]?.[campo] || "N/A") : (pedido[campo] || "N/A")}, Nuevo valor: ${valor}`,
            },
        ]
        updates.updatedAt = new Date()

        await mockFirestore.doc("pedidos", pedidoId).update(updates)
    } catch (error: any) {
        console.error("Error al guardar campo:", error)
        throw error
    }
}
