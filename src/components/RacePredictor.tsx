import { useTranslation } from "react-i18next";
import type { EffortBucket, RacePredictionItem } from "../lib/types";
import { formatRaceTime } from "../lib/format";
import { ShareButton } from "./ShareButton";
import { InfoButton } from "./InfoButton";

interface Props {
  predictions: RacePredictionItem[];
  baseBucket: EffortBucket | null;
  hasEfforts: boolean;
  locale: string;
}

export function RacePredictor({ predictions, baseBucket, hasEfforts, locale: _locale }: Props) {
  const { t } = useTranslation();

  if (predictions.length === 0 || baseBucket === null) {
    if (!hasEfforts) return null;
    return (
      <section aria-label={t("stats.racePredictor.title")}>
        <h2 className="section-title">{t("stats.racePredictor.title")}</h2>
        <p className="section-disclaimer" role="status">{t("stats.racePredictor.noData")}</p>
      </section>
    );
  }

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
              <div className="label">
                {bucketLabel(item.bucket)}
                <InfoButton text={t("stats.info.raceTime")} />
              </div>
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
                label={t("share.buttonFor", { item: bucketLabel(item.bucket) })}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
