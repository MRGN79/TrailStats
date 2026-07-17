import { type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { PeriodRecords, StreakStats } from "../lib/types";
import { formatDistance, formatNumber, splitDecimal } from "../lib/format";
import { ShareButton } from "./ShareButton";
import { InfoButton } from "./InfoButton";

interface Props {
  streak: StreakStats;
  records: PeriodRecords;
  locale: string;
  /** Índice de beat para la revelación coreografiada (Summit). Si se omite,
   *  la sección no participa en la coreografía y se muestra directamente. */
  revealIndex?: number;
}

export function StreakRecords({ streak, records, locale, revealIndex }: Props) {
  const { t } = useTranslation();

  // Trato de "logro" con degradación digna (CE-4, §2.4.1): el halo alpenglow
  // solo aparece sobre marcas con sustancia. Racha máxima activa con ≥2 semanas
  // → logro pleno; 1 semana → acento tenue existente sin halo.
  const longestAchievement = streak.isCurrentLongest && streak.longest >= 2;
  const weekAchievement = (records.bestWeek?.distanceKm ?? 0) > 0;
  const monthAchievement = (records.bestMonth?.distanceKm ?? 0) > 0;

  return (
    <section
      aria-label={t("stats.records.title")}
      className={revealIndex != null ? "summit-beat" : undefined}
      style={revealIndex != null ? ({ "--beat-index": revealIndex } as CSSProperties) : undefined}
    >
      <h2 className="section-title">{t("stats.records.title")}</h2>
      <div className="cards">
        {/* Current streak */}
        <div className="card">
          <div className="label">
            {t("stats.streak.current")}
            <InfoButton text={t("stats.info.currentStreak")} />
          </div>
          <div className="value">{formatNumber(streak.current, locale)}</div>
          <div className="card__sub">{t("stats.streak.weeks", { count: streak.current })}</div>
          <ShareButton
            getData={() => ({
              category: t("stats.streak.title"),
              subcategory: t("stats.streak.current"),
              mainValue: formatNumber(streak.current, locale),
              unit: t("stats.streak.weeks", { count: streak.current }),
            })}
            label={t("share.buttonFor", { item: t("stats.streak.current") })}
          />
        </div>

        {/* Longest streak */}
        <div
          className={`card${
            longestAchievement
              ? " card--achievement"
              : streak.isCurrentLongest
                ? " card--longest-active"
                : ""
          }`}
        >
          {longestAchievement && (
            <span className="sr-only">
              {t("summit.a11y.achievement", { label: t("stats.streak.longest") })}
            </span>
          )}
          <div className="label">
            {t("stats.streak.longest")}
            <InfoButton text={t("stats.info.longestStreak")} />
          </div>
          <div className="value">{formatNumber(streak.longest, locale)}</div>
          <div className="card__sub">{t("stats.streak.weeks", { count: streak.longest })}</div>
          {streak.longestStart && streak.longestEnd && (() => {
            const startDate = new Date(streak.longestStart + "T00:00:00Z");
            const endDate = new Date(streak.longestEnd + "T00:00:00Z");
            const yearsDiffer = startDate.getUTCFullYear() !== endDate.getUTCFullYear();
            const shortOpts: Intl.DateTimeFormatOptions = { timeZone: "UTC", month: "short", day: "numeric" };
            const longOpts: Intl.DateTimeFormatOptions = { ...shortOpts, year: "numeric" };
            const startStr = startDate.toLocaleDateString(locale, yearsDiffer ? longOpts : shortOpts);
            const endStr = endDate.toLocaleDateString(locale, longOpts);
            return <div className="card__sub card__sub--dates">{startStr} – {endStr}</div>;
          })()}
          <ShareButton
            getData={() => ({
              category: t("stats.streak.title"),
              subcategory: t("stats.streak.longest"),
              mainValue: formatNumber(streak.longest, locale),
              unit: t("stats.streak.weeks", { count: streak.longest }),
            })}
            label={t("share.buttonFor", { item: t("stats.streak.longest") })}
          />
        </div>

        {/* Best week */}
        {records.bestWeek && (() => {
          const formatted = formatDistance(records.bestWeek.distanceKm, locale);
          const { integer, decimal } = splitDecimal(formatted, locale);
          return (
            <div className={`card${weekAchievement ? " card--achievement" : ""}`}>
              {weekAchievement && (
                <span className="sr-only">
                  {t("summit.a11y.achievement", { label: t("stats.records.bestWeek") })}
                </span>
              )}
              <div className="label">
                {t("stats.records.bestWeek")}
                <InfoButton text={t("stats.info.bestWeek")} />
              </div>
              <div className="value">
                {integer}
                {decimal && <span className="value__frac">{decimal}</span>}
                <span className="unit">{t("units.km")}</span>
              </div>
              <div className="card__sub">{records.bestWeek.label}</div>
              <ShareButton
                getData={() => ({
                  category: t("stats.records.title"),
                  subcategory: t("stats.records.bestWeek"),
                  mainValue: `${formatted} ${t("units.km")}`,
                  detail: records.bestWeek!.label,
                })}
                label={t("share.buttonFor", { item: t("stats.records.bestWeek") })}
              />
            </div>
          );
        })()}

        {/* Best month */}
        {records.bestMonth && (() => {
          const formatted = formatDistance(records.bestMonth.distanceKm, locale);
          const { integer, decimal } = splitDecimal(formatted, locale);
          return (
            <div className={`card${monthAchievement ? " card--achievement" : ""}`}>
              {monthAchievement && (
                <span className="sr-only">
                  {t("summit.a11y.achievement", { label: t("stats.records.bestMonth") })}
                </span>
              )}
              <div className="label">
                {t("stats.records.bestMonth")}
                <InfoButton text={t("stats.info.bestMonth")} />
              </div>
              <div className="value">
                {integer}
                {decimal && <span className="value__frac">{decimal}</span>}
                <span className="unit">{t("units.km")}</span>
              </div>
              <div className="card__sub">{records.bestMonth.label}</div>
              <ShareButton
                getData={() => ({
                  category: t("stats.records.title"),
                  subcategory: t("stats.records.bestMonth"),
                  mainValue: `${formatted} ${t("units.km")}`,
                  detail: records.bestMonth!.label,
                })}
                label={t("share.buttonFor", { item: t("stats.records.bestMonth") })}
              />
            </div>
          );
        })()}
      </div>
    </section>
  );
}
