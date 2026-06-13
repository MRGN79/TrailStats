import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FitnessData } from "../lib/types";
import { axisTickStyle, tooltipStyle } from "./chartStyles";

interface Props {
  data: FitnessData;
  locale: string;
}

export function FitnessChart({ data, locale }: Props) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);

  const monthFmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short" }), [locale]);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }), [locale]);

  if (data.points.length === 0) return null;

  return (
    <section aria-label={t("stats.fitness.title")}>
      <h2 className="section-title">{t("stats.fitness.title")}</h2>
      <p className="section-disclaimer">{t("disclaimer.estimatesOnly")}</p>
      <div
        className="chart-wrap"
        role="img"
        aria-label={t("stats.fitness.chartAlt")}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.points}>
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(d: Date) => monthFmt.format(d)}
              stroke="rgba(255,255,255,0.15)"
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="rgba(255,255,255,0.15)"
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
            />
            <ReferenceLine
              y={0}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="3 3"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "var(--paper)", opacity: 0.7 }}
              itemStyle={{ color: "var(--paper)" }}
              labelFormatter={(d: Date) => dateFmt.format(d)}
              formatter={(value: number, name: string) => [
                Number.isFinite(value) ? value.toFixed(1) : "—",
                name,
              ]}
            />
            <Legend
              wrapperStyle={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                color: "var(--paper)",
              }}
            />
            <Line
              type="monotone"
              dataKey="ctl"
              name={t("stats.fitness.ctl")}
              stroke="var(--moss)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="atl"
              name={t("stats.fitness.atl")}
              stroke="var(--ember)"
              strokeOpacity={0.7}
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="tsb"
              name={t("stats.fitness.tsb")}
              stroke="var(--paper)"
              strokeOpacity={0.5}
              strokeWidth={1.5}
              strokeDasharray="2 3"
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
        {showTable
          ? t("stats.trends.hideTable")
          : t("stats.trends.showTable")}
      </button>

      {showTable && (
        <table className="data-table">
          <caption className="visually-hidden">{t("stats.fitness.title")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("stats.fitness.dateCol")}</th>
              <th scope="col">{t("stats.fitness.tooltip.ctl")}</th>
              <th scope="col">{t("stats.fitness.tooltip.atl")}</th>
              <th scope="col">{t("stats.fitness.tooltip.tsb")}</th>
            </tr>
          </thead>
          <tbody>
            {data.points.map((p) => (
              <tr key={p.date.getTime()}>
                <th scope="row">{dateFmt.format(p.date)}</th>
                <td>{p.ctl.toFixed(1)}</td>
                <td>{p.atl.toFixed(1)}</td>
                <td>{p.tsb.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
