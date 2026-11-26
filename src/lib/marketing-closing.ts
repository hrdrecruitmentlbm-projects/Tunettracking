import { ProspectStatusConfig } from "@/types";

const CLOSING_KEYS = new Set(["acc", "selesai", "closing", "deal"]);
const EXCLUDED_KEYWORDS = ["belum", "ditolak", "rejected", "tidak", "batal"];
const CLOSING_KEYWORDS = ["closing", "selesai", "diterima", "deal", "acc"];

/**
 * Determine whether a Prospect/Tower/Visit status represents a "Closing" outcome
 * (e.g., `acc` / "Pengajuan Diterima", `selesai`, `closing`, or admin-defined
 * closing labels). Excludes negative/pending statuses like "Belum Ada Kunjungan"
 * or "Pengajuan Ditolak".
 */
export function isClosingStatus(
  statusKey: string | null | undefined,
  statuses?: ProspectStatusConfig[]
): boolean {
  if (!statusKey) return false;
  const key = statusKey.trim().toLowerCase();
  if (CLOSING_KEYS.has(key)) return true;

  const cfg = statuses?.find((s) => s.key.toLowerCase() === key);
  const text = `${key} ${(cfg?.label || "").toLowerCase()}`;

  if (EXCLUDED_KEYWORDS.some((word) => text.includes(word))) {
    return false;
  }

  return CLOSING_KEYWORDS.some((word) => text.includes(word));
}
