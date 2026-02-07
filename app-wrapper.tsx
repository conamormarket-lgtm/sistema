"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import {
  MATRIZ_COMPOSICION,
  MAPEO_DESGLOSE_PRODUCTOS,
  mockDatabase,
  inicializarColumnasPorDefecto,
  recalcularCostosProductosPorInventario,
  calcularTiempos,
  serverTimestamp,
  increment,
  mockFirestore,
  formatMoney
} from '@/lib/mock-firebase'
import {
  despacharItem,
  validarColorEnTexto,
  calcularSaldoPedido,
  verificarStock,
  verificarStockConDetalle,
  evaluarCondicion,
  evaluarCondiciones,
  evaluarCondicionesEntrada,
  reducirStockDeInventario,
  buscarItemEnInventario,
  calcularCostoProducto,
  sincronizarCostoProductoInventario,
  obtenerValorCampo,
  evaluarFormula,
  formatearValor,
  obtenerValorColumna,
  normalizarTexto,
  agruparCamposPorCategoria,
  mapearEncabezadosACampos,
  normalizarEstadoGeneral,
  parseMontoRobust,
  parseFechaRobust,
  convertirValorSegunTipo,
  establecerValorAnidado,
  asegurarEstructurasAnidadas,
  crearEstructuraPedidoCompleto,
  validarPedidoImportado
} from './lib/business-logic'

import { RepartoTab } from "@/components/tabs/reparto-tab"
import { FinalizadosTab } from "@/components/tabs/finalizados-tab"
import { RegistrarPedidoModal } from "@/components/modals/registrar-pedido-modal"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { LoginPage } from "@/components/login-page"
import {
  SPECIAL_PERMISSIONS,
  OWNER_EMAIL,
  TIPOS_CONDICIONES,
  COLOR_PALETTE,
  peruGeoData,
  productLines,
  salesChannels,
  productOptions,
  garmentDetails,
  shippingAgencies,
  disenadores,
  repartidores,
  tiposDocumento,
  activadores,
  vendedores,
  horarios,
  regalosList,
  initialTiposDePrendaInventario,
  initialColoresInventario,
  initialTallasInventario,
  motivosAjusteStock,
} from "@/lib/constants"

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
// XLSX se importará dinámicamente cuando sea necesario
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PedidosTab } from "@/components/tabs/pedidos-tab"
import { VentasTab } from "@/components/tabs/ventas-tab"
import { DiseñoTab } from "@/components/tabs/diseno-tab"
import { CobranzaTab } from "@/components/tabs/cobranza-tab"
import { PreparacionTab } from "@/components/tabs/preparacion-tab"
import { EstampadoTab } from "@/components/tabs/estampado-tab"
import { GestionColumnasTab } from "@/components/tabs/gestion-columnas-tab"
import { EmpaquetadoTab } from "@/components/tabs/empaquetado-tab"
import { BaseDatosMatrix } from "@/components/tabs/base-datos-matrix"
import { InventariosMatrix, GestionInventariosTab, INVENTARIOS_TABS_HEADER } from "@/components/tabs/inventarios-matrix"
import { ConfiguracionMatrix } from "@/components/config/configuracion-matrix"
import {
  GestionFlujosTab,
  FlujoMatrix,
  DynamicFlujoMatrix,
  ConfeccionMatrix,
} from "@/components/matrices/flujo-confeccion-matrix"
import { EditableCell } from "@/components/ui/editable-cell"
import { Modal, ConfirmationModal } from "@/components/ui/modal"
import { ConfigColumnasEtapaModal } from "@/components/modals/config-columnas-etapa-modal"
import {
  IconSelector,
  ColorSelector,
  SortableEtapaItem,
  EtapasDragDropList,
  CondicionFormModal,
  CondicionesList,
  EtapaFormModal,
  FlujoFormModal,
} from "@/components/modals/flow-components"
import { ProductoFormModal } from "@/components/modals/producto-form-modal"
import { UserFormModal } from "@/components/modals/user-form-modal"
import { handleGuardarCampo } from "@/lib/actions"
import { loadInventarioConfig } from "@/lib/inventario-config-persistence"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertTriangle,
  Box,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  XCircle,
  DollarSign,
  Printer,
  Palette,
  Tag,
  ImageIcon,
  CreditCard,
  Percent,
  CalendarIcon,
  ListOrdered,
  Shirt,
  Archive,
  PackageSearch,
  Wrench,
  ArchiveRestore,
  MinusCircle,
  SlidersHorizontal,
  History,
  Home,
  Settings,
  CheckCircle2,
  Upload,
  Package,
  Edit,
  Copy,
  Eye,
  Plus,
  X,
  FileImage,
  Menu,
  MoreVertical,
  User,
  LogOut,
  UserPlus,
  Database,
  FileSpreadsheet,
  BarChart3,
  Download,
  Scissors,
  Sparkles,
  FileText,
  GripVertical,
  Pencil,
  Trash,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Move,
  RefreshCw,
  Video,
  Megaphone,
  Lightbulb,
  Rocket,
  Beaker,
  TrendingUp,
} from "lucide-react"

// Helper auxiliar para formateo estricto de dinero con comas


const ROLES_TABS = {
  ventas: { name: "Ventas", icon: <ShoppingCart className="w-4 h-4 mr-2" /> },
  diseño: { name: "Diseño", icon: <Palette className="w-4 h-4 mr-2" /> },
  cobranza: { name: "Cobranza", icon: <DollarSign className="w-4 h-4 mr-2" /> },
  pre_estampado: { name: "Preparación", icon: <Printer className="w-4 h-4 mr-2" /> },
  estampado: { name: "Estampado", icon: <Tag className="w-4 h-4 mr-2" /> },
  empaquetado: { name: "Empaquetado", icon: <Box className="w-4 h-4 mr-2" /> },
  reparto: { name: "Reparto", icon: <Truck className="w-4 h-4 mr-2" /> },
  finalizados: { name: "Finalizados", icon: <CheckCircle2 className="w-4 h-4 mr-2" /> },
}

const CONFECCION_TABS = {
  corte: { name: "Corte", icon: <Scissors className="w-4 h-4 mr-2" /> },
  confeccion: { name: "Confección", icon: <Shirt className="w-4 h-4 mr-2" /> },
  limpieza: { name: "Limpieza", icon: <Sparkles className="w-4 h-4 mr-2" /> },
  registro: { name: "Registro", icon: <FileText className="w-4 h-4 mr-2" /> },
}

// Definición de permisos disponibles por módulo
const AVAILABLE_MODULES = {
  ventas: {
    name: "Ventas",
    actions: ["ver", "crear", "editar", "eliminar", "anular", "exportar", "ver-todos"],
  },
  diseño: {
    name: "Diseño",
    actions: ["ver", "asignar", "subir-archivos", "marcar-completado", "editar-notas", "ver-todos"],
  },
  cobranza: {
    name: "Cobranza",
    actions: ["ver", "validar-pago", "editar-montos", "subir-comprobantes", "marcar-validado", "ver-todos"],
  },
  inventarios: {
    name: "Inventarios",
    actions: ["ver", "agregar", "editar", "eliminar", "ajustar-stock", "ver-movimientos"],
  },
  preparacion: {
    name: "Preparación",
    actions: ["ver", "asignar", "marcar-completado", "ver-todos"],
  },
  estampado: {
    name: "Estampado",
    actions: ["ver", "asignar", "marcar-completado", "ver-todos"],
  },
  empaquetado: {
    name: "Empaquetado",
    actions: ["ver", "asignar", "marcar-completado", "ver-todos"],
  },
  reparto: {
    name: "Reparto",
    actions: ["ver", "asignar", "marcar-completado", "ver-todos"],
  },
  finalizados: {
    name: "Finalizados",
    actions: ["ver", "ver-todos"],
  },
}



// Degradado por etapa: tonalidades pastel suaves, dirección distinta para cada una (facilita animar transiciones)
function getStageBackground(stageId: string | null): { background: string; backgroundSize: string } {
  // Pasteles muy suaves por etapa (solo tintes claros, sin tonos encendidos)
  const gradients: Record<string, string> = {
    ventas: 'linear-gradient(135deg, #f8fbfe 0%, #f0f6fd 35%, #fafbfc 50%, #f2f5fd 65%, #f8fbfe 100%)',
    diseño: 'linear-gradient(45deg, #fef8f9 0%, #fcf2f4 35%, #fdf9fb 50%, #fbf4f7 65%, #fef8f9 100%)',
    cobranza: 'linear-gradient(225deg, #f6fcf8 0%, #eef9f3 35%, #fafbfc 50%, #f0f9f4 65%, #f6fcf8 100%)',
    pre_estampado: 'linear-gradient(315deg, #faf8fa 0%, #f5f0f5 35%, #fafbfc 50%, #f4eef3 65%, #faf8fa 100%)',
    estampado: 'linear-gradient(160deg, #f8f7fc 0%, #f2f0fa 35%, #faf9fc 50%, #f3effa 65%, #f8f7fc 100%)',
    empaquetado: 'linear-gradient(70deg, #f6fcfb 0%, #eef9f7 35%, #fafbfc 50%, #eef8f6 65%, #f6fcfb 100%)',
    reparto: 'linear-gradient(250deg, #fefcf8 0%, #fcf8f0 35%, #fdfcf9 50%, #faf6ec 65%, #fefcf8 100%)',
    finalizados: 'linear-gradient(20deg, #f9fdf6 0%, #f2fceb 35%, #fafbf9 50%, #f0fae8 65%, #f9fdf6 100%)',
  }
  const defaultBg = 'linear-gradient(135deg, #f8f9fb 0%, #f2f4f6 35%, #fafbfc 50%, #f4f5f9 65%, #f8f9fb 100%)'
  const background = (stageId && gradients[stageId]) ? gradients[stageId] : defaultBg
  return { background, backgroundSize: '100% 100%' }
}

function App() {
  const auth = useAuth()
  const { currentUser, userData, isAdmin, isMasterAdmin, isOwner } = auth || {}
  const [activeMatrix, setActiveMatrix] = useState("inicio")
  const [flujoSeleccionado, setFlujoSeleccionado] = useState("pedidos")
  const [flujoSeleccionadoId, setFlujoSeleccionadoId] = useState<any>("flujo-pedidos") // ID del flujo seleccionado; por defecto Flujo de Pedidos
  const [mostrarGestionFlujos, setMostrarGestionFlujos] = useState(false)
  const [pedidos, setPedidos] = useState<any[]>([])
  const [flujosDisponibles, setFlujosDisponibles] = useState<any[]>([]) // Todos los flujos activos
  const [flowStageForBackground, setFlowStageForBackground] = useState<string>("diseño")
  const [mostrarGestionInventarios, setMostrarGestionInventarios] = useState(false)
  const [inventarioSeleccionado, setInventarioSeleccionado] = useState<string>("prendas")
  const [inventarioTab, setInventarioTab] = useState<string>("movimientos")

  // Asegurar que las columnas se inicialicen
  useEffect(() => {
    loadInventarioConfig(mockDatabase)
  }, [])

  useEffect(() => {
    try {
      if (mockDatabase.columnasPedidos.length === 0) {
        inicializarColumnasPorDefecto()
      }
    } catch (error: any) {
      console.error("Error al inicializar columnas:", error)
    }
  }, [])

  // Obtener todos los pedidos para calcular totales
  useEffect(() => {
    const unsubscribe = mockFirestore.collection("pedidos").onSnapshot((snapshot: any) => {
      const pedidosData = snapshot.docs.map((doc: any) => {
        const d = doc.data()
        asegurarEstructurasAnidadas(d)
        return { id: doc.id, ...d }
      })
      setPedidos(pedidosData)
    })
    return () => unsubscribe()
  }, [])

  // Función de prueba: Crear un pedido de ejemplo para verificar el flujo completo
  const crearPedidoPrueba = async () => {
    try {
      const pedidoPrueba = {
        // Datos del Cliente
        clienteNombre: "Juan",
        clienteApellidos: "Pérez García",
        clienteContacto: "987654321",
        clienteContactoSecundario: "",
        clienteCorreo: "juan.perez@example.com",
        clienteTipoDocumento: "DNI",
        clienteNumeroDocumento: "12345678",
        clienteDepartamento: "Lima",
        clienteProvincia: "Lima",
        clienteDistritoReal: "San Isidro",
        // Detalles del Pedido
        canalVenta: "WhatsApp",
        activador: "Facebook",
        lineaProducto: "Poleras",
        whatsappOrigen: "WhatsApp Principal",
        vendedor: "María González",
        productos: [
          {
            id: crypto.randomUUID(),
            productoId: "PROD001",
            cantidad: 2,
            imagenReferencial: null,
          },
        ],
        regalos: [],
        talla: "M",
        esPersonalizado: true,
        // Detalles de Entrega y Envío
        usarDatosClienteParaEnvio: true,
        envioNombres: "Juan",
        envioApellidos: "Pérez García",
        envioContacto: "987654321",
        envioContactoSecundario: "",
        envioNombreCliente: "Juan Pérez García",
        envioTipoDocumento: "DNI",
        envioNumeroDocumento: "12345678",
        envioDepartamento: "Lima",
        envioProvincia: "Lima",
        envioDistrito: "San Isidro",
        envioDireccionLima: "Av. Principal 123",
        agenciaEnvio: "Olva Courier",
        fechaEnvio: null,
        // Detalles de Pago
        montoAdelanto: 50.00,
        montoTotal: 150.00,
        montoPendiente: 100.00,
        montoMostacero: 0,
        observacion: "Pedido de prueba creado automáticamente",
        esMostacero: false,
        esPrioridad: false,
        comprobantesPago: [],
        // Comentarios
        comentarios: [],
        // Estado principal - INICIA EN DISEÑO
        status: "diseño",
        estadoGeneral: "En Diseño",
        // Tracking por etapa - Diseño (inicializado)
        diseño: {
          fechaEntrada: new Date(),
          fechaSalida: null,
          diseñadorAsignado: null,
          diseñadorNombre: null,
          estado: "",
          urlImagen: "",
        },
        // Tracking por etapa - Cobranza
        cobranza: {
          fechaEntrada: null,
          fechaSalida: null,
          estado: "",
          pago1: 0,
          pago2: 0,
          accion: "",
        },
        // Tracking por etapa - Preparación
        preparacion: {
          fechaEntrada: null,
          fechaSalida: null,
          operador: null,
          operadorNombre: null,
          estado: "",
        },
        // Tracking por etapa - Estampado
        estampado: {
          fechaEntrada: null,
          fechaSalida: null,
          operador: null,
          operadorNombre: null,
          estado: "",
        },
        // Tracking por etapa - Empaquetado
        empaquetado: {
          fechaEntrada: null,
          fechaSalida: null,
          operador: null,
          operadorNombre: null,
          estado: "",
        },
        // Tracking por etapa - Reparto
        reparto: {
          fechaEntrada: null,
          fechaSalida: null,
          fechaFinalizado: null,
          repartidor: null,
          repartidorNombre: null,
          estado: "",
        },
        // Tiempos calculados
        tiempos: {
          diseño: null,
          cobranza: null,
          preparacion: null,
          estampado: null,
          empaquetado: null,
          reparto: null,
          total: null,
        },
        // Campos adicionales
        linkWhatsapp: "",
        anadidos: "",
        // Metadatos
        createdAt: new Date(),
        userId: "system",
        historialModificaciones: [
          {
            timestamp: new Date(),
            usuarioId: "system",
            usuarioEmail: "system",
            accion: "Pedido Creado",
            detalle: "Pedido de prueba creado automáticamente para verificar el flujo",
          },
        ],
      }

      await mockFirestore.collection("pedidos").add(pedidoPrueba)
      console.log(" Pedido de prueba creado exitosamente")
      alert(" Pedido de prueba creado exitosamente. Debe aparecer en:\n- DATOS  Pedidos (Hoja Maestra)\n- FLUJOS  Flujo de Pedidos  Diseño")
    } catch (error: any) {
      console.error(" Error al crear pedido de prueba:", error)
      alert(" Error al crear pedido de prueba: " + error.message)
    }
  }

  // Ejecutar prueba solo una vez al cargar (comentado por defecto, descomentar para probar)
  // useEffect(() => {
  //   crearPedidoPrueba()
  // }, [])

  // Obtener todos los flujos activos
  useEffect(() => {
    const unsubscribe = mockFirestore.collection("flujos").onSnapshot((snapshot: any) => {
      const flujosData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
      const flujosActivos = flujosData.filter((f: any) => f.activo !== false).sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
      setFlujosDisponibles(flujosActivos)

      // Si no hay flujo seleccionado o el flujo seleccionado ya no existe, seleccionar el primero
      if (!flujoSeleccionadoId || !flujosActivos.find((f: any) => f.id === flujoSeleccionadoId)) {
        if (flujosActivos.length > 0) {
          // Intentar mantener compatibilidad con flujos antiguos
          const flujoPedidos = flujosActivos.find((f: any) => f.id === "flujo-pedidos" || f.nombre.toLowerCase().includes("pedidos"))
          if (flujoPedidos && flujoSeleccionado === "pedidos") {
            setFlujoSeleccionadoId(flujoPedidos.id)
          } else {
            const flujoConfeccion = flujosActivos.find((f: any) => f.id === "flujo-confeccion" || f.nombre.toLowerCase().includes("confección"))
            if (flujoConfeccion && flujoSeleccionado === "confeccion") {
              setFlujoSeleccionadoId(flujoConfeccion.id)
            } else if (flujosActivos.length > 0) {
              setFlujoSeleccionadoId(flujosActivos[0].id)
            }
          }
        }
      }
    })
    return () => unsubscribe()
  }, [flujoSeleccionado, flujoSeleccionadoId])

  // Calcular totales por etapa para Flujo de Pedidos
  const totalesPorEtapaPedidos = useMemo(() => {
    const calcularSaldo = (pedido: any) => {
      const montoTotal = pedido.montoTotal || 0
      const adelanto = pedido.montoAdelanto || 0
      const pago1 = pedido.cobranza?.pago1 || 0
      const pago2 = pedido.cobranza?.pago2 || 0
      return montoTotal - adelanto - pago1 - pago2
    }

    const diasVentas = mockDatabase.configuracion?.ventasTemporalDias ?? 7
    const fechaLimiteVentas = new Date()
    fechaLimiteVentas.setDate(fechaLimiteVentas.getDate() - diasVentas)
    const ventasCount = pedidos.filter((p: any) => {
      const created = parseFechaRobust(p.createdAt)
      return created && created >= fechaLimiteVentas
    }).length

    return {
      ventas: ventasCount,
      diseño: pedidos.filter((p: any) => p.estadoGeneral === "En Diseño").length,
      cobranza: pedidos.filter((p: any) => {
        if (p.estadoGeneral !== "En Cobranza") return false
        const saldo = calcularSaldo(p)
        return saldo > 0
      }).length,
      preparacion: pedidos.filter((p: any) => p.estadoGeneral === "Listo para Preparar").length,
      estampado: pedidos.filter((p: any) => p.estadoGeneral === "En Estampado").length,
      empaquetado: pedidos.filter((p: any) => p.estadoGeneral === "En Empaquetado").length,
      reparto: pedidos.filter((p: any) => p.estadoGeneral === "En Reparto").length,
      finalizados: pedidos.filter((p: any) => p.estadoGeneral === "Finalizado").length,
    }
  }, [pedidos])

  // Calcular totales por etapa para Flujo de Confección
  // Por ahora, estos serán placeholders hasta que se implemente la lógica de confección
  const totalesPorEtapaConfeccion = useMemo(() => {
    // TODO: Implementar lógica para obtener pedidos/items en flujo de confección
    // Por ahora retornamos valores de ejemplo
    return {
      corte: 0,
      confeccion: 0,
      limpieza: 0,
      registro: 0,
    }
  }, [pedidos])

  // Seleccionar los totales según el flujo seleccionado
  const totalesPorEtapa = useMemo(() => {
    let totales
    if (flujoSeleccionado === "pedidos") {
      totales = totalesPorEtapaPedidos
    } else if (flujoSeleccionado === "confeccion") {
      totales = totalesPorEtapaConfeccion
    } else {
      // Para flujos dinámicos, usar totales de pedidos como fallback
      totales = totalesPorEtapaPedidos
    }

    // Asegurar que todos los valores sean numéricos
    const t = totales as any
    return {
      ventas: t?.ventas || 0,
      diseño: t?.diseño || 0,
      cobranza: t?.cobranza || 0,
      preparacion: t?.preparacion || 0,
      estampado: t?.estampado || 0,
      empaquetado: t?.empaquetado || 0,
      reparto: t?.reparto || 0,
      finalizados: t?.finalizados || 0,
      corte: t?.corte || 0,
      confeccion: t?.confeccion || 0,
      limpieza: t?.limpieza || 0,
      registro: t?.registro || 0,
    }
  }, [flujoSeleccionado, totalesPorEtapaPedidos, totalesPorEtapaConfeccion])

  // Ocultar el indicador de desarrollo de Next.js
  useEffect(() => {
    const hideDevIndicator = () => {
      // Buscar y ocultar todos los posibles selectores
      const selectors = [
        '[data-nextjs-dev-indicator]',
        '[data-nextjs-toast]',
        '#__next-dev-indicator',
        '#__next-build-indicator',
        'div[style*="position: fixed"]',
      ]

      selectors.forEach((selector: any) => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach((el: any) => {
            if (el) {
              const style = window.getComputedStyle(el)
              const bottom = style.bottom
              const left = style.left

              // Si está en la esquina inferior izquierda
              if ((bottom === '16px' || bottom === '0px' || bottom.includes('16')) &&
                (left === '16px' || left === '0px' || left.includes('16'))) {
                el.style.display = 'none'
                el.style.visibility = 'hidden'
                el.style.opacity = '0'
                el.style.pointerEvents = 'none'
                el.remove()
              }
            }
          })
        } catch (e: any) {
          // Ignorar errores
        }
      })
    }

    // Ejecutar inmediatamente
    hideDevIndicator()

    // Ejecutar después de un delay
    setTimeout(hideDevIndicator, 100)
    setTimeout(hideDevIndicator, 500)
    setTimeout(hideDevIndicator, 1000)

    // Observar cambios en el DOM solo si body existe (evita TypeError en hidratación/SSR)
    let observer: MutationObserver | null = null
    if (typeof document !== 'undefined' && document.body) {
      try {
        observer = new MutationObserver(hideDevIndicator)
        observer.observe(document.body, { childList: true, subtree: true })
      } catch (_) {}
    }
    return () => observer?.disconnect()
  }, [])

  const renderMatrix = () => {
    if (activeMatrix === "flujo") {
      if (mostrarGestionFlujos) {
        return <GestionFlujosTab />
      }
      // Obtener el flujo seleccionado
      const flujoActual = flujosDisponibles.find((f: any) => f.id === flujoSeleccionadoId)

      // Compatibilidad con flujos antiguos: siempre mostrar Flujo de Pedidos por defecto
      const totales = totalesPorEtapa || {}
      if (flujoSeleccionado === "pedidos" || (flujoActual && (flujoActual.id === "flujo-pedidos" || (flujoActual.nombre && flujoActual.nombre.toLowerCase().includes("pedidos"))))) {
        return <FlujoMatrix totalesPorEtapa={totales} onStageChange={setFlowStageForBackground} />
      }
      if (flujoSeleccionado === "confeccion" || (flujoActual && (flujoActual.id === "flujo-confeccion" || (flujoActual.nombre && flujoActual.nombre.toLowerCase().includes("confección"))))) {
        return <ConfeccionMatrix totalesPorEtapa={totales} />
      }
      if (flujoActual && flujoSeleccionadoId) {
        return <DynamicFlujoMatrix flujoId={flujoSeleccionadoId} />
      }
      return <FlujoMatrix totalesPorEtapa={totales} onStageChange={setFlowStageForBackground} />
    }

    switch (activeMatrix) {
      case "inicio":
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
                <div className="flex items-center justify-center mb-4">
                  <Settings className="w-12 h-12 text-yellow-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-yellow-800 mb-2">En Desarrollo</h2>
                <p className="text-yellow-700">Esta sección está en desarrollo y estará disponible pronto.</p>
              </div>
            </div>
          </div>
        )
      case "inventarios":
        if (mostrarGestionInventarios) return <GestionInventariosTab />
        return (
          <InventariosMatrix
            inventarioSeleccionado={inventarioSeleccionado}
            onInventarioTabChange={setInventarioTab}
            compactLayout={inventarioTab === "movimientos" || inventarioTab === "historial"}
          />
        )
      case "finanzas":
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
                <div className="flex items-center justify-center mb-4">
                  <Settings className="w-12 h-12 text-yellow-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-yellow-800 mb-2">En Desarrollo</h2>
                <p className="text-yellow-700">Esta sección está en desarrollo y estará disponible pronto.</p>
              </div>
            </div>
          </div>
        )
      case "base-datos":
        return <BaseDatosMatrix />
      case "configuracion":
        return <ConfiguracionMatrix />
      default:
        return <FlujoMatrix onStageChange={setFlowStageForBackground} />
    }
  }

  const stageBg = useMemo(
    () => getStageBackground(activeMatrix === "flujo" && !mostrarGestionFlujos ? flowStageForBackground : null),
    [activeMatrix, mostrarGestionFlujos, flowStageForBackground]
  )

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const sidebarIconsZoneRef = useRef<HTMLDivElement | null>(null)
  const sidebarRef = useRef<HTMLElement | null>(null)

  const inventariosBg =
    "linear-gradient(135deg, #f8fbfe 0%, #f0f6fd 35%, #fafbfc 50%, #f2f5fd 65%, #f8fbfe 100%)"

  const rootStyle = useMemo(
    () => ({
      backgroundImage: activeMatrix === "inventarios" ? inventariosBg : stageBg.background,
      backgroundSize: "100% 100%" as const,
      backgroundPosition: "0 0" as const,
      backgroundRepeat: "no-repeat" as const,
      backgroundAttachment: "fixed" as const,
    }),
    [activeMatrix, stageBg.background]
  )

  const asideStyleExpanded = useMemo(
    () => ({
      background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.15) 100%)',
      backdropFilter: 'blur(24px) saturate(200%)',
      WebkitBackdropFilter: 'blur(24px) saturate(200%)',
      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.3), 4px 0 32px -8px rgba(0,0,0,0.4), -2px 0 16px -4px rgba(255,255,255,0.1)',
    }),
    []
  )
  const asideStyleCollapsed = useMemo(
    () => ({
      background: 'transparent',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      boxShadow: 'none',
      borderRight: '1px solid rgba(255,255,255,0.08)',
    }),
    []
  )

  const sidebarEl = (
    <aside
      data-app-sidebar
      role={sidebarCollapsed ? "button" : undefined}
      tabIndex={sidebarCollapsed ? 0 : undefined}
      title={sidebarCollapsed ? "Pasa el mouse para expandir" : undefined}
      onClick={sidebarCollapsed ? () => setSidebarCollapsed(false) : undefined}
      onKeyDown={sidebarCollapsed ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSidebarCollapsed(false); } } : undefined}
      onMouseEnter={(e) => {
        if (!sidebarCollapsed) return
        const rect = e.currentTarget.getBoundingClientRect()
        const relX = e.clientX - rect.left
        const channelWidth = 20
        const inChannel = relX >= rect.width - channelWidth
        const iconsZoneEl = sidebarIconsZoneRef.current
        if (iconsZoneEl) {
          const zoneRect = iconsZoneEl.getBoundingClientRect()
          const inIconsZone = e.clientY >= zoneRect.top && e.clientY <= zoneRect.bottom
          if (inIconsZone && inChannel) return
        }
        setSidebarCollapsed(false)
      }}
      onMouseLeave={(e) => {
        const related = e.relatedTarget as Node | null
        if (related && sidebarRef.current?.contains(related)) return
        setSidebarCollapsed(true)
      }}
      ref={sidebarRef}
      className={`fixed left-0 top-0 h-full min-w-0 transition-[width] duration-300 flex flex-col border-r border-white/10 z-[9999] text-slate-700 overflow-x-hidden overflow-y-auto sidebar-no-h-scroll isolate ${
        sidebarCollapsed ? "w-20 cursor-pointer" : "w-64"
      }`}
      style={{ ...(!sidebarCollapsed ? asideStyleExpanded : asideStyleCollapsed), pointerEvents: 'auto' }}
    >
        {/* Logo y Header del Sidebar */}
        <div className={`p-6 border-b border-white/10 ${sidebarCollapsed ? "" : "backdrop-blur-sm"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200/40 backdrop-blur-md rounded-xl flex items-center justify-center border border-slate-300/50 flex-shrink-0 ring-1 ring-slate-300/30">
              <Box className="w-6 h-6 text-slate-700" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-slate-700 truncate">Sistema de Gestión</h1>
                <p className="text-xs text-slate-600 truncate">Control integral</p>
              </div>
            )}
          </div>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto py-4 px-3 space-y-1 sidebar-no-h-scroll relative z-10" style={{ pointerEvents: 'auto' }}>
          <div ref={sidebarIconsZoneRef} className="space-y-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActiveMatrix("inicio"); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeMatrix === "inicio"
              ? "bg-white/30 shadow-lg backdrop-blur-md border border-white/40 ring-1 ring-white/30"
              : "hover:bg-white/20 hover:backdrop-blur-sm border border-transparent hover:border-white/30"
              }`}
            style={activeMatrix === "inicio" ? { textShadow: '0 1px 3px rgba(0,0,0,0.3)' } : {}}
            title="INICIO"
          >
            <Home className="w-5 h-5 flex-shrink-0 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
            {!sidebarCollapsed && (
              <>
                <span className="font-medium flex-1 text-left" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>INICIO</span>
                {activeMatrix === "inicio" && <CheckCircle2 className="w-4 h-4 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActiveMatrix("flujo"); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeMatrix === "flujo"
              ? "bg-white/30 shadow-lg backdrop-blur-md border border-white/40 ring-1 ring-white/30"
              : "hover:bg-white/20 hover:backdrop-blur-sm border border-transparent hover:border-white/30"
              }`}
            style={activeMatrix === "flujo" ? { textShadow: '0 1px 3px rgba(0,0,0,0.3)' } : {}}
            title="FLUJOS"
          >
            <Box className="w-5 h-5 flex-shrink-0 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
            {!sidebarCollapsed && (
              <>
                <span className="font-medium flex-1 text-left uppercase" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>FLUJOS</span>
                {activeMatrix === "flujo" && <CheckCircle2 className="w-4 h-4 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActiveMatrix("base-datos"); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeMatrix === "base-datos"
              ? "bg-white/30 shadow-lg backdrop-blur-md border border-white/40 ring-1 ring-white/30"
              : "hover:bg-white/20 hover:backdrop-blur-sm border border-transparent hover:border-white/30"
              }`}
            style={activeMatrix === "base-datos" ? { textShadow: '0 1px 3px rgba(0,0,0,0.3)' } : {}}
            title="DATOS"
          >
            <Database className="w-5 h-5 flex-shrink-0 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
            {!sidebarCollapsed && (
              <>
                <span className="font-medium flex-1 text-left" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>DATOS</span>
                {activeMatrix === "base-datos" && <CheckCircle2 className="w-4 h-4 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActiveMatrix("inventarios"); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeMatrix === "inventarios"
              ? "bg-white/30 shadow-lg backdrop-blur-md border border-white/40 ring-1 ring-white/30"
              : "hover:bg-white/20 hover:backdrop-blur-sm border border-transparent hover:border-white/30"
              }`}
            style={activeMatrix === "inventarios" ? { textShadow: '0 1px 3px rgba(0,0,0,0.3)' } : {}}
            title="INVENTARIOS"
          >
            <Archive className="w-5 h-5 flex-shrink-0 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
            {!sidebarCollapsed && (
              <>
                <span className="font-medium flex-1 text-left" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>INVENTARIOS</span>
                {activeMatrix === "inventarios" && <CheckCircle2 className="w-4 h-4 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActiveMatrix("finanzas"); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeMatrix === "finanzas"
              ? "bg-white/30 shadow-lg backdrop-blur-md border border-white/40 ring-1 ring-white/30"
              : "hover:bg-white/20 hover:backdrop-blur-sm border border-transparent hover:border-white/30"
              }`}
            style={activeMatrix === "finanzas" ? { textShadow: '0 1px 3px rgba(0,0,0,0.3)' } : {}}
            title="FINANZAS"
          >
            <DollarSign className="w-5 h-5 flex-shrink-0 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
            {!sidebarCollapsed && (
              <>
                <span className="font-medium flex-1 text-left" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>FINANZAS</span>
                {activeMatrix === "finanzas" && <CheckCircle2 className="w-4 h-4 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
              </>
            )}
          </button>

          {isOwner() && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveMatrix("configuracion"); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group mt-4 border-t border-white/10 pt-4 backdrop-blur-sm ${activeMatrix === "configuracion"
                ? "bg-white/30 shadow-lg backdrop-blur-md border border-white/40 ring-1 ring-white/30"
                : "hover:bg-white/20 hover:backdrop-blur-sm border border-transparent hover:border-white/30"
                }`}
            style={activeMatrix === "configuracion" ? { textShadow: '0 1px 3px rgba(0,0,0,0.3)' } : {}}
              title="CONFIGURACIÓN"
            >
              <Settings className="w-5 h-5 flex-shrink-0 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium flex-1 text-left" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>CONFIGURACIÓN</span>
                  {activeMatrix === "configuracion" && <CheckCircle2 className="w-4 h-4 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
                </>
              )}
            </button>
          )}
          </div>
        </nav>

        {/* Footer del Sidebar - Usuario */}
        <div className={`p-4 border-t border-white/10 ${sidebarCollapsed ? "" : "backdrop-blur-sm"}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => { if (sidebarCollapsed) e.stopPropagation(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-200/40 hover:backdrop-blur-sm transition-all duration-200 group border border-transparent hover:border-slate-300/50"
              >
                <div className="w-8 h-8 bg-slate-200/40 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-300/50 ring-1 ring-slate-300/30">
                  <User className="w-4 h-4 text-slate-700" />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium truncate text-slate-700">{userData?.name || "Usuario"}</div>
                  <div className="text-xs text-slate-600 truncate">{userData?.email || "admin@sistema.com"}</div>
                  </div>
                )}
                {!sidebarCollapsed && <ChevronDown className="w-4 h-4 flex-shrink-0 drop-shadow-md" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-56 bg-white shadow-xl border border-slate-200 rounded-xl">
              <DropdownMenuItem className="px-3 py-2.5 cursor-default">
                <User className="w-4 h-4 text-slate-400 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900">{userData?.name || "Usuario"}</span>
                  <span className="text-xs text-slate-500">{userData?.email || "admin@sistema.com"}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (confirm("¿Deseas cerrar sesión?")) {
                    // logout()
                  }
                }}
                className="cursor-pointer px-3 py-2.5 flex items-center gap-3 hover:bg-red-50 focus:bg-red-50 transition-colors text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
  )

  return (
    <div
      className="flex h-screen font-sans antialiased overflow-hidden relative"
      style={rootStyle}
    >
      {typeof document !== "undefined" ? createPortal(sidebarEl, document.body) : sidebarEl}
      {/* Overlay: pantalla completa para el desenfoque (también durante la animación de expansión); capa clicable solo sobre contenido para colapsar */}
      {!sidebarCollapsed && (
        <>
          <div
            className="fixed inset-0 z-40 transition-opacity duration-300 pointer-events-none"
            style={{
              background: "rgba(0,0,0,0.2)",
              backdropFilter: "blur(12px) saturate(0.9)",
              WebkitBackdropFilter: "blur(12px) saturate(0.9)",
            }}
            aria-hidden
          />
          <div
            className="fixed top-0 right-0 bottom-0 left-64 z-40 cursor-pointer"
            onClick={() => setSidebarCollapsed(true)}
            aria-hidden
          />
        </>
      )}
      {/* Contenido Principal: z-index bajo para quedar siempre detrás del sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative pl-20 z-0" style={{ background: "transparent" }}>
        <main className={`flex-1 min-h-0 ${activeMatrix === "inventarios" && !mostrarGestionInventarios && (inventarioTab === "movimientos" || inventarioTab === "historial") ? "overflow-hidden" : "overflow-auto"}`} style={{ background: 'transparent' }}>
          <div className={`min-h-full flex flex-col ${activeMatrix === "inventarios" && !mostrarGestionInventarios && (inventarioTab === "movimientos" || inventarioTab === "historial") ? "max-h-full h-full" : ""}`} style={{ background: "transparent" }}>
            {/* Header Superior - dentro de la misma sección que el contenido */}
            <header className="bg-transparent px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  {activeMatrix === "flujo" ? (
                    <div className="flex items-center gap-4">
                      <DropdownMenu key={flujoSeleccionadoId || flujoSeleccionado}>
                        <DropdownMenuTrigger asChild>
                          <button className="text-xl font-bold text-slate-800 hover:text-slate-900 flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors">
                            {(() => {
                              if (mostrarGestionFlujos) return "Gestión de Flujos"
                              // Buscar el flujo actual por ID primero
                              if (flujoSeleccionadoId) {
                                const flujoActual = flujosDisponibles.find((f: any) => f.id === flujoSeleccionadoId)
                                if (flujoActual) return flujoActual.nombre
                              }
                              // Compatibilidad con flujos antiguos
                              if (flujoSeleccionado === "pedidos") return "Flujo de Pedidos"
                              if (flujoSeleccionado === "confeccion") return "Flujo de Confección"
                              // Si flujoSeleccionado es un ID de flujo nuevo
                              if (flujoSeleccionado && flujoSeleccionado.startsWith("flujo-")) {
                                const flujoPorId = flujosDisponibles.find((f: any) => f.id === flujoSeleccionado)
                                if (flujoPorId) return flujoPorId.nombre
                              }
                              return "Seleccionar Flujo"
                            })()}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          {isOwner && (
                            <DropdownMenuItem
                              onClick={(e: any) => {
                                e.preventDefault()
                                setMostrarGestionFlujos(true)
                                setFlujoSeleccionadoId(null)
                                // @ts-ignore
                                setFlujoSeleccionado("pedidos")
                              }}
                              className="cursor-pointer"
                            >
                              Gestión de Flujos
                            </DropdownMenuItem>
                          )}
                          {isOwner && <DropdownMenuSeparator />}
                          {flujosDisponibles.map((flujo: any) => {
                            const getIconComponent = (iconName: any) => {
                              const iconMap = {
                                ShoppingCart, Palette, DollarSign, Printer, Tag, Box, Truck, CheckCircle2,
                                Scissors, Shirt, Sparkles, FileText, User, Settings, Archive, PackageSearch,
                                Wrench, ArchiveRestore, History, Home, Database, FileSpreadsheet, BarChart3,
                                Download, Menu, MoreVertical, LogOut, Edit, UserPlus, Eye, Upload, X,
                                FileImage, AlertTriangle, PlusCircle, Save, Search, Trash2, XCircle, ImageIcon,
                                CreditCard, Percent, CalendarIcon, ListOrdered, MinusCircle, SlidersHorizontal,
                                ChevronDown, ChevronUp, GripVertical, Plus, Pencil, Trash, EyeOff, ArrowUp,
                                ArrowDown, Move
                              }
                              const IconComponent = (iconMap as any)[flujo.icono]
                              return IconComponent ? <IconComponent className="w-4 h-4" /> : <Box className="w-4 h-4" />
                            }
                            const IconComponent = getIconComponent(flujo.icono)
                            return (
                              <DropdownMenuItem
                                key={flujo.id}
                                onClick={(e: any) => {
                                  e.preventDefault()
                                  // Primero desactivar gestión de flujos
                                  setMostrarGestionFlujos(false)
                                  // Luego actualizar el flujo seleccionado
                                  setFlujoSeleccionadoId(flujo.id)
                                  // Mantener compatibilidad
                                  if (flujo.id === "flujo-pedidos" || flujo.nombre.toLowerCase().includes("pedidos")) {
                                    setFlujoSeleccionado("pedidos")
                                  } else if (flujo.id === "flujo-confeccion" || flujo.nombre.toLowerCase().includes("confección")) {
                                    setFlujoSeleccionado("confeccion")
                                  } else {
                                    setFlujoSeleccionado(flujo.id)
                                  }
                                }}
                                className="cursor-pointer flex items-center gap-2"
                              >
                                {IconComponent && <span style={{ color: flujo.color }}>{IconComponent}</span>}
                                {flujo.nombre}
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : activeMatrix === "inventarios" ? (
                    <DropdownMenu key={`inv-${inventarioSeleccionado}-${mostrarGestionInventarios}`}>
                      <DropdownMenuTrigger asChild>
                        <button className="text-xl font-bold text-slate-800 hover:text-slate-900 flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors">
                          {mostrarGestionInventarios ? "Gestión de Inventarios" : (INVENTARIOS_TABS_HEADER as Record<string, { name: string }>)[inventarioSeleccionado]?.name ?? "Prendas"}
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {isOwner?.() && (
                          <>
                            <DropdownMenuItem
                              onClick={(e: any) => {
                                e.preventDefault()
                                setMostrarGestionInventarios(true)
                              }}
                              className="cursor-pointer"
                            >
                              Gestión de Inventarios
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {Object.entries(INVENTARIOS_TABS_HEADER).map(([key, tab]: [string, any]) => (
                          <DropdownMenuItem
                            key={key}
                            onClick={(e: any) => {
                              e.preventDefault()
                              setMostrarGestionInventarios(false)
                              setInventarioSeleccionado(key)
                            }}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <span className="w-4 h-4">{tab.icon}</span>
                            {tab.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <h2 className="text-xl font-bold text-slate-800">
                      Sistema de Gestión
                    </h2>
                  )}
                  {/* Espacio para flexibilidad */}
                  <div className="flex-1"></div>
                </div>
              </div>
            </header>

            {/* Contenido de la matriz (etapas, Gestión de Diseño, etc.) */}
            {activeMatrix === "inventarios" && !mostrarGestionInventarios ? (
              <div
                className={`flex-1 min-h-0 flex flex-col ${inventarioTab === "movimientos" || inventarioTab === "historial" ? "overflow-hidden" : ""}`}
              >
                {renderMatrix()}
              </div>
            ) : (
              renderMatrix()
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// Mostrar login si no hay sesión, sino la app
function AuthGate() {
  const { currentUser } = useAuth()
  if (!currentUser) return <LoginPage />
  return (
    <div className="min-h-screen min-w-full" style={{ minHeight: '100vh', background: 'transparent' }}>
      <App />
    </div>
  )
}

// Envolver App con AuthProvider
const AppWrapper = () => {
  try {
    return (
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    )
  } catch (error: any) {
    console.error("Error en AppWrapper:", error)
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Error al cargar la aplicación</h1>
          <p className="text-red-600 mb-2">{error?.message || "Error desconocido"}</p>
          <p className="text-sm text-gray-600">Por favor, recarga la página o contacta al administrador.</p>
        </div>
      </div>
    )
  }
}

export default AppWrapper
