import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { UploadZone } from "./components/UploadZone";
import { TotalsCards } from "./components/TotalsCards";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { EddingtonCards } from "./components/EddingtonCards";
import { StreakRecords } from "./components/StreakRecords";
import { TrendsChart } from "./components/TrendsChart";
import { PaceEvolution } from "./components/PaceEvolution";
import { BestEfforts } from "./components/BestEfforts";
import { TrainingLoad } from "./components/TrainingLoad";
import { TypeBreakdown } from "./components/TypeBreakdown";
import { Toolbar } from "./components/Toolbar";
import { LanguageToggle } from "./components/LanguageToggle";
import { PrivacyPanel } from "./components/PrivacyPanel";
import { DemoBanner } from "./components/DemoBanner";
import { processFile } from "./lib/loadDataset";
import { generateDemoDataset } from "./lib/demoData";
import {
  aggregateByPeriod,
  computeBestEfforts,
  computeEddington,
  computeHeatmap,
  computePaceEvolution,
  computeRecords,
  computeStreak,
  computeTotals,
  computeTrainingLoad,
  computeTypeBreakdown,
  computeYearOverYear,
  filterByType,
} from "./lib/aggregate";
import type { ParsedDataset, ViewMode } from "./lib/types";

function monthLabels(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: "short" });
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2020, i, 1)));
}

type Status =
  | { kind: "idle" }
  | { kind: "processing"; done?: number; total?: number }
  | { kind: "error"; message: string }
  | { kind: "ready"; dataset: ParsedDataset; demo?: boolean };

export default function App() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("es") ? "es" : "en";

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("monthly");
  const [compareYears, setCompareYears] = useState(false);

  async function handleFile(file: File) {
    setStatus({ kind: "processing" });
    setSelectedType(null);
    setCompareYears(false);
    try {
      const dataset = await processFile(file, ({ done, total }) =>
        setStatus({ kind: "processing", done, total })
      );
      if (dataset.activities.length === 0) {
        setStatus({ kind: "error", message: t("upload.error.noActivities") });
        return;
      }
      setStatus({ kind: "ready", dataset });
    } catch (err) {
      const code = err instanceof Error ? err.message : "INVALID_ZIP";
      const message =
        code === "NO_ACTIVITIES"
          ? t("upload.error.noActivities")
          : t("upload.error.invalidZip");
      setStatus({ kind: "error", message });
    }
  }

  function handleDemo() {
    setSelectedType(null);
    setView("monthly");
    setCompareYears(false);
    setStatus({ kind: "ready", dataset: generateDemoDataset(), demo: true });
  }

  const dataset = status.kind === "ready" ? status.dataset : null;
  const isDemo = status.kind === "ready" && status.demo === true;

  const filtered = useMemo(
    () => (dataset ? filterByType(dataset.activities, selectedType) : []),
    [dataset, selectedType]
  );

  const totals = useMemo(() => computeTotals(filtered), [filtered]);
  const periods = useMemo(
    () => aggregateByPeriod(filtered, view),
    [filtered, view]
  );
  const streak = useMemo(() => computeStreak(filtered), [filtered]);
  const records = useMemo(() => computeRecords(filtered), [filtered]);
  const breakdown = useMemo(() => computeTypeBreakdown(filtered), [filtered]);
  const heatmap = useMemo(() => computeHeatmap(filtered), [filtered]);
  const eddington = useMemo(() => computeEddington(filtered), [filtered]);
  const paceEvolution = useMemo(() => computePaceEvolution(filtered), [filtered]);
  const bestEfforts = useMemo(() => computeBestEfforts(filtered), [filtered]);
  const trainingLoad = useMemo(() => computeTrainingLoad(filtered), [filtered]);
  const yearOverYear = useMemo(
    () => computeYearOverYear(filtered, view, monthLabels(locale)),
    [filtered, view, locale]
  );
  const canCompareYears = yearOverYear != null;
  const activeYoY = canCompareYears && compareYears ? yearOverYear : null;

  return (
    <div className="app">
      {dataset && (
        <div className="topbar">
          <div className="brand">
            Trail<span>Stats</span>
          </div>
          <LanguageToggle />
        </div>
      )}

      {!dataset && (
        <div className="hero">
          <div className="topbar">
            <div className="brand">
              Trail<span>Stats</span>
            </div>
            <LanguageToggle />
          </div>

          <h1>{t("app.title")}</h1>
          <p className="tagline">{t("app.tagline")}</p>

          {status.kind === "processing" ? (
            <div className="dropzone" aria-live="polite">
              <div className="spinner" aria-hidden="true" />
              <span>
                {status.total
                  ? t("upload.processingProgress", {
                      done: status.done ?? 0,
                      total: status.total,
                    })
                  : t("upload.processing")}
              </span>
            </div>
          ) : (
            <UploadZone onFile={handleFile} onDemo={handleDemo} />
          )}

          {status.kind === "error" && (
            <p className="error" role="alert">
              {status.message}
            </p>
          )}

          <PrivacyPanel />
        </div>
      )}

      {dataset && (
        <>
          {isDemo && <DemoBanner onExit={() => setStatus({ kind: "idle" })} />}

          <div className="dashboard">
            <div className="dashboard__rail">
              <Toolbar
                activityTypes={dataset.activityTypes}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                view={view}
                onViewChange={setView}
                onReset={() => setStatus({ kind: "idle" })}
                canCompareYears={canCompareYears}
                compareYears={compareYears}
                onCompareYearsChange={setCompareYears}
              />
            </div>

            <div className="dashboard__main">
              {dataset.discardedRows > 0 && (
                <p className="notice" role="status">
                  {t("upload.discarded", { count: dataset.discardedRows })}
                </p>
              )}

              <TotalsCards totals={totals} locale={locale} />
              <ActivityHeatmap data={heatmap} locale={locale} />
              <EddingtonCards stats={eddington} locale={locale} />
              <StreakRecords streak={streak} records={records} locale={locale} />
              <TrendsChart
                periods={periods}
                locale={locale}
                yearOverYear={activeYoY}
              />
              <PaceEvolution points={paceEvolution} />
              <BestEfforts efforts={bestEfforts} locale={locale} />
              <TrainingLoad load={trainingLoad} locale={locale} />
              {breakdown.length > 1 && (
                <TypeBreakdown slices={breakdown} locale={locale} />
              )}
            </div>
          </div>
        </>
      )}

      <footer className="app-footer">
        <p className="privacy-note">{t("privacy.note")}</p>
        <p className="disclaimer">{t("app.disclaimer")}</p>
      </footer>
    </div>
  );
}
