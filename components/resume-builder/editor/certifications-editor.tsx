"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import type { Certification } from "@/lib/resume-builder/types";

interface Props {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
}

export default function CertificationsEditor({ certifications, onChange }: Props) {
  const add = () => {
    onChange([
      ...certifications,
      { id: crypto.randomUUID(), name: "", issuer: "", date: "", visible: true },
    ]);
  };

  const update = (id: string, field: keyof Certification, value: string | boolean) => {
    onChange(certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const remove = (id: string) => {
    onChange(certifications.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      {certifications.map((cert, i) => (
        <div key={cert.id} className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{cert.name || `Certification ${i + 1}`}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => update(cert.id, "visible", !cert.visible)} className="p-1 text-muted-foreground hover:text-foreground">
                {cert.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => remove(cert.id)} className="p-1 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={cert.name} onChange={(e) => update(cert.id, "name", e.target.value)} placeholder="CPA" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Issuer</Label>
              <Input value={cert.issuer} onChange={(e) => update(cert.id, "issuer", e.target.value)} placeholder="AICPA" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input value={cert.date} onChange={(e) => update(cert.id, "date", e.target.value)} placeholder="2021" className="h-8 text-sm" />
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1" /> Add Certification
      </Button>
    </div>
  );
}
