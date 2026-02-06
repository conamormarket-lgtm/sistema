"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { mockDatabase, mockFirestore, formatMoney, obtenerValorColumna } from "@/lib/mock-firebase"
import { PedidosTab } from "@/components/tabs/pedidos-tab"
import { ProductoFormModal } from "@/components/modals/producto-form-modal"
import { Button } from "@/components/ui/button"
import { ConfigColumnasEtapaModal } from "@/components/modals/config-columnas-etapa-modal"
import { Settings, Eye, Plus, Edit, Copy, PackageSearch, Package, UserPlus, Trash2 } from "lucide-react"

const BASE_DATOS_TABS = {
  pedidos: "Pedidos",
  clientes: "Clientes",
  leads: "Leads",
  productos: "Productos",
}

export function BaseDatosMatrix() {
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState("pedidos")

  const renderTabContent = () => {
    switch (activeTab) {
      case "pedidos":
        return <PedidosTab />
      case "clientes":
        return <ClientesTab />
      case "leads":
        return <LeadsTab />
      case "productos":
        return <ProductosTab />
      default:
        return <PedidosTab />
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <div className="border-b border-white/30 glass-box shadow-sm">
        <nav className="flex justify-center items-center px-6 py-0 overflow-x-auto" aria-label="Tabs">
          <div className="flex space-x-1">
            {Object.entries(BASE_DATOS_TABS).map(([key, name]: [string, any]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`
                  px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200
                  ${activeTab === key
                    ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }
                `}
              >
                {name}
              </button>
            ))}
          </div>
        </nav>
      </div>
      <div className="flex-1 overflow-auto">{renderTabContent()}</div>
    </div>
  )
}

// Componente: ClientesTab - Agrupa clientes desde la hoja maestra de pedidos
function ClientesTab() {
  const { isMasterAdmin } = useAuth()
  const [pedidos, setPedidos] = useState<any[]>([])
  const [clienteExpandido, setClienteExpandido] = useState<any>(null)
  const [pedidoExpandido, setPedidoExpandido] = useState<any>(null)
  const [filtros, setFiltros] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    departamento: "",
    provincia: "",
    distrito: "",
    fechaDesde: "",
    fechaHasta: "",
  })
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1)
  }, [filtros])
  const [showConfigColumnas, setShowConfigColumnas] = useState(false)
  const [columnasVisibles, setColumnasVisibles] = useState({
    id: true,
    nombre: true,
    apellidos: true,
    contacto: true,
    dni: true,
    correo: true,
    direccion: true,
    totalPedidos: true,
    totalGastado: true,
    ultimoPedido: true,
    acciones: true,
  })

  useEffect(() => {
    const unsubscribe = mockFirestore.collection("pedidos").onSnapshot((snapshot: any) => {
      const pedidosData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      setPedidos(pedidosData)
    })
    return () => unsubscribe()
  }, [])

  // Agrupar pedidos por cliente (usando DNI, teléfono o email como identificador único)
  const clientesAgrupados = useMemo(() => {
    const clientesMap: Record<string, any> = {}

    pedidos.forEach((pedido: any) => {
      // Identificar cliente único por DNI, teléfono o email
      const identificador = pedido.clienteNumeroDocumento || pedido.clienteContacto || pedido.clienteCorreo || pedido.clienteId
      if (!identificador) return

      if (!clientesMap[identificador]) {
        clientesMap[identificador] = {
          id: identificador,
          clienteNombre: pedido.clienteNombre || "",
          clienteApellidos: pedido.clienteApellidos || "",
          clienteContacto: pedido.clienteContacto || "",
          clienteNumeroDocumento: pedido.clienteNumeroDocumento || "",
          clienteCorreo: pedido.clienteCorreo || "",
          clienteDepartamento: pedido.departamento || pedido.clienteDepartamento || "",
          clienteProvincia: pedido.provincia || pedido.clienteProvincia || "",
          clienteDistrito: pedido.distrito || pedido.clienteDistrito || "",
          pedidos: [],
          totalPedidos: 0,
          totalGastado: 0,
          ultimoPedido: null,
        }
      }

      clientesMap[identificador].pedidos.push(pedido)
      clientesMap[identificador].totalPedidos += 1
      clientesMap[identificador].totalGastado += pedido.montoTotal || 0

      // Actualizar último pedido
      const fechaPedido = pedido.createdAt instanceof Date ? pedido.createdAt : new Date(pedido.createdAt)
      // @ts-ignore
      if (!clientesMap[identificador].ultimoPedido || fechaPedido > clientesMap[identificador].ultimoPedido) {
        // @ts-ignore
        clientesMap[identificador].ultimoPedido = fechaPedido
      }
    })

    return Object.values(clientesMap as any)
  }, [pedidos])

  const clientesFiltrados = useMemo(() => {
    return clientesAgrupados.filter((cliente: any) => {
      if (filtros.nombre && !`${cliente.clienteNombre} ${cliente.clienteApellidos}`.toLowerCase().includes(filtros.nombre.toLowerCase())) return false
      if (filtros.dni && !cliente.clienteNumeroDocumento?.includes(filtros.dni)) return false
      if (filtros.telefono && !cliente.clienteContacto?.includes(filtros.telefono)) return false
      if (filtros.departamento && cliente.clienteDepartamento !== filtros.departamento) return false
      if (filtros.provincia && cliente.clienteProvincia !== filtros.provincia) return false
      if (filtros.distrito && cliente.clienteDistrito !== filtros.distrito) return false
      return true
    })
  }, [clientesAgrupados, filtros])

  const resumen: any = useMemo(() => {
    return {
      totalClientes: clientesFiltrados.length,
      totalPedidos: clientesFiltrados.reduce((sum: any, c: any) => sum + (c.totalPedidos || 0), 0),
      totalGastado: clientesFiltrados.reduce((sum: any, c: any) => sum + (c.totalGastado || 0), 0),
    }
  }, [clientesFiltrados])

  // Lógica de Paginación
  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const clientesPaginados = clientesFiltrados.slice(startIndex, endIndex)

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">DATOS - Clientes</h2>
        {isMasterAdmin() && (
          <Button variant="secondary" onClick={() => setShowConfigColumnas(!showConfigColumnas)} iconLeft={<Settings className="w-4 h-4" />}>
            Columnas
          </Button>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-box rounded-2xl p-6">
          <div className="text-sm text-slate-600 mb-1">Total Clientes</div>
          <div className="text-3xl font-bold text-slate-900">{resumen.totalClientes}</div>
        </div>
        <div className="glass-box rounded-2xl p-6">
          <div className="text-sm text-slate-600 mb-1">Total Pedidos</div>
          <div className="text-3xl font-bold text-slate-900">{resumen.totalPedidos}</div>
        </div>
        <div className="glass-box rounded-2xl p-6">
          <div className="text-sm text-slate-600 mb-1">Total Gastado</div>
          <div className="text-3xl font-bold text-slate-900">S/ {formatMoney(resumen.totalGastado)}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-box rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filtros.nombre}
            onChange={(e: any) => setFiltros((prev: any) => ({ ...prev, nombre: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Buscar por DNI..."
            value={filtros.dni}
            onChange={(e: any) => setFiltros((prev: any) => ({ ...prev, dni: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Buscar por teléfono..."
            value={filtros.telefono}
            onChange={(e: any) => setFiltros((prev: any) => ({ ...prev, telefono: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Buscar por departamento..."
            value={filtros.departamento}
            onChange={(e: any) => setFiltros((prev: any) => ({ ...prev, departamento: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-box rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              {(columnasVisibles?.id !== false) && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">ID</th>}
              {(columnasVisibles?.nombre !== false) && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Nombre</th>}
              {(columnasVisibles?.apellidos !== false) && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Apellidos</th>}
              {(columnasVisibles?.contacto !== false) && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Contacto</th>}
              {(columnasVisibles?.dni !== false) && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">DNI</th>}
              {(columnasVisibles?.correo !== false) && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Correo</th>}
              {(columnasVisibles?.direccion !== false) && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Dirección</th>}
              {(columnasVisibles?.totalPedidos !== false) && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Total Pedidos</th>}
              {(columnasVisibles?.totalGastado !== false) && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Total Gastado</th>}
              {(columnasVisibles?.ultimoPedido !== false) && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Último Pedido</th>}
              {(columnasVisibles?.acciones !== false) && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={Object.values(columnasVisibles).filter((v: any) => v !== false).length} className="px-4 py-8 text-center text-slate-500">
                  No hay clientes registrados
                </td>
              </tr>
            ) : (
              clientesPaginados.map((cliente: any) => (
                <React.Fragment key={cliente.id}>
                  <tr
                    className={`hover:bg-slate-50 cursor-pointer ${clienteExpandido === cliente.id ? "bg-blue-50" : ""}`}
                    onClick={() => setClienteExpandido(clienteExpandido === cliente.id ? null : cliente.id)}
                  >
                    {(columnasVisibles?.id !== false) && <td className="px-4 py-3 text-sm text-slate-700">{cliente.id}</td>}
                    {(columnasVisibles?.nombre !== false) && <td className="px-4 py-3 text-sm text-slate-700">{cliente.clienteNombre || "-"}</td>}
                    {(columnasVisibles?.apellidos !== false) && <td className="px-4 py-3 text-sm text-slate-700">{cliente.clienteApellidos || "-"}</td>}
                    {(columnasVisibles?.contacto !== false) && <td className="px-4 py-3 text-sm text-slate-700">{cliente.clienteContacto || "-"}</td>}
                    {(columnasVisibles?.dni !== false) && <td className="px-4 py-3 text-sm text-slate-700">{cliente.clienteNumeroDocumento || "-"}</td>}
                    {(columnasVisibles?.correo !== false) && <td className="px-4 py-3 text-sm text-slate-700">{cliente.clienteCorreo || "-"}</td>}
                    {(columnasVisibles?.direccion !== false) && (
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {[cliente.clienteDepartamento, cliente.clienteProvincia, cliente.clienteDistrito].filter(Boolean).join(", ") || "-"}
                      </td>
                    )}
                    {(columnasVisibles?.totalPedidos !== false) && <td className="px-4 py-3 text-sm text-slate-700">{cliente.totalPedidos || 0}</td>}
                    {(columnasVisibles?.totalGastado !== false) && (
                      <td className="px-4 py-3 text-sm text-slate-700 font-semibold">S/ {formatMoney(cliente.totalGastado)}</td>
                    )}
                    {(columnasVisibles?.ultimoPedido !== false) && (
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {cliente.ultimoPedido ? new Date(cliente.ultimoPedido).toLocaleDateString("es-PE") : "-"}
                      </td>
                    )}
                    {(columnasVisibles?.acciones !== false) && (
                      <td className="px-4 py-3 text-sm" onClick={(e: any) => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          size="sm"
                          iconLeft={<Eye className="w-4 h-4" />}
                          onClick={(e: any) => {
                            e.stopPropagation()
                            setClienteExpandido(clienteExpandido === cliente.id ? null : cliente.id)
                          }}
                        >
                          {clienteExpandido === cliente.id ? "Ocultar" : "Ver"} Pedidos
                        </Button>
                      </td>
                    )}
                  </tr>
                  {clienteExpandido === cliente.id && (
                    <tr>
                      <td colSpan={Object.values(columnasVisibles).filter((v: any) => v !== false).length} className="px-4 py-6 bg-blue-50/50">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">
                            Pedidos de {cliente.clienteNombre} {cliente.clienteApellidos} ({cliente.pedidos.length} pedidos)
                          </h3>
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">ID Pedido</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Fecha</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Estado</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Monto Total</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {cliente.pedidos.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                      No hay pedidos para este cliente
                                    </td>
                                  </tr>
                                ) : (
                                  cliente.pedidos.map((pedido: any) => (
                                    <React.Fragment key={pedido.id}>
                                      <tr
                                        className={`hover:bg-slate-50 cursor-pointer ${pedidoExpandido === pedido.id ? "bg-green-50" : ""}`}
                                        onClick={() => setPedidoExpandido(pedidoExpandido === pedido.id ? null : pedido.id)}
                                      >
                                        <td className="px-4 py-3 text-sm text-slate-700">{pedido.id}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                          {pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString("es-PE") : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{pedido.estadoGeneral || "-"}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">S/ {formatMoney(pedido.montoTotal ?? 0)}</td>
                                        <td className="px-4 py-3 text-sm" onClick={(e: any) => e.stopPropagation()}>
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            iconLeft={<Eye className="w-4 h-4" />}
                                            onClick={(e: any) => {
                                              e.stopPropagation()
                                              setPedidoExpandido(pedidoExpandido === pedido.id ? null : pedido.id)
                                            }}
                                          >
                                            {pedidoExpandido === pedido.id ? "Ocultar" : "Ver"} Detalles
                                          </Button>
                                        </td>
                                      </tr>
                                      {pedidoExpandido === pedido.id && (
                                        <tr>
                                          <td colSpan={5} className="px-4 py-6 bg-green-50/50">
                                            <div className="space-y-4">
                                              <h4 className="text-md font-semibold text-slate-900 mb-4">Detalles Completos del Pedido #{pedido.id}</h4>
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {mockDatabase.columnasPedidos.map((columna: any) => {
                                                  const valor = obtenerValorColumna(columna, pedido)
                                                  if (valor === "-" || valor === null || valor === undefined || valor === "") return null

                                                  return (
                                                    <div key={columna.id} className="bg-white rounded-lg p-3 border border-slate-200">
                                                      <div className="text-xs font-semibold text-slate-500 uppercase mb-1">{columna.nombre}</div>
                                                      <div className="text-sm text-slate-900">{valor}</div>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Componente: LeadsTab
function LeadsTab() {
  const { isMasterAdmin } = useAuth()
  const [leads, setLeads] = useState<any[]>([])
  const [filtros, setFiltros] = useState({
    etapa: "",
    vendedor: "",
    fechaDesde: "",
    fechaHasta: "",
  })

  useEffect(() => {
    const unsubscribe = mockFirestore.collection("leads").onSnapshot((snapshot: any) => {
      const leadsData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      setLeads(leadsData)
    })
    return () => unsubscribe()
  }, [])

  const leadsFiltrados = useMemo(() => {
    return leads.filter((lead: any) => {
      if (filtros.etapa && lead.etapaVenta !== filtros.etapa) return false
      if (filtros.vendedor && lead.vendedorAsignado !== filtros.vendedor) return false
      return true
    })
  }, [leads, filtros])

  const resumen = useMemo(() => {
    const porEtapa: any = {}
    leadsFiltrados.forEach((lead: any) => {
      const etapa = lead.etapaVenta || "Sin etapa"
      porEtapa[etapa] = (porEtapa[etapa] || 0) + 1
    })
    return {
      totalLeads: leadsFiltrados.length,
      porEtapa,
    }
  }, [leadsFiltrados])

  const handleConvertirACliente = async (leadId: any) => {
    const lead = leads.find((l: any) => l.id === leadId)
    if (!lead) return

    const confirmar = confirm(`¿Convertir este lead a cliente?`)
    if (!confirmar) return

    try {
      // Crear cliente desde lead
      const nuevoCliente = {
        ...lead,
        esCliente: true,
        etapaVenta: null,
        pedidosIds: [],
        totalPedidos: 0,
        totalGastado: 0,
        primerPedido: new Date(),
        updatedAt: new Date(),
      }
      await mockFirestore.collection("clientes").add(nuevoCliente)
      await mockFirestore.doc("leads", leadId).delete()
      alert(" Lead convertido a cliente exitosamente")
    } catch (error: any) {
      alert("Error al convertir lead: " + error.message)
    }
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">DATOS - Leads</h2>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-box rounded-2xl p-6">
          <div className="text-sm text-slate-600 mb-1">Total Leads</div>
          <div className="text-3xl font-bold text-slate-900">{resumen.totalLeads}</div>
        </div>
        {Object.entries(resumen.porEtapa).map(([etapa, cantidad]: [string, any]) => (
          <div key={etapa} className="glass-box rounded-2xl p-6">
            <div className="text-sm text-slate-600 mb-1">{etapa}</div>
            <div className="text-3xl font-bold text-slate-900">{cantidad}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="glass-box rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filtros.etapa}
            onChange={(e: any) => setFiltros((prev: any) => ({ ...prev, etapa: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">Todas las etapas</option>
            <option value="interesado">Interesado</option>
            <option value="cotizacion">Cotización</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="abandonado">Abandonado</option>
          </select>
          <input
            type="text"
            placeholder="Buscar por vendedor..."
            value={filtros.vendedor}
            onChange={(e: any) => setFiltros((prev: any) => ({ ...prev, vendedor: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e: any) => setFiltros((prev: any) => ({ ...prev, fechaDesde: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e: any) => setFiltros((prev: any) => ({ ...prev, fechaHasta: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-box rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Contacto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Etapa</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Vendedor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Fecha Contacto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {leadsFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No hay leads registrados
                </td>
              </tr>
            ) : (
              leadsFiltrados.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-700">{lead.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {lead.clienteNombre} {lead.clienteApellidos}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{lead.clienteContacto || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {lead.etapaVenta || "Sin etapa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{lead.vendedorAsignado || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {lead.fechaContacto ? new Date(lead.fechaContacto).toLocaleDateString("es-PE") : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => handleConvertirACliente(lead.id)} iconLeft={<UserPlus className="w-4 h-4" />}>
                        Convertir
                      </Button>
                      <Button variant="secondary" size="sm" iconLeft={<Edit className="w-4 h-4" />}>
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" iconLeft={<Trash2 className="w-4 h-4" />}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Componente: ProductosTab - Gestión de productos creados por el dueño
function ProductosTab() {
  const { isOwner } = useAuth()
  const [productos, setProductos] = useState<any[]>([])
  const [filtros, setFiltros] = useState({
    nombre: "",
    categoria: "",
    tipo: "",
  })
  const [showModal, setShowModal] = useState(false)
  const [productoEditando, setProductoEditando] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = mockFirestore.collection("productos").onSnapshot((snapshot: any) => {
      const productosData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      setProductos(productosData)
    })
    return () => unsubscribe()
  }, [])

  const productosFiltrados = useMemo(() => {
    return productos.filter((producto: any) => {
      if (filtros.nombre && !producto.nombre?.toLowerCase().includes(filtros.nombre.toLowerCase())) return false
      if (filtros.categoria && producto.categoria !== filtros.categoria) return false
      if (filtros.tipo && producto.tipo !== filtros.tipo) return false
      return true
    })
  }, [productos, filtros])

  const categoriasUnicas = useMemo(() => {
    const cats = new Set(productos.map((p: any) => p.categoria).filter(Boolean))
    return Array.from(cats).sort()
  }, [productos])

  const handleCrearProducto = () => {
    setProductoEditando(null)
    setShowModal(true)
  }

  const handleEditarProducto = (producto: any) => {
    setProductoEditando(producto)
    setShowModal(true)
  }

  const handleDuplicarProducto = async (producto: any) => {
    try {
      const nuevoProducto = {
        ...producto,
        id: crypto.randomUUID(),
        nombre: `${producto.nombre} (Copia)`,
        fechaCreacion: new Date(),
        fechaModificacion: new Date(),
      }
      delete nuevoProducto.id
      await mockFirestore.collection("productos").add(nuevoProducto)
      alert(" Producto duplicado exitosamente")
    } catch (error: any) {
      alert("Error al duplicar producto: " + error.message)
    }
  }

  const handleToggleActivo = async (producto: any) => {
    try {
      await mockFirestore.doc("productos", producto.id).update({
        activo: !producto.activo,
        fechaModificacion: new Date(),
      })
    } catch (error: any) {
      alert("Error al actualizar producto: " + error.message)
    }
  }

  const precioActivo = (producto: any) => {
    const precio = producto.precios?.find((p: any) => p.activo)
    return precio ? precio.valor : 0
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">DATOS - Productos</h2>
        {isOwner() && (
          <Button variant="primary" onClick={handleCrearProducto} iconLeft={<Plus className="w-4 h-4" />}>
            Crear Producto
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="glass-box rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filtros.nombre}
            onChange={(e: any) => setFiltros((prev: any) => ({ ...prev, nombre: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <select
            value={filtros.categoria}
            onChange={(e: any) => setFiltros((prev: any) => ({ ...prev, categoria: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">Todas las categorías</option>
            {categoriasUnicas.map((cat: any) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={filtros.tipo}
            onChange={(e: any) => setFiltros((prev: any) => ({ ...prev, tipo: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">Todos los tipos</option>
            <option value="simple">Simple</option>
            <option value="compuesto">Compuesto</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-box rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Categoría</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Costo Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Precio Activo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No hay productos registrados
                </td>
              </tr>
            ) : (
              productosFiltrados.map((producto: any) => (
                <tr key={producto.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{producto.nombre || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${producto.tipo === "compuesto"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                      }`}>
                      {producto.tipo === "compuesto" ? (
                        <>
                          <PackageSearch className="w-3 h-3 inline mr-1" />
                          Compuesto
                        </>
                      ) : (
                        <>
                          <Package className="w-3 h-3 inline mr-1" />
                          Simple
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{producto.categoria || "-"}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    S/ {formatMoney(producto.costoTotal)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-700">
                    S/ {formatMoney(precioActivo(producto))}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${producto.activo
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                      }`}>
                      {producto.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      {isOwner() && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditarProducto(producto)}
                            iconLeft={<Edit className="w-4 h-4" />}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDuplicarProducto(producto)}
                            iconLeft={<Copy className="w-4 h-4" />}
                          >
                            Duplicar
                          </Button>
                          <Button
                            variant={producto.activo ? "dangerSoft" : "successSoft"}
                            size="sm"
                            onClick={() => handleToggleActivo(producto)}
                          >
                            {producto.activo ? "Desactivar" : "Activar"}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Producto */}
      {showModal && (
        <ProductoFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setProductoEditando(null)
          }}
          producto={productoEditando}
        />
      )}
    </div>
  )
}