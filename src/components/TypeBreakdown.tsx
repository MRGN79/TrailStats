import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TypeBreakdownSlice } from "../lib/types";
import { formatDistance } from "../lib/format";

interface Props {
  slices: TypeBreakdownSlice[];
  locale: string;
}

// Instrument palette: forest/moss/ember family, kept legible on the dark ground.
const PALETTE = [
  "#3f7d5a",
  "#fc5200",
  "#6fae8a",
  "#c2410c",
  "#2f6045",
  "#f0884f",
  "#9ac9b0",
  "#8a3b12",
];

function formatPercent(share: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(share);
}

export function TypeBreakdown({ slices, locale }: Props) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);

  const data = slices.map((s, i) => ({
    ...s,
    color: PALETTE[i % PALETTE.length],
    distance: Number(s.distanceKm.toFixed(1)),
  }));

  return (
    <section aria-label={t("stats.breakdown.title")}>
      <h2 className="section-title">{t("stats.breakdown.title")}</h2>

      <div className="breakdown">
        <div
          className="breakdown__chart"
          role="img"
          aria-label={t("stats.breakdown.chartAlt")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="distance"
                nameKey="type"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
                stroke="var(--forest-deep)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {data.map((d) => (
                  <Cell key={d.type} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--forest-deep)",
                  border: "none",
                  borderRadius: "6px",
                  color: "var(--paper)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                }}
                itemStyle={{ color: "var(--paper)" }}
                formatter={(value: number, _name, entry) => [
                  `${formatDistance(value, locale)} ${t("units.km")} · ${formatPercent(
                    (entry?.payload as { share: number }).share,
                    locale
                  )}`,
                  (entry?.payload as { type: string }).type,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="breakdown__legend">
          {data.map((d) => (
            <li key={d.type}>
              <span
                className="breakdown__swatch"
                style={{ background: d.color }}
                aria-hidden="true"
              />
              <span className="breakdown__type">{d.type}</span>
              <span className="breakdown__value">
                {formatPercent(d.share, locale)}
              </span>
            </li>
          ))}
        </ul>
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
          <caption className="visually-hidden">
            {t("stats.breakdown.title")}
          </caption>
          <thead>
            <tr>
              <th scope="col">{t("filter.activityType")}</th>
              <th scope="col">{t("stats.trends.distanceLabel")}</th>
              <th scope="col">{t("stats.breakdown.share")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.type}>
                <th scope="row">{d.type}</th>
                <td>{formatDistance(d.distanceKm, locale)}</td>
                <td>{formatPercent(d.share, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
