import { useTranslation } from "react-i18next";
import type { BestEffort } from "../lib/types";
import { formatPace } from "../lib/format";

interface Props {
  efforts: BestEffort[];
  locale: string;
}

export function BestEfforts({ efforts, locale }: Props) {
  const { t } = useTranslation();

  if (efforts.length === 0) return null;

  const dateFmt = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <section aria-label={t("stats.bestEfforts.title")}>
      <h2 className="section-title">{t("stats.bestEfforts.title")}</h2>
      <div className="cards">
        {efforts.map((e) => (
          <div className="card" key={e.bucket}>
            <div className="label">{t(`stats.bestEfforts.${e.bucket}`)}</div>
            <div className="value">
              {formatPace(e.paceSecPerKm)}
              <span className="unit">{t("units.minPerKm")}</span>
            </div>
            <div className="card__sub">{dateFmt.format(e.date)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
