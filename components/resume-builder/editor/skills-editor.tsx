"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  skills: string;
  onChange: (skills: string) => void;
}

export default function SkillsEditor({ skills, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Skills (separate categories with line breaks)</Label>
      <Textarea
        value={skills}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"Accounting: GAAP, IFRS, Revenue Recognition (ASC 606)\nSoftware: SAP, Oracle, NetSuite, QuickBooks, Excel (Advanced)\nCertifications: CPA (Active), CMA"}
        rows={8}
        className="text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Tip: Use category headers followed by colon, then list skills separated by commas.
      </p>
    </div>
  );
}
