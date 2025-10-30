"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Timeout de seguridad - si tarda más de 8 segundos, mostrar error
    const timeoutId = setTimeout(() => {
      setError("El inicio de sesión está tomando demasiado tiempo. Por favor, recarga la página e intenta de nuevo.");
      setLoading(false);
    }, 8000);

    try {
      await signIn(email, password);
      clearTimeout(timeoutId);
      // Si llega aquí, el login fue exitoso y onAuthStateChange manejará la redirección
    } catch (err) {
      clearTimeout(timeoutId);
      const errorMessage =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de Evaluación de Centros de Simulación
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
            
            {loading && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLoading(false);
                  setError("Inicio de sesión cancelado. Intenta de nuevo.");
                }}
                className="w-full"
              >
                Cancelar
              </Button>
            )}
          </div>

          {loading && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Si tarda más de 10 segundos, haz clic en Cancelar y recarga la página
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
