import { useEffect, useId, useState } from "react";
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
import { axisTickStyle, tooltipStyle } from "./chartStyles";

interface Props {
  periods: AggregatedPeriod[];
  locale: string;
  yearOverYear?: YearOverYearData | null;
}

export function TrendsChart({ periods, locale, yearOverYear }: Props) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);
  const [compareYears, setCompareYears] = useState(false);
  const hintId = useId();

  useEffect(() => {
    if (yearOverYear == null) setCompareYears(false);
  }, [yearOverYear]);

  const activeYoY = compareYears ? yearOverYear : null;
  const compare = activeYoY != null;

  const labelTickStyle = {
    fontFamily: "var(--font-body)",
    fontSize: 11,
    fill: "rgba(250,248,243,0.5)",
  };

  const singleData = periods.map((p) => ({
    label: p.label,
    distance: Number(p.distanceKm.toFixed(1)),
  }));

  return (
    <section aria-label={t("stats.trends.title")}>
      <div className="trends-header">
        <h2 className="section-title">{t("stats.trends.title")}</h2>
        {yearOverYear && (
          <>
            <label className="switch">
              <input
                type="checkbox"
                checked={compareYears}
                onChange={(e) => setCompareYears(e.target.checked)}
                aria-describedby={hintId}
              />
              <span>{t("stats.trends.compareYears")}</span>
            </label>
            <span id={hintId} className="visually-hidden">
              {t("stats.trends.compareYearsHint", {
                current: yearOverYear.currentYear,
                previous: yearOverYear.previousYear,
              })}
            </span>
          </>
        )}
      </div>

      <span aria-live="polite" className="visually-hidden">
        {compare
          ? t("stats.trends.yearOverYearAlt", {
              current: activeYoY!.currentYear,
              previous: activeYoY!.previousYear,
            })
          : t("stats.trends.chartAlt")}
      </span>

      {compare ? (
        <div
          className="chart-wrap"
          role="img"
          aria-label={t("stats.trends.yearOverYearAlt", {
            current: activeYoY!.currentYear,
            previous: activeYoY!.previousYear,
          })}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeYoY!.points}>
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
                name={String(activeYoY!.previousYear)}
                fill="var(--moss)"
                fillOpacity={0.45}
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />
              <Bar
                dataKey="current"
                name={String(activeYoY!.currentYear)}
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
                current: activeYoY!.currentYear,
                previous: activeYoY!.previousYear,
              })}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("stats.trends.period")}</th>
                <th scope="col">{activeYoY!.previousYear}</th>
                <th scope="col">{activeYoY!.currentYear}</th>
              </tr>
            </thead>
            <tbody>
              {activeYoY!.points.map((p) => (
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
