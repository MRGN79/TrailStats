import { useTranslation } from "react-i18next";
import type { TrainingLoad as TrainingLoadData } from "../lib/types";
import { formatNumber } from "../lib/format";
import { ShareButton } from "./ShareButton";

interface Props {
  load: TrainingLoadData | null;
  locale: string;
}

const STATE_TO_FILL: Record<string, string> = {
  low: "var(--moss)",
  normal: "var(--moss)",
  high: "var(--ember)",
  veryHigh: "var(--danger)",
};

export function TrainingLoad({ load, locale }: Props) {
  const { t } = useTranslation();

  if (!load) {
    return (
      <section aria-label={t("stats.load.title")}>
        <h2 className="section-title">{t("stats.load.title")}</h2>
        <p className="section-disclaimer" role="status">{t("stats.load.noData")}</p>
      </section>
    );
  }

  const indexPct = Math.round(load.index * 100);
  // La barra refleja el índice; 200% se mapea al ancho completo.
  const barWidth = Math.min(100, Math.round(load.index * 50));

  return (
    <section aria-label={t("stats.load.title")}>
      <h2 className="section-title">{t("stats.load.title")}</h2>
      <div className="load">
        <div className="load__header">
          <span className="load__index">{formatNumber(indexPct, locale)}%</span>
          <span className="load__state">{t(`stats.load.state.${load.state}`)}</span>
        </div>
        <div
          className="load__bar"
          role="progressbar"
          aria-valuenow={indexPct}
          aria-valuemin={0}
          aria-valuemax={200}
          aria-label={t("stats.load.barLabel")}
        >
          <span
            className="load__bar-fill"
            style={{
              width: `${barWidth}%`,
              backgroundColor: STATE_TO_FILL[load.state] ?? "var(--moss)",
            }}
          />
        </div>
        <p className="load__caption">
          {t("stats.load.caption", {
            current: formatNumber(load.currentLoad, locale),
            baseline: formatNumber(load.baselineLoad, locale),
          })}
        </p>
        <ShareButton
          getData={() => ({
            category: t("stats.load.title"),
            subcategory: t(`stats.load.state.${load.state}`),
            mainValue: `${indexPct}%`,
            detail: t("stats.load.caption", {
              current: formatNumber(load.currentLoad, locale),
              baseline: formatNumber(load.baselineLoad, locale),
            }),
          })}
          label={t("share.buttonFor", { item: t("stats.load.title") })}
        />
      </div>
    </section>
  );
}
