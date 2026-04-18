"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THEME_COLORS, FONT_OPTIONS } from "@/lib/resume-builder/types";
import type { GlobalSettings } from "@/lib/resume-builder/types";

interface Props {
  settings: GlobalSettings;
  onChange: (settings: GlobalSettings) => void;
}

export default function SettingsPanel({ settings, onChange }: Props) {
  const update = (field: keyof GlobalSettings, value: string | number) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Theme Color */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Theme Color</Label>
        <div className="flex flex-wrap gap-2">
          {THEME_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => update("themeColor", color)}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: settings.themeColor === color ? "#000" : "transparent",
                boxShadow: settings.themeColor === color ? "0 0 0 2px white, 0 0 0 4px " + color : "none",
              }}
            />
          ))}
          <div className="relative">
            <input
              type="color"
              value={settings.themeColor}
              onChange={(e) => update("themeColor", e.target.value)}
              className="w-7 h-7 rounded-full cursor-pointer border-0 p-0"
              style={{ appearance: "none", WebkitAppearance: "none" }}
            />
          </div>
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">Font</Label>
        <Select value={settings.fontFamily} onValueChange={(v) => update("fontFamily", v ?? settings.fontFamily)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((f) => (
              <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Base Font Size</Label>
          <div className="flex items-center gap-2">
            <Input
              type="range"
              min={8}
              max={14}
              step={0.5}
              value={settings.baseFontSize}
              onChange={(e) => update("baseFontSize", parseFloat(e.target.value))}
              className="h-8"
            />
            <span className="text-xs text-muted-foreground w-8">{settings.baseFontSize}</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Header Size</Label>
          <div className="flex items-center gap-2">
            <Input
              type="range"
              min={18}
              max={36}
              step={1}
              value={settings.headerSize}
              onChange={(e) => update("headerSize", parseInt(e.target.value))}
              className="h-8"
            />
            <span className="text-xs text-muted-foreground w-8">{settings.headerSize}</span>
          </div>
        </div>
      </div>

      {/* Spacing */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Page Padding</Label>
          <div className="flex items-center gap-2">
            <Input
              type="range"
              min={20}
              max={60}
              step={2}
              value={settings.pagePadding}
              onChange={(e) => update("pagePadding", parseInt(e.target.value))}
              className="h-8"
            />
            <span className="text-xs text-muted-foreground w-8">{settings.pagePadding}</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Section Spacing</Label>
          <div className="flex items-center gap-2">
            <Input
              type="range"
              min={8}
              max={32}
              step={2}
              value={settings.sectionSpacing}
              onChange={(e) => update("sectionSpacing", parseInt(e.target.value))}
              className="h-8"
            />
            <span className="text-xs text-muted-foreground w-8">{settings.sectionSpacing}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium">Line Height</Label>
        <div className="flex items-center gap-2">
          <Input
            type="range"
            min={1.0}
            max={2.0}
            step={0.1}
            value={settings.lineHeight}
            onChange={(e) => update("lineHeight", parseFloat(e.target.value))}
            className="h-8"
          />
          <span className="text-xs text-muted-foreground w-8">{settings.lineHeight}</span>
        </div>
      </div>
    </div>
  );
}
