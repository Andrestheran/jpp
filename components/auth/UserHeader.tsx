"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function UserHeader() {
  const { user, signOut, isAdmin } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900">
              Sistema de Evaluación
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isAdmin
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {isAdmin ? "Administrador" : "Usuario"}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                Inicio
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Usuarios
                  </Button>
                </Link>
                <Link href="/admin/preguntas">
                  <Button variant="outline" size="sm">
                    Preguntas
                  </Button>
                </Link>
              </>
            )}
            <span className="text-sm text-gray-700">
              {user.profile?.full_name || user.email}
            </span>
            <Button onClick={signOut} variant="outline" size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
