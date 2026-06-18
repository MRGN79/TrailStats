import { useTranslation } from "react-i18next";

interface ConsentBannerProps {
  onAccept: () => void;
  onReject: () => void;
}

export function ConsentBanner({ onAccept, onReject }: ConsentBannerProps) {
  const { t } = useTranslation();
  return (
    <div className="consent-banner" role="dialog" aria-modal="false" aria-label={t("consent.ariaLabel")}>
      <p className="consent-banner__text">{t("consent.text")}</p>
      <div className="consent-banner__actions">
        <button type="button" className="btn-secondary" onClick={onReject}>
          {t("consent.reject")}
        </button>
        <button type="button" className="btn-primary" onClick={onAccept}>
          {t("consent.accept")}
        </button>
      </div>
    </div>
  );
}
