"use client";

import { ResumeData } from "@/lib/resume-builder/types";

export default function ModernTemplate({ data }: { data: ResumeData }) {
  const { basic, globalSettings: gs, menuSections } = data;
  const enabled = menuSections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const sectionStyle = { marginTop: `${gs.sectionSpacing + 2}px` };
  const headingStyle = {
    fontSize: `${gs.headerSize * 0.5}px`,
    fontWeight: 600 as const,
    color: gs.themeColor,
    marginBottom: "8px",
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "8px",
  };
  const dot = <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: gs.themeColor, display: "inline-block", flexShrink: 0 }} />;

  const renderSection = (id: string) => {
    switch (id) {
      case "basic":
        return (
          <div key={id} style={{ background: gs.themeColor, color: "#fff", padding: `${gs.pagePadding * 0.6}px ${gs.pagePadding}px`, margin: `-${gs.pagePadding}px -${gs.pagePadding}px 0`, borderRadius: "0" }}>
            <h1 style={{ fontSize: `${gs.headerSize}px`, fontWeight: 700, margin: 0 }}>
              {basic.name || "Your Name"}
            </h1>
            {basic.title && <p style={{ fontSize: `${gs.baseFontSize + 2}px`, opacity: 0.9, marginTop: "2px" }}>{basic.title}</p>}
            <div style={{ fontSize: `${gs.baseFontSize - 1}px`, marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px 16px", opacity: 0.85 }}>
              {basic.email && <span>{basic.email}</span>}
              {basic.phone && <span>{basic.phone}</span>}
              {basic.location && <span>{basic.location}</span>}
              {basic.linkedin && <span>{basic.linkedin}</span>}
              {basic.website && <span>{basic.website}</span>}
            </div>
          </div>
        );
      case "summary":
        return basic.summary ? (
          <div key={id} style={{ ...sectionStyle, marginTop: `${gs.sectionSpacing + 8}px` }}>
            <h2 style={headingStyle}>{dot} Profile</h2>
            <p style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight, whiteSpace: "pre-wrap" }}>{basic.summary}</p>
          </div>
        ) : null;
      case "experience":
        return data.experience.filter((e) => e.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>{dot} Experience</h2>
            {data.experience.filter((e) => e.visible).map((exp) => (
              <div key={exp.id} style={{ marginBottom: "12px", paddingLeft: "16px", borderLeft: `2px solid ${gs.themeColor}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" as const, gap: "2px 8px" }}>
                  <strong style={{ fontSize: `${gs.baseFontSize + 1}px` }}>{exp.position}</strong>
                  <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#888", whiteSpace: "nowrap" }}>
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <div style={{ fontSize: `${gs.baseFontSize}px`, color: gs.themeColor, fontWeight: 500 }}>
                  {exp.company}{exp.location ? `, ${exp.location}` : ""}
                </div>
                {exp.description && (
                  <div style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight, marginTop: "4px", whiteSpace: "pre-wrap" }}>
                    {exp.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null;
      case "education":
        return data.education.filter((e) => e.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>{dot} Education</h2>
            {data.education.filter((e) => e.visible).map((edu) => (
              <div key={edu.id} style={{ marginBottom: "8px", paddingLeft: "16px", borderLeft: `2px solid ${gs.themeColor}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" as const, gap: "2px 8px" }}>
                  <strong style={{ fontSize: `${gs.baseFontSize + 1}px` }}>{edu.school}</strong>
                  <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#888" }}>{edu.startDate} - {edu.endDate}</span>
                </div>
                <div style={{ fontSize: `${gs.baseFontSize}px` }}>
                  {edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
                </div>
                {edu.description && <p style={{ fontSize: `${gs.baseFontSize}px`, marginTop: "2px", whiteSpace: "pre-wrap" }}>{edu.description}</p>}
              </div>
            ))}
          </div>
        ) : null;
      case "skills":
        return data.skills ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>{dot} Skills</h2>
            <div style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight + 0.2, whiteSpace: "pre-wrap" }}>{data.skills}</div>
          </div>
        ) : null;
      case "projects":
        return data.projects.filter((p) => p.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>{dot} Projects</h2>
            {data.projects.filter((p) => p.visible).map((proj) => (
              <div key={proj.id} style={{ marginBottom: "8px", paddingLeft: "16px", borderLeft: `2px solid ${gs.themeColor}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "2px 8px" }}>
                  <strong style={{ fontSize: `${gs.baseFontSize + 1}px` }}>{proj.name}</strong>
                  {proj.date && <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#888" }}>{proj.date}</span>}
                </div>
                {proj.role && <div style={{ fontSize: `${gs.baseFontSize}px`, color: gs.themeColor }}>{proj.role}</div>}
                {proj.description && <p style={{ fontSize: `${gs.baseFontSize}px`, marginTop: "2px", whiteSpace: "pre-wrap" }}>{proj.description}</p>}
              </div>
            ))}
          </div>
        ) : null;
      case "certifications":
        return data.certifications.filter((c) => c.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>{dot} Certifications</h2>
            {data.certifications.filter((c) => c.visible).map((cert) => (
              <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "2px 8px", marginBottom: "4px" }}>
                <span style={{ fontSize: `${gs.baseFontSize}px` }}><strong>{cert.name}</strong>{cert.issuer ? ` - ${cert.issuer}` : ""}</span>
                {cert.date && <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#888" }}>{cert.date}</span>}
              </div>
            ))}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: gs.fontFamily, padding: `${gs.pagePadding}px`, color: "#222", lineHeight: gs.lineHeight, overflowWrap: "break-word", wordBreak: "break-word" }}>
      {enabled.map((s) => renderSection(s.id))}
    </div>
  );
}
