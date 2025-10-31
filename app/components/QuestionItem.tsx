"use client";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

type Score = 0 | 1 | 2 | null;

interface Props {
  index: number;
  itemCode: string;
  displayNumber?: number; // Número de visualización secuencial
  question: string;
  value: Score;
  notApplicable: boolean;
  evidence: string;
  observations: string;
  evidenceFiles?: string[]; // Archivos multimedia subidos por el admin
  onChange: (
    patch: Partial<
      Pick<Props, "value" | "notApplicable" | "evidence" | "observations">
    >
  ) => void;
}

export function QuestionItem({
  index,
  itemCode,
  displayNumber,
  question,
  value,
  notApplicable,
  evidence,
  observations,
  evidenceFiles = [],
  onChange,
}: Props) {
  const { isAdmin } = useAuth();
  
  // Helper para obtener el tipo de archivo
  const getFileType = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    if (['mp4', 'webm', 'ogg'].includes(ext || '')) return 'video';
    return 'unknown';
  };

  // Helper para obtener el nombre del archivo
  const getFileName = (url: string) => {
    return url.split('/').pop() || 'archivo';
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-4">
        <Label className="font-medium">
          {displayNumber || itemCode}. {question}
        </Label>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`na-${index}`}
            checked={notApplicable}
            onCheckedChange={(c) =>
              onChange({ notApplicable: Boolean(c), value: c ? null : value })
            }
          />
          <Label htmlFor={`na-${index}`}>No aplica</Label>
        </div>
      </div>

      <RadioGroup
        value={value !== null ? String(value) : ""}
        onValueChange={(v) => onChange({ value: Number(v) as 0 | 1 | 2 })}
        className="flex gap-6"
      >
        {[0, 1, 2].map((opt) => (
          <div key={opt} className="flex items-center space-x-2">
            <RadioGroupItem
              id={`q-${index}-${opt}`}
              value={String(opt)}
              disabled={notApplicable}
            />
            <Label htmlFor={`q-${index}-${opt}`}>{opt}</Label>
          </div>
        ))}
      </RadioGroup>

      {/* Archivos multimedia de evidencia */}
      {evidenceFiles && evidenceFiles.length > 0 && (
        <div className="grid gap-2">
          <Label className="text-sm font-medium text-blue-700">
            📎 Archivos de Evidencia ({evidenceFiles.length})
          </Label>
          <div className="space-y-2">
            {evidenceFiles.map((fileUrl, idx) => {
              const fileType = getFileType(fileUrl);
              const fileName = getFileName(fileUrl);

              return (
                <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                  {fileType === 'image' && (
                    <div className="space-y-2">
                      <img
                        src={fileUrl}
                        alt={`Evidencia ${idx + 1}`}
                        className="max-w-full h-auto rounded-md"
                        style={{ maxHeight: '300px' }}
                      />
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline block"
                      >
                        🔗 Abrir imagen en nueva pestaña
                      </a>
                    </div>
                  )}

                  {fileType === 'pdf' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-2xl">📄</span>
                        <span className="font-medium">{fileName}</span>
                      </div>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        📖 Ver PDF
                      </a>
                    </div>
                  )}

                  {fileType === 'video' && (
                    <div className="space-y-2">
                      <video controls className="w-full max-w-md rounded-md">
                        <source src={fileUrl} type="video/mp4" />
                        Tu navegador no soporta video.
                      </video>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline block"
                      >
                        🔗 Abrir video en nueva pestaña
                      </a>
                    </div>
                  )}

                  {fileType === 'unknown' && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      📎 {fileName}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evidencia en texto - visible para admin siempre, para usuarios solo si hay contenido */}
      {(isAdmin || evidence) && (
        <div className="grid gap-2">
          <Label htmlFor={`ev-${index}`}>
            Evidencia adicional (texto opcional)
            {isAdmin && (
              <span className="text-xs text-gray-500 ml-1">(editable)</span>
            )}
          </Label>
          <Textarea
            id={`ev-${index}`}
            value={evidence}
            onChange={(e) => onChange({ evidence: e.target.value })}
            readOnly={!isAdmin}
            className={!isAdmin ? "bg-gray-50 cursor-not-allowed" : ""}
            placeholder={
              isAdmin ? "Agregar evidencia en texto..." : "Solo visible para usuarios"
            }
          />
        </div>
      )}

      {/* Comentarios - visible y editable para todos los usuarios */}
      <div className="grid gap-2">
        <Label htmlFor={`ob-${index}`}>
          Comentarios adicionales (opcional)
        </Label>
        <Textarea
          id={`ob-${index}`}
          value={observations}
          onChange={(e) => onChange({ observations: e.target.value })}
          placeholder="Agrega aquí cualquier comentario adicional sobre esta pregunta..."
        />
      </div>
    </div>
  );
}
