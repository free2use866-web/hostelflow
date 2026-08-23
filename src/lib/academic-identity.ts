/**
 * IIT Roorkee Academic Identity Engine
 * Parses Google-profile names ("PREET BANSAL 21115109") and 8-digit
 * enrollment numbers (YYBBBXXX) into structured academic identity.
 */

export interface ParsedEnrollment {
  enrollmentYear: number;
  branchCode: number;
  rollNumber: number;
}

/** Branch codes per IIT Roorkee academic records */
export const BRANCH_CODES: Record<number, { code: string; name: string }> = {
  101: { code: "PREP", name: "Preparatory Course" },
  110: { code: "AR", name: "Architecture" },
  112: { code: "CH", name: "Chemical Engineering" },
  113: { code: "CE", name: "Civil Engineering" },
  114: { code: "CSE", name: "Computer Science & Engineering" },
  115: { code: "EE", name: "Electrical Engineering" },
  116: { code: "ECE", name: "Electronics & Communication Engineering" },
  117: { code: "ME", name: "Mechanical Engineering" },
  118: { code: "MT", name: "Metallurgical & Materials Engineering" },
  119: { code: "PIE", name: "Production and Industrial Engineering" },
  123: { code: "EP", name: "Engineering Physics" },
  124: { code: "BSBE", name: "Biosciences and Bioengineering" },
  125: { code: "DSAI", name: "Data Science and Artificial Intelligence" },
  126: { code: "ENE", name: "Energy Engineering" },
  151: { code: "DES", name: "Design" },
  321: { code: "CHS", name: "Chemical Sciences" },
  322: { code: "ECO", name: "Economics" },
  323: { code: "MAC", name: "Mathematics and Computing" },
  324: { code: "PHY", name: "Physics" },
  410: { code: "GT", name: "Geological Technology" },
  411: { code: "GPT", name: "Geophysical Technology" },
  535: { code: "M.Tech CSE", name: "Computer Science and Engineering (M.Tech)" },
  565: { code: "M.Tech AI", name: "Artificial Intelligence (M.Tech)" },
  566: { code: "M.Tech DS", name: "Data Science (M.Tech)" },
  611: { code: "M.Sc CHY", name: "Chemistry (M.Sc.)" },
  615: { code: "M.Sc PHY", name: "Physics (M.Sc.)" },
  616: { code: "M.Sc MTH", name: "Mathematics (M.Sc.)" },
  617: { code: "M.Sc ECO", name: "Economics (M.Sc.)" },
  810: { code: "MBA", name: "Business Administration" },
};

/** Strict regex: @iitr.ac.in and any subdomain (e.g. @me.iitr.ac.in) */
export function isValidIITREmail(email: string): boolean {
  const cleaned = email.toLowerCase().trim();
  const domainRegex = /^[^@]+@([a-z0-9]+\.)?iitr\.ac\.in$/;
  return domainRegex.test(cleaned);
}

/** Parses an 8-digit IITR enrollment number: YYBBBXXX */
export function parseEnrollmentNumber(enrollment: string): ParsedEnrollment | null {
  const cleaned = enrollment.trim();
  if (!/^\d{8}$/.test(cleaned)) return null;

  const yy = parseInt(cleaned.slice(0, 2), 10);
  const bbb = parseInt(cleaned.slice(2, 5), 10);
  const xxx = parseInt(cleaned.slice(5, 8), 10);

  const enrollmentYear = yy < 50 ? 2000 + yy : 1900 + yy;
  const currentYear = new Date().getFullYear();

  if (enrollmentYear > currentYear + 1) return null; // Reject future years

  return { enrollmentYear, branchCode: bbb, rollNumber: xxx };
}

/**
 * Extracts Name + Enrollment from a profile display name.
 * e.g. "PREET BANSAL 21115109" -> { cleanName: "PREET BANSAL", enrollment: "21115109" }
 */
export function parseNameWithEnrollment(fullName: string): {
  cleanName: string;
  enrollment: string | null;
} {
  if (!fullName) return { cleanName: "", enrollment: null };

  const match = fullName.trim().match(/\b(\d{8})\b/);
  if (match) {
    const potentialEnrollment = match[1];
    const parsed = parseEnrollmentNumber(potentialEnrollment);
    if (parsed) {
      const cleanName = fullName.replace(potentialEnrollment, "").replace(/\s+/g, " ").trim();
      return { cleanName, enrollment: potentialEnrollment };
    }
  }
  return { cleanName: fullName.trim(), enrollment: null };
}

/** Derives current academic year (1st–5th) from enrollment year. */
export function deriveAcademicYear(enrollmentYear: number): number {
  const now = new Date();
  let year = now.getFullYear() - enrollmentYear;
  if (now.getMonth() >= 6) year += 1; // June onwards = next session
  return Math.min(Math.max(1, year), 5);
}
