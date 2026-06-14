import { useTranslation } from "react-i18next";

interface Props {
  activityTypes: string[];
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  onReset: () => void;
  onClearData?: () => void;
}

export function Toolbar({
  activityTypes,
  selectedType,
  onTypeChange,
  onReset,
  onClearData,
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

      <button type="button" className="btn-secondary" onClick={onReset}>
        {t("upload.loadAnother")}
      </button>

      {onClearData && (
        <button type="button" className="btn-ghost btn-ghost--danger" onClick={onClearData}>
          {t("upload.purge")}
        </button>
      )}
    </div>
  );
}
