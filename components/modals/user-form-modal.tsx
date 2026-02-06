
import React, { useState, useEffect } from "react"
import { useAuth } from "../../contexts/auth-context"
import { mockDatabase, mockFirestore } from "../../lib/mock-data"
import { Modal } from "../ui/modal"
import { Input } from "../ui/input"
import { Select } from "../ui/input"

// Modal para crear/editar usuario
export function UserFormModal({ isOpen, onClose, user, onSave }: any) {
    const { currentUser } = useAuth()
    const [formData, setFormData] = useState<any>({
        email: "",
        name: "",
        phone: "",
        password: "",
        status: "active",
        profiles: [],
        customPermissions: [],
        specialPermissions: [],
    })
    const [errors, setErrors] = useState<any>({})
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || "",
                name: user.name || "",
                phone: user.phone || "",
                password: "", // No mostrar contraseña existente
                status: user.status || "active",
                profiles: user.profiles || [],
                customPermissions: user.customPermissions || [],
                specialPermissions: user.specialPermissions || [],
            })
        } else {
            setFormData({
                email: "",
                name: "",
                phone: "",
                password: "",
                status: "active",
                profiles: [],
                customPermissions: [],
                specialPermissions: [],
            })
        }
    }, [user, isOpen])

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const newErrors: any = {}

        if (!formData.email.trim()) {
            newErrors.email = "El email es obligatorio"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email inválido"
        }

        if (!formData.name.trim()) {
            newErrors.name = "El nombre es obligatorio"
        }

        if (!user && !formData.password) {
            newErrors.password = "La contraseña es obligatoria para nuevos usuarios"
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        try {
            const userData: any = {
                email: formData.email.trim(),
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                status: formData.status,
                profiles: formData.profiles,
                customPermissions: formData.customPermissions.filter((p: any) => p.actions.length > 0),
                specialPermissions: formData.specialPermissions,
                updatedAt: new Date(),
                createdBy: currentUser?.uid || "system",
            }

            if (user) {
                if (formData.password) {
                    userData.password = formData.password // En producción, hashear
                }
                await mockFirestore.doc("users", user.id).update(userData)
            } else {
                userData.password = formData.password // En producción, hashear
                userData.createdAt = new Date()
                await mockFirestore.collection("users").add(userData)
            }

            onSave()
        } catch (error: any) {
            alert("Error al guardar usuario: " + error.message)
        }
    }

    const handleProfileToggle = (profileId: string) => {
        setFormData((prev: any) => ({
            ...prev,
            profiles: prev.profiles.includes(profileId) ? prev.profiles.filter((id: string) => id !== profileId) : [...prev.profiles, profileId],
        }))
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? " Editar Usuario" : " Crear Nuevo Usuario"} size="6xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Email"
                        id="user-email"
                        type="email"
                        value={formData.email}
                        onChange={(e: any) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
                        required
                        error={errors.email}
                        disabled={!!user}
                    />
                    <Input
                        label="Nombre Completo"
                        id="user-name"
                        value={formData.name}
                        onChange={(e: any) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                        required
                        error={errors.name}
                    />
                    <Input
                        label="Teléfono (Opcional)"
                        id="user-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e: any) => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
                    />
                    <div>
                        <Input
                            label={user ? "Nueva Contraseña (dejar vacío para mantener)" : "Contraseña"}
                            id="user-password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e: any) => setFormData((prev: any) => ({ ...prev, password: e.target.value }))}
                            required={!user}
                            error={errors.password}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-xs text-slate-600 mt-1"
                        >
                            {showPassword ? "Ocultar" : "Mostrar"} contraseña
                        </button>
                    </div>
                    <Select
                        label="Estado"
                        id="user-status"
                        value={formData.status}
                        onChange={(e: any) => setFormData((prev: any) => ({ ...prev, status: e.target.value }))}
                        options={[
                            { value: "active", label: "Activo" },
                            { value: "inactive", label: "Inactivo" },
                        ]}
                    />
                </div>

                <div className="border-t border-slate-200 pt-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Asignar Perfiles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {mockDatabase.userProfiles.map((profile: any) => (
                            <label key={profile.id} className="flex items-start space-x-2 cursor-pointer border rounded-lg p-3 hover:bg-slate-50">
                                <input
                                    type="checkbox"
                                    checked={formData.profiles.includes(profile.id)}
                                    onChange={() => handleProfileToggle(profile.id)}
                                    className="mt-1 h-4 w-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900">{profile.name}</div>
                                    <div className="text-xs text-slate-500">{profile.description}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </form>
        </Modal>
    )
}
