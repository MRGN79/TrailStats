import { useMemo, useRef, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { Totals } from "../lib/types";
import { formatDistance, formatDuration, formatNumber, splitDecimal } from "../lib/format";
import { useCountUp, type CountUpMetric } from "../lib/useCountUp";
import {
  equivalenceForDistance,
  equivalenceForElevation,
  equivalenceForMovingTime,
  type Equivalence,
} from "../lib/equivalence";
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
  /** Nonce de celebración (CE-1): >0 dispara el count-up una vez por
   *  procesamiento/demo; 0 en restauración de caché o recálculo por filtro. */
  celebrateNonce?: number;
}

export function TotalsCards({ totals, locale, firstDate, lastDate, avgHrBpm, totalCalories, revealIndex, celebrateNonce = 0 }: Props) {
  const { t } = useTranslation();
  const cardsRef = useRef<HTMLDivElement>(null);

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
  // `raw` y `format` alimentan el conteo; `equiv` la equivalencia humana (US-6).
  const cards = [
    {
      label: t("stats.totals.activities"),
      value: formatNumber(totals.activities, locale),
      unit: "",
      infoKey: "activities",
      countup: "activities" as string | undefined,
      raw: totals.activities,
      format: (n: number) => formatNumber(n, locale),
      equiv: null as Equivalence | null,
      shareValue: formatNumber(totals.activities, locale),
      shareUnit: undefined as string | undefined,
    },
    {
      label: t("stats.totals.distance"),
      value: formatDistance(totals.distanceKm, locale),
      unit: t("units.km"),
      infoKey: "distance",
      countup: "distance" as string | undefined,
      raw: totals.distanceKm,
      format: (n: number) => formatDistance(n, locale),
      equiv: equivalenceForDistance(totals.distanceKm),
      shareValue: formatDistance(totals.distanceKm, locale),
      shareUnit: t("units.km"),
    },
    {
      label: t("stats.totals.time"),
      value: formatDuration(totals.movingTimeSec, locale),
      unit: "",
      infoKey: "movingTime",
      countup: "movingTime" as string | undefined,
      raw: totals.movingTimeSec,
      format: (n: number) => formatDuration(n, locale),
      equiv: equivalenceForMovingTime(totals.movingTimeSec),
      shareValue: formatDuration(totals.movingTimeSec, locale),
      shareUnit: undefined as string | undefined,
    },
    {
      label: t("stats.totals.elevation"),
      value: formatNumber(totals.elevationGainM, locale),
      unit: t("units.m"),
      infoKey: "elevation",
      countup: "elevation" as string | undefined,
      raw: totals.elevationGainM,
      format: (n: number) => formatNumber(n, locale),
      equiv: equivalenceForElevation(totals.elevationGainM),
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
          raw: 0,
          format: (n: number) => formatNumber(n, locale),
          equiv: null as Equivalence | null,
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
          raw: 0,
          format: (n: number) => formatNumber(n, locale),
          equiv: null as Equivalence | null,
          shareValue: formatNumber(avgHrBpm, locale),
          shareUnit: t("units.bpm"),
        }]
      : []),
  ];

  const countMetrics: Record<string, CountUpMetric> = {};
  for (const c of cards) {
    if (!c.countup) continue;
    countMetrics[c.countup] = {
      value: c.raw,
      format: c.format,
      srText: t("summit.a11y.countupFinal", {
        label: c.label,
        value: c.unit ? `${c.value} ${c.unit}` : c.value,
      }),
    };
  }
  useCountUp(cardsRef, countMetrics, celebrateNonce);

  const eqNumberFmt = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale]
  );

  const categoryLabel = t("stats.totals.title");

  return (
    <section
      aria-label={t("stats.totals.title")}
      className={revealIndex != null ? "summit-beat" : undefined}
      style={revealIndex != null ? ({ "--beat-index": revealIndex } as CSSProperties) : undefined}
    >
      <h2 className="section-title">{t("stats.totals.title")}</h2>
      {dateRangeLabel && <p className="section-sub">{dateRangeLabel}</p>}
      <div className="cards" ref={cardsRef}>
        {cards.map((c) => {
          const { integer, decimal } = splitDecimal(c.value, locale);
          const equivText = c.equiv
            ? t(`stats.equivalence.${c.equiv.key}`, {
                count: c.equiv.count,
                value: eqNumberFmt.format(c.equiv.count),
              })
            : null;
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
                {c.countup ? (
                  <span className="value__amount" data-countup-amount="">
                    {integer}
                    {decimal && <span className="value__frac">{decimal}</span>}
                  </span>
                ) : (
                  <>
                    {integer}
                    {decimal && <span className="value__frac">{decimal}</span>}
                  </>
                )}
                {c.unit && <span className="unit">{c.unit}</span>}
              </div>
              {equivText && <div className="card__equiv">{equivText}</div>}
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
