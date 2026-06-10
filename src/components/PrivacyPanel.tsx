import { useTranslation } from "react-i18next";

export function PrivacyPanel() {
  const { t } = useTranslation();

  const points = [
    t("privacy.points.local"),
    t("privacy.points.noServer"),
    t("privacy.points.noTracking"),
  ];

  return (
    <section className="privacy-panel" aria-label={t("privacy.heading")}>
      <h2 className="privacy-panel__heading">{t("privacy.heading")}</h2>
      <ul className="privacy-panel__list">
        {points.map((point) => (
          <li key={point}>
            <span className="privacy-panel__check" aria-hidden="true">
              ✓
            </span>
            {point}
          </li>
        ))}
      </ul>
      <p className="privacy-panel__verify">{t("privacy.verify")}</p>
      <p className="privacy-panel__licenses">
        <a href={`${import.meta.env.BASE_URL}third-party-licenses.txt`} target="_blank" rel="noopener noreferrer">
          {t("privacy.licenses")}
        </a>
      </p>
    </section>
  );
}
