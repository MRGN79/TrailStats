import { useTranslation } from "react-i18next";
import type { PeriodRecords, StreakStats } from "../lib/types";
import { formatDistance, formatNumber, splitDecimal } from "../lib/format";
import { ShareButton } from "./ShareButton";
import { InfoButton } from "./InfoButton";

interface Props {
  streak: StreakStats;
  records: PeriodRecords;
  locale: string;
}

export function StreakRecords({ streak, records, locale }: Props) {
  const { t } = useTranslation();

  return (
    <section aria-label={t("stats.records.title")}>
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
        <div className="card">
          <div className="label">
            {t("stats.streak.longest")}
            <InfoButton text={t("stats.info.longestStreak")} />
          </div>
          <div className="value">{formatNumber(streak.longest, locale)}</div>
          <div className="card__sub">{t("stats.streak.weeks", { count: streak.longest })}</div>
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
            <div className="card">
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
            <div className="card">
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
