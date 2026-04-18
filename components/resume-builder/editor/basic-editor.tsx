"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BasicInfo } from "@/lib/resume-builder/types";

interface Props {
  basic: BasicInfo;
  onChange: (basic: BasicInfo) => void;
}

export default function BasicEditor({ basic, onChange }: Props) {
  const update = (field: keyof BasicInfo, value: string) => {
    onChange({ ...basic, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Full Name</Label>
          <Input value={basic.name} onChange={(e) => update("name", e.target.value)} placeholder="Aimun Naeem" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Title</Label>
          <Input value={basic.title} onChange={(e) => update("title", e.target.value)} placeholder="Senior Accountant | CPA" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input value={basic.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Phone</Label>
          <Input value={basic.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 234 567 8900" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Location</Label>
          <Input value={basic.location} onChange={(e) => update("location", e.target.value)} placeholder="City, Country" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">LinkedIn</Label>
          <Input value={basic.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="linkedin.com/in/..." />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Website</Label>
        <Input value={basic.website} onChange={(e) => update("website", e.target.value)} placeholder="yourwebsite.com" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Summary</Label>
        <Textarea value={basic.summary} onChange={(e) => update("summary", e.target.value)} placeholder="Brief professional summary..." rows={4} />
      </div>
    </div>
  );
}
