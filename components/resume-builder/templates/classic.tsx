"use client";

import { ResumeData } from "@/lib/resume-builder/types";

export default function ClassicTemplate({ data }: { data: ResumeData }) {
  const { basic, globalSettings: gs, menuSections } = data;
  const enabled = menuSections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const sectionStyle = { marginTop: `${gs.sectionSpacing}px` };
  const headingStyle = {
    color: gs.themeColor,
    fontSize: `${gs.headerSize * 0.55}px`,
    fontWeight: 700 as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: `2px solid ${gs.themeColor}`,
    paddingBottom: "3px",
    marginBottom: "8px",
  };

  const renderSection = (id: string) => {
    switch (id) {
      case "basic":
        return (
          <div key={id} style={{ textAlign: "center", marginBottom: `${gs.sectionSpacing}px` }}>
            <h1 style={{ fontSize: `${gs.headerSize}px`, fontWeight: 700, color: gs.themeColor, margin: 0 }}>
              {basic.name || "Your Name"}
            </h1>
            {basic.title && (
              <p style={{ fontSize: `${gs.baseFontSize + 1}px`, color: "#666", marginTop: "2px" }}>
                {basic.title}
              </p>
            )}
            <div style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#555", marginTop: "6px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 12px" }}>
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
            <h2 style={headingStyle}>Summary</h2>
            <p style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight, whiteSpace: "pre-wrap" }}>
              {basic.summary}
            </p>
          </div>
        ) : null;
      case "experience":
        return data.experience.filter((e) => e.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Experience</h2>
            {data.experience.filter((e) => e.visible).map((exp) => (
              <div key={exp.id} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: `${gs.baseFontSize + 1}px` }}>{exp.position}</strong>
                  <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#666" }}>
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <div style={{ fontSize: `${gs.baseFontSize}px`, color: gs.themeColor, fontWeight: 500 }}>
                  {exp.company}{exp.location ? ` | ${exp.location}` : ""}
                </div>
                {exp.description && (
                  <div
                    style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight, marginTop: "4px", whiteSpace: "pre-wrap" }}
                    dangerouslySetInnerHTML={{ __html: exp.description.replace(/^[-•]\s*/gm, '<span style="margin-right:4px">&#8226;</span>').split('\n').map(line => `<div style="padding-left:12px;text-indent:-12px">${line}</div>`).join('') }}
                  />
                )}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: `${gs.baseFontSize + 1}px` }}>{edu.school}</strong>
                  <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#666" }}>
                    {edu.startDate} - {edu.endDate}
                  </span>
                </div>
                <div style={{ fontSize: `${gs.baseFontSize}px` }}>
                  {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                  {edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
                </div>
                {edu.description && (
                  <p style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight, marginTop: "2px", whiteSpace: "pre-wrap" }}>
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : null;
      case "skills":
        return data.skills ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Skills</h2>
            <div style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight + 0.2, whiteSpace: "pre-wrap" }}>
              {data.skills}
            </div>
          </div>
        ) : null;
      case "projects":
        return data.projects.filter((p) => p.visible).length > 0 ? (
          <div key={id} style={sectionStyle}>
            <h2 style={headingStyle}>Projects</h2>
            {data.projects.filter((p) => p.visible).map((proj) => (
              <div key={proj.id} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: `${gs.baseFontSize + 1}px` }}>{proj.name}</strong>
                  {proj.date && <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#666" }}>{proj.date}</span>}
                </div>
                {proj.role && <div style={{ fontSize: `${gs.baseFontSize}px`, color: gs.themeColor }}>{proj.role}</div>}
                {proj.description && (
                  <p style={{ fontSize: `${gs.baseFontSize}px`, lineHeight: gs.lineHeight, marginTop: "2px", whiteSpace: "pre-wrap" }}>
                    {proj.description}
                  </p>
                )}
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
                <span style={{ fontSize: `${gs.baseFontSize}px` }}>
                  <strong>{cert.name}</strong>{cert.issuer ? ` - ${cert.issuer}` : ""}
                </span>
                {cert.date && <span style={{ fontSize: `${gs.baseFontSize - 1}px`, color: "#666" }}>{cert.date}</span>}
              </div>
            ))}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: gs.fontFamily, padding: `${gs.pagePadding}px`, color: "#1a1a1a", lineHeight: gs.lineHeight }}>
      {enabled.map((s) => renderSection(s.id))}
    </div>
  );
}
