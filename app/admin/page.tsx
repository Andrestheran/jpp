"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserHeader } from "@/components/auth/UserHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/auth";
import Link from "next/link";
import { FileText, Users, Download, ClipboardList } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "user";
  full_name?: string;
  created_at: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "user" as "admin" | "user",
    fullName: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Actualizar el rol si es diferente de 'user'
        if (newUser.role === "admin") {
          await supabase
            .from("user_profiles")
            .update({ role: "admin" })
            .eq("id", data.user.id);
        }
      }

      alert("Usuario creado exitosamente");
      setNewUser({ email: "", password: "", role: "user", fullName: "" });
      setShowCreateForm(false);
      loadUsers();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      alert(`Error creating user: ${errorMessage}`);
    }
  };

  const updateUserRole = async (userId: string, newRole: "admin" | "user") => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;
      alert("Rol actualizado exitosamente");
      loadUsers();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      alert(`Error updating role: ${errorMessage}`);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserHeader />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <div className="flex space-x-4">
              <Link href="/admin/files">
                <Button variant="outline" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Gestionar Archivos</span>
                </Button>
              </Link>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                {showCreateForm ? "Cancelar" : "Crear Usuario"}
              </Button>
            </div>
          </div>

          {/* Admin Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/admin">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Usuarios</h3>
                    <p className="text-gray-600">Gestionar usuarios del sistema</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/files">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Archivos Multimedia</h3>
                    <p className="text-gray-600">Subir y gestionar archivos</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/respuestas">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <ClipboardList className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Respuestas</h3>
                    <p className="text-gray-600">Ver y exportar respuestas</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {showCreateForm && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">
                Crear Nuevo Usuario
              </h2>
              <form onSubmit={createUser} className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <input
                    id="password"
                    type="password"
                    required
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <input
                    id="fullName"
                    type="text"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newUser.fullName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, fullName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="role">Rol</Label>
                  <select
                    id="role"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        role: e.target.value as "admin" | "user",
                      })
                    }
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <Button type="submit" className="w-full">
                    Crear Usuario
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Usuarios del Sistema</h2>
            </div>

            {loading ? (
              <div className="p-6 text-center">Cargando usuarios...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || "Sin nombre"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role === "admin"
                              ? "Administrador"
                              : "Usuario"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateUserRole(
                                user.id,
                                user.role === "admin" ? "user" : "admin"
                              )
                            }
                          >
                            Cambiar a{" "}
                            {user.role === "admin" ? "Usuario" : "Admin"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
