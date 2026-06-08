import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { UploadZone } from "./components/UploadZone";
import { TotalsCards } from "./components/TotalsCards";
import { TrendsChart } from "./components/TrendsChart";
import { Toolbar } from "./components/Toolbar";
import { LanguageToggle } from "./components/LanguageToggle";
import { PrivacyPanel } from "./components/PrivacyPanel";
import { DemoBanner } from "./components/DemoBanner";
import { processFile } from "./lib/loadDataset";
import { generateDemoDataset } from "./lib/demoData";
import {
  aggregateByPeriod,
  computeTotals,
  filterByType,
} from "./lib/aggregate";
import type { ParsedDataset, ViewMode } from "./lib/types";

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

  async function handleFile(file: File) {
    setStatus({ kind: "processing" });
    setSelectedType(null);
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
              />
            </div>

            <div className="dashboard__main">
              {dataset.discardedRows > 0 && (
                <p className="notice" role="status">
                  {t("upload.discarded", { count: dataset.discardedRows })}
                </p>
              )}

              <TotalsCards totals={totals} locale={locale} />
              <TrendsChart periods={periods} locale={locale} />
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
