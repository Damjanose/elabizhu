export type HomeCategoryKey = "rings" | "bracelets" | "earrings" | "necklaces" | "watches"

export const HOME_CATEGORIES: { key: HomeCategoryKey; aliases: string[] }[] = [
  { key: "rings", aliases: ["rings", "unaza"] },
  { key: "bracelets", aliases: ["bracelets", "byzylyke", "byzylyk"] },
  { key: "earrings", aliases: ["earrings", "vathe"] },
  { key: "necklaces", aliases: ["necklaces", "gjerdane"] },
  { key: "watches", aliases: ["watches", "ore"] },
]

/** Lowercases and strips diacritics so "Vathë" matches "vathe". */
export const normalizeCategoryName = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()

/** Finds the API category for a home category key by English or Albanian name. */
export const matchHomeCategory = <T extends { id: string; name: string }>(
  key: HomeCategoryKey,
  categories: readonly T[],
): T | undefined => {
  const aliases = HOME_CATEGORIES.find((c) => c.key === key)?.aliases ?? []
  return categories.find((category) => aliases.includes(normalizeCategoryName(category.name)))
}
