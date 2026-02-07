
import React, { useState, useEffect, createContext, useContext } from "react"
import { OWNER_EMAIL, AVAILABLE_MODULES, SPECIAL_PERMISSIONS } from "../lib/constants"
import { mockDatabase, mockFirestore, inicializarColumnasPorDefecto, DEFAULT_OWNER_USER } from "../lib/mock-firebase"
import { migrateFlujosExistentes, aplicarCondicionesPorDefectoEtapas } from "../lib/business-logic"

// Función para calcular permisos de un usuario
export const calculateUserPermissions = (user: any) => {
    if (!user || !user.profiles) {
        return { permissions: [], specialPermissions: [] }
    }

    const allPermissions: any[] = []
    const allSpecialPermissions = new Set<string>()

    // 1. Obtener permisos de los perfiles
    user.profiles.forEach((profileId: string) => {
        const profile = mockDatabase.userProfiles.find((p: any) => p.id === profileId)
        if (profile) {
            if (profile.permissions) {
                profile.permissions.forEach((perm: any) => {
                    allPermissions.push(perm)
                })
            }
            if (profile.specialPermissions) {
                profile.specialPermissions.forEach((sp: string) => {
                    allSpecialPermissions.add(sp)
                })
            }
        }
    })

    // 2. Combinar permisos por módulo (merge actions)
    const mergedPermissions: any[] = []
    const permissionMap = new Map()

    allPermissions.forEach((perm: any) => {
        if (!permissionMap.has(perm.module)) {
            permissionMap.set(perm.module, new Set(perm.actions))
        } else {
            const currentActions = permissionMap.get(perm.module)
            perm.actions.forEach((action: string) => currentActions.add(action))
        }
    })

    // Añadir permisos personalizados del usuario
    if (user.customPermissions) {
        user.customPermissions.forEach((perm: any) => {
            if (!permissionMap.has(perm.module)) {
                permissionMap.set(perm.module, new Set(perm.actions))
            } else {
                const currentActions = permissionMap.get(perm.module)
                perm.actions.forEach((action: string) => currentActions.add(action))
            }
        })
    }

    // Añadir permisos especiales del usuario
    if (user.specialPermissions) {
        user.specialPermissions.forEach((sp: string) => {
            allSpecialPermissions.add(sp)
        })
    }

    // Convertir Map a Array final
    permissionMap.forEach((actionsSet: any, module: any) => {
        // Si tiene "ver-todos", añadir automáticamente "ver"
        if (actionsSet.has("ver-todos")) {
            actionsSet.add("ver")
        }

        // Nombre del módulo para UI
        const moduleName = (AVAILABLE_MODULES as any)[module]?.name || module

        mergedPermissions.push({
            module,
            moduleName,
            actions: Array.from(actionsSet),
        })
    })

    // Si es el dueño, darle todos los permisos especiales implícitamente en la UI check
    if (user.email === OWNER_EMAIL) {
        SPECIAL_PERMISSIONS.forEach((sp: any) => allSpecialPermissions.add(sp))
    }

    return {
        permissions: mergedPermissions,
        specialPermissions: Array.from(allSpecialPermissions),
    }
}

// Contexto de Autenticación con Sistema de Permisos
const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [userData, setUserData] = useState<any>(null)
    const [loadingAuth, setLoadingAuth] = useState(false)
    const [userPermissions, setUserPermissions] = useState<{ permissions: any[], specialPermissions: string[] }>({ permissions: [], specialPermissions: [] })

    const SESSION_KEY = "sistema_gestion_user_id"

    // Cargar usuarios desde Firestore (si está conectado) y asegurar que exista el dueño por defecto
    useEffect(() => {
        const unsub = mockFirestore.collection("users").onSnapshot(() => {})
        const ensureOwner = () => {
            if (!Array.isArray(mockDatabase.users)) return
            const hasOwnerById = mockDatabase.users.some((u: any) => u?.id === "user-admin-123")
            const hasOwnerByEmail = mockDatabase.users.some((u: any) => u?.email === OWNER_EMAIL)
            if (!hasOwnerById && !hasOwnerByEmail) {
                mockDatabase.users.push({ ...DEFAULT_OWNER_USER })
            }
        }
        ensureOwner()
        const t = setTimeout(ensureOwner, 2000)
        return () => {
            unsub()
            clearTimeout(t)
        }
    }, [])

    useEffect(() => {
        function tryRestore() {
            try {
                const savedId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null
                if (!savedId) return
                const user = mockDatabase.users.find((u: any) => u.id === savedId)
                if (user && user.status === "active") {
                    setCurrentUser({ uid: user.id, email: user.email })
                    setUserData(user)
                    setUserPermissions(calculateUserPermissions(user))
                }
            } catch (_) {}
        }
        tryRestore()
        const t = setTimeout(tryRestore, 1500)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        try {
            migrateFlujosExistentes()
            aplicarCondicionesPorDefectoEtapas()
            inicializarColumnasPorDefecto()
        } catch (error: any) {
            console.error("Error en inicialización:", error)
        }
    }, [])

    // Función de login
    const login = async (email: any, password: any) => {
        setLoadingAuth(true)
        try {
            let user = mockDatabase.users.find((u: any) => u?.email === email && (u?.status === "active" || u?.status === undefined))
            if (!user && email === OWNER_EMAIL) {
                user = mockDatabase.users.find((u: any) => u?.email === OWNER_EMAIL || u?.id === "user-admin-123")
            }
            if (!user) {
                throw new Error("Usuario no encontrado o inactivo")
            }
            const isOwnerUser = user.email === OWNER_EMAIL || user.id === "user-admin-123"
            const expectedPassword = user.password ?? (isOwnerUser ? DEFAULT_OWNER_USER.password : undefined)
            if (expectedPassword == null || expectedPassword !== password) {
                throw new Error("Contraseña incorrecta")
            }

            // Actualizar último acceso
            user.lastLogin = new Date()
            if (mockFirestore.doc) {
                await mockFirestore.doc("users", user.id).update({ lastLogin: user.lastLogin })
            }

            setCurrentUser({ uid: user.id, email: user.email })
            setUserData(user)
            setUserPermissions(calculateUserPermissions(user))
            try {
                sessionStorage.setItem(SESSION_KEY, user.id)
            } catch (_) {}
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        } finally {
            setLoadingAuth(false)
        }
    }

    // Función de logout
    const logout = () => {
        try {
            sessionStorage.removeItem(SESSION_KEY)
        } catch (_) {}
        setCurrentUser(null)
        setUserData(null)
        setUserPermissions({ permissions: [], specialPermissions: [] })
    }

    // Función para verificar permisos
    const hasPermission = (module: any, action: any) => {
        if (!userData) return false
        // Dueño tiene todos los permisos
        if (isOwner()) return true

        const modulePerm = userPermissions.permissions.find((p: any) => p.module === module)
        if (!modulePerm) return false
        return modulePerm.actions.includes(action)
    }

    // Función para verificar permisos especiales
    const hasSpecialPermission = (permission: any) => {
        if (!userData) return false
        if (isOwner()) return true
        return userPermissions.specialPermissions.includes(permission)
    }

    // Función para verificar si es dueño
    const isOwner = () => {
        return (
            currentUser?.email === OWNER_EMAIL ||
            userData?.email === OWNER_EMAIL ||
            currentUser?.uid === "user-admin-123" ||
            userData?.id === "user-admin-123"
        )
    }

    // Función combinada para verificar acceso
    const canAccess = (module: any, action: any) => {
        return hasPermission(module, action)
    }

    // Función para actualizar permisos del usuario actual (cuando se modifican perfiles/usuarios)
    const refreshPermissions = () => {
        if (userData) {
            const updatedUser = mockDatabase.users.find((u: any) => u.id === userData.id)
            if (updatedUser) {
                setUserData(updatedUser)
                const perms = calculateUserPermissions(updatedUser)
                setUserPermissions(perms)
            }
        }
    }

    // Mantener compatibilidad con código existente
    const hasRole = (role: any) => {
        // Para compatibilidad, verificar si tiene permiso de "ver" en ese módulo
        return hasPermission(role, "ver")
    }

    const isAdmin = () => {
        return isMasterAdmin() || hasSpecialPermission("gestionar-usuarios")
    }

    // Mantener compatibilidad
    const isMasterAdmin = isOwner

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                userData,
                loadingAuth,
                hasRole,
                isAdmin,
                hasPermission,
                hasSpecialPermission,
                isOwner,
                isMasterAdmin,
                canAccess,
                login,
                logout,
                registerUser: () => { },
                refreshPermissions,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        // Retornar valores por defecto si el contexto no está disponible
        return {
            currentUser: null,
            userData: null,
            loadingAuth: false,
            hasRole: () => false,
            isAdmin: () => false,
            hasPermission: () => false,
            hasSpecialPermission: () => false,
            isMasterAdmin: () => false,
            isOwner: () => false,
            canAccess: () => false,
            login: async () => ({ success: false }),
            logout: () => { },
            registerUser: () => { },
            refreshPermissions: () => { },
        }
    }
    return context as any
}
