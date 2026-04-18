"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import type { Experience } from "@/lib/resume-builder/types";

interface Props {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
}

export default function ExperienceEditor({ experiences, onChange }: Props) {
  const add = () => {
    onChange([
      ...experiences,
      {
        id: crypto.randomUUID(),
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        visible: true,
      },
    ]);
  };

  const update = (id: string, field: keyof Experience, value: string | boolean) => {
    onChange(experiences.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const remove = (id: string) => {
    onChange(experiences.filter((e) => e.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...experiences];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {experiences.map((exp, i) => (
        <div key={exp.id} className="border border-border rounded-lg p-3 space-y-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={() => moveUp(i)} className="text-muted-foreground hover:text-foreground p-1" title="Move up">
                <GripVertical className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-medium text-muted-foreground">
                {exp.position || exp.company || `Experience ${i + 1}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => update(exp.id, "visible", !exp.visible)} className="p-1 text-muted-foreground hover:text-foreground">
                {exp.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => remove(exp.id)} className="p-1 text-destructive hover:text-destructive/80">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Position</Label>
              <Input value={exp.position} onChange={(e) => update(exp.id, "position", e.target.value)} placeholder="Senior Accountant" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Company</Label>
              <Input value={exp.company} onChange={(e) => update(exp.id, "company", e.target.value)} placeholder="Company Name" className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <Input value={exp.location} onChange={(e) => update(exp.id, "location", e.target.value)} placeholder="City" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start</Label>
              <Input value={exp.startDate} onChange={(e) => update(exp.id, "startDate", e.target.value)} placeholder="Jan 2022" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End</Label>
              <Input
                value={exp.current ? "Present" : exp.endDate}
                onChange={(e) => update(exp.id, "endDate", e.target.value)}
                placeholder="Present"
                disabled={exp.current}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={exp.current} onCheckedChange={(v) => update(exp.id, "current", v ?? false)} />
            <Label className="text-xs">Currently working here</Label>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description (use bullet points with - or *)</Label>
            <Textarea value={exp.description} onChange={(e) => update(exp.id, "description", e.target.value)} placeholder="- Managed monthly close process&#10;- Prepared financial statements" rows={4} className="text-sm" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1" /> Add Experience
      </Button>
    </div>
  );
}
