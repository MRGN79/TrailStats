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
import type { DistanceHistogramBucket } from "../lib/types";
import { axisTickStyle, tooltipStyle } from "./chartStyles";

interface Props {
  buckets: DistanceHistogramBucket[];
}

export function DistanceHistogram({ buckets }: Props) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);

  if (buckets.length === 0) return null;

  const data = buckets.map((b) => ({
    label: t(`stats.histogram.${b.key}`),
    count: b.count,
  }));

  return (
    <section aria-label={t("stats.histogram.title")}>
      <h2 className="section-title">{t("stats.histogram.title")}</h2>

      <div className="chart-wrap" role="img" aria-label={t("stats.histogram.chartAlt")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="label"
              stroke="rgba(255,255,255,0.15)"
              axisLine={false}
              tickLine={false}
              tick={{ ...axisTickStyle, fontFamily: "var(--font-body)" }}
            />
            <YAxis
              allowDecimals={false}
              stroke="rgba(255,255,255,0.15)"
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
            />
            <Tooltip
              cursor={{ fill: "rgba(63, 125, 90, 0.08)" }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: "var(--paper)", opacity: 0.7 }}
              itemStyle={{ color: "var(--paper)" }}
              formatter={(value: number) => [value, t("stats.histogram.countLabel")]}
            />
            <Bar
              dataKey="count"
              fill="var(--moss)"
              radius={[3, 3, 0, 0]}
              maxBarSize={64}
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
          <caption className="visually-hidden">{t("stats.histogram.title")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("stats.trends.period")}</th>
              <th scope="col">{t("stats.histogram.countLabel")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
