import { useMemo, useState } from "react";
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
import type { Payload } from "recharts/types/component/DefaultTooltipContent";
import type { LongRunPoint } from "../lib/types";
import { axisTickStyle, tooltipStyle } from "./chartStyles";

interface Props {
  points: LongRunPoint[];
  locale: string;
}

export function LongRunTrend({ points, locale }: Props) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);

  const data = useMemo(() => {
    const shortFmt = new Intl.DateTimeFormat(locale, { month: "short" });
    const longFmt = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short" });
    return points.map((p) => ({
      label: shortFmt.format(p.date),
      longLabel: longFmt.format(p.date),
      distanceKm: p.distanceKm,
    }));
  }, [points, locale]);

  if (points.length === 0) return null;

  if (points.length < 2) {
    return (
      <section aria-label={t("stats.longRun.title")}>
        <h2 className="section-title">{t("stats.longRun.title")}</h2>
        <p className="section-disclaimer" role="status">{t("stats.longRun.noData")}</p>
      </section>
    );
  }

  return (
    <section aria-label={t("stats.longRun.title")}>
      <h2 className="section-title">{t("stats.longRun.title")}</h2>

      <div className="chart-wrap" role="img" aria-label={t("stats.longRun.chartAlt")}>
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
              cursor={{ stroke: "rgba(63, 125, 90, 0.3)" }}
              contentStyle={tooltipStyle}
              labelStyle={{ color: "var(--paper)", opacity: 0.7 }}
              itemStyle={{ color: "var(--paper)" }}
              labelFormatter={(_: unknown, payload: Payload<number, string>[]) =>
                (payload?.[0]?.payload as { longLabel?: string })?.longLabel ?? ""
              }
              formatter={(value: number) => [
                `${value} ${t("units.km")}`,
                t("stats.longRun.distanceLabel"),
              ]}
            />
            <Line
              type="monotone"
              dataKey="distanceKm"
              stroke="var(--moss)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "var(--moss)" }}
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
          <caption className="visually-hidden">{t("stats.longRun.title")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("stats.longRun.dateCol")}</th>
              <th scope="col">{t("stats.longRun.distanceLabel")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.longLabel}>
                <th scope="row">{row.longLabel}</th>
                <td>{row.distanceKm} {t("units.km")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
