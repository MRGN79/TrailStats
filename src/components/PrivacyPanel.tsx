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
    </section>
  );
}
