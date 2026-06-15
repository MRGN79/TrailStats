import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HrTrendPoint } from "../lib/types";
import { axisTickStyle, tooltipStyle } from "./chartStyles";

const labelTickStyle = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  fill: "rgba(250,248,243,0.5)",
};

interface Props {
  points: HrTrendPoint[];
}

export function HrTrend({ points }: Props) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);

  if (points.length < 2) return null;

  const data = points.map((p) => ({ label: p.label, bpm: p.avgHrBpm }));
  const allBpm = data.map((d) => d.bpm);
  const minBpm = Math.min(...allBpm);
  const maxBpm = Math.max(...allBpm);
  const padding = Math.max(5, Math.round((maxBpm - minBpm) * 0.2));

  return (
    <section aria-label={t("stats.hrTrend.title")}>
      <h2 className="section-title">{t("stats.hrTrend.title")}</h2>

      <div className="chart-wrap" role="img" aria-label={t("stats.hrTrend.chartAlt")}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              stroke="rgba(255,255,255,0.15)"
              axisLine={false}
              tickLine={false}
              tick={labelTickStyle}
            />
            <YAxis
              domain={[minBpm - padding, maxBpm + padding]}
              stroke="rgba(255,255,255,0.15)"
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
              tickFormatter={(v: number) => `${Math.round(v)}`}
            />
            <Tooltip
              cursor={{ stroke: "rgba(63, 125, 90, 0.3)" }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: "var(--paper)", opacity: 0.7 }}
              itemStyle={{ color: "var(--paper)" }}
              formatter={(value: number) => [
                `${value} ${t("units.bpm")}`,
                t("stats.hrTrend.bpmLabel"),
              ]}
            />
            <Line
              type="monotone"
              dataKey="bpm"
              stroke="var(--ember)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
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
          <caption className="visually-hidden">{t("stats.hrTrend.title")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("stats.trends.period")}</th>
              <th scope="col">{t("stats.hrTrend.bpmLabel")}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.key}>
                <th scope="row">{p.label}</th>
                <td>{p.avgHrBpm} {t("units.bpm")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
