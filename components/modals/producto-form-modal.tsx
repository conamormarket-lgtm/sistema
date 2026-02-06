
import React, { useState, useEffect, useMemo } from "react"
import { Search, Plus, Trash, AlertTriangle, Save, X } from "lucide-react"

import { useAuth } from "../../contexts/auth-context"
import { mockDatabase, mockFirestore } from "../../lib/mock-data"
import { buscarItemEnInventario, calcularCostoProducto, sincronizarCostoProductoInventario } from "../../lib/business-logic"
import { Modal } from "../ui/modal"
import { Input, Select } from "../ui/input"
import { Button } from "../ui/button"

export function ProductoFormModal({ isOpen, onClose, producto }: any) {
    const { isOwner } = useAuth()
    const [formData, setFormData] = useState<any>({
        nombre: "",
        descripcion: "",
        imagen: "",
        categoria: "",
        tipo: "simple",
        itemInventarioId: "",
        inventarioId: "",
        componentes: [],
        precios: [
            { id: crypto.randomUUID(), nombre: "Precio Regular", valor: 0, activo: true, habilitado: true },
        ],
        variantes: [],
        activo: true,
    })
    const [errors, setErrors] = useState<any>({})
    const [busquedaItem, setBusquedaItem] = useState("")
    const [itemsEncontrados, setItemsEncontrados] = useState<any[]>([])
    const [mostrandoBusqueda, setMostrandoBusqueda] = useState(false)

    useEffect(() => {
        if (producto) {
            setFormData({
                nombre: producto.nombre || "",
                descripcion: producto.descripcion || "",
                imagen: producto.imagen || "",
                categoria: producto.categoria || "",
                tipo: producto.tipo || "simple",
                itemInventarioId: producto.itemInventarioId || "",
                inventarioId: producto.inventarioId || "",
                componentes: producto.componentes || [],
                precios: producto.precios?.length > 0 ? producto.precios : [
                    { id: crypto.randomUUID(), nombre: "Precio Regular", valor: 0, activo: true, habilitado: true },
                ],
                variantes: producto.variantes || [],
                activo: producto.activo !== undefined ? producto.activo : true,
            })
        } else {
            setFormData({
                nombre: "",
                descripcion: "",
                imagen: "",
                categoria: "",
                tipo: "simple",
                itemInventarioId: "",
                inventarioId: "",
                componentes: [],
                precios: [
                    { id: crypto.randomUUID(), nombre: "Precio Regular", valor: 0, activo: true, habilitado: true },
                ],
                variantes: [],
                activo: true,
            })
        }
    }, [producto, isOpen])

    const inventariosDisponibles = useMemo(() => {
        return mockDatabase.inventarios.filter((inv: any) => inv.activo)
    }, [])

    const categoriasDisponibles = useMemo(() => {
        return mockDatabase.categoriasProductos || []
    }, [])

    const handleChange = (e: any) => {
        const { name, value } = e.target
        setFormData((prev: any) => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors((prev: any) => ({ ...prev, [name]: null }))
        }
    }

    const handleBuscarItem = (inventarioId: string) => {
        if (!busquedaItem.trim()) {
            setItemsEncontrados([])
            return
        }
        const items = buscarItemEnInventario(inventarioId, busquedaItem)
        setItemsEncontrados(items)
        setMostrandoBusqueda(true)
    }

    const handleSeleccionarItem = (item: any, inventarioId: string, esComponente = false, componenteIndex: number | null = null) => {
        if (esComponente && componenteIndex !== null) {
            const nuevosComponentes = [...formData.componentes]
            nuevosComponentes[componenteIndex] = {
                ...nuevosComponentes[componenteIndex],
                itemInventarioId: item.id,
                inventarioId: inventarioId,
                nombre: item.nombre,
            }
            setFormData((prev: any) => ({ ...prev, componentes: nuevosComponentes }))
        } else {
            setFormData((prev: any) => ({
                ...prev,
                itemInventarioId: item.id,
                inventarioId: inventarioId,
            }))
        }
        setBusquedaItem("")
        setItemsEncontrados([])
        setMostrandoBusqueda(false)
    }

    const handleAgregarComponente = () => {
        setFormData((prev: any) => ({
            ...prev,
            componentes: [
                ...prev.componentes,
                {
                    id: crypto.randomUUID(),
                    itemInventarioId: "",
                    inventarioId: "",
                    cantidad: 1,
                    nombre: "",
                },
            ],
        }))
    }

    const handleEliminarComponente = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            componentes: prev.componentes.filter((_: any, i: number) => i !== index),
        }))
    }

    const handleActualizarComponente = (index: number, field: string, value: any) => {
        const nuevosComponentes = [...formData.componentes]
        nuevosComponentes[index] = { ...nuevosComponentes[index], [field]: value }
        setFormData((prev: any) => ({ ...prev, componentes: nuevosComponentes }))
    }

    const handleAgregarPrecio = () => {
        if (formData.precios.length >= 3) {
            alert("Máximo 3 precios permitidos")
            return
        }
        setFormData((prev: any) => ({
            ...prev,
            precios: [
                ...prev.precios,
                {
                    id: crypto.randomUUID(),
                    nombre: `Precio ${prev.precios.length + 1}`,
                    valor: 0,
                    activo: false,
                    habilitado: false,
                },
            ],
        }))
    }

    const handleEliminarPrecio = (precioId: string) => {
        if (formData.precios.length <= 1) {
            alert("Debe haber al menos un precio")
            return
        }
        const preciosFiltrados = formData.precios.filter((p: any) => p.id !== precioId)
        // Asegurar que al menos uno esté activo
        if (!preciosFiltrados.some((p: any) => p.activo)) {
            preciosFiltrados[0].activo = true
        }
        setFormData((prev: any) => ({ ...prev, precios: preciosFiltrados }))
    }

    const handleActualizarPrecio = (precioId: string, field: string, value: any) => {
        const nuevosPrecios = formData.precios.map((p: any) => {
            if (p.id === precioId) {
                const actualizado = { ...p, [field]: value }
                // Si se marca como activo, desactivar los demás
                if (field === "activo" && value === true) {
                    return { ...actualizado, activo: true }
                }
                return actualizado
            }
            // Si otro precio se marca como activo, desactivar este
            if (field === "activo" && value === true) {
                return { ...p, activo: false }
            }
            return p
        })
        setFormData((prev: any) => ({ ...prev, precios: nuevosPrecios }))
    }

    const handleAgregarVariante = () => {
        setFormData((prev: any) => ({
            ...prev,
            variantes: [
                ...prev.variantes,
                {
                    id: crypto.randomUUID(),
                    nombre: "",
                    costoAdicional: 0,
                    precioAdicional: 0,
                },
            ],
        }))
    }

    const handleEliminarVariante = (varianteId: string) => {
        setFormData((prev: any) => ({
            ...prev,
            variantes: prev.variantes.filter((v: any) => v.id !== varianteId),
        }))
    }

    const handleActualizarVariante = (varianteId: string, field: string, value: any) => {
        const nuevasVariantes = formData.variantes.map((v: any) =>
            v.id === varianteId ? { ...v, [field]: value } : v
        )
        setFormData((prev: any) => ({ ...prev, variantes: nuevasVariantes }))
    }

    const costoCalculado = useMemo(() => {
        return calcularCostoProducto(formData)
    }, [formData])

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const nuevosErrores: any = {}

        if (!formData.nombre.trim()) {
            nuevosErrores.nombre = "El nombre es obligatorio"
        }
        if (formData.tipo === "simple" && !formData.itemInventarioId) {
            nuevosErrores.itemInventarioId = "Debe seleccionar un item del inventario"
        }
        if (formData.tipo === "compuesto" && formData.componentes.length < 2) {
            nuevosErrores.componentes = "Debe tener al menos 2 componentes"
        }
        if (!formData.precios.some((p: any) => p.activo)) {
            nuevosErrores.precios = "Debe haber al menos un precio activo"
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setErrors(nuevosErrores)
            return
        }

        try {
            const productoData: any = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                imagen: formData.imagen.trim(),
                categoria: formData.categoria,
                tipo: formData.tipo,
                itemInventarioId: formData.itemInventarioId,
                inventarioId: formData.inventarioId,
                componentes: formData.componentes,
                precios: formData.precios,
                variantes: formData.variantes,
                costoTotal: costoCalculado,
                activo: formData.activo,
                fechaModificacion: new Date(),
            }

            // Si es propietario, permitir modificar costo (sincronizar)
            if (isOwner) {
                // En este mock, el costo se calcula automáticamente o se sincroniza
                // Si quisiéramos sobrescribir manual, lo haríamos aquí
            }

            if (producto) {
                productoData.id = producto.id
                productoData.fechaCreacion = producto.fechaCreacion
                await mockFirestore.doc("productos", producto.id).update(productoData)

                // Sincronizar costo calculado con inventario si es necesario
                await sincronizarCostoProductoInventario(producto.id, costoCalculado)
            } else {
                productoData.id = `producto-${Date.now()}`
                productoData.fechaCreacion = new Date()
                await mockFirestore.collection("productos").add(productoData)
            }

            onClose()
        } catch (error: any) {
            alert("Error al guardar producto: " + error.message)
        }
    }

    if (!isOpen) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={producto ? " Editar Producto" : " Nuevo Producto"} size="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Input
                            label="Nombre del Producto"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            error={errors.nombre}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Categoría"
                                name="categoria"
                                value={formData.categoria}
                                onChange={handleChange}
                                options={[
                                    { value: "", label: "Seleccionar..." },
                                    ...categoriasDisponibles.map((c: any) => c.nombre)
                                ]}
                            />
                            <Select
                                label="Tipo"
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleChange}
                                options={[
                                    { value: "simple", label: "Simple (Un ítem)" },
                                    { value: "compuesto", label: "Compuesto (Pack/Kit)" },
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                            />
                        </div>
                        <Input
                            label="URL de Imagen"
                            name="imagen"
                            value={formData.imagen}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Box className="w-4 h-4" />
                            Inventario y Costos
                        </h4>

                        {formData.tipo === "simple" ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Item de Inventario</label>
                                    <div className="flex gap-2">
                                        <Select
                                            className="flex-1 mb-0"
                                            name="inventarioId"
                                            value={formData.inventarioId}
                                            onChange={(e: any) => {
                                                handleChange(e)
                                                setFormData((prev: any) => ({ ...prev, itemInventarioId: "" }))
                                            }}
                                            options={[
                                                { value: "", label: "Seleccionar inventario..." },
                                                ...inventariosDisponibles.map((inv: any) => ({ value: inv.id, label: inv.nombre }))
                                            ]}
                                        />
                                    </div>
                                    {formData.inventarioId && (
                                        <div className="mt-2 relative">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por código o nombre..."
                                                    value={busquedaItem}
                                                    onChange={(e: any) => setBusquedaItem(e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                />
                                                <Button type="button" size="sm" onClick={() => handleBuscarItem(formData.inventarioId)}>
                                                    <Search className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {mostrandoBusqueda && itemsEncontrados.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {itemsEncontrados.map((item: any) => (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => handleSeleccionarItem(item, formData.inventarioId)}
                                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0"
                                                        >
                                                            <div className="font-medium text-slate-900">{item.nombre}</div>
                                                            <div className="flex justify-between text-xs text-slate-500">
                                                                <span>Cod: {item.codigo}</span>
                                                                <span>${item.costoUnitario?.toFixed(2)}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {formData.itemInventarioId && (
                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 flex justify-between items-center">
                                            <span>Item seleccionado</span>
                                            <Button type="button" size="sm" variant="ghost" onClick={() => setFormData((prev: any) => ({ ...prev, itemInventarioId: "" }))}>
                                                Cambiar
                                            </Button>
                                        </div>
                                    )}
                                    {errors.itemInventarioId && <p className="text-red-500 text-xs mt-1">{errors.itemInventarioId}</p>}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500">
                                    Agrega items individuales para formar este pack. El costo se calculará automáticamente.
                                </p>
                                {formData.componentes.map((comp: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-sm">Componente {idx + 1}</span>
                                            <button type="button" onClick={() => handleEliminarComponente(idx)} className="text-red-500 hover:text-red-700">
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Select
                                                className="mb-0"
                                                value={comp.inventarioId}
                                                onChange={(e: any) => handleActualizarComponente(idx, "inventarioId", e.target.value)}
                                                options={[
                                                    { value: "", label: "Inventario..." },
                                                    ...inventariosDisponibles.map((inv: any) => ({ value: inv.id, label: inv.nombre }))
                                                ]}
                                            />
                                            <Input
                                                type="number"
                                                className="mb-0"
                                                placeholder="Cant."
                                                value={comp.cantidad}
                                                onChange={(e: any) => handleActualizarComponente(idx, "cantidad", Number(e.target.value))}
                                            />
                                        </div>
                                        {/* Búsqueda para componente (simplificada) */}
                                        {comp.inventarioId && !comp.itemInventarioId && (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Buscar item..."
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    onBlur={(e: any) => {
                                                        // En una implementación real, esto debería activar la búsqueda
                                                        // Por ahora, simulamos que busca si hay texto
                                                        if (e.target.value) {
                                                            const items = buscarItemEnInventario(comp.inventarioId, e.target.value)
                                                            if (items.length > 0) {
                                                                handleSeleccionarItem(items[0], comp.inventarioId, true, idx)
                                                            }
                                                        }
                                                    }}
                                                />
                                                <Button type="button" size="sm" variant="secondary">
                                                    <Search className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        )}
                                        {comp.nombre && <div className="text-xs text-green-600 font-medium">{comp.nombre}</div>}
                                    </div>
                                ))}
                                <Button type="button" size="sm" variant="outline" onClick={handleAgregarComponente} iconLeft={<Plus className="w-4 h-4" />}>
                                    Agregar Componente
                                </Button>
                                {errors.componentes && <p className="text-red-500 text-xs">{errors.componentes}</p>}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex justify-between items-center font-semibold text-slate-800">
                                <span>Costo Total:</span>
                                <span className="text-lg">${costoCalculado.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Calculado automáticamente según inventario
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Configuración de Precios
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {formData.precios.map((precio: any) => (
                            <div key={precio.id} className={`p-4 border rounded-lg ${precio.activo ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <input
                                        type="text"
                                        value={precio.nombre}
                                        onChange={(e: any) => handleActualizarPrecio(precio.id, "nombre", e.target.value)}
                                        className="font-medium bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-full"
                                    />
                                    {formData.precios.length > 1 && (
                                        <button type="button" onClick={() => handleEliminarPrecio(precio.id)} className="text-slate-400 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-slate-500">$</span>
                                        <input
                                            type="number"
                                            value={precio.valor}
                                            onChange={(e: any) => handleActualizarPrecio(precio.id, "valor", Number(e.target.value))}
                                            className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-sm text-slate-600">
                                            <input
                                                type="radio"
                                                checked={precio.activo}
                                                onChange={() => handleActualizarPrecio(precio.id, "activo", true)}
                                                className="text-blue-600"
                                            />
                                            Principal
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {formData.precios.length < 3 && (
                            <button
                                type="button"
                                onClick={handleAgregarPrecio}
                                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-slate-500"
                            >
                                <Plus className="w-6 h-6 mb-2" />
                                <span className="text-sm">Agregar Precio</span>
                            </button>
                        )}
                    </div>
                    {errors.precios && <p className="text-red-500 text-sm mt-2">{errors.precios}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" iconLeft={<Save className="w-4 h-4" />}>
                        Guardar Producto
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

function Box({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    )
}

function DollarSign({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    )
}
