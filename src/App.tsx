import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { UploadZone } from "./components/UploadZone";
import { TotalsCards } from "./components/TotalsCards";
import { TrendsChart } from "./components/TrendsChart";
import { Toolbar } from "./components/Toolbar";
import { LanguageToggle } from "./components/LanguageToggle";
import { processFile } from "./lib/loadDataset";
import {
  aggregateByPeriod,
  computeTotals,
  filterByType,
} from "./lib/aggregate";
import type { ParsedDataset, ViewMode } from "./lib/types";

type Status =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "error"; message: string }
  | { kind: "ready"; dataset: ParsedDataset };

export default function App() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("es") ? "es" : "en";

  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("monthly");

  async function handleFile(file: File) {
    setStatus({ kind: "processing" });
    setSelectedType(null);
    try {
      const dataset = await processFile(file);
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

  const dataset = status.kind === "ready" ? status.dataset : null;

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
      <div className="topbar">
        <div className="brand">
          Trail<span>Stats</span>
        </div>
        <LanguageToggle />
      </div>

      {!dataset && (
        <div className="hero">
          <h1>{t("app.title")}</h1>
          <p className="tagline">{t("app.tagline")}</p>

          {status.kind === "processing" ? (
            <div className="dropzone" aria-live="polite">
              <div className="spinner" aria-hidden="true" />
              <span>{t("upload.processing")}</span>
            </div>
          ) : (
            <UploadZone onFile={handleFile} />
          )}

          {status.kind === "error" && (
            <p className="error" role="alert">
              {status.message}
            </p>
          )}

          <p className="privacy-note">{t("privacy.note")}</p>
        </div>
      )}

      {dataset && (
        <>
          <Toolbar
            activityTypes={dataset.activityTypes}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            view={view}
            onViewChange={setView}
            onReset={() => setStatus({ kind: "idle" })}
          />

          {dataset.discardedRows > 0 && (
            <p className="notice">
              {t("upload.discarded", { count: dataset.discardedRows })}
            </p>
          )}

          <TotalsCards totals={totals} locale={locale} />
          <TrendsChart periods={periods} locale={locale} />
        </>
      )}
    </div>
  );
}
