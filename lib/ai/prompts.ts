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
Produce THREE sections clearly separated.

### SECTION 1: TAILORED RESUME
Follow this EXACT format to fit on ONE page. Use the candidate's original resume structure:

# AIMUN NAEEM, CPA
(contact line: phone | email | linkedin)

(Professional summary: 3-4 lines, dense, results-focused. Start with "Results-driven CPA with X+ years...")

(Skills grid: 9 skills in 3 columns using bullet points, like:
• Revenue Recognition • NetSuite & Kantata Systems • SOX Controls & Audit Support)

## PROFESSIONAL EXPERIENCE
**Job Title | Company | Date Range**
• Bullet point achievement (quantified, start with action verb)
• Bullet point achievement
• Bullet point achievement

(Repeat for each role, 3-4 bullets per role, most recent roles get more bullets)

## EDUCATION & CERTIFICATION
**Certification** | Issuing Body | Date
**Degree** | University | Date

Rules:
1. Keep the EXACT same roles, companies, and dates from the base resume
2. Rewrite bullet points to emphasize skills matching: ${params.keywords.join(", ")}
3. Every bullet MUST start with a strong action verb and include a quantified result
4. Keep it CONCISE. Maximum 4 bullets per role. Total resume must fit ONE page
5. Do NOT fabricate experience, companies, dates, or certifications
6. Do NOT add roles or experience not in the original resume
7. Use plain text formatting, no fancy characters

### SECTION 2: COVER LETTER
Write a cover letter that sounds like a real person wrote it, not AI.

Rules for the cover letter:
1. Address to "Dear Hiring Manager" at ${params.company || "the company"}
2. NEVER use em-dashes (--). Use commas or periods instead
3. NEVER use these AI-sounding phrases: "I am writing to express", "I am excited to", "I am confident that", "I believe my", "thrilled", "passionate about", "leveraging", "utilizing", "spearheading"
4. Write like a professional accountant talks: direct, specific, numbers-focused
5. Opening: State the role you are applying for and your most relevant qualification in one sentence
6. Body (2 short paragraphs): Pick 2 specific achievements from the resume and explain how they directly relate to what the job needs. Use actual numbers
7. Closing: One sentence, thank them, say you look forward to discussing further
8. Maximum 250 words total. Short paragraphs. No fluff
9. Do NOT fabricate experience

### SECTION 3: TAILORING NOTES
List 3-5 bullet points of key changes made and why.

Use these EXACT section dividers:
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
