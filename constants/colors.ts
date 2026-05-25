// constants/colors.ts
export const colors = {
  brand: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    500: "#22c55e",
    600: "#16a34a", // primary
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },
  background: "#fafaf9", // stone-50
  surface: "#ffffff",
  border: "#e2e8f0", // slate-200
  text: {
    primary: "#0f172a", // slate-900
    secondary: "#475569", // slate-600
    muted: "#94a3b8", // slate-400
  },
  status: {
    success: "#16a34a",
    warning: "#f59e0b",
    error: "#dc2626",
    info: "#2563eb",
  },
} as const;
