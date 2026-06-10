import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onFile: (file: File) => void;
  onDemo: () => void;
}

export function UploadZone({ onFile, onDemo }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <>
    <label
      className={`dropzone${dragover ? " dragover" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragover(true);
      }}
      onDragLeave={() => setDragover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragover(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <span aria-hidden="true" style={{ fontSize: "2rem" }}>
        ↑
      </span>
      <span>{t("upload.dropzone")}</span>
    </label>

    <div className="demo-cta">
      <span className="demo-cta__sep">{t("demo.or")}</span>
      <button type="button" className="btn-demo" onClick={onDemo}>
        {t("demo.cta")}
      </button>
    </div>
    </>
  );
}
