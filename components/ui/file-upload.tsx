"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Upload, X, File, Image, Video, FileText, AlertCircle } from "lucide-react";

interface FileUploadProps {
  onFilesUploaded?: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
  error?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  "video/mp4",
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const DEFAULT_MAX_FILE_SIZE = 50; // 50MB

export function FileUpload({
  onFilesUploaded,
  maxFiles = 10,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent component when files change
  useEffect(() => {
    if (onFilesUploaded) {
      onFilesUploaded(uploadedFiles.map(f => f.file));
    }
  }, [uploadedFiles, onFilesUploaded]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no soportado. Tipos permitidos: ${acceptedTypes
        .map((type) => type.split("/")[1])
        .join(", ")}`;
    }

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `El archivo es demasiado grande. Tamaño máximo: ${maxFileSize}MB`;
    }

    return null;
  };

  const createFilePreview = (file: File): string | undefined => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return undefined;
  };

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles: UploadedFile[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push({
            file,
            id: Math.random().toString(36).substr(2, 9),
            preview: createFilePreview(file),
          });
        }
      });

      if (errors.length > 0) {
        alert(`Errores de validación:\n${errors.join("\n")}`);
      }

      if (validFiles.length > 0) {
        setUploadedFiles((prev: UploadedFile[]) => {
          const newFiles = [...prev, ...validFiles].slice(0, maxFiles);
          return newFiles;
        });
      }
    },
    [acceptedTypes, maxFileSize, maxFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev: UploadedFile[]) => {
      const newFiles = prev.filter((f: UploadedFile) => f.id !== id);
      return newFiles;
    });
  }, []);

  const getFileIcon = (file: File): React.ReactElement => {
    if (file.type.startsWith("video/")) {
      return <Video className="h-8 w-8 text-red-500" />;
    } else if (file.type.startsWith("image/")) {
      return <Image className="h-8 w-8 text-green-500" />;
    } else if (file.type === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          uploadedFiles.length > 0 && "mb-6"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Arrastra archivos multimedia aquí
        </h3>
        <p className="text-gray-500 mb-4">
          Soporta MP4, PDF, JPG y PNG (máximo {maxFileSize}MB por archivo)
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          Seleccionar archivos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">
            Archivos seleccionados ({uploadedFiles.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((uploadedFile: UploadedFile) => (
              <div
                key={uploadedFile.id}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getFileIcon(uploadedFile.file)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(uploadedFile.id)}
                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* File Preview */}
                {uploadedFile.preview && (
                  <div className="mt-2">
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="w-full h-24 object-cover rounded border"
                    />
                  </div>
                )}

                {/* Error Display */}
                {uploadedFile.error && (
                  <div className="mt-2 flex items-center space-x-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">{uploadedFile.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-600">Subiendo archivos...</span>
          </div>
        </div>
      )}
    </div>
  );
}
