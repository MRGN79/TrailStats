import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = i18n.language.startsWith("es") ? "es" : "en";

  return (
    <div className="lang-toggle" role="group" aria-label={t("lang.toggle")}>
      <button
        type="button"
        aria-pressed={current === "en"}
        onClick={() => i18n.changeLanguage("en")}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={current === "es"}
        onClick={() => i18n.changeLanguage("es")}
      >
        ES
      </button>
    </div>
  );
}
