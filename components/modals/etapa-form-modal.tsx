
import React, { useState, useEffect } from "react"
import { Save } from "lucide-react"

import { COLOR_PALETTE, AVAILABLE_MODULES } from "../../lib/constants"
import { mockDatabase, mockFirestore } from "../../lib/mock-data"
import { Modal } from "../ui/modal"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { ColorSelector, IconSelector, CondicionesList, CondicionFormModal } from "./flow-components"

export function EtapaFormModal({ isOpen, onClose, etapa, flujoId, onSave }: any) {
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        icono: "Box",
        color: COLOR_PALETTE[0].value,
        moduloPermisos: "",
        obligatoria: false,
        tipoObligatoria: null as "inicial" | "final" | null,
        orden: 0
    })
    const [errors, setErrors] = useState<any>({})
    const [condicionesSalida, setCondicionesSalida] = useState<any[]>([])
    const [condicionesEntrada, setCondicionesEntrada] = useState<any[]>([])
    const [showCondicionModal, setShowCondicionModal] = useState(false)
    const [editingCondicion, setEditingCondicion] = useState<any>(null)
    const [tipoCondicionModal, setTipoCondicionModal] = useState<"salida" | "entrada" | null>(null) // "salida" o "entrada"

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
                orden: etapa.orden || 0
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
            // Validar nombre único dentro del flujo
            const nombreExists = mockDatabase.etapas.some((e: any) => e.nombre.toLowerCase() === formData.nombre.trim().toLowerCase()
                    && e.flujoId === flujoId
                    && e.id !== etapa?.id
            )
            if (nombreExists) {
                newErrors.nombre = "Ya existe una etapa con este nombre en este flujo"
            }
        }

        // Validar que solo haya una etapa inicial y una final
        if (formData.tipoObligatoria) {
            const etapasDelFlujo = mockDatabase.etapas.filter((e: any) => e.flujoId === flujoId && e.id !== etapa?.id)
            const existeTipo = etapasDelFlujo.some((e: any) => e.tipoObligatoria === formData.tipoObligatoria)
            if (existeTipo) {
                newErrors.tipoObligatoria = `Ya existe una etapa ${formData.tipoObligatoria === "inicial" ? "inicial" : "final"} en este flujo`
            }
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
                condicionesSalida: condicionesSalida,
                condicionesEntrada: condicionesEntrada,
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
                etapaData.orden = formData.orden || mockDatabase.etapas.filter((e: any) => e.flujoId === flujoId).length
                etapaData.fechaCreacion = new Date()
                await mockFirestore.collection("etapas").add(etapaData)
            }

            onSave()
            onClose()
        } catch (error: any) {
            console.error("Error al guardar etapa:", error)
            alert("Error al guardar la etapa. Por favor, intente nuevamente.")
        }
    }

    if (!isOpen) return null

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={etapa ? " Editar Etapa" : " Crear Nueva Etapa"} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nombre de la Etapa"
                        value={formData.nombre}
                        onChange={(e: any) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                        required
                        error={errors.nombre}
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                        <textarea
                            value={formData.descripcion}
                            onChange={(e: any) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <ColorSelector
                            selectedColor={formData.color}
                            onSelect={(color: any) => setFormData(prev => ({ ...prev, color }))}
                        />
                        <IconSelector
                            selectedIcon={formData.icono}
                            onSelect={(icono: any) => setFormData(prev => ({ ...prev, icono }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Módulo de Permisos</label>
                        <select
                            value={formData.moduloPermisos}
                            onChange={(e: any) => setFormData(prev => ({ ...prev, moduloPermisos: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Seleccionar módulo</option>
                            {Object.entries(AVAILABLE_MODULES).map(([key, module]: [string, any]) => (
                                <option key={key} value={key}>{module.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Tipo de Etapa</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.tipoObligatoria === "inicial"}
                                    onChange={(e: any) => setFormData(prev => ({
                                        ...prev,
                                        tipoObligatoria: e.target.checked ? "inicial" : null,
                                        obligatoria: e.target.checked
                                    }))}
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Etapa inicial obligatoria</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.tipoObligatoria === "final"}
                                    onChange={(e: any) => setFormData(prev => ({
                                        ...prev,
                                        tipoObligatoria: e.target.checked ? "final" : null,
                                        obligatoria: e.target.checked
                                    }))}
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Etapa final obligatoria</span>
                            </label>
                        </div>
                        {errors.tipoObligatoria && (
                            <p className="text-sm text-red-600">{errors.tipoObligatoria}</p>
                        )}
                    </div>

                    {/* Sección de Condiciones de Salida */}
                    <div className="border-t border-slate-200 pt-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Condiciones de Salida</h3>
                        <p className="text-sm text-slate-600 mb-3">
                            Condiciones que deben cumplirse para avanzar a la siguiente etapa
                        </p>
                        <CondicionesList
                            condiciones={condicionesSalida}
                            tipoCondicion="salida"
                            flujoId={flujoId}
                            etapaId={etapa?.id}
                            onAdd={(cond: any) => {
                                setEditingCondicion(cond)
                                setTipoCondicionModal("salida")
                                setShowCondicionModal(true)
                            }}
                            onEdit={(cond: any) => {
                                setEditingCondicion(cond)
                                setTipoCondicionModal("salida")
                                setShowCondicionModal(true)
                            }}
                            onDelete={(cond: any) => {
                                setCondicionesSalida(prev => prev.filter((c: any) => c.id !== cond.id))
                            }}
                        />
                    </div>

                    {/* Sección de Condiciones de Entrada */}
                    <div className="border-t border-slate-200 pt-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Condiciones de Entrada</h3>
                        <p className="text-sm text-slate-600 mb-3">
                            Condiciones evaluadas al entrar a esta etapa (pueden saltar automáticamente)
                        </p>
                        <CondicionesList
                            condiciones={condicionesEntrada}
                            tipoCondicion="entrada"
                            flujoId={flujoId}
                            etapaId={etapa?.id}
                            onAdd={(cond: any) => {
                                setEditingCondicion(cond)
                                setTipoCondicionModal("entrada")
                                setShowCondicionModal(true)
                            }}
                            onEdit={(cond: any) => {
                                setEditingCondicion(cond)
                                setTipoCondicionModal("entrada")
                                setShowCondicionModal(true)
                            }}
                            onDelete={(cond: any) => {
                                setCondicionesEntrada(prev => prev.filter((c: any) => c.id !== cond.id))
                            }}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" iconLeft={<Save className="w-4 h-4" />}>
                            {etapa ? "Guardar Cambios" : "Crear Etapa"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Condición */}
            <CondicionFormModal
                isOpen={showCondicionModal}
                onClose={() => {
                    setShowCondicionModal(false)
                    setEditingCondicion(null)
                    setTipoCondicionModal(null)
                }}
                condicion={editingCondicion}
                tipoCondicion={tipoCondicionModal}
                flujoId={flujoId}
                etapaId={etapa?.id}
                onSave={(condicionData: any) => {
                    if (tipoCondicionModal === "salida") {
                        if (editingCondicion) {
                            setCondicionesSalida(prev => prev.map((c: any) => c.id === condicionData.id ? condicionData : c))
                        } else {
                            setCondicionesSalida(prev => [...prev, condicionData])
                        }
                    } else {
                        if (editingCondicion) {
                            setCondicionesEntrada(prev => prev.map((c: any) => c.id === condicionData.id ? condicionData : c))
                        } else {
                            setCondicionesEntrada(prev => [...prev, condicionData])
                        }
                    }
                }}
            />
        </>
    )
}
