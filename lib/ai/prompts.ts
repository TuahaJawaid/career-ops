export function buildEvaluationPrompt(params: {
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  baseResume: string;
  targetRoles: string[];
  targetRegions: string[];
}) {
  return `You are an expert career advisor evaluating job opportunities for a candidate.

## Candidate Profile
- Target Roles: ${params.targetRoles.join(", ")}
- Target Regions: ${params.targetRegions.length > 0 ? params.targetRegions.join(", ") : "Global (all regions)"}

## Candidate Resume
${params.baseResume}

## Job to Evaluate
- Title: ${params.jobTitle}
- Company: ${params.company || "Unknown"}
- Location: ${params.location || "Not specified"}
- Salary: ${params.salary || "Not specified"}

## Job Description
${params.description || "No description provided"}

## Instructions
Evaluate this job opportunity against the candidate's resume and preferences. Score each dimension 0-100 and assign an overall grade A-F:
- A (80-100): Excellent fit, strong match on most dimensions
- B (60-79): Good fit, solid match with minor gaps
- C (40-59): Moderate fit, several notable gaps
- D (20-39): Poor fit, significant mismatches
- F (0-19): Very poor fit, not recommended

Be honest and specific in your assessment. Consider the candidate's accounting expertise and career level.`;
}

export function buildTailoringPrompt(params: {
  baseResume: string;
  jobDescription: string;
  jobTitle: string;
  company: string;
  keywords: string[];
}) {
  return `You are an expert resume writer specializing in accounting and finance roles.

## Task
Tailor the following base resume for this specific job application. Optimize for ATS (Applicant Tracking System) compatibility while maintaining truthfulness.

## Target Job
- Title: ${params.jobTitle}
- Company: ${params.company || "the company"}
- Key Keywords: ${params.keywords.join(", ")}

## Job Description
${params.jobDescription}

## Base Resume
${params.baseResume}

## Instructions
Produce TWO sections clearly separated:

### SECTION 1: TAILORED RESUME
1. Reorganize experience bullets to prioritize relevant accounting/finance skills
2. Naturally incorporate these ATS keywords where truthful: ${params.keywords.join(", ")}
3. Quantify achievements where possible
4. Keep the same overall structure but optimize ordering and emphasis
5. Do NOT fabricate experience or skills
6. Output in clean, professional markdown format ready for PDF conversion
7. Use clear section headers: PROFESSIONAL SUMMARY, PROFESSIONAL EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS

### SECTION 2: COVER LETTER
After the resume, write a professional cover letter:
1. Address to Hiring Manager at ${params.company || "the company"}
2. Opening paragraph: Express interest in the ${params.jobTitle} role and briefly state qualifications
3. Body paragraphs: Connect 2-3 specific achievements from the resume to the job requirements
4. Closing paragraph: Express enthusiasm and call to action
5. Keep it under 400 words, professional but personable
6. Do NOT fabricate experience

### SECTION 3: TAILORING NOTES
Briefly list the key changes made to the resume and why.

Use these exact section dividers:
---RESUME---
(resume content)
---COVER LETTER---
(cover letter content)
---TAILORING NOTES---
(notes content)`;
}

export function buildAnalysisPrompt(description: string) {
  return `Analyze this job description and extract structured information.

## Job Description
${description}

## Instructions
Extract the following:
1. Required skills (must-have qualifications)
2. Preferred skills (nice-to-have qualifications)
3. Required experience (years and type)
4. Key responsibilities
5. ATS keywords (terms to include in a resume for this role)
6. Seniority level
7. Red flags (concerning aspects of the listing)
8. Estimated salary range (if not stated, estimate based on role/location)`;
}
