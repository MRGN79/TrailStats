import { useTranslation } from "react-i18next";
import {
  presetToRange,
  type DatePreset,
  type DateRangeState,
} from "../lib/dateRange";

interface Props {
  value: DateRangeState;
  onChange: (range: DateRangeState) => void;
}

const PRESETS: DatePreset[] = [
  "all",
  "thisYear",
  "lastYear",
  "last6m",
  "last3m",
  "custom",
];

function toInputValue(date: Date | null): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputValue(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function DateRangeFilter({ value, onChange }: Props) {
  const { t } = useTranslation();

  function handlePresetChange(preset: DatePreset) {
    if (preset === "custom") {
      onChange({ preset: "custom", from: value.from, to: value.to });
      return;
    }
    const { from, to } = presetToRange(preset, new Date());
    onChange({ preset, from, to });
  }

  return (
    <div className="field">
      <label htmlFor="date-preset">{t("filter.datePreset")}</label>
      <select
        id="date-preset"
        className="filter-select"
        value={value.preset}
        onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
      >
        {PRESETS.map((preset) => (
          <option key={preset} value={preset}>
            {t(`filter.preset.${preset}`)}
          </option>
        ))}
      </select>

      {value.preset === "custom" && (
        <div className="date-range-inputs">
          <div className="field">
            <label htmlFor="date-from">{t("filter.from")}</label>
            <input
              id="date-from"
              type="date"
              className="filter-select"
              value={toInputValue(value.from)}
              onChange={(e) =>
                onChange({
                  preset: "custom",
                  from: parseInputValue(e.target.value),
                  to: value.to,
                })
              }
            />
          </div>
          <div className="field">
            <label htmlFor="date-to">{t("filter.to")}</label>
            <input
              id="date-to"
              type="date"
              className="filter-select"
              value={toInputValue(value.to)}
              onChange={(e) =>
                onChange({
                  preset: "custom",
                  from: value.from,
                  to: parseInputValue(e.target.value),
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
