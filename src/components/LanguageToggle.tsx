import { useTranslation } from "react-i18next";
import { saveLang } from "../lib/preferences";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = i18n.language.startsWith("es") ? "es" : "en";

  function handleChange(lang: string) {
    i18n.changeLanguage(lang);
    saveLang(lang);
  }

  return (
    <div className="lang-toggle" role="group" aria-label={t("lang.toggle")}>
      <button
        type="button"
        aria-pressed={current === "en"}
        onClick={() => handleChange("en")}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={current === "es"}
        onClick={() => handleChange("es")}
      >
        ES
      </button>
    </div>
  );
}
