import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface ConsentBannerProps {
  onAccept: () => void;
  onReject: () => void;
}

export function ConsentBanner({ onAccept, onReject }: ConsentBannerProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      ref={dialogRef}
      className="consent-banner"
      role="alertdialog"
      aria-modal="false"
      aria-label={t("consent.ariaLabel")}
      aria-describedby="consent-banner-desc"
      tabIndex={-1}
    >
      <p id="consent-banner-desc" className="consent-banner__text">{t("consent.text")}</p>
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
