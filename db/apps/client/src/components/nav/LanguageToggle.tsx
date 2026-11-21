import { useI18n, type Lang } from "../../i18n"

type LanguageToggleProps = {
  className?: string
}

/** Shows the other language code (EN when Albanian is active, SQ when English is active). */
export const LanguageToggle = ({ className }: LanguageToggleProps) => {
  const { t, lang, setLang } = useI18n()
  const other: Lang = lang === "sq" ? "en" : "sq"
  const otherName = t(`shell.lang.${other}`)

  return (
    <button
      type="button"
      className={`aurelia-lang-toggle${className ? ` ${className}` : ""}`}
      aria-label={t("shell.lang.switchTo", { language: otherName })}
      title={otherName}
      onClick={() => setLang(other)}
    >
      {other.toUpperCase()}
    </button>
  )
}
