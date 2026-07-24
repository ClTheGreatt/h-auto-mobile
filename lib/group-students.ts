// PORTED FROM h-auto: src/lib/users/group-students.ts
//
// h-auto-mobile is a separate npm package with no shared/monorepo link to
// h-auto, so this grouping logic is duplicated here by necessity rather
// than imported. If you change the grouping/sorting rules in the web
// source file, port the change here too — they must move together.
import type { UserListItem } from "../types";

export const UNCATEGORIZED = "Uncategorized";

export type StudentUserRow = UserListItem;

export type SectionGroup = {
  key: string;
  label: string;
  users: StudentUserRow[];
  count: number;
};

export type YearGroup = {
  key: string;
  label: string;
  sections: SectionGroup[];
  count: number;
};

export type CourseGroup = {
  key: string;
  label: string;
  isUncategorized: boolean;
  years: YearGroup[];
  // Only populated when isUncategorized: flat list, no year/section nesting.
  flatUsers: StudentUserRow[];
  count: number;
};

function withUncategorizedLast(cmp: (a: string, b: string) => number) {
  return (a: string, b: string) => {
    if (a === UNCATEGORIZED && b === UNCATEGORIZED) return 0;
    if (a === UNCATEGORIZED) return 1;
    if (b === UNCATEGORIZED) return -1;
    return cmp(a, b);
  };
}

function alphaComparator(a: string, b: string): number {
  return a.localeCompare(b);
}

function yearBaseComparator(a: string, b: string): number {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  const aNum = !Number.isNaN(na);
  const bNum = !Number.isNaN(nb);
  if (aNum && bNum && na !== nb) return na - nb;
  if (aNum !== bNum) return aNum ? -1 : 1;
  return a.localeCompare(b);
}

const courseComparator = withUncategorizedLast(alphaComparator);
const yearComparator = withUncategorizedLast(yearBaseComparator);
const sectionComparator = withUncategorizedLast(alphaComparator);

function byLastName(a: StudentUserRow, b: StudentUserRow): number {
  return (
    a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
  );
}

function courseKeyOf(row: { course: string | null }): string {
  return row.course?.trim() || UNCATEGORIZED;
}
function yearKeyOf(row: { yearLevel: string | null }): string {
  return row.yearLevel?.trim() || UNCATEGORIZED;
}
function sectionKeyOf(row: { section: string | null }): string {
  return row.section?.trim() || UNCATEGORIZED;
}

/**
 * Groups student rows into Course > Year > Section. Students missing a
 * course fall into a flat "Uncategorized" course group; students with a
 * course but missing year/section nest under an "Uncategorized" year/
 * section label instead, so partial data still drills down as far as it
 * can. No "X of Y" baseline counts here — unlike web, mobile has no
 * course/year/section filter dropdowns yet, so count === the full group
 * size in every case.
 */
export function groupStudents(rows: StudentUserRow[]): CourseGroup[] {
  type CourseEntry = {
    flatUsers: StudentUserRow[];
    years: Map<string, Map<string, StudentUserRow[]>>;
  };
  const courseMap = new Map<string, CourseEntry>();

  for (const row of rows) {
    const c = courseKeyOf(row);
    let courseEntry = courseMap.get(c);
    if (!courseEntry) {
      courseEntry = { flatUsers: [], years: new Map() };
      courseMap.set(c, courseEntry);
    }
    if (c === UNCATEGORIZED) {
      courseEntry.flatUsers.push(row);
      continue;
    }
    const y = yearKeyOf(row);
    let sections = courseEntry.years.get(y);
    if (!sections) {
      sections = new Map();
      courseEntry.years.set(y, sections);
    }
    const s = sectionKeyOf(row);
    const users = sections.get(s) ?? [];
    users.push(row);
    sections.set(s, users);
  }

  const courseKeys = [...courseMap.keys()].sort(courseComparator);

  return courseKeys.map((c): CourseGroup => {
    const entry = courseMap.get(c)!;

    if (c === UNCATEGORIZED) {
      const users = [...entry.flatUsers].sort(byLastName);
      return {
        key: c,
        label: c,
        isUncategorized: true,
        years: [],
        flatUsers: users,
        count: users.length,
      };
    }

    const yearKeys = [...entry.years.keys()].sort(yearComparator);
    const years: YearGroup[] = yearKeys.map((y) => {
      const sectionsMap = entry.years.get(y)!;
      const sectionKeys = [...sectionsMap.keys()].sort(sectionComparator);
      const sections: SectionGroup[] = sectionKeys.map((s) => {
        const users = [...sectionsMap.get(s)!].sort(byLastName);
        return {
          key: s,
          label: s,
          users,
          count: users.length,
        };
      });
      const count = sections.reduce((sum, s) => sum + s.count, 0);
      return {
        key: y,
        label: y,
        sections,
        count,
      };
    });
    const count = years.reduce((sum, y) => sum + y.count, 0);

    return {
      key: c,
      label: c,
      isUncategorized: false,
      years,
      flatUsers: [],
      count,
    };
  });
}
