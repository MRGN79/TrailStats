import { useTranslation } from "react-i18next";
import type { PaceZonesData } from "../lib/types";
import { formatPace } from "../lib/format";

interface Props {
  zones: PaceZonesData | null;
  locale: string;
}

const ZONE_COLORS: Record<number, string> = {
  1: "rgba(63,125,90,0.5)",
  2: "var(--moss)",
  3: "rgba(252,82,0,0.5)",
  4: "var(--ember)",
  5: "#c2410c",
};

const ZONE_KEYS = ["z1", "z2", "z3", "z4", "z5"] as const;

export function PaceZones({ zones, locale: _locale }: Props) {
  const { t } = useTranslation();

  if (!zones) return null;

  return (
    <section aria-label={t("stats.paceZones.title")}>
      <h2 className="section-title">{t("stats.paceZones.title")}</h2>
      <div className="pace-zones">
        {zones.zones.map((zd) => {
          const pct = Math.round(zd.share * 100);
          return (
            <div className="pace-zone" key={zd.zone}>
              <span className="pace-zone__label">{t(`stats.paceZones.${ZONE_KEYS[zd.zone - 1]}`)}</span>
              <div className="pace-zone__bar-bg">
                <div
                  className="pace-zone__bar-fill"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: ZONE_COLORS[zd.zone],
                  }}
                />
              </div>
              <span className="pace-zone__pct">{pct}%</span>
            </div>
          );
        })}
      </div>
      <p className="pace-zones__note">
        {t("stats.paceZones.threshold", {
          pace: formatPace(zones.thresholdPaceSecPerKm),
        })}
      </p>
    </section>
  );
}
