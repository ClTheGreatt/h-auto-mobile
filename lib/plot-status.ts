import type { PlotStatus } from "../types";

export type PlotStatusMeta = { bg: string; text: string; label: string };

// Single source of truth for how a plot status is labeled and colored
// across the app — replaces three independent copies (plots list, plot
// detail, analytics), one of which had drifted ("Ready" vs "Ready for
// harvest") and one of which silently omitted ARCHIVED entirely.
//
// Record<PlotStatus, ...> (not Record<string, ...>) is deliberate: omitting
// a status here is now a compile error instead of a silent runtime
// fallback. The old Record<string, ...> is exactly what let ARCHIVED plots
// fall through `?? STATUS_COLORS.PREPARING` and render as "Preparing".
export const PLOT_STATUS_META: Record<PlotStatus, PlotStatusMeta> = {
  PREPARING: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    label: "Preparing",
  },
  PLANTED: { bg: "bg-blue-100", text: "text-blue-700", label: "Planted" },
  GROWING: { bg: "bg-brand-100", text: "text-brand-700", label: "Growing" },
  READY_FOR_HARVEST: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "Ready for harvest",
  },
  HARVESTED: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    label: "Harvested",
  },
  FALLOW: { bg: "bg-stone-100", text: "text-stone-700", label: "Fallow" },
  // No prior mobile entry to carry over. Sourced from web's own ARCHIVED
  // pairing (src/app/dashboard/plots/[id]/page.tsx) rather than picked
  // fresh: plain gray reads as "put away / inactive" rather than any
  // particular stage of the crop cycle, and no other status in this map
  // uses plain gray, so it stays visually distinct from all of them.
  ARCHIVED: { bg: "bg-gray-200", text: "text-gray-600", label: "Archived" },
};

// Fallback for a status value this map doesn't recognize (e.g. the API
// sending something unexpected). Deliberately NOT one of the real status
// entries above — falling back to e.g. PREPARING would actively mislabel
// an unknown status as a real, different one, which is the bug this module
// exists to fix.
export const UNKNOWN_PLOT_STATUS_META: PlotStatusMeta = {
  bg: "bg-gray-100",
  text: "text-gray-500",
  label: "Unknown",
};
