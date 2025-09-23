"use client";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

type Score = 0 | 1 | 2 | null;

interface Props {
  index: number;
  itemCode: string;
  question: string;
  value: Score;
  notApplicable: boolean;
  evidence: string;
  observations: string;
  onChange: (
    patch: Partial<
      Pick<Props, "value" | "notApplicable" | "evidence" | "observations">
    >
  ) => void;
}

export function QuestionItem({
  index,
  itemCode,
  question,
  value,
  notApplicable,
  evidence,
  observations,
  onChange,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-4">
        <Label className="font-medium">
          {itemCode}. {question}
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

      <div className="grid gap-2">
        <Label htmlFor={`ev-${index}`}>Evidencia (opcional)</Label>
        <Textarea
          id={`ev-${index}`}
          value={evidence}
          onChange={(e) => onChange({ evidence: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`ob-${index}`}>Observaciones (opcional)</Label>
        <Textarea
          id={`ob-${index}`}
          value={observations}
          onChange={(e) => onChange({ observations: e.target.value })}
        />
      </div>
    </div>
  );
}
