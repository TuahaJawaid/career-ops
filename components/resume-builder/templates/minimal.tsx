"use client";

import { ResumeData } from "@/lib/resume-builder/types";

export default function MinimalTemplate({ data }: { data: ResumeData }) {
  const { basic, globalSettings: gs, menuSections } = data;
  const enabled = menuSections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const sectionStyle = { marginTop: `${gs.sectionSpacing}px` };
  const headingStyle = {
    fontSize: `${gs.baseFontSize + 1}px`,
    fontWeight: 600 as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "#333",
    marginBottom: "6px",
  };
  const thinLine = { height: "1px", background: "#ddd", marginBottom: "8px" };

  const renderSection = (id: string) => {
    switch (id) {
      case "basic":
        return (
          <div key={id} style={{ marginBottom: `${gs.sectionSpacing}px` }}>
            <h1 style={{ fontSize: `${gs.headerSize}px`, fontWeight: 300, letterSpacing: "0.08em", color: "#111", margin: 0 }}>
              {basic.name || "Your Name"}
            </h1>
            {basic.title && <p style={{ fontSize: `${gs.baseFontSize}px`, color: "#777", marginTop: "2px", letterSpacing: "0.04em" }}>{basic.title}</p>}
            <div style={thinLine} />
            <div style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#555", display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
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
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Profile</h2>
            <div style={thinLine} />
            <p style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight, color: "#444", whiteSpace: "pre-wrap" }}>{basic.summary}</p>
          </div>
        ) : null;
      case "experience":
        return data.experience.filter((e) => e.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Experience</h2>
            <div style={thinLine} />
            {data.experience.filter((e) => e.visible).map((exp) => (
              <div key={exp.id} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: `${gs.baseFontSize + 1}px`, fontWeight: 600 }}>{exp.position}</span>
                  <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#999" }}>{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                </div>
                <div style={{ fontSize: `${gs.baseFontSize}px`, color: "#666" }}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</div>
                {exp.description && <div style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight, marginTop: "4px", color: "#444", whiteSpace: "pre-wrap" }}>{exp.description}</div>}
              </div>
            ))}
          </div>
        ) : null;
      case "education":
        return data.education.filter((e) => e.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Education</h2>
            <div style={thinLine} />
            {data.education.filter((e) => e.visible).map((edu) => (
              <div key={edu.id} style={{ marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: `${gs.baseFontSize + 1}px`, fontWeight: 600 }}>{edu.school}</span>
                  <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#999" }}>{edu.startDate} - {edu.endDate}</span>
                </div>
                <div style={{ fontSize: `${gs.baseFontSize}px`, color: "#666" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.gpa ? ` | GPA: ${edu.gpa}` : ""}</div>
              </div>
            ))}
          </div>
        ) : null;
      case "skills":
        return data.skills ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Skills</h2>
            <div style={thinLine} />
            <div style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight + 0.2, color: "#444", whiteSpace: "pre-wrap" }}>{data.skills}</div>
          </div>
        ) : null;
      case "projects":
        return data.projects.filter((p) => p.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Projects</h2>
            <div style={thinLine} />
            {data.projects.filter((p) => p.visible).map((proj) => (
              <div key={proj.id} style={{ marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: `${gs.baseFontSize + 1}px` }}>{proj.name}</strong>
                  {proj.date && <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#999" }}>{proj.date}</span>}
                </div>
                {proj.role && <div style={{ fontSize: `${gs.baseFontSize}px`, color: "#666" }}>{proj.role}</div>}
                {proj.description && <p style={{ fontSize: `${gs.baseFontSize}px`, marginTop: "2px", color: "#444", whiteSpace: "pre-wrap" }}>{proj.description}</p>}
              </div>
            ))}
          </div>
        ) : null;
      case "certifications":
        return data.certifications.filter((c) => c.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Certifications</h2>
            <div style={thinLine} />
            {data.certifications.filter((c) => c.visible).map((cert) => (
              <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: `${gs.baseFontSize}px` }}><strong>{cert.name}</strong>{cert.issuer ? ` - ${cert.issuer}` : ""}</span>
                {cert.date && <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#999" }}>{cert.date}</span>}
              </div>
            ))}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: gs.fontFamily, padding: `${gs.pagePadding}px`, color: "#222", lineHeight: gs.lineHeight }}>
      {enabled.map((s) => renderSection(s.id))}
    </div>
  );
}
