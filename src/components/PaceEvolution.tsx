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
import type { PaceEvolutionPoint } from "../lib/types";
import { formatPace } from "../lib/format";

interface Props {
  points: PaceEvolutionPoint[];
}

export function PaceEvolution({ points }: Props) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);

  if (points.length === 0) return null;

  const data = points.map((p) => ({
    label: p.label,
    pace: Math.round(p.paceSecPerKm),
  }));

  const axisTickStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fill: "rgba(250,248,243,0.5)",
    style: { fontFeatureSettings: '"tnum" 1' },
  };
  const labelTickStyle = {
    fontFamily: "var(--font-body)",
    fontSize: 11,
    fill: "rgba(250,248,243,0.5)",
  };
  const tooltipStyle = {
    background: "var(--forest-deep)",
    border: "none",
    borderRadius: "6px",
    color: "var(--paper)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.85rem",
  };

  return (
    <section aria-label={t("stats.pace.title")}>
      <h2 className="section-title">{t("stats.pace.title")}</h2>

      <div className="chart-wrap" role="img" aria-label={t("stats.pace.chartAlt")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
              reversed
              domain={["dataMin", "dataMax"]}
              stroke="rgba(255,255,255,0.15)"
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
              tickFormatter={(value: number) => formatPace(value)}
            />
            <Tooltip
              cursor={{ fill: "rgba(63, 125, 90, 0.08)" }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: "var(--paper)", opacity: 0.7 }}
              itemStyle={{ color: "var(--paper)" }}
              formatter={(value: number) => [
                `${formatPace(value)} ${t("units.minPerKm")}`,
                t("stats.pace.paceLabel"),
              ]}
            />
            <Bar
              dataKey="pace"
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
          <caption className="visually-hidden">{t("stats.pace.title")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("stats.trends.period")}</th>
              <th scope="col">{t("stats.pace.paceLabel")}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.key}>
                <th scope="row">{p.label}</th>
                <td>{formatPace(p.paceSecPerKm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
