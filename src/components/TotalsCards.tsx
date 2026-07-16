import { useMemo, type CSSProperties } from "react";
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
  totalCalories?: number | null;
  /** Índice de beat para la revelación coreografiada (Summit). Si se omite,
   *  la sección no participa en la coreografía y se muestra directamente. */
  revealIndex?: number;
}

export function TotalsCards({ totals, locale, firstDate, lastDate, avgHrBpm, totalCalories, revealIndex }: Props) {
  const { t } = useTranslation();

  const dateRangeLabel = useMemo(() => {
    if (!firstDate || !lastDate || firstDate.getTime() === 0 || lastDate.getTime() === 0) return null;
    const fmt = new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" });
    const f = fmt.format(firstDate);
    const l = fmt.format(lastDate);
    if (f === l) return f;
    return t("stats.totals.dateRange", { first: f, last: l });
  }, [firstDate, lastDate, locale, t]);

  // `countup` marca las cuatro cifras héroe que el hook useCountUp anima
  // (data-countup / data-metric); calorías y FC media no cuentan (US-2).
  const cards = [
    {
      label: t("stats.totals.activities"),
      value: formatNumber(totals.activities, locale),
      unit: "",
      infoKey: "activities",
      countup: "activities" as string | undefined,
      shareValue: formatNumber(totals.activities, locale),
      shareUnit: undefined as string | undefined,
    },
    {
      label: t("stats.totals.distance"),
      value: formatDistance(totals.distanceKm, locale),
      unit: t("units.km"),
      infoKey: "distance",
      countup: "distance" as string | undefined,
      shareValue: formatDistance(totals.distanceKm, locale),
      shareUnit: t("units.km"),
    },
    {
      label: t("stats.totals.time"),
      value: formatDuration(totals.movingTimeSec, locale),
      unit: "",
      infoKey: "movingTime",
      countup: "movingTime" as string | undefined,
      shareValue: formatDuration(totals.movingTimeSec, locale),
      shareUnit: undefined as string | undefined,
    },
    {
      label: t("stats.totals.elevation"),
      value: formatNumber(totals.elevationGainM, locale),
      unit: t("units.m"),
      infoKey: "elevation",
      countup: "elevation" as string | undefined,
      shareValue: formatNumber(totals.elevationGainM, locale),
      shareUnit: t("units.m"),
    },
    ...(totalCalories != null
      ? [{
          label: t("stats.totals.calories"),
          value: formatNumber(totalCalories, locale),
          unit: t("units.kcal"),
          infoKey: "calories",
          countup: undefined as string | undefined,
          shareValue: formatNumber(totalCalories, locale),
          shareUnit: t("units.kcal"),
        }]
      : []),
    ...(avgHrBpm != null
      ? [{
          label: t("stats.totals.avgHr"),
          value: formatNumber(avgHrBpm, locale),
          unit: t("units.bpm"),
          infoKey: "avgHr",
          countup: undefined as string | undefined,
          shareValue: formatNumber(avgHrBpm, locale),
          shareUnit: t("units.bpm"),
        }]
      : []),
  ];

  const categoryLabel = t("stats.totals.title");

  return (
    <section
      aria-label={t("stats.totals.title")}
      className={revealIndex != null ? "summit-beat" : undefined}
      style={revealIndex != null ? ({ "--beat-index": revealIndex } as CSSProperties) : undefined}
    >
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
              <div
                className={c.countup ? "value value--countup" : "value"}
                {...(c.countup ? { "data-countup": "", "data-metric": c.countup } : {})}
              >
                {integer}
                {decimal && <span className="value__frac">{decimal}</span>}
                {c.unit && <span className="unit">{c.unit}</span>}
              </div>
              {/* Frontend inserta aquí <div className="card__equiv"> con la
                  equivalencia humana (equivalence.ts, umbral ≥1, i18n) cuando
                  aplique. No se renderiza vacío para no ocupar espacio. */}
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
