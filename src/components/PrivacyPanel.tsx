import { useTranslation } from "react-i18next";
import type { ConsentState } from "../lib/adConsent";

interface Props {
  onClearData?: () => void;
  adConsent?: ConsentState;
  onResetConsent?: () => void;
}

export function PrivacyPanel({ onClearData, adConsent, onResetConsent }: Props) {
  const { t } = useTranslation();

  const points = [
    t("privacy.points.local"),
    t("privacy.points.noServer"),
    t("privacy.points.healthData"),
    t("privacy.points.activityNames"),
    t("privacy.points.ads"),
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
      {onClearData && (
        <p className="privacy-panel__clear">
          <button type="button" className="btn-link" onClick={onClearData}>
            {t("privacy.clearData")}
          </button>
        </p>
      )}
      {onResetConsent && adConsent !== null && (
        <p className="privacy-panel__clear">
          {adConsent === "accepted" ? t("privacy.adConsent.accepted") : t("privacy.adConsent.rejected")}
          {" — "}
          <button type="button" className="btn-link" onClick={onResetConsent}>
            {t("privacy.adConsent.change")}
          </button>
        </p>
      )}
      <p className="privacy-panel__verify">{t("privacy.verify")}</p>
      <p className="privacy-panel__licenses">
        <a href={`${import.meta.env.BASE_URL}third-party-licenses.txt`} target="_blank" rel="noopener noreferrer">
          {t("privacy.licenses")}
        </a>
        {" · "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          {t("privacy.googlePolicy")}
        </a>
      </p>
    </section>
  );
}
