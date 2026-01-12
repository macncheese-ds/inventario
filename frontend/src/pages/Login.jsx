"use client"

import { useState, useEffect } from "react"
import api, { setAuthToken } from "../api.js"
import Card from "../components/ui/Card.jsx"
import Button from "../components/ui/Button.jsx"

export default function Login() {
  const [credentials, setCredentials] = useState({ employee_input: "", password: "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const data = await api.authenticate(credentials.employee_input, credentials.password)
      localStorage.setItem("token", data.token)
      setAuthToken(data.token)
      window.location.href = "/"
    } catch (err) {
      setError(err.message || "Error de autenticacion")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-700/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        <Card
          variant="glass"
          className="bg-slate-800/50 backdrop-blur-xl border-slate-700/40 shadow-2xl shadow-slate-900/50"
        >
          {/* Logo and heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-3xl mb-6 shadow-lg shadow-blue-500/40 animate-float">
              I
            </div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Inventario</h1>
            <p className="text-slate-400 mt-2 text-sm font-medium">Sistema de Control</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-3 animate-slide-up">
              <div className="w-5 h-5 rounded-lg bg-rose-500/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span>{error}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Employee number input */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2.5">
                Numero de Empleado o Gafete
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  name="employee_input"
                  value={credentials.employee_input}
                  onChange={handleChange}
                  placeholder="Escanea tu gafete o codigo"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 hover:border-slate-600 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2.5">Contrasena</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 hover:border-slate-600 transition-all duration-200"
                />
              </div>
            </div>

            {/* Login button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-base font-semibold mt-8"
              loading={busy}
            >
              Iniciar Sesion
            </Button>
          </form>

          {/* Role indicators */}
          <div className="mt-8 pt-6 border-t border-slate-700/30">
            <p className="text-xs text-slate-500 text-center font-semibold uppercase tracking-widest mb-4">
              Roles Disponibles
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-700/20 border border-slate-700/30 text-slate-400 hover:bg-slate-700/30 transition-colors">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm"></span>
                <span>Administrador</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-700/20 border border-slate-700/30 text-slate-400 hover:bg-slate-700/30 transition-colors">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
                <span>Lider / Operador</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-700/20 border border-slate-700/30 text-slate-400 hover:bg-slate-700/30 transition-colors">
                <span className="w-2 h-2 rounded-full bg-slate-500 shadow-sm"></span>
                <span>Invitado (Solo lectura)</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
