import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AggregatedPeriod, YearOverYearData } from "../lib/types";
import { formatDistance } from "../lib/format";

interface Props {
  periods: AggregatedPeriod[];
  locale: string;
  yearOverYear?: YearOverYearData | null;
}

export function TrendsChart({ periods, locale, yearOverYear }: Props) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);

  const compare = yearOverYear != null;

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

  const singleData = periods.map((p) => ({
    label: p.label,
    distance: Number(p.distanceKm.toFixed(1)),
  }));

  return (
    <section aria-label={t("stats.trends.title")}>
      <h2 className="section-title">{t("stats.trends.title")}</h2>

      {compare ? (
        <div
          className="chart-wrap"
          role="img"
          aria-label={t("stats.trends.yearOverYearAlt", {
            current: yearOverYear.currentYear,
            previous: yearOverYear.previousYear,
          })}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearOverYear.points}>
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
                formatter={(value: number, name) => [
                  value == null
                    ? "—"
                    : `${formatDistance(value, locale)} ${t("units.km")}`,
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
              <Bar
                dataKey="previous"
                name={String(yearOverYear.previousYear)}
                fill="var(--moss)"
                fillOpacity={0.45}
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />
              <Bar
                dataKey="current"
                name={String(yearOverYear.currentYear)}
                fill="var(--ember)"
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          className="chart-wrap"
          role="img"
          aria-label={t("stats.trends.chartAlt")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={singleData}>
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
      )}

      <button
        type="button"
        className="table-toggle"
        aria-expanded={showTable}
        onClick={() => setShowTable((v) => !v)}
      >
        {showTable ? t("stats.trends.hideTable") : t("stats.trends.showTable")}
      </button>

      {showTable &&
        (compare ? (
          <table className="data-table">
            <caption className="visually-hidden">
              {t("stats.trends.yearOverYearAlt", {
                current: yearOverYear.currentYear,
                previous: yearOverYear.previousYear,
              })}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("stats.trends.period")}</th>
                <th scope="col">{yearOverYear.previousYear}</th>
                <th scope="col">{yearOverYear.currentYear}</th>
              </tr>
            </thead>
            <tbody>
              {yearOverYear.points.map((p) => (
                <tr key={p.index}>
                  <th scope="row">{p.label}</th>
                  <td>
                    {p.previous == null
                      ? "—"
                      : formatDistance(p.previous, locale)}
                  </td>
                  <td>
                    {p.current == null
                      ? "—"
                      : formatDistance(p.current, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <caption className="visually-hidden">
              {t("stats.trends.title")}
            </caption>
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
        ))}
    </section>
  );
}
