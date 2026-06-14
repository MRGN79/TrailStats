import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { version } from "../package.json";
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
import { CacheBanner } from "./components/CacheBanner";
import { RacePredictor } from "./components/RacePredictor";
import { PaceZones } from "./components/PaceZones";
import { FitnessChart } from "./components/FitnessChart";
import { DayOfWeekChart } from "./components/DayOfWeekChart";
import { DistanceHistogram } from "./components/DistanceHistogram";
import { LongRunTrend } from "./components/LongRunTrend";
import { processFile } from "./lib/loadDataset";
import { generateDemoDataset } from "./lib/demoData";
import { saveDataset, loadDataset, clearStorage, saveBannerDismissed, loadBannerDismissed, clearBannerDismissed } from "./lib/storage";
import {
  aggregateByPeriod,
  computeBestEfforts,
  computeDayOfWeekStats,
  computeDistanceHistogram,
  computeEddington,
  computeFitness,
  computeHeatmap,
  computeLongRunTrend,
  computePaceEvolution,
  computePaceZones,
  computeLatestDate,
  computeRacePredictor,
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
  | { kind: "restoring" }
  | { kind: "processing"; done?: number; total?: number }
  | { kind: "error"; message: string }
  | { kind: "ready"; dataset: ParsedDataset; demo?: boolean };

export default function App() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("es") ? "es" : "en";

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Restore persisted dataset from IndexedDB on first mount.
  useEffect(() => {
    loadDataset()
      .then((stored) => {
        if (stored && stored.activities.length > 0) {
          setHasStoredData(true);
          setRestoredFromCache(true);
          setStatus({ kind: "ready", dataset: stored });
        } else {
          setStatus({ kind: "idle" });
        }
      })
      .catch(() => setStatus({ kind: "idle" }));
  }, []);

  const [status, setStatus] = useState<Status>({ kind: "restoring" });
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("monthly");
  const [compareYears, setCompareYears] = useState(false);
  const [srMsg, setSrMsg] = useState("");
  const [hasStoredData, setHasStoredData] = useState(false);
  const [restoredFromCache, setRestoredFromCache] = useState(false);
  const [cacheBannerDismissed, setCacheBannerDismissed] = useState(() => loadBannerDismissed());
  const [saveError, setSaveError] = useState(false);

  const dashHeadingRef = useRef<HTMLHeadingElement>(null);
  const saveGenRef = useRef(0);

  // Move focus to the dashboard heading when data finishes loading,
  // but only when no interactive element currently has focus.
  useEffect(() => {
    if (status.kind === "ready") {
      const active = document.activeElement;
      if (!active || active === document.body || active === document.documentElement) {
        dashHeadingRef.current?.focus();
      }
    }
  }, [status.kind]);

  // Mirror processing/ready states into a persistent live region to avoid
  // announce-on-unmount ARIA race condition.
  useEffect(() => {
    if (status.kind === "restoring") {
      setSrMsg(t("upload.restoring"));
    } else if (status.kind === "processing") {
      setSrMsg(
        status.total
          ? t("upload.processingProgress", { done: status.done ?? 0, total: status.total })
          : t("upload.processing")
      );
    } else if (status.kind === "ready") {
      setSrMsg(t("upload.dashboardReady"));
    }
  }, [status, t]);

  async function handleFile(file: File) {
    const saveGen = ++saveGenRef.current;
    setStatus({ kind: "processing" });
    setSelectedType(null);
    setCompareYears(false);
    setRestoredFromCache(false);
    setSaveError(false);
    clearBannerDismissed();
    setCacheBannerDismissed(false);
    try {
      const dataset = await processFile(file, ({ done, total }) =>
        setStatus({ kind: "processing", done, total })
      );
      if (dataset.activities.length === 0) {
        setStatus({ kind: "error", message: t("upload.error.noActivities") });
        return;
      }
      setStatus({ kind: "ready", dataset });
      saveDataset(dataset)
        .then(() => { if (saveGenRef.current === saveGen) setHasStoredData(true); })
        .catch(() => { if (saveGenRef.current === saveGen) setSaveError(true); });
    } catch (err) {
      const code = err instanceof Error ? err.message : "INVALID_ZIP";
      const message =
        code === "NO_ACTIVITIES" || code === "EMPTY_FIT"
          ? t("upload.error.noActivities")
          : t("upload.error.invalidZip");
      setStatus({ kind: "error", message });
    }
  }

  function handleDemo() {
    setSelectedType(null);
    setView("monthly");
    setCompareYears(false);
    setRestoredFromCache(false);
    clearBannerDismissed();
    setCacheBannerDismissed(false);
    setStatus({ kind: "ready", dataset: generateDemoDataset(), demo: true });
  }

  async function handleClearData() {
    if (!window.confirm(t("upload.purgeConfirm"))) return;
    saveGenRef.current++;
    try {
      await clearStorage();
    } catch {
      window.alert(t("upload.error.clearFailed"));
      return;
    }
    setHasStoredData(false);
    setRestoredFromCache(false);
    clearBannerDismissed();
    setCacheBannerDismissed(false);
    setStatus({ kind: "idle" });
    setSelectedType(null);
    setView("monthly");
    setCompareYears(false);
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
  const trainingLoad = useMemo(() => computeTrainingLoad(dataset?.activities ?? []), [dataset]);
  const yearOverYear = useMemo(
    () => computeYearOverYear(filtered, view, monthLabels(locale)),
    [filtered, view, locale]
  );
  const canCompareYears = yearOverYear != null;
  const activeYoY = canCompareYears && compareYears ? yearOverYear : null;

  // Reset compare-years toggle when the filtered data no longer has two full years.
  useEffect(() => {
    if (!canCompareYears) setCompareYears(false);
  }, [canCompareYears]);

  const racePredictions = useMemo(() => computeRacePredictor(bestEfforts), [bestEfforts]);
  const paceZones = useMemo(() => computePaceZones(filtered), [filtered]);
  const fitnessData = useMemo(() => computeFitness(dataset?.activities ?? []), [dataset]);
  const latestDate = useMemo(
    () => computeLatestDate(dataset?.activities ?? []),
    [dataset]
  );
  const dayOfWeekStats = useMemo(() => computeDayOfWeekStats(filtered), [filtered]);
  const distanceHistogram = useMemo(() => computeDistanceHistogram(filtered), [filtered]);
  const longRunTrend = useMemo(() => computeLongRunTrend(filtered), [filtered]);
  const filteredFirstDate = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered.reduce((min, a) => (a.date < min ? a.date : min), filtered[0].date);
  }, [filtered]);
  const filteredLastDate = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered.reduce((max, a) => (a.date > max ? a.date : max), filtered[0].date);
  }, [filtered]);

  return (
    <div className="app">
      <div className="sr-only" aria-live="polite" aria-atomic="true">{srMsg}</div>
      <a href="#main-content" className="skip-link">{t("a11y.skipToMain")}</a>

      {dataset && (
        <header className="topbar">
          <h1 className="brand">
            Trail<span>Stats</span>
          </h1>
          <LanguageToggle />
        </header>
      )}

      <main id="main-content">
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

            {(status.kind === "processing" || status.kind === "restoring") ? (
              <div className="dropzone">
                <div className="spinner" aria-hidden="true" />
                {status.kind === "processing" && (
                  <span>
                    {status.total
                      ? t("upload.processingProgress", {
                          done: status.done ?? 0,
                          total: status.total,
                        })
                      : t("upload.processing")}
                  </span>
                )}
              </div>
            ) : (
              <UploadZone onFile={handleFile} onDemo={handleDemo} />
            )}

            {status.kind === "error" && (
              <p className="error" role="alert">
                {status.message}
              </p>
            )}

            <PrivacyPanel onClearData={hasStoredData ? handleClearData : undefined} />
          </div>
        )}

        {dataset && (
          <>
            {isDemo && <DemoBanner onExit={() => setStatus({ kind: "idle" })} />}

            {restoredFromCache && !cacheBannerDismissed && !isDemo && (
              <CacheBanner
                activityCount={dataset.activities.length}
                latestDate={latestDate}
                locale={locale}
                onLoadAnother={() => {
                  setRestoredFromCache(false);
                  clearBannerDismissed();
                  setCacheBannerDismissed(false);
                  setStatus({ kind: "idle" });
                }}
                onDismiss={() => { saveBannerDismissed(); setCacheBannerDismissed(true); }}
              />
            )}

            <div className="dashboard">
              <div className="dashboard__rail">
                <Toolbar
                  activityTypes={dataset.activityTypes}
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                  view={view}
                  onViewChange={setView}
                  onReset={() => setStatus({ kind: "idle" })}
                  onClearData={isDemo ? undefined : handleClearData}
                  canCompareYears={canCompareYears}
                  compareYears={compareYears}
                  onCompareYearsChange={setCompareYears}
                />
              </div>

              <div className="dashboard__main">
                {saveError && (
                  <p className="notice" role="alert">
                    {t("upload.error.saveFailed")}
                  </p>
                )}
                <div className="dash-section">
                  <h2 className="dash-section__title" ref={dashHeadingRef} tabIndex={-1}>
                    {t("stats.sections.social")}
                  </h2>
                  <TotalsCards totals={totals} locale={locale} firstDate={filteredFirstDate} lastDate={filteredLastDate} />
                  <StreakRecords streak={streak} records={records} locale={locale} />
                  <BestEfforts efforts={bestEfforts} locale={locale} />
                  <RacePredictor
                    predictions={racePredictions.items}
                    baseBucket={racePredictions.base}
                    hasEfforts={bestEfforts.length > 0}
                    locale={locale}
                  />
                  <EddingtonCards stats={eddington} locale={locale} />
                </div>

                <div className="dash-section">
                  <h2 className="dash-section__title">{t("stats.sections.training")}</h2>
                  {dataset.discardedRows > 0 && (
                    <p className="notice" role="status">
                      {t("upload.discarded", { count: dataset.discardedRows })}
                    </p>
                  )}
                  <ActivityHeatmap data={heatmap} locale={locale} />
                  <TrainingLoad load={trainingLoad} locale={locale} />
                  <FitnessChart data={fitnessData} locale={locale} />
                  <TrendsChart
                    periods={periods}
                    locale={locale}
                    yearOverYear={activeYoY}
                  />
                  <LongRunTrend points={longRunTrend} locale={locale} />
                  <PaceEvolution points={paceEvolution} />
                  <PaceZones zones={paceZones} locale={locale} />
                  <DayOfWeekChart stats={dayOfWeekStats} locale={locale} />
                  <DistanceHistogram buckets={distanceHistogram} />
                  {breakdown.length > 1 && (
                    <TypeBreakdown slices={breakdown} locale={locale} />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p className="privacy-note">{t("privacy.note")}</p>
        <p className="disclaimer">{t("app.disclaimer")}</p>
        <p className="app-version">v{version}</p>
      </footer>
    </div>
  );
}
