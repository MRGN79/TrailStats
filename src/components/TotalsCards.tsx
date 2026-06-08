import { useTranslation } from "react-i18next";
import type { Totals } from "../lib/types";
import { formatDistance, formatDuration, formatNumber } from "../lib/format";

interface Props {
  totals: Totals;
  locale: string;
}

export function TotalsCards({ totals, locale }: Props) {
  const { t } = useTranslation();

  const cards = [
    {
      label: t("stats.totals.activities"),
      value: formatNumber(totals.activities, locale),
      unit: "",
    },
    {
      label: t("stats.totals.distance"),
      value: formatDistance(totals.distanceKm, locale),
      unit: t("units.km"),
    },
    {
      label: t("stats.totals.time"),
      value: formatDuration(totals.movingTimeSec, locale),
      unit: "",
    },
    {
      label: t("stats.totals.elevation"),
      value: formatNumber(totals.elevationGainM, locale),
      unit: t("units.m"),
    },
  ];

  return (
    <section aria-label={t("stats.totals.title")}>
      <h2 className="section-title">{t("stats.totals.title")}</h2>
      <div className="cards">
        {cards.map((c) => (
          <div className="card" key={c.label}>
            <div className="label">{c.label}</div>
            <div className="value">
              {c.value}
              {c.unit && <span className="unit">{c.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
