import { useTranslation } from "react-i18next";

interface Props {
  onExit: () => void;
}

export function DemoBanner({ onExit }: Props) {
  const { t } = useTranslation();

  return (
    <div className="demo-banner" role="status">
      <span className="demo-banner__text">
        <span className="demo-banner__badge">{t("demo.badge")}</span>
        {t("demo.bannerText")}
      </span>
      <button type="button" className="btn-secondary" onClick={onExit}>
        {t("demo.exit")}
      </button>
    </div>
  );
}
