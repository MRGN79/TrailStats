import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayOfWeekStat } from "../lib/types";
import { axisTickStyle, tooltipStyle } from "./chartStyles";

interface Props {
  stats: DayOfWeekStat[];
  locale: string;
}

export function DayOfWeekChart({ stats, locale }: Props) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);

  const data = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return stats.map((s) => ({
      day: fmt.format(new Date(2024, 0, 1 + s.dayIndex)), // 2024-01-01 is a Monday
      dayIndex: s.dayIndex,
      distanceKm: Number(s.distanceKm.toFixed(1)),
      count: s.count,
    }));
  }, [stats, locale]);

  if (stats.every((s) => s.count === 0)) return null;

  return (
    <section aria-label={t("stats.dayOfWeek.title")}>
      <h2 className="section-title">{t("stats.dayOfWeek.title")}</h2>

      <div className="chart-wrap" role="img" aria-label={t("stats.dayOfWeek.chartAlt")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="day"
              stroke="rgba(255,255,255,0.15)"
              axisLine={false}
              tickLine={false}
              tick={{ ...axisTickStyle, fontFamily: "var(--font-body)" }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.15)"
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(63, 125, 90, 0.08)" }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: "var(--paper)", opacity: 0.7 }}
              itemStyle={{ color: "var(--paper)" }}
              formatter={(value: number) => [
                `${value} ${t("units.km")}`,
                t("stats.dayOfWeek.distanceLabel"),
              ]}
            />
            <Bar
              dataKey="distanceKm"
              fill="var(--moss)"
              radius={[3, 3, 0, 0]}
              maxBarSize={48}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <button
        type="button"
        className="table-toggle"
        aria-expanded={showTable}
        onClick={() => setShowTable((v) => !v)}
      >
        {showTable ? t("stats.trends.hideTable") : t("stats.trends.showTable")}
      </button>

      {showTable && (
        <table className="data-table">
          <caption className="visually-hidden">{t("stats.dayOfWeek.title")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("stats.dayOfWeek.dayCol")}</th>
              <th scope="col">{t("stats.dayOfWeek.distanceLabel")}</th>
              <th scope="col">{t("stats.dayOfWeek.activitiesCol")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.dayIndex}>
                <th scope="row">{row.day}</th>
                <td>{row.distanceKm} {t("units.km")}</td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
