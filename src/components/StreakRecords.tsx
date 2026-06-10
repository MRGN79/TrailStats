import { useTranslation } from "react-i18next";
import type { PeriodRecords, StreakStats } from "../lib/types";
import { formatDistance, formatNumber } from "../lib/format";
import { ShareButton } from "./ShareButton";

interface Props {
  streak: StreakStats;
  records: PeriodRecords;
  locale: string;
}

export function StreakRecords({ streak, records, locale }: Props) {
  const { t } = useTranslation();

  const items: { label: string; value: string; sub?: string; shareValue?: string }[] = [
    {
      label: t("stats.streak.current"),
      value: formatNumber(streak.current, locale),
      sub: t("stats.streak.weeks", { count: streak.current }),
    },
    {
      label: t("stats.streak.longest"),
      value: formatNumber(streak.longest, locale),
      sub: t("stats.streak.weeks", { count: streak.longest }),
    },
  ];

  if (records.bestWeek) {
    items.push({
      label: t("stats.records.bestWeek"),
      value: `${formatDistance(records.bestWeek.distanceKm, locale)} ${t("units.km")}`,
      sub: records.bestWeek.label,
      shareValue: `${formatDistance(records.bestWeek.distanceKm, locale)} ${t("units.km")}`,
    });
  }

  if (records.bestMonth) {
    items.push({
      label: t("stats.records.bestMonth"),
      value: `${formatDistance(records.bestMonth.distanceKm, locale)} ${t("units.km")}`,
      sub: records.bestMonth.label,
      shareValue: `${formatDistance(records.bestMonth.distanceKm, locale)} ${t("units.km")}`,
    });
  }

  return (
    <section aria-label={t("stats.records.title")}>
      <h2 className="section-title">{t("stats.records.title")}</h2>
      <div className="cards">
        {items.map((item, idx) => (
          <div className="card" key={item.label}>
            <div className="label">{item.label}</div>
            <div className="value">{item.value}</div>
            {item.sub && <div className="card__sub">{item.sub}</div>}
            {idx === 0 && (
              <ShareButton
                getData={() => ({
                  category: t("stats.streak.title"),
                  subcategory: t("stats.streak.current"),
                  mainValue: formatNumber(streak.current, locale),
                  unit: t("stats.streak.weeks", { count: streak.current }),
                })}
              />
            )}
            {idx >= 2 && item.shareValue !== undefined && (
              <ShareButton
                getData={() => ({
                  category: t("stats.records.title"),
                  subcategory: item.label,
                  mainValue: item.shareValue!,
                  detail: item.sub,
                })}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
