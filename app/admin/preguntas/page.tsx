"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserHeader } from "@/components/auth/UserHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/file-upload";
import { supabase } from "@/lib/auth";
import { invalidateDomainsCache } from "@/data/instrument";
import { Trash2, AlertTriangle, Upload } from "lucide-react";

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
  subsection_id?: string | null;
  evidence_files?: string[]; // URLs de archivos de evidencia
  subsection?: Subsection | null;
  domain?: Domain | null;
}

export default function AdminQuestionsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [subsections, setSubsections] = useState<Subsection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const [newItem, setNewItem] = useState({
    code: "",
    title: "",
    subsection_id: "",
    requires_evidence: false,
  });

  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

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
          subsections(
            id,
            code,
            title,
            domain_id,
            domains(
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
          subsection: item.subsections || null,
          domain: item.subsections?.domains || null,
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
      let evidenceFileUrls: string[] = [];

      // Upload evidence files if required
      if (newItem.requires_evidence && evidenceFiles.length > 0) {
        evidenceFileUrls = await uploadEvidenceFiles(evidenceFiles);
      }

      const { error } = await supabase.from("items").insert({
        code: newItem.code,
        title: newItem.title,
        subsection_id: newItem.subsection_id || null,
        requires_evidence: newItem.requires_evidence,
        evidence_files: evidenceFileUrls.length > 0 ? evidenceFileUrls : null,
      });

      if (error) throw error;

      alert("Pregunta creada exitosamente");
      setNewItem({
        code: "",
        title: "",
        subsection_id: "",
        requires_evidence: false,
      });
      setEvidenceFiles([]);
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
      // First, delete related answers to avoid foreign key constraints
      const { error: answersError } = await supabase
        .from("answers")
        .delete()
        .eq("item_id", itemId);

      if (answersError) {
        console.warn("Warning: Could not delete related answers:", answersError);
        // Continue with item deletion even if answers deletion fails
      }

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

  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return;

    try {
      const itemIds = Array.from(selectedItems);

      // First, delete related answers to avoid foreign key constraints
      const { error: answersError } = await supabase
        .from("answers")
        .delete()
        .in("item_id", itemIds);

      if (answersError) {
        console.warn("Warning: Could not delete related answers:", answersError);
        // Continue with item deletion even if answers deletion fails
      }

      const { error } = await supabase
        .from("items")
        .delete()
        .in("id", itemIds);

      if (error) throw error;

      alert(`${selectedItems.size} pregunta(s) eliminada(s) exitosamente`);
      setSelectedItems(new Set());
      setShowBulkDeleteConfirm(false);
      invalidateDomainsCache();
      loadData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      alert(`Error eliminando preguntas: ${errorMessage}`);
    }
  };

  const deleteAllItems = async () => {
    try {
      // First get all item IDs to delete them
      const { data: allItems, error: fetchError } = await supabase
        .from("items")
        .select("id");

      if (fetchError) throw fetchError;

      if (!allItems || allItems.length === 0) {
        alert("No hay preguntas para eliminar");
        setShowDeleteAllConfirm(false);
        return;
      }

      const itemIds = allItems.map(item => item.id);

      // First, delete all related answers to avoid foreign key constraints
      const { error: answersError } = await supabase
        .from("answers")
        .delete()
        .in("item_id", itemIds);

      if (answersError) {
        console.warn("Warning: Could not delete related answers:", answersError);
        // Continue with item deletion even if answers deletion fails
      }

      // Delete all items by their IDs
      const { error } = await supabase
        .from("items")
        .delete()
        .in("id", itemIds);

      if (error) throw error;

      alert("Todas las preguntas han sido eliminadas exitosamente");
      setSelectedItems(new Set());
      setShowDeleteAllConfirm(false);
      invalidateDomainsCache();
      loadData();
    } catch (error) {
      console.error("Error deleting all items:", error);
      
      // Handle specific Supabase errors
      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      // Check for common database errors
      if (errorMessage.includes('foreign key')) {
        errorMessage = "No se pueden eliminar las preguntas porque están siendo utilizadas por otros registros. Elimine primero las respuestas relacionadas.";
      } else if (errorMessage.includes('permission')) {
        errorMessage = "No tienes permisos para eliminar todas las preguntas.";
      } else if (errorMessage.includes('constraint')) {
        errorMessage = "No se pueden eliminar las preguntas debido a restricciones de la base de datos.";
      }
      
      alert(`Error eliminando todas las preguntas: ${errorMessage}`);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const uploadEvidenceFiles = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];

    setIsUploadingEvidence(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `evidence/${fileName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('multimedia')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Storage upload error:', error);
          
          // Handle specific storage errors
          if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
            throw new Error('El bucket "multimedia" no existe. Por favor ejecuta el SQL completo en Supabase para crear el bucket y sus políticas.');
          } else if (error.message.includes('policy') || error.message.includes('permission') || error.message.includes('denied')) {
            throw new Error('No tienes permisos para subir archivos. Verifica que: 1) Eres administrador, 2) Las políticas RLS están configuradas correctamente en Supabase.');
          } else if (error.message.includes('payload') || error.message.includes('large')) {
            throw new Error(`El archivo "${file.name}" es demasiado grande. Límite: 50MB por archivo.`);
          } else {
            throw new Error(`Error subiendo archivo "${file.name}": ${error.message}`);
          }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('multimedia')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading evidence files:', error);
      throw error;
    } finally {
      setIsUploadingEvidence(false);
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
            <div className="flex space-x-2">
              {selectedItems.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar Seleccionadas ({selectedItems.size})</span>
                </Button>
              )}
              {items.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteAllConfirm(true)}
                  className="flex items-center space-x-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Eliminar Todas</span>
                </Button>
              )}
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                {showCreateForm ? "Cancelar" : "Agregar Pregunta"}
              </Button>
            </div>
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
                    <Label htmlFor="subsection">Subsección (Opcional)</Label>
                    <select
                      id="subsection"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newItem.subsection_id}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          subsection_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Sin subsección específica</option>
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

                {/* Drag and Drop para archivos de evidencia */}
                {newItem.requires_evidence && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Upload className="h-5 w-5 text-blue-600" />
                      <Label className="text-sm font-medium text-gray-700">
                        Archivos de Evidencia
                      </Label>
                    </div>
                    <FileUpload
                      onFilesUploaded={setEvidenceFiles}
                      maxFiles={5}
                      maxFileSize={50} // 50MB
                      acceptedTypes={[
                        "video/mp4",
                        "application/pdf", 
                        "image/jpeg",
                        "image/jpg",
                        "image/png"
                      ]}
                      className="border-2 border-dashed border-blue-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500">
                      Sube archivos multimedia que sirvan como evidencia para esta pregunta (máximo 5 archivos, 50MB cada uno)
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isUploadingEvidence}
                >
                  {isUploadingEvidence ? "Subiendo archivos..." : "Crear Pregunta"}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <Checkbox
                          checked={selectedItems.size === items.length && items.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
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
                      <tr key={item.id} className={selectedItems.has(item.id) ? "bg-blue-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.domain ? `${item.domain.code}. ${item.domain.title}` : 'Sin dominio'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.subsection ? `${item.subsection.code}. ${item.subsection.title}` : 'Sin subsección'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                          <div className="truncate" title={item.title}>
                            {item.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.requires_evidence ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600">Sí</span>
                              {item.evidence_files && item.evidence_files.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {item.evidence_files.length} archivo(s)
                                </span>
                              )}
                            </div>
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

          {/* Confirmation Dialogs */}
          {showBulkDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirmar Eliminación
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  ¿Estás seguro de que quieres eliminar {selectedItems.size} pregunta(s) seleccionada(s)? 
                  <br /><br />
                  <strong>Esto también eliminará:</strong>
                  <br />• Todas las respuestas relacionadas a estas preguntas
                  <br /><br />
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={deleteSelectedItems}
                    className="flex-1"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showDeleteAllConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirmar Eliminación Total
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  ⚠️ ADVERTENCIA: Estás a punto de eliminar TODAS las preguntas del instrumento ({items.length} pregunta(s)). 
                  <br /><br />
                  <strong>Esto también eliminará:</strong>
                  <br />• Todas las respuestas relacionadas a estas preguntas
                  <br />• Todos los datos de evaluaciones existentes
                  <br /><br />
                  Esta acción es irreversible y afectará a todos los usuarios.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteAllConfirm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={deleteAllItems}
                    className="flex-1"
                  >
                    Eliminar Todas
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
