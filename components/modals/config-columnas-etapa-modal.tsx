
import React, { useState, useEffect, useMemo } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, RefreshCw, X, Save } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { mockDatabase } from "@/lib/mock-firebase"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

// Componente: ColumnaConfigItem - Item draggable para configuración de columnas
function ColumnaConfigItem({ columna, visible, onToggleVisible }: any) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: columna.id })
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white hover:bg-slate-50 transition-colors ${!visible ? "opacity-60" : ""
                }`}
        >
            <div className="flex items-center gap-3 px-4 py-3">
                {/* Handle para arrastrar */}
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                    <GripVertical className="w-5 h-5" />
                </div>

                {/* Checkbox de visibilidad */}
                <input
                    type="checkbox"
                    checked={visible}
                    onChange={onToggleVisible}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />

                {/* Información de la columna */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{columna.nombre}</span>
                        {columna.esSistema && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Sistema</span>
                        )}
                        {columna.tipo === "formula" && (
                            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">Fórmula</span>
                        )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                        <span className="font-medium">Campo:</span> {columna.campo} |
                        <span className="font-medium"> Tipo:</span> {columna.tipo} |
                        <span className="font-medium"> Categoría:</span> {columna.categoria}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ConfigColumnasEtapaModal({ isOpen, onClose, etapaId, etapaNombre, onSave }: any) {
    const { isOwner } = useAuth()
    const [columnasConfig, setColumnasConfig] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [filtroCategoria, setFiltroCategoria] = useState("todas")
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Cargar configuración actual
    useEffect(() => {
        if (!isOpen) return

        // Obtener todas las columnas ordenadas
        const todasColumnas = [...mockDatabase.columnasPedidos].sort((a: any, b: any) => a.orden - b.orden)

        // Obtener configuración guardada para esta etapa
        const configGuardada = mockDatabase.columnasConfig?.[etapaId] || {}
        const ordenGuardado = configGuardada.orden || []

        // Crear configuración combinando todas las columnas con la configuración guardada
        const config = todasColumnas.map((columna: any) => {
            const visible = configGuardada[columna.campo] !== undefined
                ? configGuardada[columna.campo]
                : columna.visible // Usar visible por defecto de la columna

            // Obtener orden personalizado si existe, sino usar el orden global
            const ordenPersonalizado = ordenGuardado.findIndex((c: any) => c === columna.campo)
            const orden = ordenPersonalizado !== -1 ? ordenPersonalizado : columna.orden

            return {
                ...columna,
                visible,
                ordenPersonalizado: orden,
            }
        })

        // Ordenar por orden personalizado
        config.sort((a: any, b: any) => a.ordenPersonalizado - b.ordenPersonalizado)

        setColumnasConfig(config)
    }, [isOpen, etapaId])

    const categorias = useMemo(() => {
        const cats = new Set(mockDatabase.columnasPedidos.map((c: any) => c.categoria))
        return Array.from(cats).sort()
    }, [])

    const columnasFiltradas = useMemo(() => {
        let filtradas = columnasConfig

        if (filtroCategoria !== "todas") {
            filtradas = filtradas.filter((c: any) => c.categoria === filtroCategoria)
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtradas = filtradas.filter((c: any) =>
                c.nombre.toLowerCase().includes(term) ||
                c.campo.toLowerCase().includes(term) ||
                c.categoria.toLowerCase().includes(term)
            )
        }

        return filtradas
    }, [columnasConfig, filtroCategoria, searchTerm])

    const handleDragEnd = (event: any) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = columnasFiltradas.findIndex((c: any) => c.id === active.id)
        const newIndex = columnasFiltradas.findIndex((c: any) => c.id === over.id)

        const nuevasColumnas = arrayMove(columnasFiltradas, oldIndex, newIndex)

        // Actualizar el orden personalizado
        nuevasColumnas.forEach((col: any, index: any) => {
            col.ordenPersonalizado = index
        })

        // Actualizar todas las columnas manteniendo el orden
        const nuevasColumnasCompletas = [...columnasConfig]
        nuevasColumnas.forEach((colFiltrada: any) => {
            const index = nuevasColumnasCompletas.findIndex((c: any) => c.id === colFiltrada.id)
            if (index !== -1) {
                nuevasColumnasCompletas[index].ordenPersonalizado = colFiltrada.ordenPersonalizado
            }
        })

        // Reordenar todas las columnas
        nuevasColumnasCompletas.sort((a: any, b: any) => a.ordenPersonalizado - b.ordenPersonalizado)

        setColumnasConfig(nuevasColumnasCompletas)
    }

    const handleToggleVisible = (columnaId: any) => {
        setColumnasConfig((prev: any) =>
            prev.map((col: any) =>
                col.id === columnaId ? { ...col, visible: !col.visible } : col
            )
        )
    }

    const handleGuardar = () => {
        // Crear objeto de configuración
        const config: any = {
            orden: columnasConfig.map((c: any) => c.campo),
        }

        // Agregar visibilidad de cada columna
        columnasConfig.forEach((col: any) => {
            config[col.campo] = col.visible
        })

        // Guardar en mockDatabase
        if (!mockDatabase.columnasConfig) {
            mockDatabase.columnasConfig = {}
        }
        mockDatabase.columnasConfig[etapaId] = config

        onSave?.()
        alert(`Configuración de columnas para ${etapaNombre} guardada exitosamente`)
        onClose()
    }

    const handleResetear = () => {
        if (confirm(`¿Está seguro de resetear la configuración de columnas para ${etapaNombre}?`)) {
            // Resetear a valores por defecto
            const todasColumnas = [...mockDatabase.columnasPedidos].sort((a: any, b: any) => a.orden - b.orden)
            const config = todasColumnas.map((columna: any) => ({
                ...columna,
                visible: columna.visible,
                ordenPersonalizado: columna.orden,
            }))
            setColumnasConfig(config)
        }
    }

    if (!isOwner()) {
        return null
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Configurar Columnas - ${etapaNombre}`} size="xl">
            <div className="space-y-4">
                {/* Filtros y búsqueda */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar columnas..."
                            value={searchTerm}
                            onChange={(e: any) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={filtroCategoria}
                        onChange={(e: any) => setFiltroCategoria(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todas">Todas las categorías</option>
                        {categorias.map((cat: any) => (
                            <option key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Información */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                        <strong>Instrucciones:</strong> Arrastra las columnas para reordenarlas. Marca/desmarca las casillas para mostrar u ocultar columnas en la tabla de {etapaNombre}.
                    </p>
                </div>

                {/* Lista de columnas con drag-and-drop */}
                <div className="border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={columnasFiltradas.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
                            <div className="divide-y divide-slate-200">
                                {columnasFiltradas.map((columna: any) => (
                                    <ColumnaConfigItem
                                        key={columna.id}
                                        columna={columna}
                                        visible={columna.visible}
                                        onToggleVisible={() => handleToggleVisible(columna.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                {columnasFiltradas.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        No se encontraron columnas con los filtros aplicados
                    </div>
                )}

                {/* Estadísticas */}
                <div className="flex justify-between items-center text-sm text-slate-600 pt-2 border-t border-slate-200">
                    <span>
                        Total: {columnasConfig.length} columnas |
                        Visibles: {columnasConfig.filter((c: any) => c.visible).length} |
                        Ocultas: {columnasConfig.filter((c: any) => !c.visible).length}
                    </span>
                </div>

                {/* Botones */}
                <div className="flex justify-between gap-2 pt-4 border-t">
                    <Button variant="secondary" onClick={handleResetear} iconLeft={<RefreshCw className="w-4 h-4" />}>
                        Resetear
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose} iconLeft={<X className="w-4 h-4" />}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleGuardar} iconLeft={<Save className="w-4 h-4" />}>
                            Guardar Configuración
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
