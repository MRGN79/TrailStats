import { useState } from "react";
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
import type { AggregatedPeriod } from "../lib/types";
import { formatDistance } from "../lib/format";

interface Props {
  periods: AggregatedPeriod[];
  locale: string;
}

export function TrendsChart({ periods, locale }: Props) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);

  const data = periods.map((p) => ({
    label: p.label,
    distance: Number(p.distanceKm.toFixed(1)),
  }));

  return (
    <section aria-label={t("stats.trends.title")}>
      <h2 className="section-title">{t("stats.trends.title")}</h2>

      <div className="chart-wrap" role="img" aria-label={t("stats.trends.chartAlt")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              stroke="var(--border-strong)"
              axisLine={false}
              tickLine={false}
              tick={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fill: "var(--ink-muted)",
              }}
            />
            <YAxis
              stroke="var(--border-strong)"
              axisLine={false}
              tickLine={false}
              tick={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fill: "var(--ink-muted)",
                style: { fontFeatureSettings: '"tnum" 1' },
              }}
            />
            <Tooltip
              cursor={{ fill: "rgba(63, 125, 90, 0.08)" }}
              contentStyle={{
                background: "var(--forest-deep)",
                border: "none",
                borderRadius: "6px",
                color: "var(--paper)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
              }}
              labelStyle={{ color: "var(--paper)", opacity: 0.7 }}
              itemStyle={{ color: "var(--paper)" }}
              formatter={(value: number) => [
                `${formatDistance(value, locale)} ${t("units.km")}`,
                t("stats.totals.distance"),
              ]}
            />
            <Bar
              dataKey="distance"
              fill="var(--moss)"
              radius={[3, 3, 0, 0]}
              maxBarSize={48}
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
          <caption className="visually-hidden">{t("stats.trends.title")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("stats.trends.period")}</th>
              <th scope="col">{t("stats.trends.distanceLabel")}</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.key}>
                <th scope="row">{p.label}</th>
                <td>{formatDistance(p.distanceKm, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
