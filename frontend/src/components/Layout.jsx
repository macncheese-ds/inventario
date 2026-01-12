"use client"

import { useState, useEffect } from "react"
import { jwtDecode } from "jwt-decode"
import { setAuthToken } from "../api.js"
import Button from "./ui/Button.jsx"

export default function Layout({ children, fullWidth = false }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const decoded = jwtDecode(token)
        setUser(decoded)
      } catch (error) {
        console.error("Invalid token", error)
      }
    }
  }, [])

  const handleLogout = () => {
    setAuthToken(null)
    window.location.href = "/login"
  }

  const containerClass = fullWidth ? "w-full px-4 sm:px-6 lg:px-8" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 font-sans text-slate-100">
      <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/30 sticky top-0 z-30 shadow-lg shadow-slate-900/20">
        <div className={containerClass}>
          <div className="flex justify-between items-center h-16">
            {/* Logo and branding */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => (window.location.href = "/")}>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300 group-hover:scale-105">
                I
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-slate-100 group-hover:text-blue-400 transition-colors duration-200">
                  Inventario
                </span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Sistema
                </span>
              </div>
            </div>

            {/* User info and logout */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-700/20 border border-slate-700/30 transition-colors duration-200 hover:bg-slate-700/30">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {(user.nombre || user.username || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-100">{user.nombre || user.username}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm"></span>
                      {user.rol} {user.area && `- ${user.area}`}
                    </span>
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-sm hover:text-blue-400"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                }
              >
                Salir
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className={`${containerClass} py-8 animate-fade-in`}>{children}</main>
    </div>
  )
}
