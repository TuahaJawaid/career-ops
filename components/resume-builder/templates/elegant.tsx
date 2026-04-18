"use client";

import { ResumeData } from "@/lib/resume-builder/types";

export default function ElegantTemplate({ data }: { data: ResumeData }) {
  const { basic, globalSettings: gs, menuSections } = data;
  const enabled = menuSections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const sectionStyle = { marginTop: `${gs.sectionSpacing + 4}px` };
  const headingStyle = {
    fontSize: `${gs.baseFontSize + 2}px`,
    fontWeight: 600 as const,
    color: gs.themeColor,
    marginBottom: "6px",
    paddingBottom: "4px",
    borderBottom: `1px solid ${gs.themeColor}40`,
    fontVariant: "small-caps" as const,
    letterSpacing: "0.06em",
  };

  const renderSection = (id: string) => {
    switch (id) {
      case "basic":
        return (
          <div key={id} style={{ textAlign: "center", paddingBottom: `${gs.sectionSpacing}px`, borderBottom: `2px double ${gs.themeColor}` }}>
            <h1 style={{ fontSize: `${gs.headerSize + 4}px`, fontWeight: 300, letterSpacing: "0.12em", color: gs.themeColor, margin: 0, fontVariant: "small-caps" }}>
              {basic.name || "Your Name"}
            </h1>
            {basic.title && <p style={{ fontSize: `${gs.baseFontSize + 1}px`, color: "#666", marginTop: "4px", fontStyle: "italic" }}>{basic.title}</p>}
            <div style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#777", marginTop: "8px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 6px" }}>
              {[basic.email, basic.phone, basic.location, basic.linkedin, basic.website].filter(Boolean).map((item, i, arr) => (
                <span key={i}>{item}{i < arr.length - 1 ? <span style={{ margin: "0 4px", color: gs.themeColor }}>&middot;</span> : ""}</span>
              ))}
            </div>
          </div>
        );
      case "summary":
        return basic.summary ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Profile</h2>
            <p style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight, fontStyle: "italic", color: "#555", whiteSpace: "pre-wrap" }}>{basic.summary}</p>
          </div>
        ) : null;
      case "experience":
        return data.experience.filter((e) => e.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Professional Experience</h2>
            {data.experience.filter((e) => e.visible).map((exp, i) => (
              <div key={exp.id} style={{ marginBottom: "12px", paddingBottom: i < data.experience.filter(e => e.visible).length - 1 ? "8px" : "0", borderBottom: i < data.experience.filter(e => e.visible).length - 1 ? `1px dotted #e5e5e5` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: `${gs.baseFontSize + 1}px`, color: "#222" }}>{exp.position}</strong>
                  <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#999", fontStyle: "italic" }}>{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                </div>
                <div style={{ fontSize: `${gs.baseFontSize}px`, color: gs.themeColor, fontWeight: 500, fontStyle: "italic" }}>
                  {exp.company}{exp.location ? ` | ${exp.location}` : ""}
                </div>
                {exp.description && <div style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight, marginTop: "4px", whiteSpace: "pre-wrap" }}>{exp.description}</div>}
              </div>
            ))}
          </div>
        ) : null;
      case "education":
        return data.education.filter((e) => e.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Education</h2>
            {data.education.filter((e) => e.visible).map((edu) => (
              <div key={edu.id} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: `${gs.baseFontSize + 1}px` }}>{edu.school}</strong>
                  <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#999", fontStyle: "italic" }}>{edu.startDate} - {edu.endDate}</span>
                </div>
                <div style={{ fontSize: `${gs.baseFontSize}px`, fontStyle: "italic" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.gpa ? ` | GPA: ${edu.gpa}` : ""}</div>
              </div>
            ))}
          </div>
        ) : null;
      case "skills":
        return data.skills ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Skills & Expertise</h2>
            <div style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight + 0.2, whiteSpace: "pre-wrap" }}>{data.skills}</div>
          </div>
        ) : null;
      case "projects":
        return data.projects.filter((p) => p.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Projects</h2>
            {data.projects.filter((p) => p.visible).map((proj) => (
              <div key={proj.id} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{proj.name}</strong>
                  {proj.date && <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#999", fontStyle: "italic" }}>{proj.date}</span>}
                </div>
                {proj.role && <div style={{ fontSize: `${gs.baseFontSize}px`, color: gs.themeColor, fontStyle: "italic" }}>{proj.role}</div>}
                {proj.description && <p style={{ fontSize: `${gs.baseFontSize}px`, marginTop: "2px", whiteSpace: "pre-wrap" }}>{proj.description}</p>}
              </div>
            ))}
          </div>
        ) : null;
      case "certifications":
        return data.certifications.filter((c) => c.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Certifications</h2>
            {data.certifications.filter((c) => c.visible).map((cert) => (
              <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: `${gs.baseFontSize}px` }}><strong>{cert.name}</strong>{cert.issuer ? ` - ${cert.issuer}` : ""}</span>
                {cert.date && <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#999", fontStyle: "italic" }}>{cert.date}</span>}
              </div>
            ))}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: gs.fontFamily, padding: `${gs.pagePadding}px`, color: "#333", lineHeight: gs.lineHeight }}>
      {enabled.map((s) => renderSection(s.id))}
    </div>
  );
}
