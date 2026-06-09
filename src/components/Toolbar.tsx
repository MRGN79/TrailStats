import { useTranslation } from "react-i18next";
import type { ViewMode } from "../lib/types";

interface Props {
  activityTypes: string[];
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onReset: () => void;
  canCompareYears: boolean;
  compareYears: boolean;
  onCompareYearsChange: (value: boolean) => void;
}

export function Toolbar({
  activityTypes,
  selectedType,
  onTypeChange,
  view,
  onViewChange,
  onReset,
  canCompareYears,
  compareYears,
  onCompareYearsChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="toolbar">
      <div className="field">
        <label htmlFor="type-filter">{t("filter.activityType")}</label>
        <select
          id="type-filter"
          value={selectedType ?? ""}
          onChange={(e) => onTypeChange(e.target.value || null)}
        >
          <option value="">{t("filter.allTypes")}</option>
          {activityTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div
        className="segmented"
        role="group"
        aria-label={`${t("stats.view.weekly")} / ${t("stats.view.monthly")}`}
      >
        <button
          type="button"
          aria-pressed={view === "weekly"}
          onClick={() => onViewChange("weekly")}
        >
          {t("stats.view.weekly")}
        </button>
        <button
          type="button"
          aria-pressed={view === "monthly"}
          onClick={() => onViewChange("monthly")}
        >
          {t("stats.view.monthly")}
        </button>
      </div>

      {canCompareYears && (
        <div className="field field--switch">
          <label className="switch">
            <input
              type="checkbox"
              checked={compareYears}
              onChange={(e) => onCompareYearsChange(e.target.checked)}
            />
            <span>{t("stats.trends.compareYears")}</span>
          </label>
        </div>
      )}

      <button type="button" className="btn-secondary" onClick={onReset}>
        {t("upload.loadAnother")}
      </button>
    </div>
  );
}
