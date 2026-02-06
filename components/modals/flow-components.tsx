
import React, { useState, useEffect } from "react"
import {
    ShoppingCart, Palette, DollarSign, Printer, Tag, Box, Truck, CheckCircle2,
    Scissors, Shirt, Sparkles, FileText, User, Settings, Archive, PackageSearch,
    Wrench, ArchiveRestore, History, Home, Database, FileSpreadsheet, BarChart3,
    Download, Menu, MoreVertical, LogOut, Edit, UserPlus, Eye, Upload, X,
    FileImage, AlertTriangle, PlusCircle, Save, Search, Trash2, XCircle, ImageIcon,
    CreditCard, Percent, CalendarIcon, ListOrdered, MinusCircle, SlidersHorizontal,
    ChevronDown, ChevronUp, GripVertical, Plus, Pencil, Trash, EyeOff, ArrowUp,
    ArrowDown, Move, Video, Megaphone, Lightbulb, Rocket, Beaker, TrendingUp,
} from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { AVAILABLE_ICONS, COLOR_PALETTE, TIPOS_CONDICIONES, AVAILABLE_MODULES } from "../../lib/constants"
import { mockDatabase, mockFirestore } from "../../lib/mock-firebase"
import { useAuth } from "../../contexts/auth-context"
import { Button } from "../ui/button"
import { Modal } from "../ui/modal"
import { Input } from "../ui/input"

// Componente: Selector de Iconos
export function IconSelector({ selectedIcon, onSelect, label = "Icono" }: { selectedIcon: string, onSelect: (icon: string) => void, label?: string }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isOpen, setIsOpen] = useState(false)

    const filteredIcons = AVAILABLE_ICONS.filter((iconName: any) =>
        iconName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getIconComponent = (iconName: string) => {
        const iconMap: any = {
            ShoppingCart, Palette, DollarSign, Printer, Tag, Box, Truck, CheckCircle2,
            Scissors, Shirt, Sparkles, FileText, User, Settings, Archive, PackageSearch,
            Wrench, ArchiveRestore, History, Home, Database, FileSpreadsheet, BarChart3,
            Download, Menu, MoreVertical, LogOut, Edit, UserPlus, Eye, Upload, X,
            FileImage, AlertTriangle, PlusCircle, Save, Search, Trash2, XCircle, ImageIcon,
            CreditCard, Percent, CalendarIcon, ListOrdered, MinusCircle, SlidersHorizontal,
            ChevronDown, ChevronUp, GripVertical, Plus, Pencil, Trash, EyeOff, ArrowUp,
            ArrowDown, Move, Video, Megaphone, Lightbulb, Rocket, Beaker, TrendingUp,
        }
        const IconComponent = iconMap[iconName]
        return IconComponent ? <IconComponent className="w-5 h-5" /> : null
    }

    const SelectedIcon = selectedIcon ? getIconComponent(selectedIcon) : null

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <div className="flex items-center gap-2">
                    {SelectedIcon ? (
                        <>
                            {SelectedIcon}
                            <span className="text-sm text-slate-700">{selectedIcon}</span>
                        </>
                    ) : (
                        <span className="text-sm text-slate-400">Seleccionar icono</span>
                    )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                    <div className="p-3 border-b border-slate-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar icono..."
                                value={searchTerm}
                                onChange={(e: any) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-80 p-3">
                        <div className="grid grid-cols-6 gap-2">
                            {filteredIcons.map((iconName: any) => {
                                const IconComponent = getIconComponent(iconName)
                                return (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => {
                                            onSelect(iconName)
                                            setIsOpen(false)
                                            setSearchTerm("")
                                        }}
                                        className={`p-3 rounded-lg border-2 transition-all ${selectedIcon === iconName
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                                            }`}
                                        title={iconName}
                                    >
                                        {IconComponent}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Componente: Selector de Color
export function ColorSelector({ selectedColor, onSelect, label = "Color" }: { selectedColor: string, onSelect: (color: string) => void, label?: string }) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            <div className="grid grid-cols-4 gap-2">
                {COLOR_PALETTE.map((color: any, index: number) => (
                    <button
                        key={`${color.value}-${color.name}-${index}`}
                        type="button"
                        onClick={() => onSelect(color.value)}
                        className={`h-12 rounded-lg border-2 transition-all ${selectedColor === color.value
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-slate-200 hover:border-slate-300"
                            }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                    />
                ))}
            </div>
            {selectedColor && (
                <div className="mt-2 text-xs text-slate-500">
                    Color seleccionado: {COLOR_PALETTE.find((c: any) => c.value === selectedColor)?.name || selectedColor}
                </div>
            )}
        </div>
    )
}

// Componente: Item Sortable para Etapas
export function SortableEtapaItem({ etapa, onEdit, onDelete, flujoId }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const getIconComponent = (iconName: string) => {
        const iconMap: any = {
            ShoppingCart, Palette, DollarSign, Printer, Tag, Box, Truck, CheckCircle2,
            Scissors, Shirt, Sparkles, FileText, User, Settings, Archive, PackageSearch,
            Wrench, ArchiveRestore, History, Home, Database, FileSpreadsheet, BarChart3,
            Download, Menu, MoreVertical, LogOut, Edit, UserPlus, Eye, Upload, X,
            FileImage, AlertTriangle, PlusCircle, Save, Search, Trash2, XCircle, ImageIcon,
            CreditCard, Percent, CalendarIcon, ListOrdered, MinusCircle, SlidersHorizontal,
            ChevronDown, ChevronUp, GripVertical, Plus, Pencil, Trash, EyeOff, ArrowUp,
            ArrowDown, Move, Video, Megaphone, Lightbulb, Rocket, Beaker, TrendingUp,
        }
        const IconComponent = iconMap[iconName]
        return IconComponent ? <IconComponent className="w-5 h-5" /> : null
    }

    const IconComponent = getIconComponent(etapa.icono)

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white border border-slate-200 rounded-lg p-4 mb-2 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex items-center gap-2 flex-1">
                {IconComponent && <div style={{ color: etapa.color }}>{IconComponent}</div>}
                <div className="flex-1">
                    <div className="font-medium text-slate-800">{etapa.nombre}</div>
                    {etapa.descripcion && (
                        <div className="text-sm text-slate-500">{etapa.descripcion}</div>
                    )}
                    {etapa.tipoObligatoria && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                            {etapa.tipoObligatoria === "inicial" ? "Etapa Inicial" : "Etapa Final"}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onEdit(etapa)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                {!etapa.obligatoria && (
                    <button
                        type="button"
                        onClick={() => onDelete(etapa)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                    >
                        <Trash className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
}

// Componente: Lista de Etapas con Drag & Drop
export function EtapasDragDropList({ etapas, onReorder, onEdit, onDelete, flujoId }: any) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: any) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = etapas.findIndex((e: any) => e.id === active.id)
            const newIndex = etapas.findIndex((e: any) => e.id === over.id)
            const newEtapas = arrayMove(etapas, oldIndex, newIndex)

            // Actualizar orden
            const etapasConOrden = newEtapas.map((etapa: any, index: number) => ({
                ...etapa,
                orden: index,
            }))

            onReorder(etapasConOrden)
        }
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={etapas.map((e: any) => e.id)} strategy={verticalListSortingStrategy}>
                {etapas.map((etapa: any) => (
                    <SortableEtapaItem
                        key={etapa.id}
                        etapa={etapa}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        flujoId={flujoId}
                    />
                ))}
            </SortableContext>
        </DndContext>
    )
}

// Componente: Modal de Formulario de Condición
export function CondicionFormModal({ isOpen, onClose, condicion, tipoCondicion, flujoId, etapaId, onSave }: any) {
    const [formData, setFormData] = useState({
        tipo: "",
        requerida: true,
        inventarioId: "",
        saltarAutomatico: false,
        etapaDestinoId: "",
    })
    const [errors, setErrors] = useState<any>({})
    const [etapasDelFlujo, setEtapasDelFlujo] = useState<any[]>([])
    const [inventariosDisponibles, setInventariosDisponibles] = useState<any[]>([])

    useEffect(() => {
        // Cargar etapas del flujo para el selector de etapa destino
        if (flujoId) {
            const etapas = mockDatabase.etapas
                .filter((e: any) => e.flujoId === flujoId && e.id !== etapaId)
                .sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
            setEtapasDelFlujo(etapas)
        }
    }, [flujoId, etapaId])

    useEffect(() => {
        // Cargar inventarios disponibles (solo activos)
        const inventarios = mockDatabase.inventarios
            .filter((inv: any) => inv.activo)
            .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre))
        setInventariosDisponibles(inventarios)
    }, [])

    useEffect(() => {
        if (condicion) {
            setFormData({
                tipo: condicion.tipo || "",
                requerida: condicion.requerida !== undefined ? condicion.requerida : true,
                inventarioId: condicion.parametros?.inventarioId || "",
                saltarAutomatico: condicion.parametros?.saltarAutomatico || false,
                etapaDestinoId: condicion.parametros?.etapaDestinoId || "",
            })
        } else {
            setFormData({
                tipo: tipoCondicion || "",
                requerida: true,
                inventarioId: "",
                saltarAutomatico: false,
                etapaDestinoId: "",
            })
        }
        setErrors({})
    }, [condicion, tipoCondicion, isOpen])

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const newErrors: any = {}

        if (!formData.tipo) {
            newErrors.tipo = "Debe seleccionar un tipo de condición"
        }

        const tipoCondicionObj = TIPOS_CONDICIONES.find((t: any) => t.id === formData.tipo)
        if (tipoCondicionObj?.requiereInventario && !formData.inventarioId) {
            newErrors.inventarioId = "Debe seleccionar un inventario"
        }

        if (formData.saltarAutomatico && !formData.etapaDestinoId) {
            newErrors.etapaDestinoId = "Debe seleccionar una etapa destino"
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        const condicionData: any = {
            id: condicion?.id || `condicion-${Date.now()}`,
            tipo: formData.tipo,
            requerida: formData.requerida,
            parametros: {},
        }

        if (tipoCondicionObj?.requiereInventario) {
            condicionData.parametros.inventarioId = formData.inventarioId
        }

        if (tipoCondicion === "entrada") {
            condicionData.parametros.saltarAutomatico = formData.saltarAutomatico
            if (formData.saltarAutomatico) {
                condicionData.parametros.etapaDestinoId = formData.etapaDestinoId
            }
        }

        onSave(condicionData)
        onClose()
    }

    if (!isOpen) return null

    const tipoCondicionObj = TIPOS_CONDICIONES.find((t: any) => t.id === formData.tipo)

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={condicion ? " Editar Condición" : " Agregar Condición"} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Condición</label>
                    <select
                        value={formData.tipo}
                        onChange={(e: any) => setFormData(prev => ({ ...prev, tipo: e.target.value, inventarioId: "" }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Seleccionar tipo</option>
                        {TIPOS_CONDICIONES.map((tipo: any) => (
                            <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                        ))}
                    </select>
                    {errors.tipo && <p className="text-sm text-red-600 mt-1">{errors.tipo}</p>}
                    {tipoCondicionObj && (
                        <p className="text-xs text-slate-500 mt-1">{tipoCondicionObj.descripcion}</p>
                    )}
                </div>

                <div>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.requerida}
                            onChange={(e: any) => setFormData(prev => ({ ...prev, requerida: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Condición requerida (obligatoria)</span>
                    </label>
                </div>

                {tipoCondicionObj?.requiereInventario && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Inventario</label>
                        <select
                            value={formData.inventarioId}
                            onChange={(e: any) => setFormData(prev => ({ ...prev, inventarioId: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Seleccionar inventario</option>
                            {inventariosDisponibles.map((inv: any) => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.nombre}
                                </option>
                            ))}
                        </select>
                        {errors.inventarioId && <p className="text-sm text-red-600 mt-1">{errors.inventarioId}</p>}
                        {inventariosDisponibles.length === 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                                No hay inventarios disponibles. Crea uno desde la gestión de inventarios.
                            </p>
                        )}
                    </div>
                )}

                {tipoCondicion === "entrada" && (
                    <>
                        <div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.saltarAutomatico}
                                    onChange={(e: any) => setFormData(prev => ({ ...prev, saltarAutomatico: e.target.checked, etapaDestinoId: e.target.checked ? prev.etapaDestinoId : "" }))}
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Saltar etapa automáticamente si se cumple</span>
                            </label>
                        </div>

                        {formData.saltarAutomatico && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Etapa Destino</label>
                                <select
                                    value={formData.etapaDestinoId}
                                    onChange={(e: any) => setFormData(prev => ({ ...prev, etapaDestinoId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Seleccionar etapa destino</option>
                                    {etapasDelFlujo.map((etapa: any) => (
                                        <option key={etapa.id} value={etapa.id}>{etapa.nombre}</option>
                                    ))}
                                </select>
                                {errors.etapaDestinoId && <p className="text-sm text-red-600 mt-1">{errors.etapaDestinoId}</p>}
                            </div>
                        )}
                    </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit">
                        {condicion ? "Guardar Cambios" : "Agregar Condición"}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

// Componente: Lista de Condiciones
export function CondicionesList({ condiciones, tipoCondicion, flujoId, etapaId, onAdd, onEdit, onDelete }: any) {
    const getTipoNombre = (tipoId: string) => {
        const tipo = TIPOS_CONDICIONES.find((t: any) => t.id === tipoId)
        return tipo?.nombre || tipoId
    }

    if (condiciones.length === 0) {
        return (
            <div className="text-center py-4 text-slate-500">
                <p className="text-sm">No hay condiciones configuradas</p>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onAdd(null)}
                    className="mt-2"
                    iconLeft={<Plus className="w-4 h-4" />}
                >
                    Agregar Condición
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {condiciones.map((condicion: any) => {
                const tipoCondicionObj = TIPOS_CONDICIONES.find((t: any) => t.id === condicion.tipo)
                return (
                    <div
                        key={condicion.id}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-2"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800">{getTipoNombre(condicion.tipo)}</span>
                                {condicion.requerida ? (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">Requerida</span>
                                ) : (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">Opcional</span>
                                )}
                                {tipoCondicion === "entrada" && condicion.parametros?.saltarAutomatico && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                        Salta a: {mockDatabase.etapas.find((e: any) => e.id === condicion.parametros.etapaDestinoId)?.nombre || "N/A"}
                                    </span>
                                )}
                            </div>
                            {tipoCondicionObj?.requiereInventario && condicion.parametros?.inventarioId && (
                                <p className="text-xs text-slate-500 mt-1">
                                    Inventario: {condicion.parametros.inventarioId === "inventarioPrendas" ? "Prendas" : "Productos"}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => onEdit(condicion)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(condicion)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar"
                            >
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )
            })}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAdd(null)}
                iconLeft={<Plus className="w-4 h-4" />}
                className="w-full"
            >
                Agregar Condición
            </Button>
        </div>
    )
}

export function EtapaFormModal({ isOpen, onClose, etapa, flujoId, onSave }: any) {
    const [formData, setFormData] = useState<{
        nombre: string
        descripcion: string
        icono: string
        color: string
        moduloPermisos: string
        obligatoria: boolean
        tipoObligatoria: string | null
        orden?: number
    }>({
        nombre: "",
        descripcion: "",
        icono: "Box",
        color: COLOR_PALETTE[0].value,
        moduloPermisos: "",
        obligatoria: false,
        tipoObligatoria: null,
    })
    const [errors, setErrors] = useState<Record<string, any>>({})
    const [condicionesSalida, setCondicionesSalida] = useState<any[]>([])
    const [condicionesEntrada, setCondicionesEntrada] = useState<any[]>([])
    const [showCondicionModal, setShowCondicionModal] = useState(false)
    const [editingCondicion, setEditingCondicion] = useState<any>(null)
    const [tipoCondicionModal, setTipoCondicionModal] = useState<any>(null)

    useEffect(() => {
        if (etapa) {
            setFormData({
                nombre: etapa.nombre || "",
                descripcion: etapa.descripcion || "",
                icono: etapa.icono || "Box",
                color: etapa.color || COLOR_PALETTE[0].value,
                moduloPermisos: etapa.moduloPermisos || "",
                obligatoria: etapa.obligatoria || false,
                tipoObligatoria: etapa.tipoObligatoria || null,
            })
            setCondicionesSalida(etapa.condicionesSalida || [])
            setCondicionesEntrada(etapa.condicionesEntrada || [])
        } else {
            const etapasDelFlujo = mockDatabase.etapas.filter((e: any) => e.flujoId === flujoId)
            setFormData({
                nombre: "",
                descripcion: "",
                icono: "Box",
                color: COLOR_PALETTE[0].value,
                moduloPermisos: "",
                obligatoria: false,
                tipoObligatoria: null,
                orden: etapasDelFlujo.length,
            })
            setCondicionesSalida([])
            setCondicionesEntrada([])
        }
        setErrors({})
    }, [etapa, flujoId, isOpen])

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const newErrors: any = {}
        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre es obligatorio"
        } else {
            const nombreExists = mockDatabase.etapas.some((e: any) => e.nombre.toLowerCase() === formData.nombre.trim().toLowerCase() && e.flujoId === flujoId && e.id !== etapa?.id)
            if (nombreExists) newErrors.nombre = "Ya existe una etapa con este nombre en este flujo"
        }
        if (formData.tipoObligatoria) {
            const etapasDelFlujo = mockDatabase.etapas.filter((e: any) => e.flujoId === flujoId && e.id !== etapa?.id)
            const existeTipo = etapasDelFlujo.some((e: any) => e.tipoObligatoria === formData.tipoObligatoria)
            if (existeTipo) newErrors.tipoObligatoria = `Ya existe una etapa ${formData.tipoObligatoria === "inicial" ? "inicial" : "final"} en este flujo`
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        try {
            const etapaData: any = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                icono: formData.icono,
                color: formData.color,
                moduloPermisos: formData.moduloPermisos,
                obligatoria: formData.obligatoria || formData.tipoObligatoria !== null,
                tipoObligatoria: formData.tipoObligatoria,
                condicionesSalida,
                condicionesEntrada,
                fechaModificacion: new Date(),
            }
            if (etapa) {
                etapaData.flujoId = etapa.flujoId
                etapaData.orden = etapa.orden
                etapaData.fechaCreacion = etapa.fechaCreacion
                await mockFirestore.doc("etapas", etapa.id).update(etapaData)
            } else {
                etapaData.id = `etapa-${Date.now()}`
                etapaData.flujoId = flujoId
                etapaData.orden = formData.orden ?? mockDatabase.etapas.filter((e: any) => e.flujoId === flujoId).length
                etapaData.fechaCreacion = new Date()
                await mockFirestore.collection("etapas").add(etapaData)
            }
            const list = (mockDatabase.etapas || []).map((e: any) => ({ id: e.id, ...e }))
            onSave(list)
            onClose()
        } catch (err: any) {
            console.error("Error al guardar etapa:", err)
            alert("Error al guardar la etapa. Por favor, intente nuevamente.")
        }
    }

    if (!isOpen) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={etapa ? "Editar Etapa" : "Crear Nueva Etapa"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Nombre de la Etapa" value={formData.nombre} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, nombre: e.target.value }))} required error={errors.nombre} />
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                    <textarea value={formData.descripcion} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, descripcion: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ColorSelector selectedColor={formData.color} onSelect={(color: any) => setFormData((prev: any) => ({ ...prev, color }))} />
                    <IconSelector selectedIcon={formData.icono} onSelect={(icono: any) => setFormData((prev: any) => ({ ...prev, icono }))} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Módulo de Permisos</label>
                    <select value={formData.moduloPermisos} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, moduloPermisos: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccionar módulo</option>
                        {Object.entries(AVAILABLE_MODULES).map(([key, module]: [string, any]) => (<option key={key} value={key}>{module.name}</option>))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Tipo de Etapa</label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.tipoObligatoria === "inicial"} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, tipoObligatoria: e.target.checked ? "inicial" : null, obligatoria: e.target.checked }))} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                            <span className="text-sm text-slate-700">Etapa inicial obligatoria</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.tipoObligatoria === "final"} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, tipoObligatoria: e.target.checked ? "final" : null, obligatoria: e.target.checked }))} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                            <span className="text-sm text-slate-700">Etapa final obligatoria</span>
                        </label>
                    </div>
                    {errors.tipoObligatoria && <p className="text-sm text-red-600">{errors.tipoObligatoria}</p>}
                </div>
                <div className="border-t border-slate-200 pt-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Condiciones de Salida</h3>
                    <p className="text-sm text-slate-600 mb-3">Condiciones que deben cumplirse para avanzar a la siguiente etapa</p>
                    <CondicionesList condiciones={condicionesSalida} tipoCondicion="salida" flujoId={flujoId} etapaId={etapa?.id} onAdd={() => { setEditingCondicion(null); setTipoCondicionModal("salida"); setShowCondicionModal(true) }} onEdit={(cond: any) => { setEditingCondicion(cond); setTipoCondicionModal("salida"); setShowCondicionModal(true) }} onDelete={(cond: any) => setCondicionesSalida((prev: any[]) => prev.filter((c: any) => c.id !== cond.id))} />
                </div>
                <div className="border-t border-slate-200 pt-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Condiciones de Entrada</h3>
                    <p className="text-sm text-slate-600 mb-3">Condiciones evaluadas al entrar a esta etapa</p>
                    <CondicionesList condiciones={condicionesEntrada} tipoCondicion="entrada" flujoId={flujoId} etapaId={etapa?.id} onAdd={() => { setEditingCondicion(null); setTipoCondicionModal("entrada"); setShowCondicionModal(true) }} onEdit={(cond: any) => { setEditingCondicion(cond); setTipoCondicionModal("entrada"); setShowCondicionModal(true) }} onDelete={(cond: any) => setCondicionesEntrada((prev: any[]) => prev.filter((c: any) => c.id !== cond.id))} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" iconLeft={<Save className="w-4 h-4" />}>{etapa ? "Guardar Cambios" : "Crear Etapa"}</Button>
                </div>
            </form>
            <CondicionFormModal isOpen={showCondicionModal} onClose={() => { setShowCondicionModal(false); setEditingCondicion(null); setTipoCondicionModal(null) }} condicion={editingCondicion} tipoCondicion={tipoCondicionModal} flujoId={flujoId} etapaId={etapa?.id} onSave={(condicionData: any) => {
                if (tipoCondicionModal === "salida") {
                    if (editingCondicion) setCondicionesSalida((prev: any[]) => prev.map((c: any) => c.id === condicionData.id ? condicionData : c))
                    else setCondicionesSalida((prev: any[]) => [...prev, condicionData])
                } else {
                    if (editingCondicion) setCondicionesEntrada((prev: any[]) => prev.map((c: any) => c.id === condicionData.id ? condicionData : c))
                    else setCondicionesEntrada((prev: any[]) => [...prev, condicionData])
                }
                setShowCondicionModal(false)
                setEditingCondicion(null)
                setTipoCondicionModal(null)
            }} />
        </Modal>
    )
}

export function FlujoFormModal({ isOpen, onClose, flujo, onSave }: any) {
    const { currentUser } = useAuth()
    const [formData, setFormData] = useState({ nombre: "", descripcion: "", activo: true, orden: 0, color: COLOR_PALETTE[0].value, icono: "Box" })
    const [errors, setErrors] = useState<Record<string, any>>({})

    useEffect(() => {
        if (flujo) {
            setFormData({ nombre: flujo.nombre || "", descripcion: flujo.descripcion || "", activo: flujo.activo !== undefined ? flujo.activo : true, orden: flujo.orden || 0, color: flujo.color || COLOR_PALETTE[0].value, icono: flujo.icono || "Box" })
        } else {
            setFormData({ nombre: "", descripcion: "", activo: true, orden: mockDatabase.flujos.length, color: COLOR_PALETTE[0].value, icono: "Box" })
        }
        setErrors({})
    }, [flujo, isOpen])

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const newErrors: any = {}
        if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio"
        else {
            const nombreExists = mockDatabase.flujos.some((f: any) => f.nombre.toLowerCase() === formData.nombre.trim().toLowerCase() && f.id !== flujo?.id)
            if (nombreExists) newErrors.nombre = "Ya existe un flujo con este nombre"
        }
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
        try {
            const flujoData: any = { nombre: formData.nombre.trim(), descripcion: formData.descripcion.trim(), activo: formData.activo, orden: formData.orden, color: formData.color, icono: formData.icono, fechaModificacion: new Date() }
            if (flujo) {
                flujoData.fechaCreacion = flujo.fechaCreacion
                flujoData.creadoPor = flujo.creadoPor
                await mockFirestore.doc("flujos", flujo.id).update(flujoData)
            } else {
                flujoData.id = `flujo-${Date.now()}`
                flujoData.fechaCreacion = new Date()
                flujoData.creadoPor = currentUser?.uid || "system"
                flujoData.etapas = []
                await mockFirestore.collection("flujos").add(flujoData)
            }
            onSave()
            onClose()
        } catch (err: any) {
            console.error("Error al guardar flujo:", err)
            alert("Error al guardar el flujo. Por favor, intente nuevamente.")
        }
    }

    if (!isOpen) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={flujo ? "Editar Flujo" : "Crear Nuevo Flujo"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Nombre del Flujo" value={formData.nombre} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, nombre: e.target.value }))} required error={errors.nombre} />
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                    <textarea value={formData.descripcion} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, descripcion: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Orden</label>
                        <input type="number" value={formData.orden} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, orden: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                        <input type="checkbox" id="activo" checked={formData.activo} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, activo: e.target.checked }))} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                        <label htmlFor="activo" className="text-sm font-medium text-slate-700">Flujo activo</label>
                    </div>
                </div>
                <ColorSelector selectedColor={formData.color} onSelect={(color: any) => setFormData((prev: any) => ({ ...prev, color }))} />
                <IconSelector selectedIcon={formData.icono} onSelect={(icono: any) => setFormData((prev: any) => ({ ...prev, icono }))} />
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" iconLeft={<Save className="w-4 h-4" />}>{flujo ? "Guardar Cambios" : "Crear Flujo"}</Button>
                </div>
            </form>
        </Modal>
    )
}
