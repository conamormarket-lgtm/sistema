"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { mockDatabase, mockFirestore } from "@/lib/mock-firebase"
import { SPECIAL_PERMISSIONS, OWNER_EMAIL, AVAILABLE_MODULES, vendedores as vendedoresDefault } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { UserFormModal } from "@/components/modals/user-form-modal"
import { User, Settings, AlertTriangle, Edit, UserPlus, Eye, Trash2, Save, Plus, Tag, Box, SlidersHorizontal, Search, PlusCircle } from "lucide-react"

export function ConfiguracionMatrix() {
  const [activeMainTab, setActiveMainTab] = useState("usuarios-roles")

  const CONFIGURACION_TABS = {
    "usuarios-roles": {
      name: "Usuarios y Roles",
      icon: <User className="w-4 h-4" />,
    },
    "config-general": {
      name: "Configuración General",
      icon: <Settings className="w-4 h-4" />,
    },
  }

  const renderMainTabContent = () => {
    switch (activeMainTab) {
      case "usuarios-roles":
        return <UsuariosRolesTab />
      case "config-general":
        return <ConfigGeneralTab />
      default:
        return <UsuariosRolesTab />
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-50">
      <div className="border-b border-white/30 glass-box shadow-sm">
        <nav className="flex justify-center items-center px-6 py-0 overflow-x-auto" aria-label="Tabs de Configuración">
          <div className="flex space-x-1">
            {Object.entries(CONFIGURACION_TABS).map(([key, tab]: [string, any]) => (
              <button
                key={key}
                onClick={() => setActiveMainTab(key)}
                className={`${activeMainTab === key
                  ? "bg-blue-600 text-white border-blue-500 shadow-md"
                  : "bg-transparent text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 border-transparent"
                  } whitespace-nowrap py-3 px-6 border-b-2 font-medium text-sm inline-flex items-center gap-2 transition-all duration-200 rounded-t-lg`}
              >
                <span className="w-4 h-4">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </nav>
      </div>
      <div className="flex-grow overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/5 to-slate-50">{renderMainTabContent()}</div>
    </div>
  )
}

// Sub-pestaña: Configuración General
function ConfigGeneralTab() {
  const { isOwner } = useAuth()
  const [cobranzaNumAbonos, setCobranzaNumAbonos] = useState(mockDatabase.configuracion.cobranzaNumAbonos || 2)
  const [disenadores, setDisenadores] = useState<string[]>(
    Array.isArray(mockDatabase.configuracion?.disenadores) ? [...mockDatabase.configuracion.disenadores] : ["Mercedes", "Abraham", "Huguito"]
  )
  const [nuevoDisenador, setNuevoDisenador] = useState("")
  const [operarios, setOperarios] = useState<string[]>(
    Array.isArray(mockDatabase.configuracion?.operarios) ? [...mockDatabase.configuracion.operarios] : ["OperadorPE1", "OperadorPE2", "Raúl", "Henry", "OperadorEmp1", "OperadorEmp2"]
  )
  const [nuevoOperario, setNuevoOperario] = useState("")
  const [listaVendedores, setListaVendedores] = useState<string[]>(
    Array.isArray(mockDatabase.configuracion?.vendedores) ? [...mockDatabase.configuracion.vendedores] : vendedoresDefault
  )
  const [nuevoVendedor, setNuevoVendedor] = useState("")

  const handleGuardarConfig = () => {
    mockDatabase.configuracion.cobranzaNumAbonos = cobranzaNumAbonos
    mockDatabase.configuracion.disenadores = [...disenadores]
    mockDatabase.configuracion.operarios = [...operarios]
    mockDatabase.configuracion.vendedores = [...listaVendedores]
    alert("Configuración guardada exitosamente")
  }

  const agregarDisenador = () => {
    const nombre = nuevoDisenador.trim()
    if (!nombre || disenadores.includes(nombre)) return
    setDisenadores((prev) => [...prev, nombre])
    setNuevoDisenador("")
  }

  const quitarDisenador = (nombre: string) => {
    setDisenadores((prev) => prev.filter((d) => d !== nombre))
  }

  const agregarOperario = () => {
    const nombre = nuevoOperario.trim()
    if (!nombre || operarios.includes(nombre)) return
    setOperarios((prev) => [...prev, nombre])
    setNuevoOperario("")
  }

  const quitarOperario = (nombre: string) => {
    setOperarios((prev) => prev.filter((o) => o !== nombre))
  }

  const agregarVendedor = () => {
    const nombre = nuevoVendedor.trim()
    if (!nombre || listaVendedores.includes(nombre)) return
    setListaVendedores((prev) => [...prev, nombre])
    setNuevoVendedor("")
  }

  const quitarVendedor = (nombre: string) => {
    setListaVendedores((prev) => prev.filter((v) => v !== nombre))
  }

  if (!isOwner()) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">No tienes permisos para acceder a esta sección</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="glass-box rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">Configuración de Cobranza</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Número de campos de abono (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={cobranzaNumAbonos}
              onChange={(e: any) => setCobranzaNumAbonos(Math.max(1, Math.min(10, parseInt(e.target.value) || 2)))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Define cuántos campos de abono se mostrarán en la pestaña de Cobranza
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="primary"
              onClick={handleGuardarConfig}
              iconLeft={<Save className="w-4 h-4" />}
            >
              Guardar Configuración
            </Button>
          </div>
        </div>

        <div className="glass-box rounded-2xl p-6 mt-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Lista de diseñadores</h3>
          <p className="text-sm text-slate-500 mb-4">
            Nombres que aparecen al asignar diseñador en la pestaña Diseño. Agrega o quita según necesites.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {disenadores.map((nombre) => (
              <span
                key={nombre}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-sm text-slate-700"
              >
                {nombre}
                <button
                  type="button"
                  onClick={() => quitarDisenador(nombre)}
                  className="p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-red-600"
                  title="Quitar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevoDisenador}
              onChange={(e: any) => setNuevoDisenador(e.target.value)}
              onKeyDown={(e: any) => e.key === "Enter" && (e.preventDefault(), agregarDisenador())}
              placeholder="Nombre del diseñador"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button variant="secondary" onClick={agregarDisenador} iconLeft={<Plus className="w-4 h-4" />}>
              Agregar
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Haz clic en Guardar Configuración arriba para aplicar los cambios.</p>
        </div>

        <div className="glass-box rounded-2xl p-6 mt-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Lista de operarios</h3>
          <p className="text-sm text-slate-500 mb-4">
            Nombres que aparecen al asignar operador en Preparación, Estampado y Empaquetado. Agrega o quita según necesites.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {operarios.map((nombre) => (
              <span
                key={nombre}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-sm text-slate-700"
              >
                {nombre}
                <button
                  type="button"
                  onClick={() => quitarOperario(nombre)}
                  className="p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-red-600"
                  title="Quitar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevoOperario}
              onChange={(e: any) => setNuevoOperario(e.target.value)}
              onKeyDown={(e: any) => e.key === "Enter" && (e.preventDefault(), agregarOperario())}
              placeholder="Nombre del operario"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button variant="secondary" onClick={agregarOperario} iconLeft={<Plus className="w-4 h-4" />}>
              Agregar
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Haz clic en Guardar Configuración arriba para aplicar los cambios.</p>
        </div>

        <div className="glass-box rounded-2xl p-6 mt-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Lista de vendedores</h3>
          <p className="text-sm text-slate-500 mb-4">
            Nombres que aparecen al asignar vendedor en pedidos, ventas y reportes. Agrega o quita según necesites.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {listaVendedores.map((nombre) => (
              <span
                key={nombre}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-sm text-slate-700"
              >
                {nombre}
                <button
                  type="button"
                  onClick={() => quitarVendedor(nombre)}
                  className="p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-red-600"
                  title="Quitar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevoVendedor}
              onChange={(e: any) => setNuevoVendedor(e.target.value)}
              onKeyDown={(e: any) => e.key === "Enter" && (e.preventDefault(), agregarVendedor())}
              placeholder="Nombre del vendedor"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button variant="secondary" onClick={agregarVendedor} iconLeft={<Plus className="w-4 h-4" />}>
              Agregar
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Haz clic en Guardar Configuración arriba para aplicar los cambios.</p>
        </div>
      </div>
    </div>
  )
}

// Sub-pestaña: Usuarios y Roles (contiene las 3 pestañas originales) — solo administrador
function UsuariosRolesTab() {
  const { isOwner } = useAuth()
  const [activeTab, setActiveTab] = useState("profiles")

  if (!isOwner()) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[280px] text-center">
        <div className="glass-box rounded-2xl p-8 max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Acceso restringido</h3>
          <p className="text-slate-600">
            Solo el administrador puede crear, modificar y eliminar usuarios y perfiles.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border border-slate-200">
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Tipos de Usuarios
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Box className="w-4 h-4" />
            Creación de Usuarios
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Permisos Detallados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="mt-4">
          <UserProfilesTab />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <UsersManagementTab />
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <PermissionsReferenceTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Pestaña 1: Tipos de Usuarios (Perfiles)
function UserProfilesTab() {
  const { refreshPermissions } = useAuth()
  const [profiles, setProfiles] = useState(mockDatabase.userProfiles)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProfiles = profiles.filter((profile: any) => profile.name.toLowerCase().includes(searchTerm.toLowerCase()) || profile.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCreateProfile = () => {
    setEditingProfile(null)
    setShowProfileModal(true)
  }

  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile)
    setShowProfileModal(true)
  }

  const handleDeleteProfile = async (profileId: any) => {
    if (!confirm("¿Estás seguro de eliminar este perfil? Los usuarios que lo tengan asignado perderán estos permisos.")) {
      return
    }
    try {
      await mockFirestore.doc("userProfiles", profileId).delete()
      setProfiles([...mockDatabase.userProfiles])
    } catch (error: any) {
      alert("Error al eliminar perfil: " + error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 max-w-md">
          <Input
            label=""
            id="search-profiles"
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Buscar perfiles..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <Button variant="primary" onClick={handleCreateProfile} iconLeft={<PlusCircle className="w-4 h-4" />}>
          Crear Nuevo Perfil
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredProfiles.map((profile: any) => (
          <div key={profile.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{profile.name}</h3>
                <p className="text-sm text-slate-600 mb-3">{profile.description}</p>
                <div className="flex flex-wrap gap-2">
                  {profile.permissions.map((perm: any, idx: any) => (
                    <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {(AVAILABLE_MODULES as any)[perm.module]?.name || perm.module}: {perm.actions.length} acciones
                    </span>
                  ))}
                  {profile.specialPermissions && profile.specialPermissions.length > 0 && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {profile.specialPermissions.length} permisos especiales
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button variant="secondary" size="sm" onClick={() => handleEditProfile(profile)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteProfile(profile.id)}>
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filteredProfiles.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            {searchTerm ? "No se encontraron perfiles" : "No hay perfiles creados"}
          </div>
        )}
      </div>

      {showProfileModal && (
        <ProfileFormModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false)
            setEditingProfile(null)
          }}
          profile={editingProfile}
          onSave={() => {
            setProfiles([...mockDatabase.userProfiles])
            setShowProfileModal(false)
            setEditingProfile(null)
            refreshPermissions()
          }}
        />
      )}
    </div>
  )
}

// Modal para crear/editar perfil
function ProfileFormModal({ isOpen, onClose, profile, onSave }: any) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    permissions: [],
    specialPermissions: [],
  })
  const [errors, setErrors] = useState<Record<string, any>>({})

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        description: profile.description || "",
        permissions: profile.permissions || [],
        specialPermissions: profile.specialPermissions || [],
      })
    } else {
      setFormData({
        name: "",
        description: "",
        permissions: [],
        specialPermissions: [],
      })
    }
  }, [profile, isOpen])

  const handleModulePermissionChange = (module: any, action: any, checked: any) => {
    setFormData((prev: any) => {
      const p = prev as any
      // @ts-ignore
      const modulePerms = p.permissions.find((pm: any) => pm.module === module)
      if (checked) {
        if (modulePerms) {
          if (!modulePerms.actions.includes(action)) {
            modulePerms.actions.push(action)
          }
        } else {
          p.permissions.push({ module, actions: [action] })
        }
      } else {
        if (modulePerms) {
          modulePerms.actions = modulePerms.actions.filter((a: any) => a !== action)
          if (modulePerms.actions.length === 0) {
            p.permissions = p.permissions.filter((pm: any) => pm.module !== module)
          }
        }
      }
      return { ...p }
    })
  }

  const handleSpecialPermissionChange = (permission: any, checked: any) => {
    setFormData((prev: any) => {
      if (checked) {
        if (!prev.specialPermissions.includes(permission)) {
          prev.specialPermissions.push(permission)
        }
      } else {
        prev.specialPermissions = prev.specialPermissions.filter((p: any) => p !== permission)
      }
      return { ...prev }
    })
  }

  const isModuleActionChecked = (module: any, action: any) => {
    const modulePerm = formData.permissions.find((p: any) => p.module === module)
    return Boolean(modulePerm && modulePerm.actions.includes(action))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const newErrors: any = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const profileData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions.filter((p: any) => p.actions.length > 0),
        specialPermissions: formData.specialPermissions,
        updatedAt: new Date(),
      }

      if (profile) {
        await mockFirestore.doc("userProfiles", profile.id).update(profileData)
      } else {
        await mockFirestore.collection("userProfiles").add(profileData)
      }

      onSave()
    } catch (error: any) {
      alert("Error al guardar perfil: " + error.message)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={profile ? " Editar Perfil" : " Crear Nuevo Perfil"} size="4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nombre del Perfil"
          id="profile-name"
          value={formData.name}
          onChange={(e: any) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
          required
          error={errors.name}
          placeholder="Ej: Vendedor, Diseñador, Admin"
        />

        <Input
          label="Descripción"
          id="profile-description"
          type="textarea"
          value={formData.description}
          onChange={(e: any) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
          rows={2}
          placeholder="Describe el propósito de este perfil"
        />

        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Permisos por Módulo</h3>
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {Object.entries(AVAILABLE_MODULES).map(([moduleKey, module]: [string, any]) => (
              <div key={moduleKey} className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3">{module.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {module.actions.map((action: any) => (
                    <label key={action} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isModuleActionChecked(moduleKey, action)}
                        onChange={(e: any) => handleModulePermissionChange(moduleKey, action, e.target.checked)}
                        className="h-4 w-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                      />
                      <span className="text-sm text-slate-700 capitalize">{action.replace("-", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Permisos Especiales</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SPECIAL_PERMISSIONS.map((perm: any) => (
              <label key={perm} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.specialPermissions.includes(perm)}
                  onChange={(e: any) => handleSpecialPermissionChange(perm, e.target.checked)}
                  className="h-4 w-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                />
                <span className="text-sm text-slate-700 capitalize">{perm.replace("-", " ")}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {profile ? "Guardar Cambios" : "Crear Perfil"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Pestaña 2: Creación de Usuarios
function UsersManagementTab() {
  const { refreshPermissions, currentUser } = useAuth()
  const [users, setUsers] = useState(mockDatabase.users)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsers = useMemo(() => {
    const list = users.filter((user: any) => {
      if (!user) return false
      const name = (user.name ?? "").toString().toLowerCase()
      const email = (user.email ?? "").toString().toLowerCase()
      const term = searchTerm.toLowerCase()
      return name.includes(term) || email.includes(term)
    })
    // Evitar duplicados por id (p. ej. user-admin-123)
    const seen = new Set<string>()
    return list.filter((u: any) => {
      const id = u?.id ?? ""
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  }, [users, searchTerm])

  const handleCreateUser = () => {
    setEditingUser(null)
    setShowUserModal(true)
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setShowUserModal(true)
  }

  const handleDeleteUser = async (userId: any) => {
    if (userId === "user-admin-123") {
      alert("No se puede eliminar al dueño")
      return
    }
    if (!confirm("¿Estás seguro de eliminar este usuario?")) {
      return
    }
    try {
      await mockFirestore.doc("users", userId).delete()
      setUsers([...mockDatabase.users])
    } catch (error: any) {
      alert("Error al eliminar usuario: " + error.message)
    }
  }

  const handleToggleUserStatus = async (user: any) => {
    if (user.id === "user-admin-123") {
      alert("No se puede desactivar al dueño")
      return
    }
    try {
      await mockFirestore.doc("users", user.id).update({ status: user.status === "active" ? "inactive" : "active" })
      setUsers([...mockDatabase.users])
    } catch (error: any) {
      alert("Error al actualizar estado: " + error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 max-w-md">
          <Input
            label=""
            id="search-users"
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Buscar usuarios..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <Button variant="primary" onClick={handleCreateUser} iconLeft={<PlusCircle className="w-4 h-4" />}>
          Crear Nuevo Usuario
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Perfiles</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Último Acceso</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredUsers.map((user: any, index: number) => (
              <tr key={`${user?.id ?? "u"}-${index}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">{user.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {user.profiles && user.profiles.length > 0 ? (
                      user.profiles.map((profileId: any) => {
                        const profile = mockDatabase.userProfiles.find((p: any) => p.id === profileId)
                        return profile ? (
                          <span key={profileId} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {profile.name}
                          </span>
                        ) : null
                      })
                    ) : (
                      <span className="text-xs text-slate-400">Sin perfiles</span>
                    )}
                    {user.customPermissions && user.customPermissions.length > 0 && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Personalizado</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                  >
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Nunca"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEditUser(user)}>
                      Editar
                    </Button>
                    {user.id !== "user-admin-123" && (
                      <>
                        <Button
                          variant={user.status === "active" ? "danger" : "success"}
                          size="sm"
                          onClick={() => handleToggleUserStatus(user)}
                        >
                          {user.status === "active" ? "Desactivar" : "Activar"}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user.id)}>
                          Eliminar
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            {searchTerm ? "No se encontraron usuarios" : "No hay usuarios creados"}
          </div>
        )}
      </div>

      {showUserModal && (
        <UserFormModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false)
            setEditingUser(null)
          }}
          user={editingUser}
          onSave={() => {
            setUsers([...mockDatabase.users])
            setShowUserModal(false)
            setEditingUser(null)
            refreshPermissions()
          }}
        />
      )}
    </div>
  )
}

// Modal para crear/editar usuario
// Pestaña 3: Permisos Detallados (Vista de Referencia)
function PermissionsReferenceTab() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Esta es una vista de referencia de todos los permisos disponibles en el sistema. Úsala como guía al crear
          perfiles o asignar permisos personalizados.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Permisos por Módulo</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Módulo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Acciones Disponibles</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.entries(AVAILABLE_MODULES).map(([moduleKey, module]: [string, any]) => (
                <tr key={moduleKey} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{module.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {module.actions.map((action: any) => (
                        <span key={action} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded capitalize">
                          {action.replace("-", " ")}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {moduleKey === "ventas" && "Gestión de pedidos y ventas"}
                    {moduleKey === "diseño" && "Gestión de diseños y archivos"}
                    {moduleKey === "cobranza" && "Validación de pagos y comprobantes"}
                    {moduleKey === "inventarios" && "Gestión de inventario de productos"}
                    {moduleKey === "preparacion" && "Proceso de preparación de pedidos"}
                    {moduleKey === "estampado" && "Proceso de estampado"}
                    {moduleKey === "empaquetado" && "Proceso de empaquetado"}
                    {moduleKey === "reparto" && "Gestión de reparto y entregas"}
                    {moduleKey === "finalizados" && "Visualización de pedidos finalizados"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Permisos Especiales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SPECIAL_PERMISSIONS.map((perm: any) => (
              <div key={perm} className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-2 capitalize">{perm.replace("-", " ")}</h4>
                <p className="text-sm text-slate-600">
                  {perm === "configuracion" && "Acceso completo a la configuración del sistema"}
                  {perm === "reportes" && "Generar y exportar reportes"}
                  {perm === "exportar-datos" && "Exportar datos del sistema"}
                  {perm === "ver-historial-completo" && "Ver historial completo de cambios"}
                  {perm === "gestionar-usuarios" && "Crear, editar y eliminar usuarios"}
                  {perm === "gestionar-roles" && "Crear, editar y eliminar perfiles/roles"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}