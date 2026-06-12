import { useTranslation } from "react-i18next";

interface Props {
  activityCount: number;
  latestDate: Date;
  locale: string;
  onLoadAnother: () => void;
  onDismiss: () => void;
}

export function CacheBanner({ activityCount, latestDate, locale, onLoadAnother, onDismiss }: Props) {
  const { t } = useTranslation();

  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(latestDate);

  return (
    <div className="cache-banner" role="status">
      <span className="cache-banner__text">
        {t("cache.bannerText", { count: activityCount, date: formattedDate })}
      </span>
      <div className="cache-banner__actions">
        <button type="button" className="btn-secondary" onClick={onLoadAnother}>
          {t("upload.loadAnother")}
        </button>
        <button type="button" className="cache-banner__dismiss" onClick={onDismiss} aria-label={t("cache.dismiss")}>
          ×
        </button>
      </div>
    </div>
  );
}
