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

      <div className="chart-wrap" role="img" aria-label={t("stats.trends.distanceLabel")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number) => [
                `${formatDistance(value, locale)} ${t("units.km")}`,
                t("stats.totals.distance"),
              ]}
            />
            <Bar dataKey="distance" fill="#fc5200" />
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
