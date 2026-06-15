import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Totals } from "../lib/types";
import { formatDistance, formatDuration, formatNumber, splitDecimal } from "../lib/format";
import { ShareButton } from "./ShareButton";
import { InfoButton } from "./InfoButton";

interface Props {
  totals: Totals;
  locale: string;
  firstDate: Date | null;
  lastDate: Date | null;
  avgHrBpm?: number | null;
}

export function TotalsCards({ totals, locale, firstDate, lastDate, avgHrBpm }: Props) {
  const { t } = useTranslation();

  const dateRangeLabel = useMemo(() => {
    if (!firstDate || !lastDate || firstDate.getTime() === 0 || lastDate.getTime() === 0) return null;
    const fmt = new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" });
    const f = fmt.format(firstDate);
    const l = fmt.format(lastDate);
    if (f === l) return f;
    return t("stats.totals.dateRange", { first: f, last: l });
  }, [firstDate, lastDate, locale, t]);

  const cards = [
    {
      label: t("stats.totals.activities"),
      value: formatNumber(totals.activities, locale),
      unit: "",
      infoKey: "activities",
      shareValue: formatNumber(totals.activities, locale),
      shareUnit: undefined as string | undefined,
    },
    {
      label: t("stats.totals.distance"),
      value: formatDistance(totals.distanceKm, locale),
      unit: t("units.km"),
      infoKey: "distance",
      shareValue: formatDistance(totals.distanceKm, locale),
      shareUnit: t("units.km"),
    },
    {
      label: t("stats.totals.time"),
      value: formatDuration(totals.movingTimeSec, locale),
      unit: "",
      infoKey: "movingTime",
      shareValue: formatDuration(totals.movingTimeSec, locale),
      shareUnit: undefined as string | undefined,
    },
    {
      label: t("stats.totals.elevation"),
      value: formatNumber(totals.elevationGainM, locale),
      unit: t("units.m"),
      infoKey: "elevation",
      shareValue: formatNumber(totals.elevationGainM, locale),
      shareUnit: t("units.m"),
    },
    ...(avgHrBpm != null
      ? [{
          label: t("stats.totals.avgHr"),
          value: formatNumber(avgHrBpm, locale),
          unit: t("units.bpm"),
          infoKey: "avgHr",
          shareValue: formatNumber(avgHrBpm, locale),
          shareUnit: t("units.bpm"),
        }]
      : []),
  ];

  const categoryLabel = t("stats.totals.title");

  return (
    <section aria-label={t("stats.totals.title")}>
      <h2 className="section-title">{t("stats.totals.title")}</h2>
      {dateRangeLabel && <p className="section-sub">{dateRangeLabel}</p>}
      <div className="cards">
        {cards.map((c) => {
          const { integer, decimal } = splitDecimal(c.value, locale);
          return (
            <div className="card" key={c.label}>
              <div className="label">
                {c.label}
                <InfoButton text={t(`stats.info.${c.infoKey}`)} />
              </div>
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
                label={t("share.buttonFor", { item: c.label })}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
