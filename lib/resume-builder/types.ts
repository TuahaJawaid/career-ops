export interface BasicInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string;
  visible: boolean;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  visible: boolean;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  date: string;
  description: string;
  link: string;
  visible: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  visible: boolean;
}

export interface MenuSection {
  id: string;
  title: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface GlobalSettings {
  themeColor: string;
  fontFamily: string;
  baseFontSize: number;
  pagePadding: number;
  sectionSpacing: number;
  lineHeight: number;
  headerSize: number;
}

export const THEME_COLORS = [
  "#1a365d", // Navy
  "#000000", // Black
  "#1e40af", // Blue
  "#0f766e", // Teal
  "#7c3aed", // Purple
  "#be185d", // Pink
  "#b91c1c", // Red
  "#15803d", // Green
  "#c2410c", // Orange
  "#475569", // Slate
];

export const FONT_OPTIONS = [
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "Calibri, 'Gill Sans', sans-serif", label: "Calibri" },
  { value: "'Helvetica Neue', Arial, sans-serif", label: "Helvetica" },
  { value: "Garamond, serif", label: "Garamond" },
  { value: "'Segoe UI', sans-serif", label: "Segoe UI" },
  { value: "system-ui, sans-serif", label: "System UI" },
];

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  layout: string;
}

export interface ResumeData {
  id: string;
  title: string;
  templateId: string;
  basic: BasicInfo;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
  skills: string;
  menuSections: MenuSection[];
  globalSettings: GlobalSettings;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_MENU_SECTIONS: MenuSection[] = [
  { id: "basic", title: "Basic Info", icon: "User", enabled: true, order: 0 },
  { id: "summary", title: "Summary", icon: "FileText", enabled: true, order: 1 },
  { id: "experience", title: "Experience", icon: "Briefcase", enabled: true, order: 2 },
  { id: "education", title: "Education", icon: "GraduationCap", enabled: true, order: 3 },
  { id: "skills", title: "Skills", icon: "Wrench", enabled: true, order: 4 },
  { id: "projects", title: "Projects", icon: "FolderOpen", enabled: true, order: 5 },
  { id: "certifications", title: "Certifications", icon: "Award", enabled: true, order: 6 },
];

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  themeColor: "#1a365d",
  fontFamily: "Calibri, 'Gill Sans', sans-serif",
  baseFontSize: 11,
  pagePadding: 40,
  sectionSpacing: 16,
  lineHeight: 1.4,
  headerSize: 24,
};

export function createDefaultResume(): ResumeData {
  return {
    id: crypto.randomUUID(),
    title: "Untitled Resume",
    templateId: "classic",
    basic: {
      name: "Aimun Naeem",
      title: "Senior Accountant | CPA",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      website: "",
      summary: "",
    },
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    skills: "",
    menuSections: [...DEFAULT_MENU_SECTIONS],
    globalSettings: { ...DEFAULT_GLOBAL_SETTINGS },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
