export interface Pedido {
    id: string
    numeroPedido?: string
    clienteNombre?: string
    clienteTelefono?: string
    clienteCorreo?: string
    fechaPedido?: string | Date
    items?: any[]
    montoTotal?: number
    montoPendiente?: number
    estadoGeneral?: string
    status?: string
    cobranza?: {
        fechaEntrada?: string | Date
        pago1?: number
        pago2?: number
        estado?: string
        [key: string]: any
    }
    [key: string]: any
}

export interface Producto {
    id: string
    nombre: string
    precio: number
    tipo?: string
    stock?: number
    [key: string]: any
}

export interface Cliente {
    id: string
    nombre: string
    telefono?: string
    email?: string
    [key: string]: any
}

export interface Usuario {
    id: string
    email: string
    nombre?: string
    role?: string
    permissions?: Permission[]
    specialPermissions?: string[]
    [key: string]: any
}

export interface Permission {
    module: string
    actions: string[]
}

export interface UserProfile {
    id: string
    name: string
    permissions: Permission[]
    specialPermissions?: string[]
}
