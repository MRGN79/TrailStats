import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { HeatmapData, HeatLevel } from "../lib/types";
import { formatDistance } from "../lib/format";

interface Props {
  data: HeatmapData;
  locale: string;
}

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;
const TOP = 16;
const LEFT = 22;

const MONTH_KEYS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const LEVEL_FILL: Record<HeatLevel, string> = {
  none: "rgba(255,255,255,0.06)",
  low: "color-mix(in srgb, var(--moss) 40%, transparent)",
  medium: "color-mix(in srgb, var(--moss) 70%, transparent)",
  high: "var(--moss)",
  exceptional: "var(--ember)",
};

// Día de la semana con lunes = 0 … domingo = 6 (consistente con ISO).
function weekdayMon0(date: Date): number {
  const d = date.getUTCDay();
  return d === 0 ? 6 : d - 1;
}

export function ActivityHeatmap({ data, locale }: Props) {
  const { t } = useTranslation();

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [locale]
  );

  const { columns, monthLabels, width, height } = useMemo(() => {
    const days = data.days;
    // La primera columna empieza el lunes de la semana del primer día.
    const firstWeekday = days.length > 0 ? weekdayMon0(days[0].date) : 0;
    const cols: { x: number; cells: (typeof days)[number][] }[] = [];

    let col = 0;
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const row = (firstWeekday + i) % 7;
      if (row === 0 && i > 0) col += 1;
      if (!cols[col]) cols[col] = { x: LEFT + col * STEP, cells: [] };
      cols[col].cells.push(day);
    }

    // Etiquetas de mes: primera columna donde aparece cada mes.
    const labels: { x: number; key: string }[] = [];
    let lastMonth = -1;
    for (let c = 0; c < cols.length; c++) {
      const firstCell = cols[c].cells[0];
      if (!firstCell) continue;
      const m = firstCell.date.getUTCMonth();
      if (m !== lastMonth) {
        labels.push({ x: cols[c].x, key: MONTH_KEYS[m] });
        lastMonth = m;
      }
    }

    return {
      columns: cols,
      monthLabels: labels,
      width: LEFT + cols.length * STEP,
      height: TOP + 7 * STEP,
    };
  }, [data]);

  return (
    <section aria-label={t("stats.heatmap.title")}>
      <h2 className="section-title">{t("stats.heatmap.title")}</h2>

      <div className="heatmap-scroll">
        <svg
          className="heatmap"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={t("stats.heatmap.title")}
        >
          {monthLabels.map((m, i) => (
            <text
              key={`${m.key}-${i}`}
              x={m.x}
              y={11}
              className="heatmap__month"
            >
              {t(`stats.heatmap.months.${m.key}`)}
            </text>
          ))}

          {DAY_KEYS.map((dk, row) => (
            <text
              key={dk}
              x={0}
              y={TOP + row * STEP + CELL - 2}
              className="heatmap__day"
            >
              {t(`stats.heatmap.days.${dk}`)}
            </text>
          ))}

          {columns.map((c) =>
            c.cells.map((day) => {
              const row = weekdayMon0(day.date);
              const dateStr = dateFmt.format(day.date);
              const hasActivity = day.distanceKm > 0;
              const label = hasActivity
                ? t("stats.heatmap.dayLabel", {
                    date: dateStr,
                    distance: formatDistance(day.distanceKm, locale),
                  })
                : t("stats.heatmap.dayLabelEmpty", { date: dateStr });
              return (
                <rect
                  key={day.date.getTime()}
                  x={c.x}
                  y={TOP + row * STEP}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={LEVEL_FILL[day.level]}
                  aria-label={label}
                >
                  <title>{label}</title>
                </rect>
              );
            })
          )}
        </svg>
      </div>

      <ul className="heatmap-legend" aria-hidden="true">
        <li>
          <span
            className="heatmap-legend__swatch"
            style={{ background: LEVEL_FILL.none }}
          />
          {t("stats.heatmap.noActivity")}
        </li>
        <li>
          <span
            className="heatmap-legend__swatch"
            style={{ background: LEVEL_FILL.low }}
          />
          {t("stats.heatmap.low")}
        </li>
        <li>
          <span
            className="heatmap-legend__swatch"
            style={{ background: LEVEL_FILL.medium }}
          />
          {t("stats.heatmap.medium")}
        </li>
        <li>
          <span
            className="heatmap-legend__swatch"
            style={{ background: LEVEL_FILL.high }}
          />
          {t("stats.heatmap.high")}
        </li>
      </ul>
    </section>
  );
}
