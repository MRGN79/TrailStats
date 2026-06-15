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
import { HrTrend } from "./components/HrTrend";
import { HrZones } from "./components/HrZones";
import { CadenceTrend } from "./components/CadenceTrend";
import { PowerTrend } from "./components/PowerTrend";
import { SummaryCardModal } from "./components/SummaryCardModal";
import { processFile } from "./lib/loadDataset";
import { generateDemoDataset } from "./lib/demoData";
import { repository } from "./lib/repository";
import { saveBannerDismissed, loadBannerDismissed, clearBannerDismissed } from "./lib/preferences";
import {
  computeAvgHr,
  computeBestEfforts,
  computeCadenceTrend,
  computePowerTrend,
  computeTotalCalories,
  detectSportCategory,
  hasCadenceData,
  hasPowerData,
  computeDayOfWeekStats,
  computeDistanceHistogram,
  computeEddington,
  computeFitness,
  computeHeatmap,
  computeHrTrend,
  computeHrZones,
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
  filterByType,
  hasHeartRateData,
} from "./lib/aggregate";
import type { ParsedDataset } from "./lib/types";
import { initialDateRange, type DateRangeState } from "./lib/dateRange";

export type { DatePreset, DateRangeState } from "./lib/dateRange";

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
    repository.load()
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
  const [dateRange, setDateRange] = useState<DateRangeState>(initialDateRange);
  const [showSummaryCard, setShowSummaryCard] = useState(false);

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
    setDateRange(initialDateRange);

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
      repository.save(dataset)
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
    setDateRange(initialDateRange);


    setRestoredFromCache(false);
    clearBannerDismissed();
    setCacheBannerDismissed(false);
    setStatus({ kind: "ready", dataset: generateDemoDataset(), demo: true });
  }

  async function handleClearData() {
    if (!window.confirm(t("upload.purgeConfirm"))) return;
    saveGenRef.current++;
    try {
      await repository.clear();
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
    setDateRange(initialDateRange);
  }

  const dataset = status.kind === "ready" ? status.dataset : null;
  const isDemo = status.kind === "ready" && status.demo === true;

  const filtered = useMemo(() => {
    if (!dataset) return [];
    let acts = filterByType(dataset.activities, selectedType);
    if (dateRange.from) acts = acts.filter((a) => a.date >= dateRange.from!);
    if (dateRange.to) {
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      acts = acts.filter((a) => a.date <= end);
    }
    return acts;
  }, [dataset, selectedType, dateRange]);

  const totals = useMemo(() => computeTotals(filtered), [filtered]);

  const streak = useMemo(() => computeStreak(filtered), [filtered]);
  const records = useMemo(() => computeRecords(filtered), [filtered]);
  const breakdown = useMemo(() => computeTypeBreakdown(filtered), [filtered]);
  const heatmap = useMemo(() => computeHeatmap(filtered), [filtered]);
  const eddington = useMemo(() => computeEddington(filtered), [filtered]);
  const paceEvolution = useMemo(() => computePaceEvolution(filtered), [filtered]);
  const bestEfforts = useMemo(() => computeBestEfforts(filtered), [filtered]);
  const trainingLoad = useMemo(() => computeTrainingLoad(dataset?.activities ?? []), [dataset]);


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
  const hasHr = useMemo(() => hasHeartRateData(filtered), [filtered]);
  const avgHrBpm = useMemo(() => computeAvgHr(filtered), [filtered]);
  const hrTrend = useMemo(() => computeHrTrend(filtered), [filtered]);
  const hrZones = useMemo(() => computeHrZones(filtered), [filtered]);
  const sportCategory = useMemo(() => detectSportCategory(selectedType), [selectedType]);
  const totalCalories = useMemo(() => computeTotalCalories(filtered), [filtered]);
  const hasCadence = useMemo(() => hasCadenceData(filtered), [filtered]);
  const hasPower = useMemo(() => hasPowerData(filtered), [filtered]);
  const cadenceTrend = useMemo(() => computeCadenceTrend(filtered), [filtered]);
  const powerTrend = useMemo(() => computePowerTrend(filtered), [filtered]);
  const showRunningMetrics = sportCategory === "running" || sportCategory === "mixed";
  const showCyclingMetrics = sportCategory === "cycling" || sportCategory === "mixed";

  const summaryCardData = useMemo(() => ({
    totalActivities: totals.activities,
    totalDistanceKm: totals.distanceKm,
    totalMovingTimeSec: totals.movingTimeSec,
    totalElevationGainM: totals.elevationGainM,
    currentStreak: streak.current,
    bestWeekDistanceKm: records.bestWeek?.distanceKm ?? null,
    locale,
    labels: {
      activities: t("stats.totals.activities"),
      distance: t("stats.totals.distance"),
      time: t("stats.totals.time"),
      elevation: t("stats.totals.elevation"),
      currentStreak: t("stats.streak.current"),
      bestWeek: t("stats.records.bestWeek"),
      weeks: t("share.weeksUnit"),
      km: t("units.km"),
      m: t("units.m"),
    },
  }), [totals, streak, records, locale, t]);
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
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  onReset={() => setStatus({ kind: "idle" })}
                  onClearData={isDemo ? undefined : handleClearData}
                />
                <button
                  type="button"
                  className="btn-secondary toolbar__share-summary"
                  onClick={() => setShowSummaryCard(true)}
                >
                  {t("share.summaryButton")}
                </button>
              </div>

              <div className="dashboard__main">
                {showSummaryCard && (
                  <SummaryCardModal
                    data={summaryCardData}
                    onClose={() => setShowSummaryCard(false)}
                  />
                )}
                {saveError && (
                  <p className="notice" role="alert">
                    {t("upload.error.saveFailed")}
                  </p>
                )}
                <div className="dash-section">
                  <h2 className="dash-section__title" ref={dashHeadingRef} tabIndex={-1}>
                    {t("stats.sections.social")}
                  </h2>
                  <TotalsCards totals={totals} locale={locale} firstDate={filteredFirstDate} lastDate={filteredLastDate} avgHrBpm={avgHrBpm} totalCalories={totalCalories} />
                  <StreakRecords streak={streak} records={records} locale={locale} />
                  {showRunningMetrics && (
                    <>
                      <BestEfforts efforts={bestEfforts} locale={locale} />
                      <RacePredictor
                        predictions={racePredictions.items}
                        baseBucket={racePredictions.base}
                        hasEfforts={bestEfforts.length > 0}
                        locale={locale}
                      />
                    </>
                  )}
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
                  <TrendsChart activities={filtered} locale={locale} />
                  {showRunningMetrics && (
                    <>
                      <LongRunTrend points={longRunTrend} locale={locale} />
                      <PaceEvolution points={paceEvolution} />
                      <PaceZones zones={paceZones} locale={locale} />
                    </>
                  )}
                  <DayOfWeekChart stats={dayOfWeekStats} locale={locale} />
                  <DistanceHistogram buckets={distanceHistogram} />
                  {breakdown.length > 1 && (
                    <TypeBreakdown slices={breakdown} locale={locale} />
                  )}
                  {hasHr && (
                    <>
                      <HrTrend points={hrTrend} />
                      <HrZones zones={hrZones} />
                    </>
                  )}
                  {hasCadence && (
                    <CadenceTrend points={cadenceTrend} sportCategory={sportCategory} />
                  )}
                  {showCyclingMetrics && hasPower && (
                    <PowerTrend points={powerTrend} />
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
