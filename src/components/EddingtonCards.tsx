import { useTranslation } from "react-i18next";
import type { EddingtonStat } from "../lib/types";
import { formatNumber } from "../lib/format";
import { ShareButton } from "./ShareButton";
import { InfoButton } from "./InfoButton";

interface Props {
  stats: EddingtonStat[];
  locale: string;
}

export function EddingtonCards({ stats, locale }: Props) {
  const { t } = useTranslation();

  if (stats.length === 0) {
    return (
      <section aria-label={t("stats.eddington.title")}>
        <h2 className="section-title">{t("stats.eddington.title")}</h2>
        <p className="section-disclaimer" role="status">{t("stats.eddington.noData")}</p>
      </section>
    );
  }

  return (
    <section aria-label={t("stats.eddington.title")}>
      <h2 className="section-title">{t("stats.eddington.title")}</h2>
      <div className="cards">
        {stats.map((s) => (
          <div className="card" key={s.sport}>
            <div className="label">
              {t(`stats.eddington.${s.sport}`)}
              <InfoButton text={t(`stats.info.eddington${s.sport === "run" ? "Run" : "Cycling"}`)} />
            </div>
            <div className="value">{formatNumber(s.number, locale)}</div>
            {s.next.remaining > 0 && (
              <div className="card__sub">
                {t("stats.eddington.next", {
                  count: s.next.remaining,
                  remaining: formatNumber(s.next.remaining, locale),
                  target: formatNumber(s.next.target, locale),
                })}
              </div>
            )}
            <ShareButton
              getData={() => ({
                category: t("stats.eddington.title"),
                subcategory: t(`stats.eddington.${s.sport}`),
                mainValue: formatNumber(s.number, locale),
                detail:
                  s.next.remaining > 0
                    ? t("stats.eddington.next", {
                        count: s.next.remaining,
                        remaining: formatNumber(s.next.remaining, locale),
                        target: formatNumber(s.next.target, locale),
                      })
                    : undefined,
              })}
              label={t("share.buttonFor", { item: t(`stats.eddington.${s.sport}`) })}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
