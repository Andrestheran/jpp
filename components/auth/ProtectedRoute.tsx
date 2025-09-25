"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "./LoginForm";

interface Props {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, loading, isAdmin, isUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Verificar si el usuario tiene el rol requerido
  if (requiredRole) {
    const hasRequiredRole =
      (requiredRole === "admin" && isAdmin) ||
      (requiredRole === "user" && (isUser || isAdmin)); // Admin puede actuar como user

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Denegado
            </h2>
            <p className="text-gray-600">
              No tienes permisos para acceder a esta sección.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Rol requerido:{" "}
              {requiredRole === "admin" ? "Administrador" : "Usuario"}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
