import { useTranslation } from "react-i18next";
import type { Totals } from "../lib/types";
import { formatDistance, formatDuration, formatNumber, splitDecimal } from "../lib/format";
import { ShareButton } from "./ShareButton";

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
      shareValue: formatNumber(totals.activities, locale),
      shareUnit: undefined as string | undefined,
    },
    {
      label: t("stats.totals.distance"),
      value: formatDistance(totals.distanceKm, locale),
      unit: t("units.km"),
      shareValue: formatDistance(totals.distanceKm, locale),
      shareUnit: t("units.km"),
    },
    {
      label: t("stats.totals.time"),
      value: formatDuration(totals.movingTimeSec, locale),
      unit: "",
      shareValue: formatDuration(totals.movingTimeSec, locale),
      shareUnit: undefined as string | undefined,
    },
    {
      label: t("stats.totals.elevation"),
      value: formatNumber(totals.elevationGainM, locale),
      unit: t("units.m"),
      shareValue: formatNumber(totals.elevationGainM, locale),
      shareUnit: t("units.m"),
    },
  ];

  const categoryLabel = t("stats.totals.title");

  return (
    <section aria-label={t("stats.totals.title")}>
      <h2 className="section-title">{t("stats.totals.title")}</h2>
      <div className="cards">
        {cards.map((c) => {
          const { integer, decimal } = splitDecimal(c.value, locale);
          return (
          <div className="card" key={c.label}>
            <div className="label">{c.label}</div>
            <div className="value">
              {integer}
              {decimal && <span className="value__frac">{decimal}</span>}
              {c.unit && <span className="unit">{c.unit}</span>}
            </div>
            <ShareButton
              getData={() => ({
                category: categoryLabel,
                subcategory: c.label,
                mainValue: c.shareValue,
                unit: c.shareUnit,
              })}
            />
          </div>
          );
        })}
      </div>
    </section>
  );
}
