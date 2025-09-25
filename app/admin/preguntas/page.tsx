"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserHeader } from "@/components/auth/UserHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/auth";
import { invalidateDomainsCache } from "@/data/instrument";

interface Domain {
  id: string;
  code: string;
  title: string;
}

interface Subsection {
  id: string;
  code: string;
  title: string;
  domain_id: string;
}

interface Item {
  id: string;
  code: string;
  title: string;
  requires_evidence: boolean;
  subsection_id: string;
  subsection?: Subsection;
  domain?: Domain;
}

export default function AdminQuestionsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newItem, setNewItem] = useState({
    code: "",
    title: "",
    subsection_id: "",
    requires_evidence: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar dominios
      const { data: domainsData, error: domainsError } = await supabase
        .from("domains")
        .select("*")
        .order("code");

      if (domainsError) throw domainsError;
      setDomains(domainsData || []);

      // Cargar subsecciones
      const { data: subsectionsData, error: subsectionsError } = await supabase
        .from("subsections")
        .select("*")
        .order("code");

      if (subsectionsError) throw subsectionsError;
      setSubsections(subsectionsData || []);

      // Cargar items con información de subsección y dominio
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select(
          `
          *,
          subsections!inner(
            id,
            code,
            title,
            domain_id,
            domains!inner(
              id,
              code,
              title
            )
          )
        `
        )
        .order("code");

      if (itemsError) throw itemsError;

      // Transformar los datos para el formato esperado
      const transformedItems =
        itemsData?.map((item) => ({
          ...item,
          subsection: item.subsections,
          domain: item.subsections.domains,
        })) || [];

      setItems(transformedItems);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("items").insert({
        code: newItem.code,
        title: newItem.title,
        subsection_id: newItem.subsection_id,
        requires_evidence: newItem.requires_evidence,
      });

      if (error) throw error;

      alert("Pregunta creada exitosamente");
      setNewItem({
        code: "",
        title: "",
        subsection_id: "",
        requires_evidence: false,
      });
      setShowCreateForm(false);
      invalidateDomainsCache(); // Limpiar cache para que se recarguen las preguntas
      loadData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      alert(`Error creating item: ${errorMessage}`);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta pregunta?")) {
      return;
    }

    try {
      const { error } = await supabase.from("items").delete().eq("id", itemId);

      if (error) throw error;

      alert("Pregunta eliminada exitosamente");
      invalidateDomainsCache(); // Limpiar cache para que se recarguen las preguntas
      loadData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      alert(`Error deleting item: ${errorMessage}`);
    }
  };

  const getSubsectionsByDomain = (domainId: string) => {
    return subsections.filter((s) => s.domain_id === domainId);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserHeader />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Administración de Preguntas</h1>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? "Cancelar" : "Agregar Pregunta"}
            </Button>
          </div>

          {showCreateForm && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">
                Agregar Nueva Pregunta
              </h2>
              <form onSubmit={createItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Código</Label>
                    <input
                      id="code"
                      type="text"
                      required
                      placeholder="ej: 1.4"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newItem.code}
                      onChange={(e) =>
                        setNewItem({ ...newItem, code: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="subsection">Subsección</Label>
                    <select
                      id="subsection"
                      required
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newItem.subsection_id}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          subsection_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Seleccionar subsección...</option>
                      {domains.map((domain) => (
                        <optgroup
                          key={domain.id}
                          label={`${domain.code}. ${domain.title}`}
                        >
                          {getSubsectionsByDomain(domain.id).map(
                            (subsection) => (
                              <option key={subsection.id} value={subsection.id}>
                                {domain.code}.{subsection.code}.{" "}
                                {subsection.title}
                              </option>
                            )
                          )}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Título de la Pregunta</Label>
                  <Textarea
                    id="title"
                    required
                    placeholder="Descripción completa de la pregunta..."
                    className="mt-1"
                    value={newItem.title}
                    onChange={(e) =>
                      setNewItem({ ...newItem, title: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="requires_evidence"
                    type="checkbox"
                    checked={newItem.requires_evidence}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        requires_evidence: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="requires_evidence">Requiere evidencia</Label>
                </div>

                <Button type="submit" className="w-full">
                  Crear Pregunta
                </Button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                Preguntas del Instrumento
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-center">Cargando preguntas...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dominio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subsección
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Evidencia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.domain?.code}. {item.domain?.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.subsection?.code}. {item.subsection?.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                          <div className="truncate" title={item.title}>
                            {item.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.requires_evidence ? (
                            <span className="text-green-600">Sí</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Eliminar
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
