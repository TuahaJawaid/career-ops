"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderOpen,
  Award,
  Settings,
  Download,
  Save,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  FileText,
  Layout,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import BasicEditor from "@/components/resume-builder/editor/basic-editor";
import ExperienceEditor from "@/components/resume-builder/editor/experience-editor";
import EducationEditor from "@/components/resume-builder/editor/education-editor";
import SkillsEditor from "@/components/resume-builder/editor/skills-editor";
import ProjectsEditor from "@/components/resume-builder/editor/projects-editor";
import CertificationsEditor from "@/components/resume-builder/editor/certifications-editor";
import SettingsPanel from "@/components/resume-builder/editor/settings-panel";

import ClassicTemplate from "@/components/resume-builder/templates/classic";
import ModernTemplate from "@/components/resume-builder/templates/modern";
import MinimalTemplate from "@/components/resume-builder/templates/minimal";
import ElegantTemplate from "@/components/resume-builder/templates/elegant";

import {
  createDefaultResume,
  type ResumeData,
  type MenuSection,
} from "@/lib/resume-builder/types";

const TEMPLATES = [
  { id: "classic", name: "Classic", description: "Traditional clean layout" },
  { id: "modern", name: "Modern", description: "Bold header with accents" },
  { id: "minimal", name: "Minimal", description: "Light and airy" },
  { id: "elegant", name: "Elegant", description: "Refined with small caps" },
];

const SECTION_ICONS: Record<string, typeof User> = {
  basic: User,
  summary: FileText,
  experience: Briefcase,
  education: GraduationCap,
  skills: Wrench,
  projects: FolderOpen,
  certifications: Award,
};

const STORAGE_KEY = "career-ops-resume-builder";

function getTemplateComponent(templateId: string) {
  switch (templateId) {
    case "modern": return ModernTemplate;
    case "minimal": return MinimalTemplate;
    case "elegant": return ElegantTemplate;
    default: return ClassicTemplate;
  }
}

export default function ResumeBuilderPage() {
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return createDefaultResume();
  });

  const [activeSection, setActiveSection] = useState("basic");
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-save to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...resumeData, updatedAt: new Date().toISOString() }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [resumeData]);

  const updateField = useCallback(<K extends keyof ResumeData>(field: K, value: ResumeData[K]) => {
    setResumeData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setResumeData((prev) => ({
      ...prev,
      menuSections: prev.menuSections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  }, []);

  const moveSection = useCallback((sectionId: string, direction: "up" | "down") => {
    setResumeData((prev) => {
      const sections = [...prev.menuSections].sort((a, b) => a.order - b.order);
      const idx = sections.findIndex((s) => s.id === sectionId);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sections.length) return prev;
      // Don't allow moving above "basic"
      if (sections[swapIdx].id === "basic" && direction === "up") return prev;
      const oldOrder = sections[idx].order;
      sections[idx] = { ...sections[idx], order: sections[swapIdx].order };
      sections[swapIdx] = { ...sections[swapIdx], order: oldOrder };
      return { ...prev, menuSections: sections };
    });
  }, []);

  const handleExportPDF = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !previewRef.current) return;

    const html = previewRef.current.innerHTML;
    printWindow.document.write(`<!DOCTYPE html>
<html><head>
<title>${resumeData.basic.name || "Resume"}</title>
<style>
  @page { size: letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 8.5in; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head><body>${html}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  }, [resumeData.basic.name]);

  const handleNewResume = useCallback(() => {
    if (confirm("Start a new resume? Your current progress is saved in browser.")) {
      const fresh = createDefaultResume();
      setResumeData(fresh);
      setActiveSection("basic");
      toast.success("New resume created");
    }
  }, []);

  const handleExportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(resumeData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resumeData.basic.name || "resume"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON");
  }, [resumeData]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as ResumeData;
          if (data.basic && data.menuSections) {
            setResumeData(data);
            toast.success("Resume imported");
          } else {
            toast.error("Invalid resume file");
          }
        } catch {
          toast.error("Failed to parse file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const TemplateComponent = getTemplateComponent(resumeData.templateId);
  const sortedSections = [...resumeData.menuSections].sort((a, b) => a.order - b.order);

  const renderActiveEditor = () => {
    if (showSettings) {
      return <SettingsPanel settings={resumeData.globalSettings} onChange={(s) => updateField("globalSettings", s)} />;
    }
    if (showTemplates) {
      return (
        <div className="space-y-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => { updateField("templateId", t.id); toast.success(`Template: ${t.name}`); }}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                resumeData.templateId === t.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="font-medium text-sm">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.description}</div>
            </button>
          ))}
        </div>
      );
    }
    switch (activeSection) {
      case "basic":
      case "summary":
        return <BasicEditor basic={resumeData.basic} onChange={(b) => updateField("basic", b)} />;
      case "experience":
        return <ExperienceEditor experiences={resumeData.experience} onChange={(e) => updateField("experience", e)} />;
      case "education":
        return <EducationEditor education={resumeData.education} onChange={(e) => updateField("education", e)} />;
      case "skills":
        return <SkillsEditor skills={resumeData.skills} onChange={(s) => updateField("skills", s)} />;
      case "projects":
        return <ProjectsEditor projects={resumeData.projects} onChange={(p) => updateField("projects", p)} />;
      case "certifications":
        return <CertificationsEditor certifications={resumeData.certifications} onChange={(c) => updateField("certifications", c)} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/resumes" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Input
            value={resumeData.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="h-7 w-48 text-sm font-medium border-none bg-transparent px-1 focus-visible:ring-1"
            placeholder="Resume title"
          />
          <Badge variant="secondary" className="text-[10px]">Auto-saved</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleNewResume} className="h-7 text-xs">
            New
          </Button>
          <Button variant="ghost" size="sm" onClick={handleImportJSON} className="h-7 text-xs">
            Import
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportJSON} className="h-7 text-xs">
            <Save className="h-3 w-3 mr-1" /> JSON
          </Button>
          <Button variant="default" size="sm" onClick={handleExportPDF} className="h-7 text-xs">
            <Download className="h-3 w-3 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Section Nav - narrow sidebar */}
        <div className="w-14 border-r border-border bg-muted/30 flex flex-col items-center py-2 gap-1 shrink-0">
          {sortedSections.map((section) => {
            const Icon = SECTION_ICONS[section.id] || FileText;
            const isActive = activeSection === section.id && !showSettings && !showTemplates;
            return (
              <button
                key={section.id}
                onClick={() => { setActiveSection(section.id); setShowSettings(false); setShowTemplates(false); }}
                className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                } ${!section.enabled ? "opacity-40" : ""}`}
                title={section.title}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[8px] leading-none">{section.title.slice(0, 5)}</span>
              </button>
            );
          })}
          <div className="border-t border-border w-6 my-1" />
          <button
            onClick={() => { setShowTemplates(true); setShowSettings(false); }}
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${showTemplates ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            title="Templates"
          >
            <Layout className="h-4 w-4" />
            <span className="text-[8px] leading-none">Templ</span>
          </button>
          <button
            onClick={() => { setShowSettings(true); setShowTemplates(false); }}
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${showSettings ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
            <span className="text-[8px] leading-none">Style</span>
          </button>
        </div>

        {/* Editor Panel */}
        <div className="w-[340px] border-r border-border flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {showSettings ? "Style Settings" : showTemplates ? "Templates" : sortedSections.find((s) => s.id === activeSection)?.title || "Editor"}
            </h3>
            {!showSettings && !showTemplates && activeSection !== "basic" && (
              <div className="flex items-center gap-1">
                <button onClick={() => moveSection(activeSection, "up")} className="p-1 text-muted-foreground hover:text-foreground">
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button onClick={() => moveSection(activeSection, "down")} className="p-1 text-muted-foreground hover:text-foreground">
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button onClick={() => toggleSection(activeSection)} className="p-1 text-muted-foreground hover:text-foreground">
                  {resumeData.menuSections.find((s) => s.id === activeSection)?.enabled ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </button>
              </div>
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3">
              {renderActiveEditor()}
            </div>
          </ScrollArea>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 bg-muted/20 overflow-auto flex justify-center py-6 px-4">
          <div
            ref={previewRef}
            className="bg-white shadow-xl border border-border/50"
            style={{
              width: "8.5in",
              minHeight: "11in",
              maxWidth: "100%",
            }}
          >
            <TemplateComponent data={resumeData} />
          </div>
        </div>
      </div>
    </div>
  );
}
