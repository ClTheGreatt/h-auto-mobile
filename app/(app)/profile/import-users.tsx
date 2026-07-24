import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import Papa from "papaparse";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import {
  detectImportTypeMismatch,
  importTypeMismatchMessage,
} from "../../../constants/user-import";
import {
    useImportUsers,
    useValidateImportFile,
    useValidateImportRows,
    type ParsedImportRow,
} from "../../../lib/hooks/use-users";

type ImportType = "FACULTY" | "STUDENT_FARMER";
type Phase = "idle" | "validating" | "preview" | "committing" | "done";

type ImportResult = {
  success: string[];
  failed: { email: string; reason: string }[];
  totalProcessed: number;
};

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Full column set the server accepts (required + optional), in the same
// order as the web template. academicYear is optional for students — if
// left blank the server derives it from the idNumber prefix.
const COLUMNS: Record<ImportType, string[]> = {
  FACULTY: [
    "firstName",
    "middleName",
    "lastName",
    "email",
    "phoneNumber",
    "idNumber",
    "department",
    "position",
    "password",
  ],
  STUDENT_FARMER: [
    "firstName",
    "middleName",
    "lastName",
    "email",
    "phoneNumber",
    "idNumber",
    "academicYear",
    "course",
    "yearLevel",
    "section",
    "password",
  ],
};

// The real required-field/format rules live server-side (the validate
// endpoints run the exact same schemas as the commit endpoint) — this is
// just guidance copy, not enforcement.
const REQUIRED_CAPTION: Record<ImportType, string> = {
  FACULTY:
    "Required: firstName, lastName, email (@bpsu.edu.ph), idNumber (123456-1234), department, position, password (8+ chars, upper + lower case, a number, and a symbol). middleName and phoneNumber (+639XXXXXXXXX) are optional.",
  STUDENT_FARMER:
    "Required: firstName, lastName, email (@bpsu.edu.ph), idNumber (12-34567), course, section (e.g. BSA-1A), password (8+ chars, upper + lower case, a number, and a symbol). middleName, phoneNumber (+639XXXXXXXXX), yearLevel, and academicYear are optional.",
};

export default function ImportUsers() {
  const router = useRouter();
  const importUsers = useImportUsers();
  const validateRows = useValidateImportRows();
  const validateFile = useValidateImportFile();

  const [type, setType] = useState<ImportType>("FACULTY");
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const invalidCount = rows.length - validCount;

  function handleValidateError(err: any) {
    setPhase("idle");
    Alert.alert("Could not check file", err?.message ?? "Try again");
  }

  async function handlePickFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/csv",
          XLSX_MIME,
          "*/*",
        ],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;

      const asset = res.assets[0];
      const lowerName = asset.name.toLowerCase();
      const isCsv = lowerName.endsWith(".csv");
      const isXlsx = lowerName.endsWith(".xlsx");

      if (!isCsv && !isXlsx) {
        Alert.alert("Wrong file type", "Please pick a .csv or .xlsx file.");
        return;
      }

      setFileName(asset.name);

      if (isXlsx) {
        // exceljs is server-only, so an .xlsx upload is always validated
        // via a round-trip — the same parseExcelImportFile logic (marker
        // check included) the web .xlsx upload uses.
        setPhase("validating");
        validateFile.mutate(
          { type, uri: asset.uri, name: asset.name },
          {
            onSuccess: (res) => {
              setRows(res.rows);
              setPhase("preview");
            },
            onError: handleValidateError,
          },
        );
        return;
      }

      const text = await FileSystem.readAsStringAsync(asset.uri);
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        // Strip the "required field" asterisk the template header carries
        // (e.g. "idNumber *") so a CSV export of the template still
        // matches the schema's plain field names.
        transformHeader: (h) => h.trim().replace(/\s*\*$/, ""),
      });

      if (parsed.errors.length > 0) {
        Alert.alert("Could not read CSV", parsed.errors[0].message);
        return;
      }

      if (parsed.data.length === 0) {
        Alert.alert("Empty file", "No rows found in this CSV.");
        return;
      }

      // Reject a wrong-template upload up front, as a single clear
      // message — never as per-row noise about columns the file
      // legitimately lacks. CSV has no hidden marker sheet to check (lost
      // on export), so header shape is the only signal available here —
      // same as the web CSV path.
      const headers = parsed.meta.fields ?? [];
      const detectedType = detectImportTypeMismatch(headers, type);
      if (detectedType) {
        Alert.alert(
          "Wrong import type",
          importTypeMismatchMessage(type, detectedType),
        );
        return;
      }

      const trimmedRows = parsed.data.map((raw) => {
        const trimmed: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw)) {
          trimmed[k] = typeof v === "string" ? v.trim() : String(v ?? "");
        }
        return trimmed;
      });

      setPhase("validating");
      // Real validation happens server-side (the validate endpoint runs
      // the exact same schemas the commit endpoint and the web import
      // use) — this call never persists anything, it only returns
      // per-row issues for the preview below.
      validateRows.mutate(
        { type, rows: trimmedRows },
        {
          onSuccess: (res) => {
            setRows(res.rows);
            setPhase("preview");
          },
          onError: handleValidateError,
        },
      );
    } catch (err: any) {
      Alert.alert("Something went wrong", err?.message ?? "Try again");
    }
  }

  function handleCommit() {
    const validRows = rows
      .filter((r) => r.errors.length === 0)
      .map((r) => r.raw);
    if (validRows.length === 0) {
      Alert.alert("Nothing to import", "There are no valid rows.");
      return;
    }
    setPhase("committing");
    importUsers.mutate(
      { type, rows: validRows, fileName },
      {
        onSuccess: (res) => {
          setResult(res);
          setPhase("done");
        },
        onError: (err: any) => {
          setPhase("preview");
          Alert.alert("Import failed", err?.message ?? "Try again");
        },
      },
    );
  }

  function reset() {
    setPhase("idle");
    setRows([]);
    setResult(null);
    setFileName("");
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 bg-stone-50 border-b border-slate-100">
        <Pressable
          onPress={() => (phase === "preview" ? reset() : router.back())}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-200"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-slate-900 ml-2">
          Import users
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {phase === "idle" && (
          <>
            <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Import type
            </Text>
            <View className="flex-row mb-5" style={{ gap: 8 }}>
              {(
                [
                  { value: "FACULTY", label: "Faculty" },
                  { value: "STUDENT_FARMER", label: "Student Farmers" },
                ] as { value: ImportType; label: string }[]
              ).map((opt) => {
                const active = type === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setType(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl border items-center ${
                      active
                        ? "bg-brand-600 border-brand-600"
                        : "bg-white border-slate-200"
                    } active:opacity-80`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        active ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
              <Text className="text-sm font-semibold text-slate-900 mb-2">
                Expected columns
              </Text>
              <Text className="text-xs text-slate-500 mb-3">
                Fill in the columns below in Excel or Google Sheets, then
                upload as .xlsx or .csv:
              </Text>
              <View className="bg-stone-50 rounded-lg p-3">
                <Text
                  className="text-xs text-slate-700"
                  style={{ fontFamily: "monospace" }}
                >
                  {COLUMNS[type].join(",")}
                </Text>
              </View>
              <Text className="text-xs text-slate-400 mt-3">
                {REQUIRED_CAPTION[type]}
              </Text>
            </View>

            <Pressable
              onPress={handlePickFile}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-8 items-center active:bg-slate-50"
            >
              <Ionicons
                name="cloud-upload-outline"
                size={32}
                color={colors.text.muted}
              />
              <Text className="text-sm font-medium text-slate-700 mt-2">
                Pick a file
              </Text>
              <Text className="text-xs text-slate-400 mt-1">
                Accepts .xlsx or .csv — you&apos;ll see a preview before
                anything is saved
              </Text>
            </Pressable>
          </>
        )}

        {phase === "validating" && (
          <View className="items-center py-16">
            <ActivityIndicator color={colors.brand[600]} />
            <Text className="text-sm text-slate-500 mt-4">
              Checking your file...
            </Text>
          </View>
        )}

        {phase === "preview" && (
          <>
            <View className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={colors.text.muted}
                />
                <Text
                  className="flex-1 text-sm font-medium text-slate-900 ml-2"
                  numberOfLines={1}
                >
                  {fileName}
                </Text>
              </View>
              <View className="flex-row mt-3" style={{ gap: 8 }}>
                <View className="px-2.5 py-1 rounded-full bg-brand-100">
                  <Text className="text-xs font-medium text-brand-700">
                    {validCount} valid
                  </Text>
                </View>
                {invalidCount > 0 && (
                  <View className="px-2.5 py-1 rounded-full bg-red-100">
                    <Text className="text-xs font-medium text-red-700">
                      {invalidCount} with errors
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {rows.map((row) => {
              const ok = row.errors.length === 0;
              return (
                <View
                  key={row.rowNumber}
                  className={`rounded-2xl border p-3.5 mb-2.5 ${
                    ok
                      ? "bg-white border-slate-100"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name={ok ? "checkmark-circle" : "close-circle"}
                      size={18}
                      color={ok ? "#16a34a" : "#dc2626"}
                    />
                    <Text className="flex-1 text-sm font-medium text-slate-900 ml-2">
                      {row.raw.firstName} {row.raw.lastName}
                    </Text>
                    <Text className="text-xs text-slate-400">
                      Row {row.rowNumber}
                    </Text>
                  </View>
                  <Text
                    className="text-xs text-slate-500 mt-1 ml-6"
                    numberOfLines={1}
                  >
                    {row.raw.email || "—"}
                  </Text>
                  {!ok && (
                    <View className="ml-6 mt-1.5">
                      {row.errors.map((e, i) => (
                        <Text key={i} className="text-xs text-red-600">
                          • {e}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {invalidCount > 0 && (
              <View className="flex-row items-start bg-amber-50 border border-amber-200 rounded-xl p-3 mt-1">
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color="#b45309"
                  style={{ marginTop: 1 }}
                />
                <Text className="flex-1 text-xs text-amber-800 ml-2">
                  {invalidCount} row(s) have errors and will be skipped. Fix the
                  file and re-pick, or import only the {validCount} valid row(s).
                </Text>
              </View>
            )}
          </>
        )}

        {phase === "committing" && (
          <View className="items-center py-16">
            <ActivityIndicator color={colors.brand[600]} />
            <Text className="text-sm text-slate-500 mt-4">
              Importing {validCount} user(s)...
            </Text>
          </View>
        )}

        {phase === "done" && result && (
          <>
            <View className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full bg-brand-100 items-center justify-center">
                  <Ionicons
                    name="checkmark"
                    size={22}
                    color={colors.brand[600]}
                  />
                </View>
                <View className="ml-3">
                  <Text className="text-base font-semibold text-slate-900">
                    Import complete
                  </Text>
                  <Text className="text-xs text-slate-500">
                    Processed {result.totalProcessed} row(s)
                  </Text>
                </View>
              </View>
              <View className="flex-row" style={{ gap: 10 }}>
                <View className="flex-1 bg-brand-50 border border-brand-100 rounded-xl p-3">
                  <Text className="text-xs font-medium text-brand-700">
                    Created
                  </Text>
                  <Text className="text-2xl font-semibold text-brand-700">
                    {result.success.length}
                  </Text>
                </View>
                <View className="flex-1 bg-red-50 border border-red-100 rounded-xl p-3">
                  <Text className="text-xs font-medium text-red-700">
                    Failed
                  </Text>
                  <Text className="text-2xl font-semibold text-red-700">
                    {result.failed.length}
                  </Text>
                </View>
              </View>
            </View>

            {result.failed.length > 0 && (
              <View className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
                <Text className="text-sm font-semibold text-slate-900 mb-2">
                  Failed rows
                </Text>
                {result.failed.map((f, i) => (
                  <View key={i} className="py-2 border-b border-slate-50">
                    <Text className="text-sm text-slate-900">{f.email}</Text>
                    <Text className="text-xs text-red-600 mt-0.5">
                      {f.reason}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {phase === "preview" && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex-row"
          style={{ gap: 10 }}
        >
          <Pressable
            onPress={reset}
            className="flex-1 rounded-xl py-3.5 items-center bg-white border border-slate-200 active:bg-slate-50"
          >
            <Text className="text-slate-700 font-semibold text-base">
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCommit}
            disabled={validCount === 0}
            className={`flex-1 rounded-xl py-3.5 items-center ${
              validCount === 0
                ? "bg-brand-600/50"
                : "bg-brand-600 active:bg-brand-700"
            }`}
          >
            <Text className="text-white font-semibold text-base">
              Import {validCount}
            </Text>
          </Pressable>
        </View>
      )}

      {phase === "done" && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex-row"
          style={{ gap: 10 }}
        >
          <Pressable
            onPress={reset}
            className="flex-1 rounded-xl py-3.5 items-center bg-white border border-slate-200 active:bg-slate-50"
          >
            <Text className="text-slate-700 font-semibold text-base">
              Import another
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace("/(app)/profile/users")}
            className="flex-1 rounded-xl py-3.5 items-center bg-brand-600 active:bg-brand-700"
          >
            <Text className="text-white font-semibold text-base">
              View users
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
