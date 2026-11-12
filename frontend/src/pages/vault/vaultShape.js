import { buildBreakdown } from "./VaultFolderCard";
import { DEFAULT_VAULT_FILTERS, applyVaultFilters } from "./vaultFilters";

const KEY = "cadence_vault_shape";
const MAX = 30;
const MAX_CHIPS = 4;

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
  } catch {
    /* ignore: default shape is used */
  }
  return {};
}

// view: "university" | "custom"
// null = never saved (caller uses a default guess)
// []   = saved, that tab really had no workspaces
// Otherwise one number per card: how many type chips it showed.
export function readVaultShape(view) {
  const list = readAll()[view];
  if (!Array.isArray(list)) return null;
  return list
    .slice(0, MAX)
    .map((n) => Math.min(MAX_CHIPS, Math.max(0, Number(n) || 0)));
}

function chipCounts(groups) {
  // Same order the page shows on first paint (default filters + default sort).
  return applyVaultFilters(groups ?? [], DEFAULT_VAULT_FILTERS)
    .slice(0, MAX)
    .map((g) => Math.min(MAX_CHIPS, buildBreakdown(g.items || []).length));
}

export function saveVaultShape(bySubject, byFolder) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ university: chipCounts(bySubject), custom: chipCounts(byFolder) })
    );
  } catch {
    /* storage unavailable */
  }
}
