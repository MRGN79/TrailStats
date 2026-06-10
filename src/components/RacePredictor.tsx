import { useTranslation } from "react-i18next";
import type { EffortBucket, RacePredictionItem } from "../lib/types";
import { formatRaceTime } from "../lib/format";
import { ShareButton } from "./ShareButton";

interface Props {
  predictions: RacePredictionItem[];
  baseBucket: EffortBucket | null;
  locale: string;
}

export function RacePredictor({ predictions, baseBucket, locale: _locale }: Props) {
  const { t } = useTranslation();

  if (predictions.length === 0 || baseBucket === null) return null;

  const bucketLabel = (bucket: EffortBucket): string =>
    t(`stats.bestEfforts.${bucket}`);

  return (
    <section aria-label={t("stats.racePredictor.title")}>
      <h2 className="section-title">{t("stats.racePredictor.title")}</h2>
      <p className="race-predictor__subtitle">
        {t("stats.racePredictor.subtitle", { base: bucketLabel(baseBucket) })}
      </p>
      <p className="section-disclaimer">{t("disclaimer.estimatesOnly")}</p>
      <div className="cards">
        {predictions.map((item) => {
          const timeFormatted = formatRaceTime(item.timeSeconds);
          return (
            <div className="card" key={item.bucket}>
              <div className="label">{bucketLabel(item.bucket)}</div>
              <div className="value">{timeFormatted}</div>
              <div className="card__sub">
                <span
                  className={`race-predictor__badge race-predictor__badge--${item.isActual ? "actual" : "predicted"}`}
                >
                  {item.isActual
                    ? t("stats.racePredictor.actual")
                    : t("stats.racePredictor.predicted")}
                </span>
              </div>
              <ShareButton
                getData={() => ({
                  category: t("stats.racePredictor.title"),
                  subcategory: bucketLabel(item.bucket),
                  mainValue: timeFormatted,
                  detail: item.isActual
                    ? t("stats.racePredictor.actual")
                    : t("stats.racePredictor.predicted"),
                })}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
