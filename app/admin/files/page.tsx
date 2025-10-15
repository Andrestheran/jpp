"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserHeader } from "@/components/auth/UserHeader";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/auth";
import { Upload, Trash2, Download, Eye } from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  created_at: string;
}

export default function AdminFilesPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('multimedia')
          .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('multimedia')
          .getPublicUrl(filePath);

        // Save file metadata to database
        const { data: dbData, error: dbError } = await supabase
          .from('uploaded_files')
          .insert({
            name: file.name,
            type: file.type,
            size: file.size,
            url: publicUrl,
            file_path: filePath
          })
          .select()
          .single();

        if (dbError) throw dbError;

        return dbData;
      });

      const uploadedData = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...uploadedData]);
      setSelectedFiles([]);
      
      alert(`${uploadedData.length} archivo(s) subido(s) exitosamente`);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error al subir archivos. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('multimedia')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      alert('Archivo eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error al eliminar archivo. Inténtalo de nuevo.');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) {
      return <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
        <span className="text-red-600 text-xs font-bold">MP4</span>
      </div>;
    } else if (type.startsWith('image/')) {
      return <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
        <span className="text-green-600 text-xs font-bold">IMG</span>
      </div>;
    } else if (type === 'application/pdf') {
      return <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
        <span className="text-red-600 text-xs font-bold">PDF</span>
      </div>;
    }
    return <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
      <span className="text-gray-600 text-xs font-bold">FILE</span>
    </div>;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserHeader />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Gestión de Archivos Multimedia</h1>
            <div className="flex space-x-2">
              <Button
                onClick={uploadFiles}
                disabled={selectedFiles.length === 0 || isUploading}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>
                  {isUploading ? 'Subiendo...' : `Subir ${selectedFiles.length} archivo(s)`}
                </span>
              </Button>
            </div>
          </div>

          {/* File Upload Component */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Subir Archivos</h2>
            <FileUpload
              onFilesUploaded={handleFilesSelected}
              maxFiles={20}
              maxFileSize={100} // 100MB
              acceptedTypes={[
                "video/mp4",
                "application/pdf", 
                "image/jpeg",
                "image/jpg",
                "image/png"
              ]}
            />
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Archivos Subidos</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                        className="flex items-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>Descargar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFile(file.id, file.url)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Eliminar</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadedFiles.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay archivos subidos
              </h3>
              <p className="text-gray-500">
                Usa el área de arrastrar y soltar arriba para subir archivos multimedia.
              </p>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
