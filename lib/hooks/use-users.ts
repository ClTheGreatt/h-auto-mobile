import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StudentListItem, UserDetail, UserListItem } from "../../types";
import { api } from "../api";

export type UsersView = "active" | "graduated";

export function useUsers(view: UsersView) {
  return useQuery({
    queryKey: ["users", view],
    queryFn: () =>
      api<{ users: UserListItem[] }>(`/api/mobile/me/users?view=${view}`),
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => api<{ user: UserDetail }>(`/api/mobile/me/users/${id}`),
    enabled: !!id,
  });
}

// Active, non-graduated students only — for the plot-assignment student
// picker. view=active is required here: a graduated student can still be
// status=ACTIVE (graduation is orthogonal to status), so without it they'd
// show up as assignable and only fail once the faculty member actually
// tries to assign them.
export function useStudents() {
  return useQuery({
    queryKey: ["users", "students"],
    queryFn: () =>
      api<{ users: StudentListItem[] }>(
        "/api/mobile/me/users?role=STUDENT_FARMER&status=ACTIVE&view=active",
      ),
  });
}

// Candidates for THIS plot's assign-student picker, scoped server-side to
// the viewer's actual authority: unrestricted for Admin/Super Admin,
// limited to the Faculty caller's advised sections otherwise. Already-
// assigned students are NOT excluded server-side — the caller still
// filters via excludeStudentIds, same as before. Replaces useStudents()
// for the picker; that hook is unrelated (role/status-filtered, not
// plot/advisory-scoped) and has no other callers to preserve.
export function useAssignableStudents(plotId: string) {
  return useQuery({
    queryKey: ["plots", plotId, "assignable-students"],
    queryFn: () =>
      api<{ students: StudentListItem[] }>(
        `/api/mobile/me/plots/${plotId}/assignable-students`,
      ),
    enabled: !!plotId,
  });
}

type CreateUserInput = {
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: string;
  // Optional: when omitted, the server generates one and returns it
  // once as tempPassword. Still accepted if a caller wants to set one
  // explicitly (unused by this app's own Add User form now, but the
  // server continues to support it).
  password?: string;
  status?: string;
  idNumber?: string;
  phoneNumber?: string;
  department?: string;
  course?: string;
  yearLevel?: string;
  section?: string;
  position?: string;
};

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      api<{ user: UserListItem; tempPassword?: string }>(
        "/api/mobile/me/users",
        {
          method: "POST",
          body: input,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api<{ user: UserListItem }>(`/api/mobile/me/users/${id}`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

type ImportResult = {
  success: string[];
  failed: { email: string; reason: string }[];
  totalProcessed: number;
};

type ImportInput = {
  type: string;
  rows: Record<string, string>[];
  fileName: string;
};

export function useImportUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportInput) =>
      api<ImportResult>("/api/mobile/me/users/import", {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export type ParsedImportRow = {
  rowNumber: number;
  raw: Record<string, string>;
  errors: string[];
};

type ValidateImportInput = {
  type: string;
  rows: Record<string, string>[];
};

// Dry-run validation for a CSV import preview — runs the exact same
// schemas as the commit endpoint (both call buildParsedRows server-side),
// so the mobile preview shows the same per-row issues the web preview
// would. Nothing is persisted by this call.
export function useValidateImportRows() {
  return useMutation({
    mutationFn: (input: ValidateImportInput) =>
      api<{ rows: ParsedImportRow[] }>("/api/mobile/me/users/import/validate", {
        method: "POST",
        body: input,
      }),
  });
}

type ValidateImportFileInput = {
  type: string;
  uri: string;
  name: string;
};

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Dry-run validation for an uploaded .xlsx file — server-side parse via
// the exact same logic web's .xlsx upload uses (parseExcelImportFile),
// including the import-type marker check. exceljs is server-only, so this
// round-trip is the only way to validate an .xlsx on-device. Nothing is
// persisted by this call.
export function useValidateImportFile() {
  return useMutation({
    mutationFn: ({ type, uri, name }: ValidateImportFileInput) => {
      const formData = new FormData();
      formData.append("file", { uri, name, type: XLSX_MIME } as any);
      formData.append("type", type);

      return api<{ rows: ParsedImportRow[] }>(
        "/api/mobile/me/users/import/validate-file",
        {
          method: "POST",
          body: formData,
        },
      );
    },
  });
}
