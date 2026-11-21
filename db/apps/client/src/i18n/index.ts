import { create } from "zustand"
import type { Lang, Messages } from "./types"
import { shellMessages } from "./messages/shell"
import { homeMessages } from "./messages/home"
import { catalogMessages } from "./messages/catalog"
import { accountMessages } from "./messages/account"
import { adminMessages } from "./messages/admin"

export type { Lang } from "./types"

const STORAGE_KEY = "elabizhu.lang"
const sets = [shellMessages, homeMessages, catalogMessages, accountMessages, adminMessages]

const dictionaries: Record<Lang, Messages> = {
  sq: Object.assign({}, ...sets.map((s) => s.sq)),
  en: Object.assign({}, ...sets.map((s) => s.en)),
}

const readInitial = (): Lang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "sq" || saved === "en") return saved
  } catch {
    /* ignore */
  }
  return "sq" // Albanian is the default
}

type LangState = { lang: Lang; setLang: (lang: Lang) => void }

export const useLangStore = create<LangState>((set) => ({
  lang: readInitial(),
  setLang: (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang
    set({ lang })
  },
}))

export type TFunction = (key: string, vars?: Record<string, string | number>) => string

/** Translate outside React (e.g. toasts, validation schemas). Falls back to sq, then to the key. */
export const translate = (lang: Lang, key: string, vars?: Record<string, string | number>): string => {
  const raw = dictionaries[lang][key] ?? dictionaries.sq[key] ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}

export const tNow: TFunction = (key, vars) => translate(useLangStore.getState().lang, key, vars)

/** React hook: re-renders on language change. Usage: const { t, lang, setLang } = useI18n() */
export const useI18n = () => {
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const t: TFunction = (key, vars) => translate(lang, key, vars)
  return { t, lang, setLang }
}
