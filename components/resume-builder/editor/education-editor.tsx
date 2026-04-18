"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import type { Education } from "@/lib/resume-builder/types";

interface Props {
  education: Education[];
  onChange: (education: Education[]) => void;
}

export default function EducationEditor({ education, onChange }: Props) {
  const add = () => {
    onChange([
      ...education,
      {
        id: crypto.randomUUID(),
        school: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: "",
        description: "",
        visible: true,
      },
    ]);
  };

  const update = (id: string, field: keyof Education, value: string | boolean) => {
    onChange(education.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const remove = (id: string) => {
    onChange(education.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-4">
      {education.map((edu, i) => (
        <div key={edu.id} className="border border-border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{edu.school || `Education ${i + 1}`}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => update(edu.id, "visible", !edu.visible)} className="p-1 text-muted-foreground hover:text-foreground">
                {edu.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => remove(edu.id)} className="p-1 text-destructive hover:text-destructive/80">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">School</Label>
              <Input value={edu.school} onChange={(e) => update(edu.id, "school", e.target.value)} placeholder="University" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Degree</Label>
              <Input value={edu.degree} onChange={(e) => update(edu.id, "degree", e.target.value)} placeholder="Bachelor of Science" className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Field of Study</Label>
              <Input value={edu.field} onChange={(e) => update(edu.id, "field", e.target.value)} placeholder="Accounting" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start</Label>
              <Input value={edu.startDate} onChange={(e) => update(edu.id, "startDate", e.target.value)} placeholder="2016" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End</Label>
              <Input value={edu.endDate} onChange={(e) => update(edu.id, "endDate", e.target.value)} placeholder="2020" className="h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">GPA (optional)</Label>
            <Input value={edu.gpa} onChange={(e) => update(edu.id, "gpa", e.target.value)} placeholder="3.8" className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea value={edu.description} onChange={(e) => update(edu.id, "description", e.target.value)} placeholder="Relevant coursework, honors..." rows={2} className="text-sm" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1" /> Add Education
      </Button>
    </div>
  );
}
