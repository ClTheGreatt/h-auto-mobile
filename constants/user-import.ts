// MIRRORED FROM h-auto: src/lib/constants/user-import.ts
//
// h-auto-mobile is a separate npm package with no shared/monorepo link to
// h-auto, so these enum lists, regexes, and helpers are duplicated here by
// necessity rather than imported. If you change a value in the web source
// file, update this file too — they must move together. Server-side
// validation (POST /api/mobile/me/users, the import routes) always uses
// the real Zod schemas regardless of what this file says; this file only
// drives client-side UI (pickers, format hints, early error messages) and
// the import-type-mismatch check for the mobile CSV path.

export const DEPARTMENTS = [
  "BS Agriculture - Animal Science",
  "BS Agriculture - Crop Science",
  "BTVTEd - Animal Production",
  "BTVTEd - Crops Production",
  "BS Agricultural and Biosystems Engineering",
] as const;

export const FACULTY_POSITIONS = [
  "Instructor I",
  "Instructor II",
  "Instructor III",
  "Assistant Professor I",
  "Assistant Professor II",
  "Assistant Professor III",
  "Assistant Professor IV",
  "Associate Professor I",
  "Associate Professor II",
  "Associate Professor III",
  "Associate Professor IV",
  "Associate Professor V",
  "Professor I",
  "Professor II",
  "Professor III",
  "Professor IV",
  "Professor V",
  "Professor VI",
] as const;

// Faculty employee ID: 6 digits, dash, 4 digits (e.g. 202000-0001).
export const FACULTY_ID_REGEX = /^\d{6}-\d{4}$/;

// Student ID: 2-digit year prefix, dash, 5 digits (e.g. 23-04567). The
// prefix's valid range is checked separately (see studentIdPrefixRange)
// since it depends on the current year.
export const STUDENT_ID_REGEX = /^\d{2}-\d{5}$/;

// Section: one of the 3 program prefixes, dash, year digit 1-4, one
// uppercase letter (e.g. BSA-1A, BTVTED-2B, BSABE-3C).
export const SECTION_REGEX = /^(BSA|BTVTED|BSABE)-[1-4][A-Z]$/;

// Student ID prefix must be between 20 and (current year % 100) + 1 —
// e.g. in 2026 that's 20 through 27 inclusive.
export function studentIdPrefixRange(): { min: number; max: number } {
  return { min: 20, max: (new Date().getFullYear() % 100) + 1 };
}

// Assumes the format regex (STUDENT_ID_REGEX) already passed — this only
// checks the numeric prefix range.
export function isValidStudentIdPrefix(idNumber: string): boolean {
  const prefix = parseInt(idNumber.slice(0, 2), 10);
  const { min, max } = studentIdPrefixRange();
  return prefix >= min && prefix <= max;
}

export type ImportRowType = "FACULTY" | "STUDENT_FARMER";

// Columns that only ever appear on ONE side — used to detect "wrong
// template uploaded" from header shape alone. The mobile CSV path has no
// access to the hidden Lists-sheet marker (CSV export drops non-data
// sheets entirely), so this header-shape fallback is the only check
// available there — same as the web CSV path.
const FACULTY_DISTINCTIVE_FIELDS = ["department", "position"] as const;
const STUDENT_DISTINCTIVE_FIELDS = ["course", "section"] as const;

export function detectImportTypeMismatch(
  headers: readonly string[],
  selectedType: ImportRowType
): ImportRowType | null {
  const headerSet = new Set(headers.map((h) => h.replace(/\s*\*$/, "").trim()));
  const hasFacultyFields = FACULTY_DISTINCTIVE_FIELDS.some((f) => headerSet.has(f));
  const hasStudentFields = STUDENT_DISTINCTIVE_FIELDS.some((f) => headerSet.has(f));

  if (selectedType === "FACULTY" && hasStudentFields && !hasFacultyFields) {
    return "STUDENT_FARMER";
  }
  if (selectedType === "STUDENT_FARMER" && hasFacultyFields && !hasStudentFields) {
    return "FACULTY";
  }
  return null;
}

const IMPORT_TYPE_STEP1_LABEL: Record<ImportRowType, string> = {
  FACULTY: "Faculty",
  STUDENT_FARMER: "Student Farmers",
};

const IMPORT_TYPE_TEMPLATE_LABEL: Record<ImportRowType, string> = {
  FACULTY: "Faculty",
  STUDENT_FARMER: "Student Farmer",
};

export function importTypeMismatchMessage(
  selectedType: ImportRowType,
  detectedType: ImportRowType
): string {
  return (
    `This looks like a ${IMPORT_TYPE_TEMPLATE_LABEL[detectedType]} file, but ` +
    `"${IMPORT_TYPE_STEP1_LABEL[selectedType]}" is selected. Switch the ` +
    `import type or pick the matching file.`
  );
}
