"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import type { Project } from "@/lib/resume-builder/types";

interface Props {
  projects: Project[];
  onChange: (projects: Project[]) => void;
}

export default function ProjectsEditor({ projects, onChange }: Props) {
  const add = () => {
    onChange([
      ...projects,
      { id: crypto.randomUUID(), name: "", role: "", date: "", description: "", link: "", visible: true },
    ]);
  };

  const update = (id: string, field: keyof Project, value: string | boolean) => {
    onChange(projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const remove = (id: string) => {
    onChange(projects.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      {projects.map((proj, i) => (
        <div key={proj.id} className="border border-border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{proj.name || `Project ${i + 1}`}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => update(proj.id, "visible", !proj.visible)} className="p-1 text-muted-foreground hover:text-foreground">
                {proj.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => remove(proj.id)} className="p-1 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Project Name</Label>
              <Input value={proj.name} onChange={(e) => update(proj.id, "name", e.target.value)} placeholder="Project name" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Input value={proj.role} onChange={(e) => update(proj.id, "role", e.target.value)} placeholder="Lead" className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input value={proj.date} onChange={(e) => update(proj.id, "date", e.target.value)} placeholder="2023" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Link</Label>
              <Input value={proj.link} onChange={(e) => update(proj.id, "link", e.target.value)} placeholder="https://..." className="h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea value={proj.description} onChange={(e) => update(proj.id, "description", e.target.value)} rows={3} className="text-sm" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1" /> Add Project
      </Button>
    </div>
  );
}
