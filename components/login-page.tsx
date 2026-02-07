"use client"

import React, { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Box } from "lucide-react"

export function LoginPage() {
  const { login, loadingAuth } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    if (!trimmedEmail || !trimmedPassword) {
      setError("Ingresa correo y contraseña.")
      return
    }
    const result = await login(trimmedEmail, trimmedPassword)
    if (result.success) {
      return
    }
    setError(result.error || "Error al iniciar sesión.")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/80 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-slate-200/60 flex items-center justify-center border border-slate-300/50">
              <Box className="w-8 h-8 text-slate-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-slate-800 mb-1">Sistema de Gestión</h1>
          <p className="text-sm text-slate-500 text-center mb-6">Inicia sesión para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo"
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ej. admin@sistema.com"
              required
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loadingAuth}>
              {loadingAuth ? "Entrando…" : "Iniciar sesión"}
            </Button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-6">
            Usuario dueño por defecto: <span className="font-mono text-slate-500">admin@sistema.com</span> / contraseña configurada en Configuración.
          </p>
        </div>
      </div>
    </div>
  )
}
